import { AudioSystem } from './audioSystem';

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  category: string;
  tags: string[];
  popularity: number;
  isOfficial: boolean;
  waveform?: number[];
}

export interface UserAudio {
  id: string;
  name: string;
  url: string;
  duration: number;
  uploadedAt: Date;
  userId: string;
  isPublic: boolean;
  waveform?: number[];
}

export class AudioLibrary {
  private static instance: AudioLibrary;
  private audioSystem: AudioSystem;
  private trendingTracks: AudioTrack[] = [];
  private userUploads: UserAudio[] = [];
  private favorites: Set<string> = new Set();
  private recentlyUsed: string[] = [];

  private constructor() {
    this.audioSystem = AudioSystem.getInstance();
    this.initializeDefaultLibrary();
  }

  public static getInstance(): AudioLibrary {
    if (!AudioLibrary.instance) {
      AudioLibrary.instance = new AudioLibrary();
    }
    return AudioLibrary.instance;
  }

  private initializeDefaultLibrary() {
    this.trendingTracks = [
      {
        id: 'trending-1',
        name: 'Elix Star Live Viral Beat',
        url: '/audio/trending/viral-beat.mp3',
        duration: 30,
        category: 'Trending',
        tags: ['viral', 'dance', 'popular'],
        popularity: 95,
        isOfficial: true,
        waveform: this.generateWaveformData()
      },
      {
        id: 'trending-2',
        name: 'Summer Vibes',
        url: '/audio/trending/summer-vibes.mp3',
        duration: 25,
        category: 'Trending',
        tags: ['summer', 'upbeat', 'happy'],
        popularity: 88,
        isOfficial: true,
        waveform: this.generateWaveformData()
      },
      {
        id: 'trending-3',
        name: 'Hip Hop Energy',
        url: '/audio/trending/hip-hop.mp3',
        duration: 35,
        category: 'Trending',
        tags: ['hip-hop', 'urban', 'cool'],
        popularity: 82,
        isOfficial: true,
        waveform: this.generateWaveformData()
      },
      {
        id: 'trending-4',
        name: 'Electronic Pulse',
        url: '/audio/trending/electronic.mp3',
        duration: 28,
        category: 'Trending',
        tags: ['electronic', 'edm', 'energy'],
        popularity: 79,
        isOfficial: true,
        waveform: this.generateWaveformData()
      },
      {
        id: 'trending-5',
        name: 'Chill Lo-Fi',
        url: '/audio/trending/lofi-chill.mp3',
        duration: 45,
        category: 'Trending',
        tags: ['lofi', 'chill', 'relax'],
        popularity: 76,
        isOfficial: true,
        waveform: this.generateWaveformData()
      }
    ];
  }

  private generateWaveformData(): number[] {
    const length = 100;
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      data.push(Math.random() * 0.8 + 0.1);
    }
    return data;
  }

  public async uploadAudio(file: File): Promise<UserAudio> {
    try {
      // Generate unique ID
      const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Get audio duration
      const duration = await this.getAudioDuration(url);
      
      // Generate waveform
      const waveform = await this.generateWaveformFromFile(file);

      const userAudio: UserAudio = {
        id,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        url,
        duration,
        uploadedAt: new Date(),
        userId: 'current-user', // This should come from auth
        isPublic: true,
        waveform
      };

      this.userUploads.unshift(userAudio);
      return userAudio;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  private getAudioDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio'));
      });
    });
  }

  private async generateWaveformFromFile(file: File): Promise<number[]> {
    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 100;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      audioContext.close();
      return waveform;
    } catch (error) {
      console.error('Error generating waveform:', error);
      return this.generateWaveformData(); // Fallback to generated data
    }
  }

  public getTrendingTracks(): AudioTrack[] {
    return [...this.trendingTracks].sort((a, b) => b.popularity - a.popularity);
  }

  public getUserUploads(): UserAudio[] {
    return [...this.userUploads];
  }

  public getFavorites(): AudioTrack[] {
    return this.trendingTracks.filter(track => this.favorites.has(track.id));
  }

  public getRecentlyUsed(): AudioTrack[] {
    return this.recentlyUsed
      .map(id => this.trendingTracks.find(track => track.id === id))
      .filter(Boolean) as AudioTrack[];
  }

  public searchTracks(query: string): AudioTrack[] {
    const lowercaseQuery = query.toLowerCase();
    return this.trendingTracks.filter(track => 
      track.name.toLowerCase().includes(lowercaseQuery) ||
      track.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  public getTracksByCategory(category: string): AudioTrack[] {
    return this.trendingTracks.filter(track => track.category === category);
  }

  public addToFavorites(trackId: string): void {
    this.favorites.add(trackId);
  }

  public removeFromFavorites(trackId: string): void {
    this.favorites.delete(trackId);
  }

  public addToRecentlyUsed(trackId: string): void {
    // Remove if already exists
    this.recentlyUsed = this.recentlyUsed.filter(id => id !== trackId);
    // Add to beginning
    this.recentlyUsed.unshift(trackId);
    // Keep only last 10
    this.recentlyUsed = this.recentlyUsed.slice(0, 10);
  }

  public isFavorite(trackId: string): boolean {
    return this.favorites.has(trackId);
  }

  public deleteUserAudio(audioId: string): void {
    const audio = this.userUploads.find(a => a.id === audioId);
    if (audio) {
      URL.revokeObjectURL(audio.url);
      this.userUploads = this.userUploads.filter(a => a.id !== audioId);
    }
  }

  public getAudioCategories(): string[] {
    const categories = new Set(this.trendingTracks.map(track => track.category));
    return Array.from(categories);
  }

  public async preloadAudio(trackId: string): Promise<void> {
    const track = this.trendingTracks.find(t => t.id === trackId);
    if (track) {
      const audio = new Audio(track.url);
      audio.preload = 'auto';
      // Preload without playing
      audio.load();
    }
  }

  public getRecommendedTracks(currentTrackId: string): AudioTrack[] {
    const currentTrack = this.trendingTracks.find(t => t.id === currentTrackId);
    if (!currentTrack) return [];

    return this.trendingTracks
      .filter(track => 
        track.id !== currentTrackId && 
        (track.category === currentTrack.category || 
         track.tags.some(tag => currentTrack.tags.includes(tag)))
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }
}