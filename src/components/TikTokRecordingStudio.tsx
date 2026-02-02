import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EnhancedVideoEffectsProcessor } from '../lib/enhancedVideoEffects';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Camera, CameraOff, Mic, MicOff, Play, Pause, Square, 
  Upload, Music, Sparkles, Volume2, VolumeX, RotateCcw, 
  FlipHorizontal, FlipVertical, Zap, Heart, Star, 
  Clock, Filter, Palette, Text, Sticker, Save,
  Check, X, Settings, Sun, Moon
} from 'lucide-react';

interface RecordingSettings {
  video: boolean;
  audio: boolean;
  effects: string[];
  speed: number;
  beautyLevel: number;
  filter: string;
  isMuted: boolean;
  audioVolume: number;
  isFrontCamera: boolean;
  flashEnabled: boolean;
  quality: '720p' | '1080p';
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  artist: string;
  isPopular: boolean;
}

interface StickerItem {
  id: string;
  emoji: string;
  name: string;
  category: string;
}

export const ElixStarLiveRecordingStudio: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const effectsProcessorRef = useRef<EnhancedVideoEffectsProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<'effects' | 'filters' | 'beauty' | 'speed' | 'audio' | 'text' | 'stickers'>('effects');
  const [showPreview, setShowPreview] = useState(false);
  const [textOverlays, setTextOverlays] = useState<Array<{id: string, text: string, x: number, y: number, style: any}>>([]);
  const [stickers, setStickers] = useState<Array<{id: string, emoji: string, x: number, y: number, animation: string}>>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const [settings, setSettings] = useState<RecordingSettings>({
    video: true,
    audio: true,
    effects: [],
    speed: 1,
    beautyLevel: 0,
    filter: 'none',
    isMuted: false,
    audioVolume: 0.5,
    isFrontCamera: true,
    flashEnabled: false,
    quality: '1080p'
  });

  // Audio tracks (simulated - in real app would fetch from API)
  const audioTracks: AudioTrack[] = [
    { id: '1', name: 'Trending Sound 1', url: '/audio/trending1.mp3', duration: 15, artist: 'Artist 1', isPopular: true },
    { id: '2', name: 'Popular Beat', url: '/audio/beat1.mp3', duration: 30, artist: 'Beat Maker', isPopular: true },
    { id: '3', name: 'Funny Sound', url: '/audio/funny1.mp3', duration: 10, artist: 'Comedy Sounds', isPopular: false },
    { id: '4', name: 'Dance Track', url: '/audio/dance1.mp3', duration: 60, artist: 'DJ Mix', isPopular: true },
    { id: '5', name: 'Chill Vibes', url: '/audio/chill1.mp3', duration: 45, artist: 'Chill Artist', isPopular: false },
  ];

  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Stickers data
  const stickerCategories = {
    popular: [
      { id: '1', emoji: '❤️', name: 'Heart', category: 'popular' },
      { id: '2', emoji: '🔥', name: 'Fire', category: 'popular' },
      { id: '3', emoji: '✨', name: 'Sparkles', category: 'popular' },
      { id: '4', emoji: '😂', name: 'Laugh', category: 'popular' },
      { id: '5', emoji: '👍', name: 'Thumbs Up', category: 'popular' },
    ],
    emojis: [
      { id: '6', emoji: '😍', name: 'Love Eyes', category: 'emojis' },
      { id: '7', emoji: '🤔', name: 'Thinking', category: 'emojis' },
      { id: '8', emoji: '😎', name: 'Cool', category: 'emojis' },
      { id: '9', emoji: '🥳', name: 'Party', category: 'emojis' },
      { id: '10', emoji: '😱', name: 'Shocked', category: 'emojis' },
    ],
    effects: [
      { id: '11', emoji: '💫', name: 'Dizzy', category: 'effects' },
      { id: '12', emoji: '🌟', name: 'Star', category: 'effects' },
      { id: '13', emoji: '⚡', name: 'Lightning', category: 'effects' },
      { id: '14', emoji: '💥', name: 'Explosion', category: 'effects' },
      { id: '15', emoji: '🎉', name: 'Party Popper', category: 'effects' },
    ]
  };

  const [activeStickerCategory, setActiveStickerCategory] = useState<keyof typeof stickerCategories>('popular');

  // Initialize camera and effects processor
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, [settings.isFrontCamera]);

  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          width: settings.quality === '1080p' ? 1920 : 1280,
          height: settings.quality === '1080p' ? 1080 : 720,
          facingMode: settings.isFrontCamera ? 'user' : 'environment'
        },
        audio: settings.audio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Initialize effects processor
      if (canvasRef.current) {
        effectsProcessorRef.current = new EnhancedVideoEffectsProcessor(canvasRef.current);
        effectsProcessorRef.current.start();
        startEffectLoop();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startEffectLoop = () => {
    const processFrame = () => {
      if (videoRef.current && canvasRef.current && effectsProcessorRef.current && !isRecording) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Apply effects
        effectsProcessorRef.current.processFrame(video, settings.effects);
        
        // Add text overlays
        textOverlays.forEach(overlay => {
          effectsProcessorRef.current?.addAnimatedText(overlay.text, {x: overlay.x, y: overlay.y}, 'fade');
        });
        
        // Add stickers
        stickers.forEach(sticker => {
          effectsProcessorRef.current?.addAnimatedSticker(sticker.emoji, {x: sticker.x, y: sticker.y}, sticker.animation);
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      recordedChunksRef.current = [];
      
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: settings.quality === '1080p' ? 8000000 : 4000000,
        audioBitsPerSecond: 128000
      };

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsPreview(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration timer
      const startTime = Date.now();
      const timer = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
        if (!isRecording) {
          clearInterval(timer);
        }
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const toggleEffect = (effectId: string) => {
    setSettings(prev => ({
      ...prev,
      effects: prev.effects.includes(effectId)
        ? prev.effects.filter(id => id !== effectId)
        : [...prev.effects, effectId]
    }));
  };

  const addTextOverlay = () => {
    const newText = prompt('Enter text:');
    if (newText && canvasRef.current) {
      setTextOverlays(prev => [...prev, {
        id: Date.now().toString(),
        text: newText,
        x: canvasRef.current!.width / 2,
        y: canvasRef.current!.height / 2,
        style: { font: 'bold 32px Arial', color: 'white', stroke: 'black' }
      }]);
    }
  };

  const addSticker = (sticker: StickerItem) => {
    setStickers(prev => [...prev, {
      id: Date.now().toString(),
      emoji: sticker.emoji,
      x: Math.random() * (canvasRef.current?.width || 300),
      y: Math.random() * (canvasRef.current?.height || 400),
      animation: 'bounce'
    }]);
  };

  const saveVideo = async () => {
    if (!recordedBlob) return;

    // Create form data for upload
    const formData = new FormData();
    formData.append('video', recordedBlob, `elix_star_live_video_${Date.now()}.webm`);
    formData.append('effects', JSON.stringify(settings.effects));
    formData.append('duration', duration.toString());
    formData.append('textOverlays', JSON.stringify(textOverlays));
    formData.append('stickers', JSON.stringify(stickers));

    try {
      // Upload to your backend
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Video uploaded successfully!');
        resetRecording();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const resetRecording = () => {
    setIsPreview(false);
    setRecordedBlob(null);
    setDuration(0);
    setTextOverlays([]);
    setStickers([]);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (effectsProcessorRef.current) {
      effectsProcessorRef.current.destroy();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-pink-500" />
          <h1 className="text-xl font-bold">Create Video</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, isFrontCamera: !prev.isFrontCamera }))}
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettings(prev => ({ ...prev, flashEnabled: !prev.flashEnabled }))}
          >
            {settings.flashEnabled ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Recording Area */}
        <div className="flex-1 relative">
          {/* Video Preview */}
          <div className="relative h-full flex items-center justify-center bg-gray-900">
            <video
              ref={videoRef}
              className="hidden"
              autoPlay
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
              style={{ aspectRatio: '9/16' }}
            />
            
            {/* Recording Indicators */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono">{formatDuration(duration)}</span>
                {isPaused && <Badge variant="secondary">PAUSED</Badge>}
              </div>
            )}

            {/* Text Overlays */}
            {textOverlays.map(overlay => (
              <div
                key={overlay.id}
                className="absolute text-white text-2xl font-bold"
                style={{
                  left: overlay.x,
                  top: overlay.y,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  cursor: 'move'
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    setTextOverlays(prev => prev.map(t => 
                      t.id === overlay.id 
                        ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }
                        : t
                    ));
                  }
                }}
              >
                {overlay.text}
              </div>
            ))}

            {/* Stickers */}
            {stickers.map(sticker => (
              <div
                key={sticker.id}
                className="absolute text-4xl"
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  cursor: 'move'
                }}
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  if (rect) {
                    setStickers(prev => prev.map(s => 
                      s.id === sticker.id 
                        ? { ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }
                        : s
                    ));
                  }
                }}
              >
                {sticker.emoji}
              </div>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                className="rounded-full w-20 h-20 bg-pink-500 hover:bg-pink-600 text-white"
                onClick={startRecording}
              >
                <div className="w-6 h-6 bg-white rounded-full" />
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full border-white text-white"
                  onClick={pauseRecording}
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>
                <Button
                  size="lg"
                  className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 text-white"
                  onClick={stopRecording}
                >
                  <Square className="h-8 w-8" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Effects Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {['effects', 'filters', 'beauty', 'speed', 'audio', 'text', 'stickers'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 px-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-pink-500 border-b-2 border-pink-500'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab === 'effects' && <Zap className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'filters' && <Filter className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'beauty' && <Heart className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'speed' && <Zap className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'audio' && <Music className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'text' && <Text className="h-4 w-4 mx-auto mb-1" />}
                {tab === 'stickers' && <Sticker className="h-4 w-4 mx-auto mb-1" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'effects' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Special Effects</h3>
                <div className="grid grid-cols-3 gap-2">
                  {effectsProcessorRef.current?.getElixStarLiveEffects().filter(e => e.type === 'transition').map(effect => (
                    <button
                      key={effect.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.effects.includes(effect.id)
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => toggleEffect(effect.id)}
                    >
                      <div className="text-2xl mb-1">{effect.preview}</div>
                      <div className="text-xs">{effect.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Color Filters</h3>
                <div className="grid grid-cols-2 gap-2">
                  {effectsProcessorRef.current?.getElixStarLiveEffects().filter(e => e.type === 'filter').map(effect => (
                    <button
                      key={effect.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.effects.includes(effect.id)
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => toggleEffect(effect.id)}
                    >
                      <div className="text-2xl mb-1">{effect.preview}</div>
                      <div className="text-xs">{effect.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'beauty' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Beauty Filters</h3>
                <div className="space-y-3">
                  {effectsProcessorRef.current?.getElixStarLiveEffects().filter(e => e.type === 'beauty').map(effect => (
                    <button
                      key={effect.id}
                      className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        settings.effects.includes(effect.id)
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => toggleEffect(effect.id)}
                    >
                      <div className="text-2xl">{effect.preview}</div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{effect.name}</div>
                        <div className="text-xs text-gray-400">Intensity: {effect.intensity || 0.5}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'speed' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Speed Control</h3>
                <div className="space-y-3">
                  {[{value: 0.5, label: '0.5x Slow'}, {value: 1, label: 'Normal'}, {value: 2, label: '2x Fast'}].map(speed => (
                    <button
                      key={speed.value}
                      className={`w-full p-3 rounded-lg border-2 transition-all ${
                        settings.speed === speed.value
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSettings(prev => ({ ...prev, speed: speed.value }))}
                    >
                      <div className="font-medium">{speed.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Add Sound</h3>
                <div className="space-y-2">
                  {audioTracks.map(track => (
                    <button
                      key={track.id}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        selectedAudio?.id === track.id
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedAudio(track)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{track.name}</div>
                          <div className="text-xs text-gray-400">{track.artist} • {track.duration}s</div>
                        </div>
                        {track.isPopular && <Badge className="text-xs">HOT</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Add Text</h3>
                <Button 
                  className="w-full" 
                  onClick={addTextOverlay}
                  variant="outline"
                >
                  <Text className="h-4 w-4 mr-2" />
                  Add Text Overlay
                </Button>
                
                {textOverlays.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Current Text Overlays:</h4>
                    {textOverlays.map(overlay => (
                      <div key={overlay.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                        <span className="text-sm truncate">{overlay.text}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== overlay.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stickers' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Add Stickers</h3>
                <div className="flex gap-1 mb-3">
                  {Object.keys(stickerCategories).map(category => (
                    <button
                      key={category}
                      className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                        activeStickerCategory === category
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => setActiveStickerCategory(category as keyof typeof stickerCategories)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {stickerCategories[activeStickerCategory].map(sticker => (
                    <button
                      key={sticker.id}
                      className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-2xl"
                      onClick={() => addSticker(sticker)}
                      title={sticker.name}
                    >
                      {sticker.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreview && recordedBlob && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Preview Your Video</h2>
              <Button variant="ghost" onClick={() => setIsPreview(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <video
              src={URL.createObjectURL(recordedBlob)}
              className="w-full rounded-lg mb-4"
              controls
              autoPlay
            />
            
            <div className="flex gap-3">
              <Button className="flex-1" onClick={saveVideo}>
                <Save className="h-4 w-4 mr-2" />
                Save & Upload
              </Button>
              <Button variant="outline" onClick={resetRecording}>
                Retake
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
