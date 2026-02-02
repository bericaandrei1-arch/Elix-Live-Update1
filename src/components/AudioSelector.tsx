import React, { useState, useEffect, useRef } from 'react';
import { AudioLibrary, AudioTrack, UserAudio } from '../lib/audioLibrary';
import { AudioSystem } from '../lib/audioSystem';
import { Play, Pause, Upload, Heart, Search, Volume2, Clock, TrendingUp, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

interface AudioSelectorProps {
  onAudioSelect: (audioUrl: string, audioName: string) => void;
  onVolumeChange: (volume: number) => void;
  selectedAudio?: string;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({ 
  onAudioSelect, 
  onVolumeChange, 
  selectedAudio 
}) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'favorites' | 'uploads' | 'recent'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const audioLibrary = AudioLibrary.getInstance();
  const audioSystem = AudioSystem.getInstance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async (trackId: string, audioUrl: string) => {
    try {
      if (playingTrack === trackId) {
        // Pause current track
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setPlayingTrack(null);
        }
      } else {
        // Stop current track and play new one
        if (audioRef.current) {
          audioRef.current.pause();
        }

        // Create new audio element
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = volume;
        
        audioRef.current.addEventListener('loadedmetadata', () => {
          setDuration(audioRef.current?.duration || 0);
        });

        audioRef.current.addEventListener('timeupdate', () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        });

        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlayingTrack(null);
          setCurrentTime(0);
        });

        await audioRef.current.play();
        setIsPlaying(true);
        setPlayingTrack(trackId);
        
        // Add to recently used
        audioLibrary.addToRecentlyUsed(trackId);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    onVolumeChange(newVolume);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      try {
        const uploadedAudio = await audioLibrary.uploadAudio(file);
        onAudioSelect(uploadedAudio.url, uploadedAudio.name);
        setActiveTab('uploads');
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }
  };

  const handleFavoriteToggle = (trackId: string) => {
    if (favorites.has(trackId)) {
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        newFavorites.delete(trackId);
        return newFavorites;
      });
      audioLibrary.removeFromFavorites(trackId);
    } else {
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        newFavorites.add(trackId);
        return newFavorites;
      });
      audioLibrary.addToFavorites(trackId);
    }
  };

  const handleSelectAudio = (audioUrl: string, audioName: string) => {
    // Stop current preview
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayingTrack(null);
    }
    onAudioSelect(audioUrl, audioName);
  };

  const getCurrentTracks = () => {
    switch (activeTab) {
      case 'trending':
        return audioLibrary.getTrendingTracks();
      case 'favorites':
        return audioLibrary.getFavorites();
      case 'uploads':
        return audioLibrary.getUserUploads();
      case 'recent':
        return audioLibrary.getRecentlyUsed();
      default:
        return [];
    }
  };

  const getFilteredTracks = () => {
    const tracks = getCurrentTracks();
    if (!searchQuery) return tracks;
    
    const query = searchQuery.toLowerCase();
    return tracks.filter(track => 
      track.name.toLowerCase().includes(query) ||
      ('tags' in track && track.tags?.some(tag => tag.toLowerCase().includes(query)))
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const AudioTrackItem: React.FC<{ track: AudioTrack | UserAudio; isUserUpload?: boolean }> = ({ track, isUserUpload }) => {
    const isPlayingThis = playingTrack === track.id;
    const isFavorite = favorites.has(track.id);
    const isSelected = selectedAudio === track.url;

    return (
      <div className={cn(
        "flex items-center p-3 rounded-lg border transition-all cursor-pointer",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}>
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => handlePlayPause(track.id, track.url)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isPlayingThis ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{track.name}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(track.duration)}</span>
              {isUserUpload && (
                <>
                  <span>•</span>
                  <span>Your upload</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isUserUpload && (
            <button
              onClick={() => handleFavoriteToggle(track.id)}
              className={cn(
                "p-1 rounded transition-colors",
                isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </button>
          )}
          
          <button
            onClick={() => handleSelectAudio(track.url, track.name)}
            className={cn(
              "px-3 py-1 text-xs rounded transition-colors",
              isSelected 
                ? "bg-blue-500 text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
          >
            {isSelected ? 'Selected' : 'Use'}
          </button>
        </div>
      </div>
    );
  };

  const filteredTracks = getFilteredTracks();

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Music className="w-5 h-5" />
          Select Audio
        </h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search audio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mb-3">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-8">{Math.round(volume * 100)}%</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'trending', label: 'Trending', icon: TrendingUp },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'uploads', label: 'Uploads', icon: Upload },
            { id: 'recent', label: 'Recent', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors flex-1 justify-center",
                activeTab === id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'uploads' && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Audio File
            </Button>
          </div>
        )}

        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No audio found matching your search' : 'No audio available'}
          </div>
        ) : (
          filteredTracks.map((track) => (
            <AudioTrackItem
              key={track.id}
              track={track}
              isUserUpload={activeTab === 'uploads'}
            />
          ))
        )}
      </div>

      {/* Audio Preview Progress */}
      {isPlaying && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Now playing: {audioLibrary.getTrendingTracks().find(t => t.id === playingTrack)?.name || 'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
};
