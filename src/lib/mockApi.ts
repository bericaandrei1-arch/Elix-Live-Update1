// 🎭 Mock API - Works without real API keys!
// This lets your Elix Star Live app run immediately

export const mockUsers = [
  {
    id: '1',
    username: 'creator_one',
    displayName: 'Alex Creator',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face',
    followers: 12500,
    following: 340,
    videos: 45,
    likes: 89000,
    bio: '🎬 Content creator | 🎵 Music lover | ✨ Elix Star Live videos',
    verified: true,
    level: 25
  },
  {
    id: '2',
    username: 'dance_queen',
    displayName: 'Sarah Dancer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    followers: 8900,
    following: 210,
    videos: 67,
    likes: 156000,
    bio: '💃 Dance videos | 🎵 Trending sounds | ✨ Positive vibes',
    verified: false,
    level: 18
  },
  {
    id: '3',
    username: 'comedy_king',
    displayName: 'Mike Funny',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    followers: 23400,
    following: 120,
    videos: 89,
    likes: 345000,
    bio: '😂 Comedy videos | 🎭 Daily laughs | 🎯 Entertainment',
    verified: true,
    level: 42
  }
];

export const mockVideos = [
  {
    id: '1',
    userId: '1',
    username: 'creator_one',
    displayName: 'Alex Creator',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=720&h=1280&fit=crop',
    description: 'Amazing effects with the new filter! ✨ #trending #effects',
    music: 'Trending Sound - Original Audio',
    likes: 12500,
    comments: 234,
    shares: 89,
    views: 45000,
    duration: 15,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hashtags: ['#trending', '#effects', '#viral'],
    verified: true,
    isLiked: false,
    isSaved: false,
    isFollowing: false
  },
  {
    id: '2',
    userId: '2',
    username: 'dance_queen',
    displayName: 'Sarah Dancer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=720&h=1280&fit=crop',
    description: 'New dance challenge! 💃 Who can do this better? #dance #challenge',
    music: 'Popular Dance Track 2024',
    likes: 8900,
    comments: 156,
    shares: 234,
    views: 67000,
    duration: 20,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    hashtags: ['#dance', '#challenge', '#viral'],
    verified: false,
    isLiked: true,
    isSaved: false,
    isFollowing: true
  },
  {
    id: '3',
    userId: '3',
    username: 'comedy_king',
    displayName: 'Mike Funny',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=720&h=1280&fit=crop',
    description: 'When you try to use Elix Star Live effects for the first time 😂 #comedy #relatable',
    music: 'Funny Sound Effect Compilation',
    likes: 23400,
    comments: 567,
    shares: 445,
    views: 156000,
    duration: 25,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    hashtags: ['#comedy', '#relatable', '#viral'],
    verified: true,
    isLiked: false,
    isSaved: true,
    isFollowing: false
  }
];

export const mockLiveStreams = [
  {
    id: 'live1',
    userId: '1',
    username: 'creator_one',
    displayName: 'Alex Creator',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face',
    title: '🎬 Live Effects Tutorial - Learn Amazing Elix Star Live Tricks!',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=720&h=1280&fit=crop',
    viewers: 1247,
    duration: 1800,
    isLive: true,
    likes: 890,
    gifts: 45,
    verified: true,
    level: 25,
    tags: ['tutorial', 'effects', 'live']
  },
  {
    id: 'live2',
    userId: '2',
    username: 'dance_queen',
    displayName: 'Sarah Dancer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    title: '💃 Live Dance Session - Taking Requests!',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=720&h=1280&fit=crop',
    viewers: 892,
    duration: 900,
    isLive: true,
    likes: 567,
    gifts: 23,
    verified: false,
    level: 18,
    tags: ['dance', 'music', 'live']
  }
];

export const mockGifts = [
  {
    id: 'gift1',
    name: 'Rose',
    icon: '🌹',
    price: 1,
    animation: 'bounce',
    category: 'basic'
  },
  {
    id: 'gift2',
    name: 'Heart',
    icon: '❤️',
    price: 5,
    animation: 'pulse',
    category: 'basic'
  },
  {
    id: 'gift3',
    name: 'Fire',
    icon: '🔥',
    price: 10,
    animation: 'shake',
    category: 'premium'
  },
  {
    id: 'gift4',
    name: 'Diamond',
    icon: '💎',
    price: 50,
    animation: 'sparkle',
    category: 'premium'
  },
  {
    id: 'gift5',
    name: 'Dragon',
    icon: '🐉',
    price: 100,
    animation: 'fly',
    category: 'legendary'
  }
];

export const mockComments = [
  {
    id: '1',
    userId: '2',
    username: 'dance_queen',
    displayName: 'Sarah Dancer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=30&h=30&fit=crop&crop=face',
    content: 'Amazing effects! 🔥',
    likes: 12,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isLiked: false
  },
  {
    id: '2',
    userId: '3',
    username: 'comedy_king',
    displayName: 'Mike Funny',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=30&h=30&fit=crop&crop=face',
    content: 'This is so cool! How did you do that effect? ✨',
    likes: 8,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    isLiked: true
  }
];

// Mock API functions
export const mockApi = {
  // User functions
  getUser: async (userId: string) => {
    await delay(300);
    return mockUsers.find(user => user.id === userId) || mockUsers[0];
  },

  getUsers: async () => {
    await delay(500);
    return mockUsers;
  },

  // Video functions
  getVideos: async (page = 1, limit = 10) => {
    await delay(600);
    const start = (page - 1) * limit;
    const end = start + limit;
    return mockVideos.slice(start, end);
  },

  getVideo: async (videoId: string) => {
    await delay(300);
    return mockVideos.find(video => video.id === videoId) || mockVideos[0];
  },

  // Live stream functions
  getLiveStreams: async () => {
    await delay(400);
    return mockLiveStreams;
  },

  getLiveStream: async (streamId: string) => {
    await delay(300);
    return mockLiveStreams.find(stream => stream.id === streamId) || mockLiveStreams[0];
  },

  // Gift functions
  getGifts: async () => {
    await delay(200);
    return mockGifts;
  },

  // Comment functions
  getComments: async (_videoId: string) => {
    await delay(400);
    return mockComments;
  },

  // Like/Unlike functions
  likeVideo: async (videoId: string) => {
    await delay(300);
    const video = mockVideos.find(v => v.id === videoId);
    if (video) {
      video.isLiked = true;
      video.likes += 1;
    }
    return { success: true };
  },

  unlikeVideo: async (videoId: string) => {
    await delay(300);
    const video = mockVideos.find(v => v.id === videoId);
    if (video) {
      video.isLiked = false;
      video.likes -= 1;
    }
    return { success: true };
  },

  // Follow/Unfollow functions
  followUser: async (userId: string) => {
    await delay(300);
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.followers += 1;
    }
    return { success: true };
  },

  unfollowUser: async (userId: string) => {
    await delay(300);
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.followers -= 1;
    }
    return { success: true };
  },

  // Gift sending
  sendGift: async (streamId: string, giftId: string, _userId: string) => {
    await delay(500);
    const stream = mockLiveStreams.find(s => s.id === streamId);
    const gift = mockGifts.find(g => g.id === giftId);
    
    if (stream && gift) {
      stream.gifts += 1;
      return { 
        success: true, 
        message: `Sent ${gift.name} to ${stream.displayName}!`,
        gift: gift
      };
    }
    
    return { success: false, message: 'Failed to send gift' };
  },

  // Authentication (mock)
  login: async (_email: string, _password: string) => {
    await delay(800);
    return {
      user: mockUsers[0],
      token: 'mock-jwt-token-12345',
      success: true
    };
  },

  register: async (email: string, _password: string, username: string) => {
    await delay(1000);
    return {
      user: {
        ...mockUsers[0],
        email,
        username
      },
      token: 'mock-jwt-token-67890',
      success: true
    };
  }
};

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default mockApi;
