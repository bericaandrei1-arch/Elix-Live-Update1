import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Bookmark, Play, Pause, Volume2, VolumeX, Music, User, MoreHorizontal, Check } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

interface VideoData {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  music: {
    title: string;
    artist: string;
  };
  duration: number;
  liked: boolean;
  saved: boolean;
  following: boolean;
}

interface ElixStarLiveVideoFeedProps {
  videos: VideoData[];
  onLike?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onSave?: (videoId: string) => void;
  onFollow?: (userId: string) => void;
  onProfileClick?: (userId: string) => void;
}

const ElixStarLiveVideoPlayer: React.FC<{
  video: VideoData;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onProfileClick: () => void;
}> = ({ video, isActive, onLike, onComment, onShare, onSave, onFollow, onProfileClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play when video is in view
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Auto-play failed:', error);
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Update progress
  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current && isPlaying) {
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(currentProgress);
      }
    };

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative h-screen w-full bg-black flex items-center justify-center overflow-hidden"
      onClick={showControlsTemporarily}
    >
      {/* Video Player */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/30">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </button>
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onProfileClick}
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/80 hover:border-white transition-colors"
          >
            <img src={video.author.avatar} alt={video.author.name} className="w-full h-full object-cover" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">@{video.author.name}</span>
              {video.author.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="text-sm text-white/80">{video.description}</div>
          </div>
          {!video.following && (
            <button
              onClick={onFollow}
              className="px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Follow
            </button>
          )}
        </div>

        {/* Music Info */}
        <div className="flex items-center gap-2 text-white/80">
          <Music className="w-4 h-4" />
          <span className="text-sm">{video.music.title} - {video.music.artist}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        {/* Like Button */}
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
            video.liked 
              ? 'bg-pink-500 text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}>
            <Heart className={`w-6 h-6 ${video.liked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs text-white">{formatNumber(video.stats.likes)}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={onComment}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group-hover:scale-110">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs text-white">{formatNumber(video.stats.comments)}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group-hover:scale-110">
            <Share className="w-6 h-6" />
          </div>
          <span className="text-xs text-white">{formatNumber(video.stats.shares)}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
            video.saved 
              ? 'bg-yellow-500 text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}>
            <Bookmark className={`w-6 h-6 ${video.saved ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs text-white">{video.saved ? 'Saved' : 'Save'}</span>
        </button>

        {/* More Button */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all group-hover:scale-110">
            <MoreHorizontal className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Floating Music Disc */}
      <div className="absolute bottom-4 right-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/60 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
          <Music className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export const ElixStarLiveVideoFeed: React.FC<ElixStarLiveVideoFeedProps> = ({
  videos,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  onProfileClick
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  // Touch/Mouse handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isScrolling.current) return;
    
    const touchEndY = e.touches[0].clientY;
    const deltaY = touchStartY.current - touchEndY;
    
    if (Math.abs(deltaY) > 50) { // Minimum swipe distance
      isScrolling.current = true;
      
      if (deltaY > 0 && currentVideoIndex < videos.length - 1) {
        // Swipe up - next video
        setCurrentVideoIndex(prev => prev + 1);
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        setCurrentVideoIndex(prev => prev - 1);
      }
    }
  };

  // Mouse wheel handler for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 10) { // Minimum scroll distance
      if (e.deltaY > 0 && currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentVideoIndex > 0) {
        setCurrentVideoIndex(prev => prev - 1);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (currentVideoIndex > 0) {
            setCurrentVideoIndex(prev => prev - 1);
          }
          break;
        case 'ArrowDown':
          if (currentVideoIndex < videos.length - 1) {
            setCurrentVideoIndex(prev => prev + 1);
          }
          break;
        case ' ':
          e.preventDefault();
          // Space bar to play/pause current video
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length]);

  // Preload next video
  useEffect(() => {
    if (currentVideoIndex < videos.length - 1) {
      const nextVideo = new Image();
      nextVideo.src = videos[currentVideoIndex + 1].thumbnail;
    }
  }, [currentVideoIndex, videos]);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-hidden relative bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
    >
      {/* Video Container */}
      <div 
        className="h-full w-full transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
          height: `${videos.length * 100}vh`
        }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-screen w-full relative">
            <ElixStarLiveVideoPlayer
              video={video}
              isActive={index === currentVideoIndex}
              onLike={() => onLike?.(video.id)}
              onComment={() => onComment?.(video.id)}
              onShare={() => onShare?.(video.id)}
              onSave={() => onSave?.(video.id)}
              onFollow={() => onFollow?.(video.author.id)}
              onProfileClick={() => onProfileClick?.(video.author.id)}
            />
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {videos.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-8 rounded-full transition-all duration-300 ${
              index === currentVideoIndex 
                ? 'bg-white' 
                : index < currentVideoIndex 
                  ? 'bg-white/30' 
                  : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Navigation Arrows (Desktop) */}
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 hidden md:flex flex-col gap-4">
        <button
          onClick={() => currentVideoIndex > 0 && setCurrentVideoIndex(prev => prev - 1)}
          disabled={currentVideoIndex === 0}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={() => currentVideoIndex < videos.length - 1 && setCurrentVideoIndex(prev => prev + 1)}
          disabled={currentVideoIndex === videos.length - 1}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-30"
        >
          ↓
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm hidden md:block">
        Swipe up/down or use arrow keys to navigate
      </div>
    </div>
  );
};

// Sample data generator for testing
export const generateSampleVideos = (count: number = 10): VideoData[] => {
  const sampleVideos = [
    {
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
      thumbnail: "https://picsum.photos/400/700?random=1",
      title: "Amazing Dance Moves",
      description: "Check out these incredible dance moves! 🔥 #dance #viral #trending",
      author: { id: "1", name: "dance_queen", avatar: "https://picsum.photos/100/100?random=11", verified: true },
      stats: { likes: 1250000, comments: 45000, shares: 23000, views: 8500000 },
      music: { title: "Viral Dance Beat", artist: "DJ Trend" },
      duration: 15,
      liked: false,
      saved: false,
      following: false
    },
    {
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
      thumbnail: "https://picsum.photos/400/700?random=2",
      title: "Cooking Tutorial",
      description: "Learn to make the perfect pasta in 30 seconds! 🍝 #cooking #foodie #tutorial",
      author: { id: "2", name: "chef_master", avatar: "https://picsum.photos/100/100?random=12", verified: false },
      stats: { likes: 890000, comments: 23000, shares: 15000, views: 4200000 },
      music: { title: "Cooking Vibes", artist: "Kitchen Beats" },
      duration: 30,
      liked: true,
      saved: false,
      following: true
    },
    {
      url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4",
      thumbnail: "https://picsum.photos/400/700?random=3",
      title: "Funny Pets Compilation",
      description: "These pets will make your day! 😂 #pets #funny #animals #cute",
      author: { id: "3", name: "pet_lover", avatar: "https://picsum.photos/100/100?random=13", verified: true },
      stats: { likes: 2100000, comments: 67000, shares: 34000, views: 12000000 },
      music: { title: "Happy Pets", artist: "Animal Sounds" },
      duration: 45,
      liked: false,
      saved: true,
      following: false
    }
  ];

  return Array.from({ length: count }, (_, i) => ({
    ...sampleVideos[i % sampleVideos.length],
    id: `video_${i + 1}`,
    thumbnail: `https://picsum.photos/400/700?random=${i + 1}`,
    author: {
      ...sampleVideos[i % sampleVideos.length].author,
      avatar: `https://picsum.photos/100/100?random=${i + 11}`
    }
  }));
};

export default ElixStarLiveVideoFeed;