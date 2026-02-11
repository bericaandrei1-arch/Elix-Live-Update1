import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import {
  calculateEngagementScore,
  isEligibleForFyp,
  refreshVideoFypStatus,
  FYP_THRESHOLD,
} from '../lib/fypEligibility';

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  level?: number;
  isVerified?: boolean;
  followers: number;
  following: number;
  isFollowing?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  likes: number;
  time: string;
  isLiked?: boolean;
  replies?: Comment[];
}

interface Music {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  coverUrl?: string;
  previewUrl?: string;
}

interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface Video {
  id: string;
  url: string;
  thumbnail?: string;
  duration: string;
  user: User;
  description: string;
  hashtags: string[];
  music: Music;
  stats: VideoStats;
  createdAt: string;
  location?: string;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  comments: Comment[];
  quality?: 'auto' | '720p' | '1080p';
  privacy?: 'public' | 'friends' | 'private';
}

interface VideoStore {
  videos: Video[];
  likedVideos: string[];
  savedVideos: string[];
  followingUsers: string[];
  loading: boolean;
  
  // Video actions
  fetchVideos: () => Promise<void>;
  addVideo: (video: Video) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;
  
  // Like actions
  toggleLike: (videoId: string) => void | Promise<void>;
  getLikedVideos: () => Video[];
  
  // Save actions
  toggleSave: (videoId: string) => void;
  getSavedVideos: () => Video[];
  
  // Follow actions
  toggleFollow: (userId: string) => void;
  getFollowingUsers: () => User[];
  
  // Share actions
  shareVideo: (videoId: string) => void | Promise<void>;

  // Comment actions
  addComment: (videoId: string, comment: Omit<Comment, 'id' | 'time'>) => void | Promise<void>;
  deleteComment: (videoId: string, commentId: string) => void;
  toggleCommentLike: (videoId: string, commentId: string) => void;
  
  // Analytics
  incrementViews: (videoId: string) => void | Promise<void>;
  getTrendingVideos: () => Video[];
  getRecommendedVideos: (userId: string) => Video[];
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      likedVideos: [],
      savedVideos: [],
      followingUsers: [],
      loading: false,

      fetchVideos: async () => {
        set({ loading: true });
        try {
          let data: any[] = [];
          let err: any = null;
          const baseSelect = `*, user:users ( id, username, display_name, avatar_url, is_creator )`;
          const profileSelect = `*, user:profiles!user_id ( user_id, username, display_name, avatar_url, is_creator )`;

          // Try FYP feed first: only eligible videos, by engagement
          let res = await supabase
            .from('videos')
            .select(baseSelect)
            .eq('is_private', false)
            .eq('is_eligible_for_fyp', true)
            .order('engagement_score', { ascending: false })
            .order('created_at', { ascending: false });

          if (res.error && (res.error.message?.includes('is_eligible_for_fyp') || res.error.message?.includes('engagement_score'))) {
            res = await supabase.from('videos').select(baseSelect).eq('is_private', false).order('created_at', { ascending: false });
          }
          if (res.error && (res.error.message?.includes('users') || res.error.message?.includes('relation'))) {
            let r2 = await supabase.from('videos').select(profileSelect).eq('is_private', false).eq('is_eligible_for_fyp', true).order('engagement_score', { ascending: false }).order('created_at', { ascending: false });
            if (r2.error && (r2.error.message?.includes('is_eligible_for_fyp') || r2.error.message?.includes('engagement_score'))) {
              r2 = await supabase.from('videos').select(profileSelect).eq('is_private', false).order('created_at', { ascending: false });
            }
            data = r2.data || [];
            err = r2.error;
          } else {
            data = res.data || [];
            err = res.error;
          }

          if (err) throw err;

          let likedIds: string[] = [];
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: likes } = await supabase.from('likes').select('video_id').eq('user_id', user.id);
              likedIds = likes?.map((r: { video_id: string }) => r.video_id) ?? [];
            }
          } catch {
            // ignore
          }
          const likedSet = new Set(likedIds);

          const mappedVideos: Video[] = data.map((v: any) => {
            const u = v.user;
            const uid = u?.user_id ?? u?.id ?? v.user_id ?? 'unknown';
            const uname = u?.username ?? 'user';
            return {
              id: v.id,
              url: v.url,
              thumbnail: v.thumbnail_url || 'https://picsum.photos/400/600',
              duration: '0:15',
              user: {
                id: uid,
                username: uname,
                name: u?.display_name ?? uname,
                avatar: u?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(uname)}`,
                level: 1,
                isVerified: !!u?.is_creator,
                followers: 0,
                following: 0
              },
              description: v.caption || '',
              hashtags: [],
              music: { id: 'original', title: 'Original Sound', artist: u?.display_name ?? uname, duration: '0:15' },
              stats: { views: v.views || 0, likes: v.likes || 0, comments: 0, shares: 0, saves: 0 },
              createdAt: v.created_at,
              location: 'For You',
              isLiked: likedSet.has(v.id),
              isSaved: false,
              isFollowing: false,
              comments: [],
              quality: 'auto',
              privacy: 'public'
            };
          });

          // Keep videos already in store that aren't in this fetch (e.g. your new post) so they still show at top
          const fetchedIds = new Set(mappedVideos.map((v) => v.id));
          const existing = get().videos;
          const toPrepend = existing.filter((v) => !fetchedIds.has(v.id));
          const merged = toPrepend.length ? [...toPrepend, ...mappedVideos] : mappedVideos;

          set({ videos: merged, likedVideos: likedIds, loading: false });
        } catch (err) {
          console.error('Error fetching videos:', err);
          set({ loading: false });
        }
      },

      // Video actions
      addVideo: (video) => set((state) => ({ 
        videos: [video, ...state.videos] 
      })),
      
      removeVideo: (videoId) => set((state) => ({
        videos: state.videos.filter(video => video.id !== videoId)
      })),
      
      updateVideo: (videoId, updates) => set((state) => ({
        videos: state.videos.map(video => 
          video.id === videoId ? { ...video, ...updates } : video
        )
      })),

      // Like actions (persist to likes table + update video engagement / FYP eligibility)
      toggleLike: async (videoId) => {
        const state = get();
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return;

        const wasLiked = video.isLiked;
        const newLikes = wasLiked ? video.stats.likes - 1 : video.stats.likes + 1;
        const updatedStats = { ...video.stats, likes: newLikes };
        const score = calculateEngagementScore(updatedStats);
        const eligible = isEligibleForFyp(score);

        const newLikedVideos = wasLiked
          ? state.likedVideos.filter(id => id !== videoId)
          : [...state.likedVideos, videoId];

        set({
          videos: state.videos.map(v =>
            v.id === videoId
              ? { ...v, isLiked: !wasLiked, stats: updatedStats }
              : v
          ),
          likedVideos: newLikedVideos
        });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          if (wasLiked) {
            await supabase.from('likes').delete().eq('video_id', videoId).eq('user_id', user.id);
          } else {
            await supabase.from('likes').insert({ video_id: videoId, user_id: user.id });
          }
          await supabase
            .from('videos')
            .update({
              likes: newLikes,
              engagement_score: score,
              is_eligible_for_fyp: eligible
            })
            .eq('id', videoId);
        } catch (err) {
          console.error('toggleLike persist failed:', err);
          set({ videos: state.videos, likedVideos: state.likedVideos });
        }
      },

      getLikedVideos: () => {
        const { videos, likedVideos } = get();
        return videos.filter(video => likedVideos.includes(video.id));
      },

      // Save actions
      toggleSave: (videoId) => set((state) => {
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return state;

        const isSaved = video.isSaved;
        const newSavedVideos = isSaved 
          ? state.savedVideos.filter(id => id !== videoId)
          : [...state.savedVideos, videoId];

        return {
          videos: state.videos.map(v => 
            v.id === videoId 
              ? { 
                  ...v, 
                  isSaved: !isSaved,
                  stats: {
                    ...v.stats,
                    saves: isSaved ? v.stats.saves - 1 : v.stats.saves + 1
                  }
                }
              : v
          ),
          savedVideos: newSavedVideos
        };
      }),

      getSavedVideos: () => {
        const { videos, savedVideos } = get();
        return videos.filter(video => savedVideos.includes(video.id));
      },

      // Follow actions
      toggleFollow: (userId) => set((state) => {
        const newFollowingUsers = state.followingUsers.includes(userId)
          ? state.followingUsers.filter(id => id !== userId)
          : [...state.followingUsers, userId];

        return {
          videos: state.videos.map(video => 
            video.user.id === userId 
              ? { 
                  ...video, 
                  isFollowing: !video.isFollowing,
                  user: {
                    ...video.user,
                    followers: video.isFollowing 
                      ? video.user.followers - 1 
                      : video.user.followers + 1
                  }
                }
              : video
          ),
          followingUsers: newFollowingUsers
        };
      }),

      getFollowingUsers: () => {
        const { videos, followingUsers } = get();
        return videos
          .map(video => video.user)
          .filter(user => followingUsers.includes(user.id));
      },

      // Share actions – increment share count + refresh FYP eligibility
      shareVideo: async (videoId) => {
        const state = get();
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return;

        const newShares = video.stats.shares + 1;
        const updatedStats = { ...video.stats, shares: newShares };

        set({
          videos: state.videos.map(v =>
            v.id === videoId
              ? { ...v, stats: updatedStats }
              : v
          )
        });

        try {
          await refreshVideoFypStatus(videoId, updatedStats);
        } catch (err) {
          console.error('shareVideo FYP refresh failed:', err);
        }
      },

      // Comment actions – also refresh FYP eligibility
      addComment: async (videoId, commentData) => {
        const state = get();
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return;

        const newComment: Comment = {
          ...commentData,
          id: `comment_${Date.now()}_${Math.random()}`,
          time: 'now'
        };
        const newComments = video.stats.comments + 1;
        const updatedStats = { ...video.stats, comments: newComments };

        set({
          videos: state.videos.map(v =>
            v.id === videoId
              ? { ...v, comments: [...v.comments, newComment], stats: updatedStats }
              : v
          )
        });

        try {
          await refreshVideoFypStatus(videoId, updatedStats);
        } catch (err) {
          console.error('addComment FYP refresh failed:', err);
        }
      },

      deleteComment: (videoId, commentId) => set((state) => ({
        videos: state.videos.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                comments: video.comments.filter(c => c.id !== commentId),
                stats: {
                  ...video.stats,
                  comments: Math.max(0, video.stats.comments - 1)
                }
              }
            : video
        )
      })),

      toggleCommentLike: (videoId, commentId) => set((state) => ({
        videos: state.videos.map(video => 
          video.id === videoId 
            ? {
                ...video,
                comments: video.comments.map(comment => 
                  comment.id === commentId 
                    ? { 
                        ...comment, 
                        isLiked: !comment.isLiked,
                        likes: comment.isLiked 
                          ? comment.likes - 1 
                          : comment.likes + 1
                      }
                    : comment
                )
              }
            : video
        )
      })),

      // Analytics
      incrementViews: async (videoId) => {
        const state = get();
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return;

        const newViews = video.stats.views + 1;
        const updatedStats = { ...video.stats, views: newViews };

        set({
          videos: state.videos.map(v =>
            v.id === videoId
              ? { ...v, stats: updatedStats }
              : v
          )
        });

        try {
          // Persist view count to DB
          await supabase
            .from('videos')
            .update({ views: newViews })
            .eq('id', videoId);
          // Refresh FYP eligibility with new view count
          await refreshVideoFypStatus(videoId, updatedStats);
        } catch (err) {
          console.error('incrementViews persist failed:', err);
        }
      },

      getTrendingVideos: () => {
        const { videos } = get();
        return [...videos].sort((a, b) => {
          const engagementA = (a.stats.likes + a.stats.comments + a.stats.shares) / (a.stats.views || 1);
          const engagementB = (b.stats.likes + b.stats.comments + b.stats.shares) / (b.stats.views || 1);
          return engagementB - engagementA;
        });
      },

      getRecommendedVideos: () => {
        const { videos, likedVideos, followingUsers } = get();
        // Simple recommendation: show recent videos not seen/liked yet
        return videos
          .filter(video => !likedVideos.includes(video.id))
          .slice(0, 10);
      }
    }),
    {
      name: 'video-store-v3',
      partialize: (state) => ({
        likedVideos: state.likedVideos,
        savedVideos: state.savedVideos,
        followingUsers: state.followingUsers
      })
    }
  )
);
