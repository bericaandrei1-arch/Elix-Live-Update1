import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import {
  calculateEngagementScore,
  isEligibleForFyp,
  refreshVideoFypStatus,
} from '../lib/fypEligibility';
import {
  fetchForYouFeed,
  trackLike,
  trackComment,
  trackShare,
  trackFollow,
} from '../lib/interactionTracker';

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
          // If we are in the browser, always re-fetch fresh data from DB first
          // This ensures newly uploaded videos appear immediately
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let data: any[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let err: any = null;

          // FIX: Do NOT use foreign key embedding for profiles/users if the relationship is missing or ambiguous.
          // Instead, fetch videos first, then fetch user profiles manually.
          
          // 1. Fetch videos
          let res = await supabase
            .from('videos')
            .select('*')
            .eq('is_private', false)
            .order('created_at', { ascending: false });

          if (res.error) {
             console.error('Error fetching videos table:', res.error);
             set({ loading: false });
             return;
          }
          
          const rawVideos = res.data || [];
          const userIds = [...new Set(rawVideos.map((v: any) => v.user_id))];

          // 2. Fetch profiles for these users
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url, is_creator')
            .in('user_id', userIds);
            
          if (profileError) {
             console.error('Error fetching profiles:', profileError);
          }
          
          // Map profiles by ID for easy lookup
          const profileMap = new Map();
          (profiles || []).forEach((p: any) => {
             profileMap.set(p.user_id, p);
          });

          // 3. Fetch real engagement state (likes + following)
          let likedIds: string[] = [];
          let followingIds: string[] = [];
          
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Fetch likes
              const { data: likes } = await supabase.from('likes').select('video_id').eq('user_id', user.id);
              likedIds = likes?.map((r: { video_id: string }) => r.video_id) ?? [];
              
              // Fetch following
              const { data: following } = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
              followingIds = following?.map((r: { following_id: string }) => r.following_id) ?? [];
            }
          } catch {
            // ignore
          }
          
          const likedSet = new Set(likedIds);
          const followingSet = new Set(followingIds);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedVideos: Video[] = rawVideos.map((v: any) => {
            const uid = v.user_id;
            const profile = profileMap.get(uid);
            const uname = profile?.username || 'user';
            
            // Map real follow status
            const isFollowing = followingSet.has(uid);
            
            return {
              id: v.id,
              url: v.url,
              thumbnail: v.thumbnail_url || '',
              duration: '0:15',
              user: {
                id: uid,
                username: uname,
                name: profile?.display_name || uname,
                avatar: profile?.avatar_url || '',
                level: 1,
                isVerified: !!profile?.is_creator,
                followers: 0, // In feed we don't fetch count yet to save perf, but status is real
                following: 0
              },
              description: v.caption || '',
              hashtags: [],
              music: { id: 'original', title: 'Original Sound', artist: profile?.display_name || uname, duration: '0:15' },
              stats: { views: v.views || 0, likes: v.likes || 0, comments: v.comments_count || 0, shares: v.shares_count || 0, saves: 0 },
              createdAt: v.created_at,
              location: 'For You',
              isLiked: likedSet.has(v.id),
              isSaved: false,
              isFollowing: isFollowing,
              comments: [],
              quality: 'auto',
              privacy: 'public'
            };
          });

          set({ videos: mappedVideos, likedVideos: likedIds, followingUsers: followingIds, loading: false });
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
            trackLike(videoId).catch(() => {});
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
      toggleFollow: async (userId) => {
        const state = get();
        const wasFollowing = state.followingUsers.includes(userId);
        
        // Update local state immediately (optimistic)
        set((s) => {
          const newFollowingUsers = s.followingUsers.includes(userId)
            ? s.followingUsers.filter(id => id !== userId)
            : [...s.followingUsers, userId];

          return {
            videos: s.videos.map(video =>
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
        });

        // Persist to DB
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return; // Should be logged in

          if (wasFollowing) {
             // Unfollow
             await supabase.from('followers').delete().eq('follower_id', user.id).eq('following_id', userId);
          } else {
             // Follow
             await supabase.from('followers').insert({ follower_id: user.id, following_id: userId });
             trackFollow(userId).catch(() => {});
          }
        } catch (err) {
          console.error('toggleFollow persist failed:', err);
          // Ideally revert state here, but for now we log error
        }
      },

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
          trackShare(videoId).catch(() => {});
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

        // Get current user for optimistic UI
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Must be logged in

        // Optimistic update
        const tempId = `comment_${Date.now()}`;
        const newComment: Comment = {
          ...commentData,
          id: tempId,
          userId: user.id,
          username: user.user_metadata.username || 'user',
          avatar: user.user_metadata.avatar_url || '',
          time: 'just now',
          likes: 0,
          isLiked: false
        };
        
        const newCommentsCount = video.stats.comments + 1;
        const updatedStats = { ...video.stats, comments: newCommentsCount };

        set({
          videos: state.videos.map(v =>
            v.id === videoId
              ? { ...v, comments: [...v.comments, newComment], stats: updatedStats }
              : v
          )
        });

        try {
          // Persist to DB
          const { data: insertedComment, error } = await supabase
            .from('comments')
            .insert({
              video_id: videoId,
              user_id: user.id,
              text: commentData.text
            })
            .select()
            .single();

          if (error) throw error;

          // Update the optimistic comment with real ID
          if (insertedComment) {
             set(s => ({
               videos: s.videos.map(v => 
                 v.id === videoId 
                   ? { 
                       ...v, 
                       comments: v.comments.map(c => c.id === tempId ? { ...c, id: insertedComment.id } : c) 
                     } 
                   : v
               )
             }));
          }

          trackComment(videoId, commentData.text).catch(() => {});
          await refreshVideoFypStatus(videoId, updatedStats);
        } catch (err) {
          console.error('addComment persist failed:', err);
          // Revert on error? For now just log.
        }
      },

      deleteComment: async (videoId, commentId) => {
        set((state) => ({
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
        }));
        try {
          await supabase.from('comments').delete().eq('id', commentId);
        } catch (err) {
          console.error('deleteComment failed:', err);
        }
      },

      toggleCommentLike: async (videoId, commentId) => {
        const state = get();
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return;
        
        const comment = video.comments.find(c => c.id === commentId);
        if (!comment) return;

        const wasLiked = comment.isLiked;

        set((state) => ({
          videos: state.videos.map(video => 
            video.id === videoId 
              ? {
                  ...video,
                  comments: video.comments.map(c => 
                    c.id === commentId 
                      ? { 
                          ...c, 
                          isLiked: !wasLiked,
                          likes: wasLiked ? c.likes - 1 : c.likes + 1
                        }
                      : c
                  )
                }
              : video
          )
        }));

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (wasLiked) {
             await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
          } else {
             await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
          }
        } catch (err) {
          console.error('toggleCommentLike failed:', err);
        }
      },

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
        const { videos, likedVideos, followingUsers: _followingUsers } = get();
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
