import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Heart, 
  Bookmark, 
  Music,
  MessageCircle,
  Share2,
  Flag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVideoStore } from '../store/useVideoStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { trackEvent } from '../lib/analytics';
import EnhancedCommentsModal from './EnhancedCommentsModal';
import EnhancedLikesModal from './EnhancedLikesModal';
import ShareModal from './ShareModal';
import UserProfileModal from './UserProfileModal';
import ReportModal from './ReportModal';
import { LevelBadge } from './LevelBadge';

interface EnhancedVideoPlayerProps {
  videoId: string;
  isActive: boolean;
  onVideoEnd?: () => void;
  onProgress?: (progress: number) => void;
}

// Premium Sidebar Button Component with Metallic Rose Gold Design
const PremiumSidebarButton = ({ 
  onClick, 
  isActive = false, 
  iconSrc,
  icon: Icon,
  label, 
  className = ""
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  iconSrc?: string;
  icon?: React.ElementType;
  label?: string;
  className?: string;
}) => (
  <div className={`flex flex-col items-center ${className}`}>
    <button 
      onClick={onClick}
      className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
      style={{
        background: 'linear-gradient(145deg, rgba(30,30,30,0.95) 0%, rgba(10,10,10,0.98) 100%)',
        boxShadow: isActive 
          ? '0 0 20px rgba(230,179,106,0.5), inset 0 1px 1px rgba(255,255,255,0.1)' 
          : '0 4px 15px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)',
        border: '2px solid',
        borderColor: isActive ? '#E6B36A' : 'rgba(230,179,106,0.4)',
      }}
    >
      {/* Inner glow */}
      <div 
        className="absolute inset-[2px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)',
        }}
      />
      
      {/* Light reflection */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-transparent via-[#E6B36A]/30 to-transparent rounded-full" />
      
      {iconSrc ? (
        <img 
          src={iconSrc} 
          alt="" 
          className={`w-7 h-7 object-contain transition-all duration-200 ${isActive ? 'brightness-125' : 'opacity-80'}`}
          style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(230,179,106,0.6))' : 'none' }}
        />
      ) : Icon && (
        <Icon 
          className={`w-7 h-7 stroke-[1.5px] transition-all duration-200 ${
            isActive 
              ? 'text-[#E6B36A] drop-shadow-[0_0_8px_rgba(230,179,106,0.6)]' 
              : 'text-[#E6B36A]/70'
          }`}
          style={isActive ? { fill: '#E6B36A' } : { fill: 'transparent' }}
        />
      )}
    </button>
    {label && (
      <span 
        className={`text-xs font-semibold mt-1.5 cursor-pointer hover:underline transition-colors ${
          isActive ? 'text-[#E6B36A]' : 'text-[#E6B36A]/70'
        }`}
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
        onClick={onClick}
      >
        {label}
      </span>
    )}
  </div>
);

// Legacy wrapper for compatibility
const SidebarButton = PremiumSidebarButton;

export default function EnhancedVideoPlayer({ 
  videoId, 
  isActive, 
  onVideoEnd,
  onProgress 
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const volume = 0.5;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDoubleClick, setIsDoubleClick] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const navigate = useNavigate();
  const { muteAllSounds } = useSettingsStore();
  const { 
    videos, 
    toggleLike, 
    toggleSave, 
    toggleFollow, 
    incrementViews 
  } = useVideoStore();
  
  const video = videos.find(v => v.id === videoId);
  const effectiveMuted = muteAllSounds || isMuted;
  
  // Video playback controls
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      videoRef.current?.pause();
      audioRef.current?.pause();
    } else {
      videoRef.current?.play().catch(() => {});
      if (!effectiveMuted && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(prev => !prev);
  }, [effectiveMuted, isPlaying]);

  const toggleMute = () => {
    if (muteAllSounds) {
      trackEvent('video_toggle_mute_blocked_global', { videoId });
      return;
    }
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) {
        videoRef.current.volume = volume;
      }
    }

    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      audioRef.current.volume = volume;
      if (newMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }

    trackEvent('video_toggle_mute', { videoId, muted: !isMuted });
  };

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      onProgress?.(videoElement.currentTime / videoElement.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setVideoSize({ w: videoElement.videoWidth, h: videoElement.videoHeight });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [onProgress, onVideoEnd]);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (isActive) {
      const el = videoRef.current;
      const playResult = el?.play?.();
      if (playResult && typeof (playResult as Promise<void>).catch === 'function') {
        (playResult as Promise<void>).catch((err) => {
          if (!effectiveMuted) {
            setIsMuted(true);
            if (videoRef.current) videoRef.current.muted = true;
            trackEvent('video_autoplay_sound_blocked', { videoId, name: err?.name });
          }
        });
      }
      setIsPlaying(true);
      incrementViews(videoId);
      trackEvent('video_view', { videoId });

      const audio = audioRef.current;
      if (audio && video?.music?.previewUrl) {
        if (audio.src !== video.music.previewUrl) {
          audio.src = video.music.previewUrl;
        }
        audio.currentTime = 0;
        audio.muted = effectiveMuted;
        audio.volume = volume;
        if (!effectiveMuted) {
          const audioPlayResult = audio.play?.();
          if (audioPlayResult && typeof (audioPlayResult as Promise<void>).catch === 'function') {
            (audioPlayResult as Promise<void>).catch(() => {});
          }
        }
      }
    } else {
      const v = videoRef.current;
      if (v?.pause) {
        try {
          v.pause();
        } catch {
          void 0;
        }
      }
      setIsPlaying(false);
      const a = audioRef.current;
      if (a?.pause) {
        try {
          a.pause();
        } catch {
          void 0;
        }
      }
    }
  }, [effectiveMuted, incrementViews, isActive, video?.music?.previewUrl, videoId, volume]);

  useEffect(() => {
    if (!muteAllSounds) return;
    setIsMuted(true);
    if (videoRef.current) videoRef.current.muted = true;
    if (audioRef.current) {
      audioRef.current.muted = true;
      if (audioRef.current.pause) {
        try {
          audioRef.current.pause();
        } catch {
          void 0;
        }
      }
    }
  }, [muteAllSounds]);

  // Mouse/touch interactions
  const handleVideoClick = (e: React.MouseEvent) => {
    if (isMuted) {
      toggleMute();
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Double click detection
    if (isDoubleClick) {
      // Like on double click
      handleLike();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      return;
    }

    setIsDoubleClick(true);
    setTimeout(() => setIsDoubleClick(false), 300);

    // Single click - play/pause
    if (Math.abs(x - centerX) < rect.width * 0.3 && Math.abs(y - centerY) < rect.height * 0.3) {
      togglePlay();
    }
  };

  // Action handlers
  const handleLike = () => {
    toggleLike(videoId);
    trackEvent('video_like_toggle', { videoId, next: !video.isLiked });
  };

  const handleSave = () => {
    toggleSave(videoId);
    trackEvent('video_save_toggle', { videoId, next: !video.isSaved });
  };

  const handleFollow = () => {
    toggleFollow(video.user.id);
    trackEvent('video_follow_toggle', { videoId, userId: video.user.id, next: !video.isFollowing });
  };

  const handleShare = () => {
    setShowShareModal(true);
    trackEvent('video_share_open', { videoId });
  };

  const handleComment = () => {
    setShowComments(true);
    trackEvent('video_comments_open', { videoId });
  };

  const handleProfileClick = () => {
    setShowUserProfile(true);
    trackEvent('video_profile_open', { videoId, userId: video.user.id });
  };

  const handleMusicClick = () => {
    navigate(`/music/${encodeURIComponent(video.music.id)}`);
    trackEvent('video_music_open', { videoId, musicId: video.music.id });
  };

  const handleReport = () => {
    setShowReportModal(true);
    trackEvent('video_report_open', { videoId });
  };

  // Format functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!video) return null;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full snap-start overflow-hidden border-b border-gray-800 flex justify-center"
    >
      {/* Video Element - iPhone 14 Pro Max: 6.7" Super Retina XDR, 2796×1290px, 19.5:9, ~460ppi */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="w-full max-w-[500px] min-h-full" style={{ aspectRatio: '1290/2796' }}>
        <audio ref={audioRef} preload="auto" className="hidden" />
        <video
          ref={videoRef}
          src={video.url}
          className="w-full h-full object-cover"
          loop
          playsInline
          preload="auto"
          muted={effectiveMuted}
          onClick={handleVideoClick}
          onError={(e) => {
            console.warn(`Video ${video.id} failed to load:`, e);
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('bg-black');
            const errorText = document.createElement('div');
            errorText.className = 'absolute inset-0 flex items-center justify-center text-white/50 text-sm';
            errorText.innerText = 'Video unavailable';
            e.currentTarget.parentElement?.appendChild(errorText);
          }}
        />

        {videoSize && (
          <div className="absolute top-16 right-4 px-2 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/80">
            {videoSize.w}×{videoSize.h}
          </div>
        )}

            <div className="absolute bottom-3 left-3 right-3 h-1.5 rounded-full bg-black/40 overflow-hidden backdrop-blur-sm border border-white/10 shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-[#FFD700] via-[#E6B36A] to-[#FFD700] relative overflow-hidden"
            style={{
              width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
              boxShadow: '0 0 10px rgba(230,179,106,0.6)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Heart animation for double click */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="animate-ping">
              <Heart className="w-24 h-24 text-[#E6B36A] fill-current" />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Right Sidebar - LUXURY PREMIUM DESIGN */}
      <div className="absolute z-[201] right-3 bottom-20 flex flex-col items-center gap-3 pointer-events-auto">
        
        {/* Profile Avatar with Luxury Border & Glow */}
        <div className="relative -mt-4 mb-3 animate-float">
          <div 
            className="w-14 h-14 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 relative animate-glow-border"
            onClick={handleProfileClick}
            style={{
              background: 'linear-gradient(145deg, #FFD700 0%, #E6B36A 50%, #FFD700 100%)',
              padding: '3px',
              boxShadow: '0 8px 24px rgba(230,179,106,0.6), 0 0 40px rgba(230,179,106,0.3)',
            }}
          >
            <img 
              src={video.user.avatar} 
              alt={video.user.username} 
              className="w-full h-full rounded-full object-cover border-2 border-black/20"
            />
            {video.user.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-0.5 border-2 border-black animate-premium-glow">
                <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Like Button - Premium Style */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleLike}
            className="w-16 h-16 hover:scale-110 active:scale-95 transition-all duration-300 relative"
            title="Like"
          >
            <img 
              src="/Icons/side-like.png?v=10" 
              alt="Like" 
              className={`w-full h-full object-contain transition-all duration-300 ${
                video.isLiked 
                  ? 'brightness-125 drop-shadow-[0_0_20px_rgba(230,179,106,0.9)] animate-luxury-pulse' 
                  : 'hover:brightness-110 hover:drop-shadow-[0_0_10px_rgba(230,179,106,0.5)]'
              }`}
            />
          </button>
          <span className="glass-premium px-2 py-0.5 rounded-full text-[#E6B36A] text-xs font-bold shadow-lg">
            {formatNumber(video.stats.likes)}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleComment}
            className="w-12 h-12 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Comments"
          >
            <img src="/Icons/side-comment.png" alt="Comments" className="w-full h-full object-contain hover:brightness-110 transition-all" />
          </button>
          <span className="glass px-2 py-0.5 rounded-full text-[#E6B36A] text-xs font-bold">
            {formatNumber(video.stats.comments)}
          </span>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleSave}
            className="w-12 h-12 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Save"
          >
            <img 
              src="/Icons/side-save.png" 
              alt="Save" 
              className={`w-full h-full object-contain transition-all ${
                video.isSaved 
                  ? 'brightness-125 drop-shadow-[0_0_15px_rgba(230,179,106,0.8)]' 
                  : 'hover:brightness-110'
              }`}
            />
          </button>
          <span className="glass px-2 py-0.5 rounded-full text-white text-xs font-bold">
            {formatNumber(video.stats.saves || 0)}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleShare}
            className="w-12 h-12 hover:scale-110 active:scale-95 transition-all duration-300"
            title="Share"
          >
            <img src="/Icons/side-share.png" alt="Share" className="w-full h-full object-contain hover:brightness-110 transition-all" />
          </button>
          <span className="glass px-2 py-0.5 rounded-full text-white text-xs font-bold">
            {formatNumber(video.stats.shares)}
          </span>
        </div>

        {/* Music Button - Spinning with Glow */}
        <button 
          onClick={handleMusicClick}
          className="w-12 h-12 hover:scale-110 transition-all duration-300 animate-spin-slow relative"
          title="Music"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#E6B36A]/30 to-transparent rounded-full blur-md animate-premium-glow" />
          <img src="/Icons/side-music.png" alt="Music" className="w-full h-full object-contain relative z-10" />
        </button>

        {/* Menu Button */}
        <button 
          onClick={() => {}}
          className="w-12 h-12 hover:scale-110 active:scale-95 transition-all duration-300"
          title="More"
        >
          <img src="/Icons/side-menu.png" alt="More" className="w-full h-full object-contain hover:brightness-110 transition-all" />
        </button>
      </div>

      {/* Bottom Info Area - LUXURY REDESIGN */}
      <div className="absolute z-[190] left-4 bottom-[120px] md:bottom-[150px] w-[70%] pb-4 pointer-events-none">
        {/* Premium User Badge with Glassmorphism */}
        <div className="glass-premium rounded-2xl px-3 py-2 mb-3 animate-luxury-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <LevelBadge level={video.user.level ?? 1} size={10} layout="fixed" />
            <h3 className="text-[#E6B36A] font-extrabold text-shadow-md tracking-wide">{video.user.username}</h3>
            {video.user.isVerified && (
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-[#E6B36A]/80 text-xs font-semibold">
            <span>{formatNumber(video.user.followers)} followers</span>
            <span>•</span>
            <span className="text-white/70">{formatNumber(video.stats.views)} views</span>
          </div>
        </div>
        
        {/* Description with Premium Background */}
        <p className="text-white text-sm mb-2 text-shadow-lg font-medium line-clamp-2 px-1">
          {video.description}
        </p>
        
        {/* Hashtags with Luxury Style */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {video.hashtags.map((hashtag) => (
            <button
              key={hashtag}
              onClick={() => navigate(`/hashtag/${hashtag}`)}
              className="glass px-2.5 py-1 rounded-full text-[#E6B36A] text-xs font-bold hover:bg-[#E6B36A]/20 transition-all hover:scale-105 pointer-events-auto"
            >
              #{hashtag}
            </button>
          ))}
        </div>

        {video.location && (
          <div className="flex items-center gap-1.5 text-white/70 text-xs mb-2.5 px-1">
            <div className="w-2 h-2 bg-[#E6B36A] rounded-full animate-premium-glow" />
            <span className="font-medium">{video.location}</span>
          </div>
        )}
        
        {/* Music Player - Premium Style */}
        <div className="glass-premium rounded-full px-3 py-2 flex items-center gap-2 w-fit max-w-[90%]">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E6B36A] to-[#C9A172] flex items-center justify-center animate-spin-slow">
            <Music size={14} className="text-black" />
          </div>
          <div className="overflow-hidden flex-1 max-w-[180px]">
            <div className="text-xs font-bold text-white whitespace-nowrap animate-marquee">
              <span className="inline-block pl-full animate-marquee-scroll">
                {video.music.title} - {video.music.artist}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EnhancedCommentsModal 
        isOpen={showComments} 
        onClose={() => setShowComments(false)}
        videoId={videoId}
        comments={video.comments}
      />
      
      <EnhancedLikesModal 
        isOpen={showLikes} 
        onClose={() => setShowLikes(false)}
        videoId={videoId}
        likes={video.stats.likes}
      />
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        video={video}
      />
      
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={video.user}
        onFollow={handleFollow}
      />
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        videoId={videoId}
        contentType="video"
      />
    </div>
  );
}
