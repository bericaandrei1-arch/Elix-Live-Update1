// 🔄 Real API Only System (Apple Store Compliant)
// This file enforces real API usage and removes mock data fallback

import { supabase } from './supabase';

const isProd = import.meta.env.PROD;

// Force real API usage in production
export const useRealApi = true;

const handleRealApiError = async <T,>(error: unknown): Promise<T> => {
  console.error('[API] Production API request failed:', error);
  // In production, propagate the error instead of serving mock data
  throw error;
};

// Wrapper functions that strictly use real API
export const api = {
  // User functions
  getUser: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Video functions
  getVideos: async (page = 1, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, verified, level)
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  getVideo: async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, verified, level)
        `)
        .eq('id', videoId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Live stream functions
  getLiveStreams: async () => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, verified, level)
        `)
        .eq('is_live', true)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  getLiveStream: async (streamId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_streams')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, verified, level)
        `)
        .eq('id', streamId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Gift functions
  getGifts: async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Comment functions
  getComments: async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url)
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Like/Unlike functions
  likeVideo: async (videoId: string) => {
    try {
      // Get current video data
      const { data: video } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
      
      if (video) {
        const { error } = await supabase
          .from('videos')
          .update({ likes: video.likes + 1 })
          .eq('id', videoId);
        
        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  unlikeVideo: async (videoId: string) => {
    try {
      // Get current video data
      const { data: video } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
      
      if (video) {
        const { error } = await supabase
          .from('videos')
          .update({ likes: Math.max(0, video.likes - 1) })
          .eq('id', videoId);
        
        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Follow/Unfollow functions
  followUser: async (userId: string) => {
    try {
      // Get current user data
      const { data: user } = await supabase
        .from('users')
        .select('followers')
        .eq('id', userId)
        .single();
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ followers: user.followers + 1 })
          .eq('id', userId);
        
        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      // Get current user data
      const { data: user } = await supabase
        .from('users')
        .select('followers')
        .eq('id', userId)
        .single();
      
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ followers: Math.max(0, user.followers - 1) })
          .eq('id', userId);
        
        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Gift sending
  sendGift: async (streamId: string, giftId: string, userId: string) => {
    try {
      // Get gift and stream data
      const [giftResult, streamResult] = await Promise.all([
        supabase.from('gifts').select('*').eq('id', giftId).single(),
        supabase.from('live_streams').select('*').eq('id', streamId).single()
      ]);
      
      if (giftResult.data && streamResult.data) {
        // Update stream gifts count
        await supabase
          .from('live_streams')
          .update({ gifts: streamResult.data.gifts + 1 })
          .eq('id', streamId);
        
        // Create gift transaction record
        await supabase.from('gift_transactions').insert({
          stream_id: streamId,
          gift_id: giftId,
          user_id: userId,
          amount: giftResult.data.price
        });
      }
      
      return { 
        success: true, 
        message: `Sent ${giftResult.data?.name || 'gift'}!`,
        gift: giftResult.data
      };
    } catch (error) {
      throw error;
    }
  },

  // Authentication
  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { user: data.user, token: data.session?.access_token, success: true };
    } catch (error) {
      throw error;
    }
  },

  register: async (email: string, password: string, username: string) => {
    try {
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo
        }
      });
      
      if (error) throw error;
      return { user: data.user, token: data.session?.access_token, success: true };
    } catch (error) {
      throw error;
    }
  }
};

export default api;
