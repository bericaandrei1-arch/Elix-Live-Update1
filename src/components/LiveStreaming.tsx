import React, { useState, useEffect, useRef } from 'react';
import { LiveStreamingManager } from '../lib/liveStreaming';
import { LiveChat } from './LiveChat';
import { Video, VideoOff, Mic, MicOff, Settings, Users, Eye, Play, Square, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import FaceARGift from './FaceARGift';
import { FaceARGift as FaceARGiftType } from '../lib/liveStreaming';

interface LiveStreamingProps {
  isStreamer?: boolean;
  streamId?: string;
  currentFaceARGift?: FaceARGiftType | null;
  onFaceARGiftComplete?: () => void;
}

export const LiveStreaming: React.FC<LiveStreamingProps> = ({ 
  isStreamer = false, 
  streamId,
  currentFaceARGift,
  onFaceARGiftComplete
}) => {
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedQuality, setSelectedQuality] = useState<'360p' | '480p' | '720p' | '1080p'>('720p');
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamStartTime, setStreamStartTime] = useState<Date | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamManager = LiveStreamingManager.getInstance();

  const categories = [
    'General', 'Gaming', 'Music', 'Dance', 'Comedy', 'Education', 
    'Sports', 'Technology', 'Art', 'Cooking', 'Travel', 'Fashion'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive && streamStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - streamStartTime.getTime();
        setStreamDuration(Math.floor(diff / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive, streamStartTime]);

  useEffect(() => {
    // Set up stream manager listeners
    streamManager.onStreamUpdate((stream) => {
      setViewerCount(stream.viewerCount);
    });

    // Request camera/mic permissions on mount
    if (isStreamer) {
      requestMediaPermissions();
    }
  }, [isStreamer]);

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      alert('Please enter a stream title');
      return;
    }

    try {
      await streamManager.startLiveStream({
        title: streamTitle,
        description: streamDescription,
        category: selectedCategory,
        isPrivate,
        allowComments,
        quality: selectedQuality
      });

      setIsLive(true);
      setStreamStartTime(new Date());
      setShowSettings(false);
    } catch (error) {
      console.error('Error starting stream:', error);
      alert('Failed to start stream. Please check your camera and microphone permissions.');
    }
  };

  const handleEndStream = async () => {
    try {
      await streamManager.endStream();
      setIsLive(false);
      setStreamStartTime(null);
      setStreamDuration(0);
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Implement video track enable/disable
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Implement audio track enable/disable
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const StreamControls = () => (
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isVideoEnabled ? "default" : "destructive"}
          onClick={toggleVideo}
          className="bg-black/50 hover:bg-black/70 border border-white/20"
        >
          {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
        
        <Button
          size="sm"
          variant={isAudioEnabled ? "default" : "destructive"}
          onClick={toggleAudio}
          className="bg-black/50 hover:bg-black/70 border border-white/20"
        >
          {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="bg-black/50 hover:bg-black/70 border border-white/20 text-white"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-black/50 px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">{viewerCount}</span>
        </div>
        
        {isLive && (
          <div className="bg-red-500 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
            <span>{formatDuration(streamDuration)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isLive ? (
          <Button
            onClick={handleEndStream}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Square className="w-4 h-4 mr-2" />
            End Stream
          </Button>
        ) : (
          <Button
            onClick={handleStartStream}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Go Live
          </Button>
        )}
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Stream Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(false)}
        >
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Stream Title</label>
          <Input
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            placeholder="Enter stream title..."
            disabled={isLive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={streamDescription}
            onChange={(e) => setStreamDescription(e.target.value)}
            placeholder="Describe your stream..."
            disabled={isLive}
            className="w-full p-2 border rounded-md resize-none h-20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isLive}
            className="w-full p-2 border rounded-md"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quality</label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value as any)}
            disabled={isLive}
            className="w-full p-2 border rounded-md"
          >
            <option value="360p">360p</option>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={isLive}
          />
          <label htmlFor="private" className="text-sm">Private Stream</label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="comments"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            disabled={isLive}
          />
          <label htmlFor="comments" className="text-sm">Allow Comments</label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Face AR Gift Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 10 }}
      />

      {/* Face AR Gift Component */}
      {currentFaceARGift && (
        <FaceARGift
          videoElement={videoRef.current}
          canvasElement={canvasRef.current}
          giftType={currentFaceARGift.type}
          color={currentFaceARGift.color}
          isActive={true}
          onFaceDetected={(hasFace) => {
            if (!hasFace && onFaceARGiftComplete) {
              // Gift completed when face is no longer detected
              setTimeout(onFaceARGiftComplete, 1000);
            }
          }}
        />
      )}

      {/* Stream Settings Overlay */}
      {!isLive && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Start Live Stream</h2>
              <p className="text-gray-600 text-sm">Set up your stream and go live</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stream Title *</label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter stream title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartStream}
                  disabled={!streamTitle.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Controls */}
      {isStreamer && (
        <>
          <StreamControls />
          {showSettings && <SettingsPanel />}
        </>
      )}

      {/* Live Indicator for Viewers */}
      {!isStreamer && isLive && (
        <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      )}
    </div>
  );
};
