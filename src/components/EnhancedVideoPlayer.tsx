import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Heart, 
  Bookmark, 
  Music,
  UserPlus,
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

// Reusable Sidebar Button Component for Gold & Black Theme
const SidebarButton = ({ 
  onClick, 
  isActive = false, 
  icon: Icon, 
  label, 
  customContent,
  className = ""
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  icon?: React.ElementType; 
  label?: string;
  customContent?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col items-center mr-[110px] ${className}`}>
    <button 
      onClick={onClick}
      className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 hover:bg-white/5 group"
    >
      {customContent ? customContent : Icon && (
        <Icon 
          className={`w-8 h-8 stroke-[1.5px] transition-colors ${
            isActive 
              ? 'text-black fill-[#E6B36A]' 
              : 'text-[#E6B36A] fill-black/60'
          }`} 
        />
      )}
    </button>
    {label && (
      <span 
        className="text-[#E6B36A] text-xs font-bold mt-1 text-shadow-sm cursor-pointer hover:underline"
        onClick={onClick}
      >
        {label}
      </span>
    )}
  </div>
);

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
      el
        ?.play()
        .catch((err) => {
          if (!effectiveMuted) {
            setIsMuted(true);
            if (videoRef.current) videoRef.current.muted = true;
            trackEvent('video_autoplay_sound_blocked', { videoId, name: err?.name });
          }
        });
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
          audio.play().catch(() => {});
        }
      }
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [effectiveMuted, incrementViews, isActive, video?.music?.previewUrl, videoId, volume]);

  useEffect(() => {
    if (!muteAllSounds) return;
    setIsMuted(true);
    if (videoRef.current) videoRef.current.muted = true;
    if (audioRef.current) {
      audioRef.current.muted = true;
      audioRef.current.pause();
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
      className="relative w-full h-screen bg-black snap-start overflow-hidden border-b border-gray-800 flex justify-center"
    >
      {/* Video Element */}
      <div className="absolute inset-0 w-full max-w-[500px]">
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
          <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-white/80">
            {videoSize.w}×{videoSize.h}
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 h-1 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-[#E6B36A]"
            style={{
              width: `${duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0}%`,
            }}
          />
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

      {/* Right Sidebar - Constrained to Right Edge */}
      {/* Old PNG overlay removed as per user request */}

      {/* Interactive Hitboxes - Aligned with the visual overlay */}
      <div className="absolute z-[201] right-[-97px] bottom-[100px] flex flex-col items-center gap-2 pb-24 pointer-events-auto">
        
        {/* Profile Avatar Area */}
        <div className="relative mr-[110px] mt-[10px]">
          <div 
            className="w-11 h-11 rounded-full cursor-pointer hover:brightness-110 relative border border-[#E6B36A]"
            onClick={handleProfileClick}
          >
             <img 
               src={video.user.avatar} 
               alt={video.user.username} 
               className="w-full h-full rounded-full object-cover"
             />
            {video.user.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-black">
                <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                </div>
              </div>
            )}
          </div>
          
          {/* Follow Button Badge */}
          {!video.isFollowing && (
            <button 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#E6B36A] rounded-full flex items-center justify-center hover:scale-110 transition-transform" 
              onClick={handleFollow}
            >
              <UserPlus className="w-3 h-3 text-black" />
            </button>
          )}
        </div>

        {/* Like Button */}
        <SidebarButton 
          onClick={handleLike}
          isActive={video.isLiked}
          icon={Heart}
          label={formatNumber(video.stats.likes)}
          className="mt-[10px]"
        />

        {/* Comment Button */}
        <SidebarButton 
          onClick={handleComment}
          icon={MessageCircle}
          label={formatNumber(video.stats.comments)}
          className="mt-[5px]"
        />

        {/* Save Button */}
        <SidebarButton 
          onClick={handleSave}
          isActive={video.isSaved}
          icon={Bookmark}
          className="mt-[5px]"
        />

        {/* Share Button */}
        <SidebarButton 
          onClick={handleShare}
          icon={Share2}
          label={formatNumber(video.stats.shares)}
          className="mt-[5px]"
        />

        <SidebarButton
          onClick={handleReport}
          icon={Flag}
          label="Report"
          className="mt-[5px]"
        />

        {/* Music Disc Area */}
        <div 
          className="w-11 h-11 rounded-full cursor-pointer hover:scale-110 transition-transform mt-[20px] mr-[110px] relative bg-black border border-[#E6B36A]"
          onClick={handleMusicClick}
        >
          <div className="absolute inset-0 rounded-full border border-[#E6B36A]/30 animate-spin" style={{ animationDuration: '8s' }} />
          <Music className="w-5 h-5 text-[#E6B36A] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Bottom Info Area */}
      <div className="absolute z-[190] left-4 bottom-[120px] md:bottom-[150px] w-[70%] pb-4 pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          <LevelBadge level={video.user.level ?? 1} size={10} layout="fixed" />
          <h3 className="text-[#E6B36A] font-bold text-shadow-md">{video.user.username}</h3>
          {video.user.isVerified && (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
          <span className="text-[#E6B36A]/60 text-sm">•</span>
          <span className="text-[#E6B36A]/60 text-sm">{formatNumber(video.user.followers)} followers</span>
        </div>
        
        <p className="text-white/90 text-sm mb-2 text-shadow-md line-clamp-2">
          {video.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {video.hashtags.map((hashtag) => (
            <button
              key={hashtag}
              onClick={() => navigate(`/hashtag/${hashtag}`)}
              className="text-[#E6B36A] text-xs font-medium hover:underline"
            >
              #{hashtag}
            </button>
          ))}
        </div>

        {video.location && (
          <div className="flex items-center gap-1 text-white/60 text-xs mb-2">
            <div className="w-3 h-3 bg-white/60 rounded-full" />
            <span>{video.location}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-white/90">
          <Music size={14} className="text-[#E6B36A]" />
          <span className="text-xs font-medium animate-marquee whitespace-nowrap overflow-hidden w-32">
            {video.music.title} - {video.music.artist}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-white/60 text-xs">
          <span>{formatNumber(video.stats.views)} views</span>
          <span>•</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
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
