export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  artist: string;
  genre: string;
  bpm?: number;
  key?: string;
  isPopular: boolean;
  isTrending: boolean;
  plays: number;
  likes: number;
  tags: string[];
  waveform?: number[];
}

export interface AudioEffect {
  id: string;
  name: string;
  type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'pitch' | 'speed';
  parameters: Record<string, number>;
}

export class AudioSystem {
  private static instance: AudioSystem;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private effectsChain: AudioNode[] = [];
  private audioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private duration: number = 0;
  private onProgressCallback?: (progress: number) => void;
  private onEndedCallback?: () => void;

  private constructor() {
    this.initAudioContext();
  }

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect gain to analyser
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Audio context initialization failed:', error);
    }
  }

  // Load audio file
  async loadAudio(url: string): Promise<void> {
    if (!this.audioContext) throw new Error('Audio context not available');

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  // Load audio from file input
  async loadAudioFromFile(file: File): Promise<void> {
    if (!this.audioContext) throw new Error('Audio context not available');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          this.duration = this.audioBuffer.duration;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Play audio
  play(startTime: number = 0): void {
    if (!this.audioContext || !this.audioBuffer) return;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Stop current playback
    this.stop();

    // Create new source
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = this.audioBuffer;
    this.currentSource.connect(this.gainNode!);

    // Set up ended callback
    this.currentSource.onended = () => {
      this.isPlaying = false;
      this.onEndedCallback?.();
    };

    // Start playback
    this.startTime = this.audioContext.currentTime - startTime;
    this.pauseTime = 0;
    this.currentSource.start(this.audioContext.currentTime, startTime);
    this.isPlaying = true;

    // Start progress monitoring
    this.startProgressMonitoring();
  }

  // Pause audio
  pause(): void {
    if (!this.currentSource || !this.audioContext) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.currentSource.stop();
    this.currentSource = null;
    this.isPlaying = false;
    this.stopProgressMonitoring();
  }

  // Stop audio
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    this.stopProgressMonitoring();
  }

  // Seek to position
  seek(time: number): void {
    if (this.isPlaying) {
      this.play(time);
    } else {
      this.pauseTime = time;
    }
  }

  // Set volume
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
    }
  }

  // Get current time
  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    } else {
      return this.pauseTime;
    }
  }

  // Get duration
  getDuration(): number {
    return this.duration;
  }

  // Get waveform data
  getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Get frequency data
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Apply audio effects
  applyEffect(effect: AudioEffect): void {
    if (!this.audioContext) return;

    let effectNode: AudioNode | null = null;

    switch (effect.type) {
      case 'reverb':
        effectNode = this.createReverb(effect.parameters.roomSize || 0.5);
        break;
      case 'delay':
        effectNode = this.createDelay(effect.parameters.time || 0.3, effect.parameters.feedback || 0.3);
        break;
      case 'filter':
        effectNode = this.createFilter(effect.parameters.frequency || 1000, (effect.parameters.type as any) || 'lowpass');
        break;
      case 'distortion':
        effectNode = this.createDistortion(effect.parameters.amount || 20);
        break;
      case 'pitch':
        // Pitch shift requires more complex implementation
        break;
      case 'speed':
        // Speed change affects playback rate
        if (this.currentSource) {
          this.currentSource.playbackRate.setValueAtTime(effect.parameters.rate || 1, this.audioContext.currentTime);
        }
        break;
    }

    if (effectNode) {
      this.effectsChain.push(effectNode);
      this.reconnectEffectsChain();
    }
  }

  private createReverb(roomSize: number): ConvolverNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const convolver = this.audioContext.createConvolver();
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, roomSize);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  private createDelay(time: number, feedback: number): DelayNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const delay = this.audioContext.createDelay(time);
    const feedbackGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();

    delay.delayTime.setValueAtTime(time, this.audioContext.currentTime);
    feedbackGain.gain.setValueAtTime(feedback, this.audioContext.currentTime);
    dryGain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
    wetGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    // Connect delay feedback loop
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    return delay;
  }

  private createFilter(frequency: number, type: BiquadFilterType): BiquadFilterNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return filter;
  }

  private createDistortion(amount: number): WaveShaperNode {
    if (!this.audioContext) throw new Error('Audio context not available');

    const waveshaper = this.audioContext.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    waveshaper.curve = curve;
    waveshaper.oversample = '4x';
    return waveshaper;
  }

  private reconnectEffectsChain(): void {
    if (!this.gainNode) return;

    // Disconnect everything
    this.gainNode.disconnect();
    this.effectsChain.forEach(node => node.disconnect());

    // Reconnect chain
    let currentNode: AudioNode = this.gainNode;
    
    this.effectsChain.forEach(node => {
      currentNode.connect(node);
      currentNode = node;
    });
    
    currentNode.connect(this.analyser!);
  }

  private startProgressMonitoring(): void {
    const monitor = () => {
      if (this.isPlaying && this.onProgressCallback) {
        const progress = (this.getCurrentTime() / this.duration) * 100;
        this.onProgressCallback(Math.min(100, Math.max(0, progress)));
        requestAnimationFrame(monitor);
      }
    };
    monitor();
  }

  private stopProgressMonitoring(): void {
    // Progress monitoring stops automatically when isPlaying becomes false
  }

  // Set callbacks
  setOnProgressCallback(callback: (progress: number) => void): void {
    this.onProgressCallback = callback;
  }

  setOnEndedCallback(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Audio library manager
export class AudioLibrary {
  private tracks: AudioTrack[] = [];
  private categories: Map<string, AudioTrack[]> = new Map();

  constructor() {
    this.initializeDefaultTracks();
  }

  private initializeDefaultTracks(): void {
    const defaultTracks: AudioTrack[] = [
      {
        id: 'trending-1',
        name: 'Viral Dance Beat 2024',
        url: '/audio/trending-dance-2024.mp3',
        duration: 30,
        artist: 'DJ Viral',
        genre: 'Dance',
        bpm: 128,
        isPopular: true,
        isTrending: true,
        plays: 1250000,
        likes: 89000,
        tags: ['viral', 'dance', 'trending', '2024']
      },
      {
        id: 'trending-2',
        name: 'Elix Star Live Comedy Sound',
        url: '/audio/comedy-sound.mp3',
        duration: 15,
        artist: 'Comedy Beats',
        genre: 'Comedy',
        isPopular: true,
        isTrending: false,
        plays: 980000,
        likes: 67000,
        tags: ['comedy', 'funny', 'viral', 'short']
      },
      {
        id: 'trending-3',
        name: 'Emotional Background',
        url: '/audio/emotional-bg.mp3',
        duration: 45,
        artist: 'Emotional Music',
        genre: 'Emotional',
        isPopular: false,
        isTrending: true,
        plays: 340000,
        likes: 23000,
        tags: ['emotional', 'sad', 'background', 'story']
      },
      {
        id: 'trending-4',
        name: 'Cooking Vibes',
        url: '/audio/cooking-vibes.mp3',
        duration: 60,
        artist: 'Kitchen Sounds',
        genre: 'Lifestyle',
        bpm: 95,
        isPopular: true,
        isTrending: false,
        plays: 560000,
        likes: 41000,
        tags: ['cooking', 'lifestyle', 'chill', 'food']
      },
      {
        id: 'trending-5',
        name: 'Fitness Motivation',
        url: '/audio/fitness-motivation.mp3',
        duration: 120,
        artist: 'Gym Beats',
        genre: 'Fitness',
        bpm: 140,
        isPopular: true,
        isTrending: true,
        plays: 2100000,
        likes: 156000,
        tags: ['fitness', 'gym', 'motivation', 'workout']
      }
    ];

    this.tracks = defaultTracks;
    this.organizeByCategories();
  }

  private organizeByCategories(): void {
    this.categories.clear();
    
    // Organize by genre
    this.tracks.forEach(track => {
      if (!this.categories.has(track.genre)) {
        this.categories.set(track.genre, []);
      }
      this.categories.get(track.genre)!.push(track);
    });

    // Organize by trending
    const trending = this.tracks.filter(t => t.isTrending);
    this.categories.set('Trending', trending);

    // Organize by popular
    const popular = this.tracks.filter(t => t.isPopular);
    this.categories.set('Popular', popular);
  }

  getAllTracks(): AudioTrack[] {
    return this.tracks;
  }

  getTracksByCategory(category: string): AudioTrack[] {
    return this.categories.get(category) || [];
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  searchTracks(query: string): AudioTrack[] {
    const lowercaseQuery = query.toLowerCase();
    return this.tracks.filter(track => 
      track.name.toLowerCase().includes(lowercaseQuery) ||
      track.artist.toLowerCase().includes(lowercaseQuery) ||
      track.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTrackById(id: string): AudioTrack | undefined {
    return this.tracks.find(track => track.id === id);
  }

  addTrack(track: AudioTrack): void {
    this.tracks.push(track);
    this.organizeByCategories();
  }

  removeTrack(id: string): boolean {
    const index = this.tracks.findIndex(track => track.id === id);
    if (index !== -1) {
      this.tracks.splice(index, 1);
      this.organizeByCategories();
      return true;
    }
    return false;
  }

  incrementPlays(id: string): void {
    const track = this.getTrackById(id);
    if (track) {
      track.plays++;
    }
  }

  toggleLike(id: string): boolean {
    const track = this.getTrackById(id);
    if (track) {
      const isLiked = track.likes > 0 && track.likes % 2 === 1;
      if (isLiked) {
        track.likes--;
      } else {
        track.likes++;
      }
      return !isLiked;
    }
    return false;
  }

  getPopularTracks(limit: number = 10): AudioTrack[] {
    return this.tracks
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit);
  }

  getTrendingTracks(limit: number = 10): AudioTrack[] {
    return this.tracks
      .filter(track => track.isTrending)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit);
  }
}