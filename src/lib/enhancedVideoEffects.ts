import { VideoEffect } from './videoEffects';

export interface AdvancedVideoEffect extends VideoEffect {
  intensity?: number;
  parameters?: Record<string, any>;
}

export class EnhancedVideoEffectsProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private effects: AdvancedVideoEffect[] = [];
  private animationFrame: number | null = null;
  private time: number = 0;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      this.audioDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }

  // Beauty filter with advanced skin smoothing
  applyAdvancedBeautyFilter(frame: HTMLVideoElement, intensity: number = 0.5) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    // Apply bilateral filter for skin smoothing
    tempCtx.filter = `blur(${intensity * 1.5}px)`;
    tempCtx.drawImage(frame, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Enhance brightness and contrast
    this.ctx.filter = `brightness(${1 + intensity * 0.2}) contrast(${1 + intensity * 0.1})`;
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.filter = 'none';
  }

  // Advanced color filters with Elix Star Live styles
  applyElixStarLiveColorFilter(frame: HTMLVideoElement, filterName: string) {
    const filters = {
      'vintage': 'sepia(0.4) contrast(1.3) brightness(0.9) saturate(0.8)',
      'retro': 'sepia(0.6) contrast(1.5) brightness(1.1) hue-rotate(15deg)',
      'cinematic': 'contrast(1.4) brightness(0.8) saturate(1.3) hue-rotate(-5deg)',
      'cool': 'hue-rotate(200deg) saturate(1.2) brightness(1.1)',
      'warm': 'hue-rotate(-20deg) saturate(1.4) brightness(1.2)',
      'dramatic': 'contrast(1.6) brightness(0.7) saturate(1.5)',
      'dreamy': 'blur(0.5px) brightness(1.3) contrast(0.9) saturate(1.2)',
      'neon': 'hue-rotate(280deg) saturate(2) brightness(1.3) contrast(1.2)',
      'sunset': 'hue-rotate(15deg) saturate(1.6) brightness(1.1) contrast(1.1)',
      'blackwhite': 'grayscale(1) contrast(1.7) brightness(1.1)',
      'film': 'sepia(0.3) contrast(1.2) brightness(0.95) saturate(0.9)',
      'glow': 'brightness(1.2) contrast(1.1) saturate(1.3)'
    };

    this.ctx.filter = filters[filterName as keyof typeof filters] || 'none';
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.filter = 'none';
  }

  // Background blur with portrait mode
  applyPortraitMode(frame: HTMLVideoElement, intensity: number = 0.8) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;

    // Create circular gradient for blur effect
    const gradient = this.ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,1)');

    // Draw blurred background
    this.ctx.filter = `blur(${intensity * 25}px)`;
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    
    // Create mask for sharp center
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw sharp center
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.filter = 'none';
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
  }

  // Speed effects with visual indicators
  applySpeedEffect(frame: HTMLVideoElement, speed: number) {
    if (speed > 1) {
      // Fast motion - add motion blur and increase contrast
      this.ctx.filter = 'contrast(1.3) saturate(1.2)';
      this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
      
      // Add speed lines
      this.addSpeedLines();
    } else if (speed < 1) {
      // Slow motion - soften and add dreamy effect
      this.ctx.filter = 'blur(0.3px) brightness(1.1) contrast(0.9)';
      this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Normal speed
      this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.filter = 'none';
  }

  private addSpeedLines() {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 50, y);
      this.ctx.stroke();
    }
  }

  // Zoom effect
  applyZoomEffect(frame: HTMLVideoElement, zoomLevel: number = 1.2) {
    const scaledWidth = this.canvas.width * zoomLevel;
    const scaledHeight = this.canvas.height * zoomLevel;
    const offsetX = (scaledWidth - this.canvas.width) / 2;
    const offsetY = (scaledHeight - this.canvas.height) / 2;
    
    this.ctx.drawImage(frame, -offsetX, -offsetY, scaledWidth, scaledHeight);
  }

  // Shake effect
  applyShakeEffect(frame: HTMLVideoElement, intensity: number = 5) {
    const shakeX = (Math.random() - 0.5) * intensity;
    const shakeY = (Math.random() - 0.5) * intensity;
    
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  // Glow effect
  applyGlowEffect(frame: HTMLVideoElement, intensity: number = 0.5) {
    // Create glow by drawing multiple times with slight offsets
    this.ctx.globalAlpha = intensity * 0.3;
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 2;
      const offsetY = (Math.random() - 0.5) * 2;
      this.ctx.drawImage(frame, offsetX, offsetY, this.canvas.width, this.canvas.height);
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
  }

  // Transition effects
  applyTransitionEffect(frame1: HTMLVideoElement, frame2: HTMLVideoElement, progress: number, type: string = 'fade') {
    switch (type) {
      case 'fade':
        this.ctx.globalAlpha = 1 - progress;
        this.ctx.drawImage(frame1, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = progress;
        this.ctx.drawImage(frame2, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
        break;
      
      case 'slide':
        const offsetX = this.canvas.width * progress;
        this.ctx.drawImage(frame1, -offsetX, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(frame2, this.canvas.width - offsetX, 0, this.canvas.width, this.canvas.height);
        break;
      
      case 'zoom':
        const scale1 = 1 + progress * 0.5;
        const scale2 = 1 - progress * 0.5;
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale1, scale1);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        this.ctx.drawImage(frame1, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale2, scale2);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        this.ctx.drawImage(frame2, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        break;
    }
  }

  // Animated stickers with physics
  addAnimatedSticker(emoji: string, position: { x: number; y: number }, animation: string = 'bounce') {
    this.time += 0.016; // ~60fps
    
    let offsetY = 0;
    let scale = 1;
    let rotation = 0;
    
    switch (animation) {
      case 'bounce':
        offsetY = Math.sin(this.time * 5) * 10;
        break;
      case 'spin':
        rotation = this.time * 2;
        break;
      case 'pulse':
        scale = 1 + Math.sin(this.time * 3) * 0.2;
        break;
      case 'float':
        offsetY = Math.sin(this.time * 2) * 5;
        rotation = Math.sin(this.time * 1.5) * 0.1;
        break;
    }
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y + offsetY);
    this.ctx.rotate(rotation);
    this.ctx.scale(scale, scale);
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(emoji, 0, 0);
    this.ctx.restore();
  }

  // Text with animations
  addAnimatedText(text: string, position: { x: number; y: number }, animation: string = 'typewriter') {
    this.ctx.save();
    this.ctx.font = 'bold 32px Arial';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'center';
    
    switch (animation) {
      case 'typewriter':
        const charsToShow = Math.floor(this.time * 10) % (text.length + 1);
        const visibleText = text.substring(0, charsToShow);
        this.ctx.strokeText(visibleText, position.x, position.y);
        this.ctx.fillText(visibleText, position.x, position.y);
        break;
      
      case 'fade':
        this.ctx.globalAlpha = (Math.sin(this.time * 2) + 1) / 2;
        this.ctx.strokeText(text, position.x, position.y);
        this.ctx.fillText(text, position.x, position.y);
        break;
      
      case 'slide':
        const slideX = Math.sin(this.time) * 20;
        this.ctx.strokeText(text, position.x + slideX, position.y);
        this.ctx.fillText(text, position.x + slideX, position.y);
        break;
    }
    
    this.ctx.restore();
  }

  // Audio-reactive effects
  applyAudioReactiveEffect(frame: HTMLVideoElement, audioData: Uint8Array) {
    if (!audioData) return;
    
    const average = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
    const intensity = average / 255;
    
    // Create pulsing effect based on audio
    const pulseScale = 1 + intensity * 0.1;
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(pulseScale, pulseScale);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.ctx.filter = `brightness(${1 + intensity * 0.3}) saturate(${1 + intensity * 0.5})`;
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.ctx.filter = 'none';
  }

  // Get all available Elix Star Live-style effects
  getElixStarLiveEffects(): AdvancedVideoEffect[] {
    return [
      {
        id: 'beauty-natural',
        name: 'Natural Beauty',
        type: 'beauty',
        preview: '🌟',
        apply: (canvas, ctx, frame) => this.applyAdvancedBeautyFilter(frame, 0.3),
        intensity: 0.3
      },
      {
        id: 'beauty-glam',
        name: 'Glam Beauty',
        type: 'beauty',
        preview: '✨',
        apply: (canvas, ctx, frame) => this.applyAdvancedBeautyFilter(frame, 0.7),
        intensity: 0.7
      },
      {
        id: 'filter-vintage',
        name: 'Vintage',
        type: 'filter',
        preview: '📸',
        apply: (canvas, ctx, frame) => this.applyElixStarLiveColorFilter(frame, 'vintage')
      },
      {
        id: 'filter-cinematic',
        name: 'Cinematic',
        type: 'filter',
        preview: '🎬',
        apply: (canvas, ctx, frame) => this.applyElixStarLiveColorFilter(frame, 'cinematic')
      },
      {
        id: 'filter-neon',
        name: 'Neon',
        type: 'filter',
        preview: '💡',
        apply: (canvas, ctx, frame) => this.applyElixStarLiveColorFilter(frame, 'neon')
      },
      {
        id: 'effect-portrait',
        name: 'Portrait',
        type: 'filter',
        preview: '👤',
        apply: (canvas, ctx, frame) => this.applyPortraitMode(frame, 0.8)
      },
      {
        id: 'effect-zoom',
        name: 'Zoom',
        type: 'transition',
        preview: '🔍',
        apply: (canvas, ctx, frame) => this.applyZoomEffect(frame, 1.3)
      },
      {
        id: 'effect-shake',
        name: 'Shake',
        type: 'transition',
        preview: '📳',
        apply: (canvas, ctx, frame) => this.applyShakeEffect(frame, 8)
      },
      {
        id: 'effect-glow',
        name: 'Glow',
        type: 'filter',
        preview: '💫',
        apply: (canvas, ctx, frame) => this.applyGlowEffect(frame, 0.6)
      }
    ];
  }

  // Process frame with multiple effects
  processFrame(frame: HTMLVideoElement, effects: string[]) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const elixStarLiveEffects = this.getElixStarLiveEffects();
    
    effects.forEach(effectId => {
      const effect = elixStarLiveEffects.find(e => e.id === effectId);
      if (effect) {
        effect.apply(this.canvas, this.ctx, frame);
      }
    });
    
    // If no effects, draw original frame
    if (effects.length === 0) {
      this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Start animation loop
  start() {
    const animate = () => {
      this.time += 0.016;
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  // Stop animation loop
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Cleanup
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}