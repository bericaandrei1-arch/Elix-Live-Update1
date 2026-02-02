import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  isVerified?: boolean;
  followers: number;
  following: number;
  bio?: string;
  website?: string;
  location?: string;
  joinedDate: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  session: Session | null;
  isLoading: boolean;
  
  // Actions
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  getCurrentUser: () => User | null;
  checkUser: () => void;
  loginAsGuest: () => void;
}

let authUnsubscribe: (() => void) | null = null;

function mapSessionToUser(session: Session | null): User | null {
  const sbUser = session?.user;
  if (!sbUser) return null;
  const meta = (sbUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = sbUser.email ?? '';
  const usernameFromMeta = typeof meta.username === 'string' ? meta.username : undefined;
  const fullNameFromMeta = typeof meta.full_name === 'string' ? meta.full_name : undefined;
  const avatarFromMeta = typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined;
  const fallbackUsername = email ? email.split('@')[0] : 'user';
  const rawLevel = meta.level;
  const levelFromMeta =
    typeof rawLevel === 'number'
      ? rawLevel
      : typeof rawLevel === 'string'
        ? Number(rawLevel)
        : NaN;
  const level = Number.isFinite(levelFromMeta) && levelFromMeta > 0 ? Math.floor(levelFromMeta) : 1;

  return {
    id: sbUser.id,
    username: usernameFromMeta ?? fallbackUsername,
    name: fullNameFromMeta ?? usernameFromMeta ?? fallbackUsername,
    email,
    avatar: avatarFromMeta ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(usernameFromMeta ?? fallbackUsername)}&background=random`,
    level,
    isVerified: false,
    followers: 0,
    following: 0,
    joinedDate: sbUser.created_at ?? new Date().toISOString()
  };
}

export const useAuthStore = create<AuthStore>()(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    session: null,
    isLoading: true,

    signInWithPassword: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const session = data.session ?? null;
      set({ session, user: mapSessionToUser(session), isAuthenticated: !!session, isLoading: false });
      return { error: null };
    },

    signUpWithPassword: async (email, password, username) => {
      const userData: Record<string, unknown> = { level: 1 };
      if (username) userData.username = username;

      // Force no email confirmation for this user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: userData,
          emailRedirectTo: undefined // Don't send confirmation email flow
        }
      });
      
      if (error) return { error: error.message, needsEmailConfirmation: false };
      
      // Auto sign-in logic (Supabase sometimes returns session immediately if email confirm is off)
      const session = data.session ?? null;
      if (session) {
        set({ session, user: mapSessionToUser(session), isAuthenticated: true, isLoading: false });
        return { error: null, needsEmailConfirmation: false };
      }

      // If no session, try to sign in immediately (works if email confirm is off)
      if (data.user && !data.session) {
          const signInRes = await supabase.auth.signInWithPassword({ email, password });
          if (signInRes.data.session) {
             set({ session: signInRes.data.session, user: mapSessionToUser(signInRes.data.session), isAuthenticated: true, isLoading: false });
             return { error: null, needsEmailConfirmation: false };
          }
          
          // If sign in fails, it means Supabase requires email confirmation.
          // We must return true so the UI prompts the user to check their email.
          return { error: null, needsEmailConfirmation: true };
      }

      return { error: 'Unknown signup state', needsEmailConfirmation: false };
    },

    resendSignupConfirmation: async (email) => {
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo }
      });
      if (error) return { error: error.message };
      return { error: null };
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ session: null, user: null, isAuthenticated: false, isLoading: false });
    },

    updateUser: (updates) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

    getCurrentUser: () => get().user,

    checkUser: () => {
      if (!authUnsubscribe) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          set({ session: session ?? null, user: mapSessionToUser(session ?? null), isAuthenticated: !!session, isLoading: false });
        });
        authUnsubscribe = () => data.subscription.unsubscribe();
      }

      supabase.auth
        .getSession()
        .then(({ data }) => {
          const session = data.session ?? null;
          set({ session, user: mapSessionToUser(session), isAuthenticated: !!session, isLoading: false });
        })
        .catch(() => {
          set({ session: null, user: null, isAuthenticated: false, isLoading: false });
        });
    },

    loginAsGuest: () => {
      const guestUser: User = {
        id: 'guest_123',
        username: 'guest_user',
        name: 'Guest User',
        email: 'guest@example.com',
        avatar: 'https://ui-avatars.com/api/?name=Guest+User&background=random',
        level: 1,
        isVerified: false,
        followers: 0,
        following: 0,
        joinedDate: new Date().toISOString()
      };
      set({ user: guestUser, isAuthenticated: true, isLoading: false, session: null });
    }
  })
);
