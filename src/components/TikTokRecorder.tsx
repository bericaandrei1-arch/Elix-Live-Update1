import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoEffectsProcessor } from '../lib/videoEffects';
import { Button } from './ui/button';
import { Camera, CameraOff, Mic, MicOff, Play, Pause, Square, Upload, Music, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface RecordingSettings {
  video: boolean;
  audio: boolean;
  effects: any[];
  speed: number;
  beautyLevel: number;
  filter: string;
}

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
}

export const ElixStarLiveRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const effectsProcessorRef = useRef<VideoEffectsProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [settings, setSettings] = useState<RecordingSettings>({
    video: true,
    audio: true,
    effects: [],
    speed: 1,
    beautyLevel: 0,
    filter: 'none'
  });
  const [showEffects, setShowEffects] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const availableAudio: AudioTrack[] = [
    { id: '1', name: 'Trending Beat 1', url: '/audio/beat1.mp3', duration: 30 },
    { id: '2', name: 'Viral Sound 2', url: '/audio/beat2.mp3', duration: 45 },
    { id: '3', name: 'Popular Music 3', url: '/audio/beat3.mp3', duration: 60 },
    { id: '4', name: 'Dance Track 4', url: '/audio/beat4.mp3', duration: 25 }
  ];

  // Initialize camera and effects
  useEffect(() => {
    initializeCamera();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          facingMode: 'user'
        },
        audio: settings.audio
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Initialize effects processor
      if (canvasRef.current) {
        effectsProcessorRef.current = new VideoEffectsProcessor(canvasRef.current);
        canvasRef.current.width = 1080;
        canvasRef.current.height = 1920;
      }

      // Initialize audio context
      audioContextRef.current = new AudioContext();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (effectsProcessorRef.current) {
      effectsProcessorRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Apply effects in real-time
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !effectsProcessorRef.current) return;

    const applyEffects = () => {
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Apply effects based on settings
      const effects = [];
      
      if (settings.beautyLevel > 0) {
        effects.push({ type: 'beauty', intensity: settings.beautyLevel });
      }
      
      if (settings.filter !== 'none') {
        effects.push({ type: 'filter', filterType: settings.filter });
      }

      effectsProcessorRef.current!.processFrame(videoRef.current!, effects);
      
      if (!isRecording) {
        requestAnimationFrame(applyEffects);
      }
    };

    applyEffects();
  }, [settings, isRecording]);

  const startRecording = async () => {
    if (!streamRef.current || !canvasRef.current) return;

    recordedChunksRef.current = [];
    
    // Create canvas stream with effects
    const canvasStream = canvasRef.current.captureStream(30);
    
    // Add audio if enabled
    if (settings.audio && selectedAudio) {
      const audio = new Audio(selectedAudio.url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : audioVolume;
      audio.play();
      
      if (audioContextRef.current) {
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        const destination = audioContextRef.current.createMediaStreamDestination();
        audioSourceRef.current.connect(destination);
        
        const audioTrack = destination.stream.getAudioTracks()[0];
        canvasStream.addTrack(audioTrack);
      }
    }

    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setIsPreview(true);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setDuration(0);

    // Start duration timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Stop after 60 seconds (Elix Star Live limit)
    setTimeout(() => {
      if (mediaRecorderRef.current && isRecording) {
        stopRecording();
      }
      clearInterval(timer);
    }, 60000);
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;

    const formData = new FormData();
    formData.append('video', recordedBlob, 'elix-star-live-video.webm');
    formData.append('duration', duration.toString());
    formData.append('effects', JSON.stringify(settings.effects));
    if (selectedAudio) {
      formData.append('audioTrack', selectedAudio.id);
    }

    try {
      // Upload to your backend
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Video uploaded successfully:', result);
        // Reset recorder
        setRecordedBlob(null);
        setIsPreview(false);
        setDuration(0);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const uploadFromGallery = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setRecordedBlob(file);
        setIsPreview(true);
        setDuration(0);
      }
    };
    input.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effects = effectsProcessorRef.current?.getAvailableEffects() || [];

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Video Preview */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie camera
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettings(prev => ({ ...prev, video: !prev.video }))}
            className="bg-black/50 text-white"
          >
            {settings.video ? <Camera /> : <CameraOff />}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEffects(!showEffects)}
              className="bg-black/50 text-white"
            >
              <Sparkles />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAudio(!showAudio)}
              className="bg-black/50 text-white"
            >
              <Music />
            </Button>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex flex-col items-center gap-4">
          {/* Duration */}
          {isRecording && (
            <div className="text-white text-lg font-mono">
              {formatTime(duration)}
            </div>
          )}

          {/* Main Controls */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={uploadFromGallery}
              className="bg-black/50 text-white"
            >
              <Upload />
            </Button>

            {/* Record Button */}
            <div className="relative">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full border-4 transition-all ${
                  isRecording
                    ? 'bg-red-500 border-red-400 animate-pulse'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 text-white mx-auto" />
                ) : (
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto" />
                )}
              </button>
              
              {/* Pause Button */}
              {isRecording && (
                <button
                  onClick={pauseRecording}
                  className="absolute -right-12 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center"
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 text-white" />
                  ) : (
                    <Pause className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Audio Control */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettings(prev => ({ ...prev, audio: !prev.audio }))}
              className="bg-black/50 text-white"
            >
              {settings.audio ? <Mic /> : <MicOff />}
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex gap-2">
            {[0.5, 1, 2].map(speed => (
              <button
                key={speed}
                onClick={() => setSettings(prev => ({ ...prev, speed }))}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  settings.speed === speed
                    ? 'bg-blue-500 text-white'
                    : 'bg-black/50 text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Effects Panel */}
      {showEffects && (
        <div className="absolute right-0 top-20 bottom-20 w-20 bg-black/80 backdrop-blur-sm z-30 p-2">
          <div className="space-y-2">
            {effects.map(effect => (
              <button
                key={effect.id}
                onClick={() => {
                  const isActive = settings.effects.some(e => e.id === effect.id);
                  if (isActive) {
                    setSettings(prev => ({
                      ...prev,
                      effects: prev.effects.filter(e => e.id !== effect.id)
                    }));
                  } else {
                    setSettings(prev => ({
                      ...prev,
                      effects: [...prev.effects, effect]
                    }));
                  }
                }}
                className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                  settings.effects.some(e => e.id === effect.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                <div className="text-lg">{effect.preview}</div>
                <div className="text-[10px] mt-1">{effect.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Panel */}
      {showAudio && (
        <div className="absolute left-0 right-0 bottom-32 bg-black/80 backdrop-blur-sm z-30 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Sounds</h3>
              <button
                onClick={() => setShowAudio(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {availableAudio.map(audio => (
              <div
                key={audio.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  selectedAudio?.id === audio.id
                    ? 'bg-blue-500/20 border border-blue-500'
                    : 'bg-white/10'
                }`}
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{audio.name}</div>
                  <div className="text-white/60 text-xs">{audio.duration}s</div>
                </div>
                <button
                  onClick={() => setSelectedAudio(selectedAudio?.id === audio.id ? null : audio)}
                  className="text-white hover:text-blue-400"
                >
                  {selectedAudio?.id === audio.id ? '✓' : '+'}
                </button>
              </div>
            ))}

            {/* Volume Control */}
            {selectedAudio && (
              <div className="flex items-center gap-3 pt-3 border-t border-white/20">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white"
                >
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {isPreview && recordedBlob && (
        <div className="absolute inset-0 bg-black z-40 flex flex-col">
          <video
            className="flex-1 object-cover"
            src={URL.createObjectURL(recordedBlob)}
            controls
            autoPlay
          />
          <div className="p-4 flex gap-3">
            <Button
              onClick={() => {
                setIsPreview(false);
                setRecordedBlob(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Retake
            </Button>
            <Button
              onClick={uploadVideo}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
