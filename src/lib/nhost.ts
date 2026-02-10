/**
 * Nhost Client Configuration
 * 
 * This module sets up the Nhost client for:
 * - Authentication (email/password, social login)
 * - Storage (file uploads, avatars, videos)
 * - GraphQL (Hasura-powered queries & mutations)
 * 
 * To connect to your Nhost project:
 * 1. Create a project at https://app.nhost.io
 * 2. Set VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION in your .env file
 * 3. The app will automatically use Nhost for auth, storage, and data
 */

// ═══════════════════════════════════════════════════
// Nhost Configuration
// ═══════════════════════════════════════════════════

const NHOST_SUBDOMAIN = import.meta.env.VITE_NHOST_SUBDOMAIN || '';
const NHOST_REGION = import.meta.env.VITE_NHOST_REGION || '';

export const nhostConfig = {
  subdomain: NHOST_SUBDOMAIN,
  region: NHOST_REGION,
  hasValidConfig: !!(NHOST_SUBDOMAIN && NHOST_REGION && !NHOST_SUBDOMAIN.includes('placeholder') && !NHOST_SUBDOMAIN.includes('your-')),
  authUrl: NHOST_SUBDOMAIN ? `https://${NHOST_SUBDOMAIN}.auth.${NHOST_REGION}.nhost.run/v1` : '',
  storageUrl: NHOST_SUBDOMAIN ? `https://${NHOST_SUBDOMAIN}.storage.${NHOST_REGION}.nhost.run/v1` : '',
  graphqlUrl: NHOST_SUBDOMAIN ? `https://${NHOST_SUBDOMAIN}.graphql.${NHOST_REGION}.nhost.run/v1` : '',
  functionsUrl: NHOST_SUBDOMAIN ? `https://${NHOST_SUBDOMAIN}.functions.${NHOST_REGION}.nhost.run/v1` : '',
};

// ═══════════════════════════════════════════════════
// Nhost Auth Client (ready to connect)
// ═══════════════════════════════════════════════════

interface NhostSession {
  accessToken: string;
  refreshToken: string;
  user: NhostUser;
}

interface NhostUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NhostAuthResponse {
  session: NhostSession | null;
  error: { message: string; status: number } | null;
}

class NhostAuth {
  private baseUrl: string;
  private session: NhostSession | null = null;

  constructor(authUrl: string) {
    this.baseUrl = authUrl;
  }

  async signInWithEmailPassword(email: string, password: string): Promise<NhostAuthResponse> {
    if (!nhostConfig.hasValidConfig) {
      return { session: null, error: { message: 'Nhost not configured. Set VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION.', status: 0 } };
    }
    try {
      const response = await fetch(`${this.baseUrl}/signin/email-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { session: null, error: { message: data.message || 'Sign in failed', status: response.status } };
      }
      this.session = data.session;
      this.persistSession(data.session);
      return { session: data.session, error: null };
    } catch (err) {
      return { session: null, error: { message: err instanceof Error ? err.message : 'Network error', status: 0 } };
    }
  }

  async signUpWithEmailPassword(email: string, password: string, displayName?: string): Promise<NhostAuthResponse> {
    if (!nhostConfig.hasValidConfig) {
      return { session: null, error: { message: 'Nhost not configured. Set VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION.', status: 0 } };
    }
    try {
      const response = await fetch(`${this.baseUrl}/signup/email-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, options: { displayName: displayName || email.split('@')[0] } }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { session: null, error: { message: data.message || 'Sign up failed', status: response.status } };
      }
      this.session = data.session;
      if (data.session) this.persistSession(data.session);
      return { session: data.session, error: null };
    } catch (err) {
      return { session: null, error: { message: err instanceof Error ? err.message : 'Network error', status: 0 } };
    }
  }

  async signOut(): Promise<void> {
    if (!nhostConfig.hasValidConfig || !this.session) {
      this.session = null;
      this.clearSession();
      return;
    }
    try {
      await fetch(`${this.baseUrl}/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.session.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: this.session.refreshToken }),
      });
    } catch {
      // Ignore network errors on sign out
    }
    this.session = null;
    this.clearSession();
  }

  async refreshSession(): Promise<NhostAuthResponse> {
    const stored = this.getStoredSession();
    if (!stored?.refreshToken || !nhostConfig.hasValidConfig) {
      return { session: null, error: { message: 'No session to refresh', status: 0 } };
    }
    try {
      const response = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        this.clearSession();
        return { session: null, error: { message: data.message || 'Token refresh failed', status: response.status } };
      }
      this.session = data.session;
      this.persistSession(data.session);
      return { session: data.session, error: null };
    } catch (err) {
      return { session: null, error: { message: err instanceof Error ? err.message : 'Network error', status: 0 } };
    }
  }

  getSession(): NhostSession | null {
    return this.session || this.getStoredSession();
  }

  getUser(): NhostUser | null {
    const session = this.getSession();
    return session?.user || null;
  }

  getAccessToken(): string | null {
    return this.getSession()?.accessToken || null;
  }

  private persistSession(session: NhostSession): void {
    try {
      localStorage.setItem('nhost_session', JSON.stringify(session));
    } catch { /* ignore */ }
  }

  private getStoredSession(): NhostSession | null {
    try {
      const raw = localStorage.getItem('nhost_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem('nhost_session');
    } catch { /* ignore */ }
  }
}

// ═══════════════════════════════════════════════════
// Nhost Storage Client (ready to connect)
// ═══════════════════════════════════════════════════

class NhostStorage {
  private baseUrl: string;
  private auth: NhostAuth;

  constructor(storageUrl: string, auth: NhostAuth) {
    this.baseUrl = storageUrl;
    this.auth = auth;
  }

  async upload(file: File, path?: string): Promise<{ fileId: string; error: string | null }> {
    if (!nhostConfig.hasValidConfig) {
      return { fileId: '', error: 'Nhost not configured' };
    }
    const token = this.auth.getAccessToken();
    if (!token) {
      return { fileId: '', error: 'Not authenticated' };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (path) formData.append('name', path);

    try {
      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { fileId: '', error: data.message || 'Upload failed' };
      }
      return { fileId: data.id || data.fileMetadata?.id || '', error: null };
    } catch (err) {
      return { fileId: '', error: err instanceof Error ? err.message : 'Upload failed' };
    }
  }

  getPublicUrl(fileId: string): string {
    if (!nhostConfig.hasValidConfig || !fileId) return '';
    return `${this.baseUrl}/files/${fileId}`;
  }

  async delete(fileId: string): Promise<{ error: string | null }> {
    if (!nhostConfig.hasValidConfig) return { error: 'Nhost not configured' };
    const token = this.auth.getAccessToken();
    if (!token) return { error: 'Not authenticated' };

    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return { error: 'Delete failed' };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Delete failed' };
    }
  }
}

// ═══════════════════════════════════════════════════
// Nhost GraphQL Client (ready to connect)
// ═══════════════════════════════════════════════════

class NhostGraphQL {
  private baseUrl: string;
  private auth: NhostAuth;

  constructor(graphqlUrl: string, auth: NhostAuth) {
    this.baseUrl = graphqlUrl;
    this.auth = auth;
  }

  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<{ data: T | null; error: string | null }> {
    if (!nhostConfig.hasValidConfig) {
      return { data: null, error: 'Nhost not configured' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.auth.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });
      const result = await response.json();
      if (result.errors) {
        return { data: null, error: result.errors[0]?.message || 'GraphQL error' };
      }
      return { data: result.data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'GraphQL request failed' };
    }
  }
}

// ═══════════════════════════════════════════════════
// Create Nhost Instances
// ═══════════════════════════════════════════════════

export const nhostAuth = new NhostAuth(nhostConfig.authUrl);
export const nhostStorage = new NhostStorage(nhostConfig.storageUrl, nhostAuth);
export const nhostGraphQL = new NhostGraphQL(nhostConfig.graphqlUrl, nhostAuth);

// ═══════════════════════════════════════════════════
// Helper: Check if Nhost is ready
// ═══════════════════════════════════════════════════

export function isNhostReady(): boolean {
  return nhostConfig.hasValidConfig;
}

// ═══════════════════════════════════════════════════
// Example GraphQL Queries (ready for Nhost schema)
// ═══════════════════════════════════════════════════

export const NHOST_QUERIES = {
  GET_VIDEOS: `
    query GetVideos($limit: Int = 50) {
      videos(order_by: { created_at: desc }, limit: $limit) {
        id
        url
        thumbnail_url
        caption
        views
        likes
        created_at
        user {
          id
          username
          display_name
          avatar_url
        }
      }
    }
  `,
  GET_PROFILE: `
    query GetProfile($userId: uuid!) {
      users_by_pk(id: $userId) {
        id
        email
        display_name
        avatar_url
        metadata
        created_at
      }
    }
  `,
  GET_NOTIFICATIONS: `
    query GetNotifications($userId: uuid!, $limit: Int = 50) {
      notifications(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }, limit: $limit) {
        id
        type
        title
        body
        is_read
        created_at
        actor {
          id
          display_name
          avatar_url
        }
      }
    }
  `,
  INSERT_VIDEO: `
    mutation InsertVideo($url: String!, $caption: String, $thumbnailUrl: String) {
      insert_videos_one(object: { url: $url, caption: $caption, thumbnail_url: $thumbnailUrl }) {
        id
        url
        created_at
      }
    }
  `,
  TOGGLE_LIKE: `
    mutation ToggleLike($videoId: uuid!, $userId: uuid!) {
      insert_likes_one(
        object: { video_id: $videoId, user_id: $userId }
        on_conflict: { constraint: likes_pkey, update_columns: [] }
      ) {
        id
      }
    }
  `,
  TOGGLE_FOLLOW: `
    mutation ToggleFollow($followerId: uuid!, $followingId: uuid!) {
      insert_followers_one(
        object: { follower_id: $followerId, following_id: $followingId }
        on_conflict: { constraint: followers_pkey, update_columns: [] }
      ) {
        id
      }
    }
  `,
};

export default { nhostAuth, nhostStorage, nhostGraphQL, nhostConfig, isNhostReady };
