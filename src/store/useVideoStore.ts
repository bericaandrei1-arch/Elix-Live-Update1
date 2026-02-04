import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface Video {
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
  
  // Video actions
  addVideo: (video: Video) => void;
  removeVideo: (videoId: string) => void;
  updateVideo: (videoId: string, updates: Partial<Video>) => void;
  
  // Like actions
  toggleLike: (videoId: string) => void;
  getLikedVideos: () => Video[];
  
  // Save actions
  toggleSave: (videoId: string) => void;
  getSavedVideos: () => Video[];
  
  // Follow actions
  toggleFollow: (userId: string) => void;
  getFollowingUsers: () => User[];
  
  // Comment actions
  addComment: (videoId: string, comment: Omit<Comment, 'id' | 'time'>) => void;
  deleteComment: (videoId: string, commentId: string) => void;
  toggleCommentLike: (videoId: string, commentId: string) => void;
  
  // Analytics
  incrementViews: (videoId: string) => void;
  getTrendingVideos: () => Video[];
  getRecommendedVideos: (userId: string) => Video[];
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [
        {
          id: 't1',
          url: '/gifts/golden_rage_lion.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=11',
          duration: '0:15',
          user: {
            id: 'test1',
            username: 'elix_music',
            name: 'Elix Music',
            avatar: 'https://i.pravatar.cc/150?u=elix_music',
            level: 11,
            isVerified: true,
            followers: 12000,
            following: 240
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:30:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't2',
          url: '/gifts/legendary_guardians_of_treasure_chest.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=12',
          duration: '0:15',
          user: {
            id: 'test2',
            username: 'elix_beats',
            name: 'Elix Beats',
            avatar: 'https://i.pravatar.cc/150?u=elix_beats',
            level: 22,
            isVerified: false,
            followers: 8450,
            following: 120
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:31:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't3',
          url: '/gifts/crystal_voyager_ship.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=13',
          duration: '0:15',
          user: {
            id: 'test3',
            username: 'elix_radio',
            name: 'Elix Radio',
            avatar: 'https://i.pravatar.cc/150?u=elix_radio',
            level: 39,
            isVerified: false,
            followers: 2100,
            following: 80
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:32:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        }
        ,
        {
          id: 't4',
          url: '/gifts/earth_titan_gorilla.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=14',
          duration: '0:15',
          user: {
            id: 'test4',
            username: 'elix_olympus',
            name: 'Elix Olympus',
            avatar: 'https://i.pravatar.cc/150?u=elix_olympus',
            level: 79,
            isVerified: true,
            followers: 44210,
            following: 120
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:33:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't5',
          url: '/gifts/mythic_beast_vault_phoenix_lion_dragon_bear_wolf.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=15',
          duration: '0:15',
          user: {
            id: 'test5',
            username: 'elix_frost',
            name: 'Elix Frost',
            avatar: 'https://i.pravatar.cc/150?u=elix_frost',
            level: 116,
            isVerified: true,
            followers: 19880,
            following: 310
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:34:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't6',
          url: '/gifts/molten_fury_of_the_lava_dragon.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=16',
          duration: '0:15',
          user: {
            id: 'test6',
            username: 'elix_thunder',
            name: 'Elix Thunder',
            avatar: 'https://i.pravatar.cc/150?u=elix_thunder',
            level: 116,
            isVerified: true,
            followers: 33210,
            following: 95
          },
          description: 'High quality vertical test clip • 1080x1920 • no watermark',
          hashtags: ['elix', 'foryou', '1080p'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0
          },
          createdAt: '2026-01-01T10:35:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't7',
          url: '/gifts/fire_phoenix.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=17',
          duration: '0:15',
          user: {
            id: 'test7',
            username: 'elix_phoenix',
            name: 'Elix Phoenix',
            avatar: 'https://i.pravatar.cc/150?u=elix_phoenix',
            level: 88,
            isVerified: true,
            followers: 55000,
            following: 180
          },
          description: 'Fire Phoenix rising from the ashes',
          hashtags: ['phoenix', 'fire', 'mythical'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 12500,
            likes: 890,
            comments: 45,
            shares: 120,
            saves: 200
          },
          createdAt: '2026-01-01T10:36:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't8',
          url: '/gifts/frost_wolf.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=18',
          duration: '0:15',
          user: {
            id: 'test8',
            username: 'elix_wolf',
            name: 'Elix Wolf',
            avatar: 'https://i.pravatar.cc/150?u=elix_wolf',
            level: 65,
            isVerified: false,
            followers: 28000,
            following: 95
          },
          description: 'Frost Wolf in the frozen tundra',
          hashtags: ['wolf', 'frost', 'winter'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 8900,
            likes: 650,
            comments: 32,
            shares: 88,
            saves: 150
          },
          createdAt: '2026-01-01T10:37:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't9',
          url: '/gifts/fantasy_unicorn.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=19',
          duration: '0:15',
          user: {
            id: 'test9',
            username: 'elix_unicorn',
            name: 'Elix Unicorn',
            avatar: 'https://i.pravatar.cc/150?u=elix_unicorn',
            level: 42,
            isVerified: true,
            followers: 41000,
            following: 220
          },
          description: 'Magical Fantasy Unicorn',
          hashtags: ['unicorn', 'fantasy', 'magic'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 15000,
            likes: 1200,
            comments: 78,
            shares: 200,
            saves: 350
          },
          createdAt: '2026-01-01T10:38:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't10',
          url: '/gifts/cosmic_panther.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=20',
          duration: '0:15',
          user: {
            id: 'test10',
            username: 'elix_cosmic',
            name: 'Elix Cosmic',
            avatar: 'https://i.pravatar.cc/150?u=elix_cosmic',
            level: 99,
            isVerified: true,
            followers: 72000,
            following: 150
          },
          description: 'Cosmic Panther from the stars',
          hashtags: ['cosmic', 'panther', 'space'],
          music: {
            id: 'original_sound',
            title: 'Original Sound',
            artist: 'Creator',
            duration: '0:15'
          },
          stats: {
            views: 22000,
            likes: 1800,
            comments: 95,
            shares: 300,
            saves: 500
          },
          createdAt: '2026-01-01T10:39:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't11',
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=21',
          duration: '0:10',
          user: {
            id: 'test11',
            username: 'neon_vibes',
            name: 'Neon Vibes',
            avatar: 'https://i.pravatar.cc/150?u=neon_vibes',
            level: 55,
            isVerified: true,
            followers: 89000,
            following: 320
          },
          description: 'Neon lights and city vibes ✨ #aesthetic',
          hashtags: ['neon', 'aesthetic', 'vibes'],
          music: {
            id: 'synth_wave',
            title: 'Synth Wave',
            artist: 'DJ Electric',
            duration: '0:10'
          },
          stats: {
            views: 45000,
            likes: 3200,
            comments: 180,
            shares: 450,
            saves: 800
          },
          createdAt: '2026-01-02T14:20:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't12',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=22',
          duration: '0:08',
          user: {
            id: 'test12',
            username: 'nature_lover',
            name: 'Nature Lover',
            avatar: 'https://i.pravatar.cc/150?u=nature_lover',
            level: 33,
            isVerified: false,
            followers: 25000,
            following: 180
          },
          description: 'Beautiful spring flowers blooming 🌸',
          hashtags: ['nature', 'spring', 'flowers'],
          music: {
            id: 'peaceful_piano',
            title: 'Peaceful Piano',
            artist: 'Calm Sounds',
            duration: '0:08'
          },
          stats: {
            views: 18000,
            likes: 1500,
            comments: 88,
            shares: 200,
            saves: 350
          },
          createdAt: '2026-01-02T16:45:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't13',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=23',
          duration: '0:12',
          user: {
            id: 'test13',
            username: 'ocean_dreams',
            name: 'Ocean Dreams',
            avatar: 'https://i.pravatar.cc/150?u=ocean_dreams',
            level: 78,
            isVerified: true,
            followers: 112000,
            following: 95
          },
          description: 'Relaxing ocean waves 🌊 #calm #relax',
          hashtags: ['ocean', 'waves', 'relax'],
          music: {
            id: 'ocean_sounds',
            title: 'Ocean Sounds',
            artist: 'Nature ASMR',
            duration: '0:12'
          },
          stats: {
            views: 67000,
            likes: 5400,
            comments: 320,
            shares: 890,
            saves: 1500
          },
          createdAt: '2026-01-03T09:15:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't14',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=24',
          duration: '0:06',
          user: {
            id: 'test14',
            username: 'glam_queen',
            name: 'Glam Queen',
            avatar: 'https://i.pravatar.cc/150?u=glam_queen',
            level: 92,
            isVerified: true,
            followers: 250000,
            following: 420
          },
          description: 'Silver glam makeup tutorial ✨💄',
          hashtags: ['makeup', 'glam', 'beauty'],
          music: {
            id: 'pop_beat',
            title: 'Pop Beat',
            artist: 'Hit Maker',
            duration: '0:06'
          },
          stats: {
            views: 120000,
            likes: 9800,
            comments: 560,
            shares: 1200,
            saves: 2800
          },
          createdAt: '2026-01-03T18:30:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        },
        {
          id: 't15',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          thumbnail: 'https://picsum.photos/400/600?random=25',
          duration: '0:09',
          user: {
            id: 'test15',
            username: 'dance_king',
            name: 'Dance King',
            avatar: 'https://i.pravatar.cc/150?u=dance_king',
            level: 67,
            isVerified: true,
            followers: 180000,
            following: 280
          },
          description: 'New dance moves 🔥 #dance #trending',
          hashtags: ['dance', 'trending', 'moves'],
          music: {
            id: 'dance_hit',
            title: 'Dance Hit',
            artist: 'Club Mix',
            duration: '0:09'
          },
          stats: {
            views: 88000,
            likes: 7200,
            comments: 420,
            shares: 980,
            saves: 1600
          },
          createdAt: '2026-01-04T12:00:00Z',
          location: 'For You',
          isLiked: false,
          isSaved: false,
          isFollowing: false,
          comments: [],
          quality: '1080p',
          privacy: 'public'
        }
      ],
      likedVideos: [],
      savedVideos: [],
      followingUsers: [],

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

      // Like actions
      toggleLike: (videoId) => set((state) => {
        const video = state.videos.find(v => v.id === videoId);
        if (!video) return state;

        const isLiked = video.isLiked;
        const newLikedVideos = isLiked 
          ? state.likedVideos.filter(id => id !== videoId)
          : [...state.likedVideos, videoId];

        return {
          videos: state.videos.map(v => 
            v.id === videoId 
              ? { 
                  ...v, 
                  isLiked: !isLiked,
                  stats: {
                    ...v.stats,
                    likes: isLiked ? v.stats.likes - 1 : v.stats.likes + 1
                  }
                }
              : v
          ),
          likedVideos: newLikedVideos
        };
      }),

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

      // Comment actions
      addComment: (videoId, commentData) => set((state) => {
        const newComment: Comment = {
          ...commentData,
          id: `comment_${Date.now()}_${Math.random()}`,
          time: 'now'
        };

        return {
          videos: state.videos.map(video => 
            video.id === videoId 
              ? { 
                  ...video, 
                  comments: [...video.comments, newComment],
                  stats: {
                    ...video.stats,
                    comments: video.stats.comments + 1
                  }
                }
              : video
          )
        };
      }),

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
      incrementViews: (videoId) => set((state) => ({
        videos: state.videos.map(video => 
          video.id === videoId 
            ? { 
                ...video, 
                stats: {
                  ...video.stats,
                  views: video.stats.views + 1
                }
              }
            : video
        )
      })),

      getTrendingVideos: () => {
        const { videos } = get();
        return [...videos].sort((a, b) => {
          const engagementA = (a.stats.likes + a.stats.comments + a.stats.shares) / a.stats.views;
          const engagementB = (b.stats.likes + b.stats.comments + b.stats.shares) / b.stats.views;
          return engagementB - engagementA;
        });
      },

      getRecommendedVideos: () => {
        const { videos, likedVideos, followingUsers } = get();
        const userLikedTags = videos
          .filter(v => likedVideos.includes(v.id))
          .flatMap(v => v.hashtags);
        
        const userFollowing = followingUsers;
        
        return videos
          .filter(video => !likedVideos.includes(video.id))
          .map(video => {
            let score = 0;
            
            // Boost for liked hashtags
            const commonTags = video.hashtags.filter(tag => 
              userLikedTags.includes(tag)
            ).length;
            score += commonTags * 2;
            
            // Boost for following users
            if (userFollowing.includes(video.user.id)) {
              score += 5;
            }
            
            // Boost for verified users
            if (video.user.isVerified) {
              score += 1;
            }
            
            // Boost for recent content
            const daysSinceUpload = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpload < 7) {
              score += 1;
            }
            
            return { video, score };
          })
          .sort((a, b) => b.score - a.score)
          .map(({ video }) => video)
          .slice(0, 10);
      }
    }),
    {
      name: 'video-store',
      partialize: (state) => ({
        likedVideos: state.likedVideos,
        savedVideos: state.savedVideos,
        followingUsers: state.followingUsers
      })
    }
  )
);
