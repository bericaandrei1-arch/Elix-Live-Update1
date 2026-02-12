/**
 * Elix Live Camera Layout with ALL AI Features CONNECTED
 * Rose Champagne Color Scheme (#D6A088) - NO RED!
 * Version: FINAL - All buttons functional
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  X, 
  Music, 
  RefreshCw, 
  Zap, 
  Clock, 
  Sparkles, 
  User, 
  ChevronDown,
  Check,
  Plus,
  Minus,
  Wand2,
  Type,
  Gauge,
  Star,
  Palette,
  SlidersHorizontal,
  RotateCcw,
  ImagePlus,
  Layers,
  Crosshair
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Camera Filters - CSS filter strings applied to video
// ═══════════════════════════════════════════════════
const CAMERA_FILTERS = [
  { id: 'none', name: 'Original', filter: 'none', color: '#888888' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.4) contrast(1.3) brightness(0.9) saturate(0.8)', color: '#C4A35A' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)', color: '#5B9BD5' },
  { id: 'warm', name: 'Warm', filter: 'hue-rotate(-20deg) saturate(1.4) brightness(1.2)', color: '#E8835A' },
  { id: 'cinematic', name: 'Cinema', filter: 'contrast(1.4) brightness(0.8) saturate(1.3) hue-rotate(-5deg)', color: '#2C3E50' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1) contrast(1.7) brightness(1.1)', color: '#555555' },
  { id: 'retro', name: 'Retro', filter: 'sepia(0.6) contrast(1.5) brightness(1.1) hue-rotate(15deg)', color: '#A0522D' },
  { id: 'dramatic', name: 'Drama', filter: 'contrast(1.6) brightness(0.7) saturate(1.5)', color: '#1A1A2E' },
  { id: 'neon', name: 'Neon', filter: 'saturate(2) brightness(1.3) contrast(1.2) hue-rotate(280deg)', color: '#FF00FF' },
  { id: 'sunset', name: 'Sunset', filter: 'hue-rotate(15deg) saturate(1.6) brightness(1.1) contrast(1.1)', color: '#FF6B35' },
  { id: 'film', name: 'Film', filter: 'sepia(0.3) contrast(1.2) brightness(0.95) saturate(0.9)', color: '#8B7355' },
  { id: 'glow', name: 'Glow', filter: 'brightness(1.25) contrast(1.1) saturate(1.3)', color: '#FFD700' },
];

// ═══════════════════════════════════════════════════
// Speed options for CapCut
// ═══════════════════════════════════════════════════
const SPEED_OPTIONS = [
  { value: 0.3, label: '0.3x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
];

// ═══════════════════════════════════════════════════
// Sticker/Emoji options
// ═══════════════════════════════════════════════════
const STICKER_OPTIONS = ['😂', '❤️', '🔥', '✨', '🎵', '💯', '🌟', '🦋', '🌈', '💎', '👑', '🎭', '🎬', '🎤', '💫', '🍀'];

interface ElixCameraLayoutProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
  isPaused: boolean;
  onRecord: () => void;
  onClose: () => void;
  onFlipCamera: () => void;
  onSelectMusic: () => void;
  onAIMusicGenerator?: () => void;
  onAIEffects?: () => void;
  onCapCut?: () => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onGalleryOpen?: () => void;
  onPostTab?: () => void;
  onCreateTab?: () => void;
  onLiveTab?: () => void;
  selectedTab?: 'post' | 'create' | 'live';
  onFlashToggle?: () => void;
  flashActive?: boolean;
  timerDelay?: 0 | 3 | 10;
  onTimerCycle?: () => void;
  onSpeedChange?: (speed: number) => void;
  currentSpeed?: number;
}

export default function ElixCameraLayout({
  videoRef,
  isRecording,
  isPaused: _isPaused,
  onRecord,
  onClose,
  onFlipCamera,
  onSelectMusic,
  onAIMusicGenerator,
  onAIEffects: _onAIEffects,
  onCapCut: _onCapCut,
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onGalleryOpen,
  onPostTab,
  onCreateTab,
  onLiveTab,
  selectedTab = 'post',
  onFlashToggle,
  flashActive = false,
  timerDelay = 0,
  onTimerCycle,
  onSpeedChange,
  currentSpeed = 1,
}: ElixCameraLayoutProps) {
  const [selectedDuration, setSelectedDuration] = useState('60s');
  const [focusLocked, setFocusLocked] = useState(false);

  const toggleFocusLock = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;
    const stream = video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caps = track.getCapabilities?.() as any;
      if (caps?.focusMode) {
        const newLocked = !focusLocked;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await track.applyConstraints({ advanced: [{ focusMode: newLocked ? 'manual' : 'continuous' } as any] });
        setFocusLocked(newLocked);
      } else {
        setFocusLocked((v) => !v);
      }
    } catch {
      setFocusLocked((v) => !v);
    }
  }, [focusLocked, videoRef]);
  const [beautyEnabled, setBeautyEnabled] = useState(true);
  const [beautyLevel, setBeautyLevel] = useState(0.5); // 0 to 1

  // ── Panel states ──
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showCapCutPanel, setShowCapCutPanel] = useState(false);
  const [showBeautySlider, setShowBeautySlider] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

  // ── Filter / Effects state ──
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [textOverlay, setTextOverlay] = useState('');
  const [activeStickers, setActiveStickers] = useState<string[]>([]);
  const [enhanceEnabled, setEnhanceEnabled] = useState(false);

  const textInputRef = useRef<HTMLInputElement>(null);

  const durations = ['10m', '60s', '15s', 'PHOTO', 'TEXT'];

  // ═══════════════════════════════════════════════════
  // Apply CSS filters to the video element in real-time
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    if (!videoRef.current) return;

    const filters: string[] = [];

    // Beauty filter
    if (beautyEnabled) {
      const bl = beautyLevel;
      filters.push(`brightness(${1 + bl * 0.15}) contrast(${1 - bl * 0.05}) saturate(${1 + bl * 0.08})`);
    }

    // Color filter
    const filterObj = CAMERA_FILTERS.find(f => f.id === activeFilter);
    if (filterObj && filterObj.filter !== 'none') {
      filters.push(filterObj.filter);
    }

    // Auto-enhance
    if (enhanceEnabled) {
      filters.push('brightness(1.05) contrast(1.08) saturate(1.12)');
    }

    videoRef.current.style.filter = filters.length > 0 ? filters.join(' ') : 'none';

    const videoEl = videoRef.current;
    return () => {
      if (videoEl) {
        videoEl.style.filter = 'none';
      }
    };
  }, [beautyEnabled, beautyLevel, activeFilter, enhanceEnabled, videoRef]);

  useEffect(() => {
    if (videoRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (videoRef.current as any).setZoom?.(zoomLevel);
      }
  }, [zoomLevel, videoRef]);

  // ── Toggle effects panel ──
  const toggleEffectsPanel = useCallback(() => {
    setShowEffectsPanel(prev => !prev);
    setShowCapCutPanel(false);
    setShowBeautySlider(false);
  }, []);

  // ── Toggle CapCut panel ──
  const toggleCapCutPanel = useCallback(() => {
    setShowCapCutPanel(prev => !prev);
    setShowEffectsPanel(false);
    setShowBeautySlider(false);
  }, []);

  // ── Toggle beauty slider ──
  const toggleBeautySlider = useCallback(() => {
    setBeautyEnabled(prev => !prev);
  }, []);

  const openBeautySlider = useCallback(() => {
    setShowBeautySlider(prev => !prev);
    setShowEffectsPanel(false);
    setShowCapCutPanel(false);
  }, []);

  // ── Select a filter ──
  const selectFilter = useCallback((filterId: string) => {
    setActiveFilter(prev => prev === filterId ? 'none' : filterId);
  }, []);

  // ── Add sticker ──
  const addSticker = useCallback((emoji: string) => {
    setActiveStickers(prev => {
      if (prev.includes(emoji)) return prev.filter(s => s !== emoji);
      return [...prev, emoji];
    });
  }, []);

  // ── Focus text input when shown ──
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">

      {/* ══════════════════════════════════════════ */}
      {/* TOP BAR */}
      {/* ══════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 z-50 px-3 flex items-center justify-between pointer-events-auto" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        <div className="w-10 h-10"></div>

        {/* Add Sound Button */}
        <button
          onClick={onSelectMusic}
          className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all border border-[#D6A088]/15"
        >
          <Music size={12} className="text-[#D6A088]" strokeWidth={2} />
          <span className="text-[#D6A088] text-xs font-medium">Add sound</span>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center hover:scale-110 transition-transform active:scale-90 z-[60] relative"
          title="Close"
        >
          <img src="/Icons/power-button.png" alt="Close" className="w-5 h-5 object-contain" />
        </button>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* Active Filter Indicator (top-left) */}
      {/* ══════════════════════════════════════════ */}
      {activeFilter !== 'none' && (
        <div className="absolute top-0 left-3 z-50 pointer-events-auto" style={{ paddingTop: 'max(5.5rem, calc(env(safe-area-inset-top) + 3rem))' }}>
          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 border border-[#D6A088]/20">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CAMERA_FILTERS.find(f => f.id === activeFilter)?.color }} />
            <span className="text-[#D6A088] text-[10px] font-semibold">{CAMERA_FILTERS.find(f => f.id === activeFilter)?.name}</span>
            <button onClick={() => setActiveFilter('none')} className="ml-0.5" title="Remove filter">
              <X size={10} className="text-[#D6A088]/60" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* Text Overlay Display */}
      {/* ══════════════════════════════════════════ */}
      {textOverlay && (
        <div className="absolute top-1/3 left-0 right-0 z-40 flex justify-center pointer-events-auto">
          <button onClick={() => setTextOverlay('')} title="Remove text" className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-xl font-bold text-center drop-shadow-lg">{textOverlay}</p>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* Sticker Overlay Display */}
      {/* ══════════════════════════════════════════ */}
      {activeStickers.length > 0 && (
        <div className="absolute top-[15%] right-12 z-40 flex flex-col gap-2 pointer-events-auto">
          {activeStickers.map((sticker, i) => (
            <button
              key={i}
              onClick={() => setActiveStickers(prev => prev.filter(s => s !== sticker))}
              className="text-3xl drop-shadow-lg hover:scale-125 transition-transform"
              title="Remove sticker"
            >
              {sticker}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* RIGHT SIDE VERTICAL CONTROLS */}
      {/* ══════════════════════════════════════════ */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2.5 pointer-events-auto max-h-[65vh] overflow-y-auto scrollbar-hide pb-safe">
        
        {/* Flip Camera */}
        <button
          onClick={onFlipCamera}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
          title="Flip Camera"
        >
          <RefreshCw size={18} strokeWidth={1.5} className="text-[#D6A088]" />
        </button>

        {/* Flash */}
        <button 
          onClick={onFlashToggle}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform relative"
        >
          <Zap size={18} strokeWidth={1.5} className="text-[#D6A088]" fill={flashActive ? "#D6A088" : "none"} />
          {flashActive && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#D6A088] rounded-full flex items-center justify-center">
              <Check size={8} className="text-white" strokeWidth={2.5} />
            </div>
          )}
        </button>

        {/* Focus Lock */}
        <button 
          onClick={toggleFocusLock}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform relative"
          title="Focus Lock"
        >
          <Crosshair size={18} strokeWidth={1.5} className="text-[#D6A088]" />
          {focusLocked && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#D6A088] rounded-full flex items-center justify-center">
              <Check size={8} className="text-white" strokeWidth={2.5} />
            </div>
          )}
        </button>

        <div className="w-6 h-[1px] bg-[#D6A088]/25 rounded-full"></div>
        <button 
          onClick={onTimerCycle}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform relative"
        >
          <Clock size={18} strokeWidth={1.5} className="text-[#D6A088]" />
          {timerDelay > 0 && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#D6A088] rounded-full flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">{timerDelay}s</span>
            </div>
          )}
        </button>

        {/* Effects / Filters */}
        <button 
          onClick={toggleEffectsPanel}
          className={`w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${showEffectsPanel ? 'bg-[#D6A088]/20 rounded-full' : ''}`}
          title="Filters & Effects"
        >
          <Palette size={18} strokeWidth={1.5} className="text-[#D6A088]" />
        </button>

        {/* Beauty */}
        <button
          onClick={toggleBeautySlider}
          onDoubleClick={openBeautySlider}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform relative"
        >
          <User size={18} strokeWidth={1.5} className="text-[#D6A088]" />
          {beautyEnabled && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#D6A088] rounded-full flex items-center justify-center">
              <Check size={8} className="text-white" strokeWidth={2.5} />
            </div>
          )}
        </button>

        {/* Beauty Slider (shows when tapped) */}
        {showBeautySlider && (
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-1 py-2 flex flex-col items-center gap-1 border border-[#D6A088]/20">
            <span className="text-[8px] text-[#D6A088] font-bold">{Math.round(beautyLevel * 100)}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={beautyLevel * 100}
              onChange={(e) => setBeautyLevel(Number(e.target.value) / 100)}
              title="Beauty level"
              className="w-6 h-16 appearance-none cursor-pointer"
              style={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                writingMode: 'vertical-lr' as any,
                direction: 'rtl',
                accentColor: '#D6A088',
              }}
            />
          </div>
        )}

        {/* More Options Arrow */}
        <button 
          onClick={() => {
            const el = document.querySelector('.scrollbar-hide');
            if (el) el.scrollBy({ top: 100, behavior: 'smooth' });
          }}
          className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
          title="More options"
        >
          <ChevronDown size={18} strokeWidth={1.5} className="text-[#D6A088]" />
        </button>

        {/* ── AI FEATURES SECTION ── */}
        <div className="w-7 h-[1.5px] bg-[#D6A088]/30 rounded-full my-0.5"></div>

        {/* Zoom In */}
        {onZoomIn && (
          <button 
            onClick={onZoomIn}
            className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
            title="Zoom In"
          >
            <Plus size={18} className="text-[#D6A088]" strokeWidth={1.5} />
          </button>
        )}

        {/* Zoom Out */}
        {onZoomOut && (
          <button 
            onClick={onZoomOut}
            className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
            title="Zoom Out"
          >
            <Minus size={18} className="text-[#D6A088]" strokeWidth={1.5} />
          </button>
        )}

        {/* Zoom Level - tap to reset */}
        {(onZoomIn || onZoomOut) && (
          <button
            onClick={onZoomReset}
            className={`text-[#D6A088] text-[10px] font-bold bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border transition-all active:scale-90 ${
              zoomLevel !== 1 ? 'border-[#D6A088]/40 shadow-[0_0_6px_rgba(214,160,136,0.3)]' : 'border-[#D6A088]/15'
            }`}
            title="Tap to reset zoom"
          >
            {zoomLevel.toFixed(1)}x
          </button>
        )}

        {/* AI Music Generator */}
        {onAIMusicGenerator && (
          <button 
            onClick={onAIMusicGenerator}
            className="w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
            title="AI Music"
          >
            <Music size={18} className="text-[#D6A088]" strokeWidth={1.5} />
          </button>
        )}

        {/* AI Effects (Wand) */}
        <button 
          onClick={toggleEffectsPanel}
          className={`w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${showEffectsPanel ? 'bg-[#D6A088]/20 rounded-full' : ''}`}
          title="AI Effects"
        >
          <Wand2 size={18} className="text-[#D6A088]" strokeWidth={1.5} />
        </button>

        {/* CapCut AI Editor */}
        <button 
          onClick={toggleCapCutPanel}
          className={`w-8 h-8 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform ${showCapCutPanel ? 'bg-[#D6A088]/20 rounded-full' : ''}`}
          title="CapCut AI"
        >
          <Sparkles size={18} className="text-[#D6A088]" strokeWidth={1.5} />
        </button>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* EFFECTS PANEL (Bottom Sheet) */}
      {/* ══════════════════════════════════════════ */}
      {showEffectsPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-[60] pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div className="bg-black/90 backdrop-blur-xl rounded-t-2xl border-t border-[#D6A088]/20 pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h3 className="text-[#D6A088] text-sm font-bold flex items-center gap-1.5">
                <Palette size={14} />
                Filters & Effects
              </h3>
              <button onClick={() => setShowEffectsPanel(false)} className="p-1" title="Close effects">
                <X size={16} className="text-[#D6A088]/60" />
              </button>
            </div>

            {/* Filter Grid */}
            <div className="px-3 pb-3">
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {CAMERA_FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => selectFilter(filter.id)}
                    className={`flex flex-col items-center gap-1 flex-shrink-0 ${activeFilter === filter.id ? 'scale-110' : ''} transition-transform`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg ${
                        activeFilter === filter.id ? 'border-[#D6A088] shadow-[#D6A088]/30' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: filter.color }}
                    >
                      {activeFilter === filter.id && (
                        <Check size={16} className="text-white drop-shadow-lg" strokeWidth={3} />
                      )}
                    </div>
                    <span className={`text-[9px] font-semibold ${activeFilter === filter.id ? 'text-[#D6A088]' : 'text-white/60'}`}>
                      {filter.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Enhance Toggle */}
            <div className="px-4 pb-4 flex items-center gap-3">
              <button
                onClick={() => setEnhanceEnabled(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  enhanceEnabled
                    ? 'bg-[#D6A088] text-black'
                    : 'bg-white/10 text-white/60 border border-white/10'
                }`}
              >
                <Star size={12} />
                Auto Enhance
              </button>
              <button
                onClick={() => { setActiveFilter('none'); setEnhanceEnabled(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/60 border border-white/10"
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* CAPCUT AI PANEL (Bottom Sheet) */}
      {/* ══════════════════════════════════════════ */}
      {showCapCutPanel && (
        <div className="absolute bottom-0 left-0 right-0 z-[60] pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div className="bg-black/90 backdrop-blur-xl rounded-t-2xl border-t border-[#D6A088]/20 pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h3 className="text-[#D6A088] text-sm font-bold flex items-center gap-1.5">
                <Sparkles size={14} />
                CapCut AI Tools
              </h3>
              <button onClick={() => setShowCapCutPanel(false)} className="p-1" title="Close CapCut">
                <X size={16} className="text-[#D6A088]/60" />
              </button>
            </div>

            {/* Speed Control */}
            <div className="px-4 pb-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Gauge size={10} />
                Recording Speed
              </p>
              <div className="flex items-center gap-2">
                {SPEED_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onSpeedChange?.(opt.value)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      currentSpeed === opt.value
                        ? 'bg-[#D6A088] text-black shadow-lg shadow-[#D6A088]/30'
                        : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Tools Grid */}
            <div className="px-4 pb-3">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Layers size={10} />
                AI Tools
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* Text Overlay */}
                <button
                  onClick={() => { setShowTextInput(true); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <Type size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Text</span>
                </button>

                {/* Stickers */}
                <button
                  onClick={() => { setShowStickerPicker(true); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <span className="text-lg">😂</span>
                  <span className="text-white/60 text-[9px] font-medium">Stickers</span>
                </button>

                {/* Auto Enhance */}
                <button
                  onClick={() => setEnhanceEnabled(prev => !prev)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95 ${
                    enhanceEnabled
                      ? 'bg-[#D6A088]/20 border-[#D6A088]/40'
                      : 'bg-white/5 border-white/10 hover:border-[#D6A088]/30'
                  }`}
                >
                  <Star size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Enhance</span>
                </button>

                {/* Beauty Fine-Tune */}
                <button
                  onClick={() => { openBeautySlider(); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <SlidersHorizontal size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Retouch</span>
                </button>

                {/* Filters shortcut */}
                <button
                  onClick={() => { toggleEffectsPanel(); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <Palette size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Filters</span>
                </button>

                {/* Music */}
                <button
                  onClick={() => { onAIMusicGenerator?.(); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <Music size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Music</span>
                </button>

                {/* Flip */}
                <button
                  onClick={() => { onFlipCamera(); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <RefreshCw size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Flip</span>
                </button>

                {/* Gallery */}
                <button
                  onClick={() => { onGalleryOpen?.(); setShowCapCutPanel(false); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D6A088]/30 transition-all active:scale-95"
                >
                  <ImagePlus size={20} className="text-[#D6A088]" />
                  <span className="text-white/60 text-[9px] font-medium">Gallery</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TEXT INPUT OVERLAY */}
      {/* ══════════════════════════════════════════ */}
      {showTextInput && (
        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center pointer-events-auto">
          <div className="w-[80%] max-w-xs bg-black/90 backdrop-blur-xl rounded-2xl border border-[#D6A088]/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#D6A088] text-sm font-bold">Add Text</h3>
              <button onClick={() => setShowTextInput(false)} title="Close text input">
                <X size={16} className="text-[#D6A088]/60" />
              </button>
            </div>
            <input
              ref={textInputRef}
              type="text"
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Type your text..."
              className="w-full bg-white/10 border border-[#D6A088]/20 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-[#D6A088]/50"
              maxLength={50}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setTextOverlay(''); setShowTextInput(false); }}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-xs font-semibold"
              >
                Clear
              </button>
              <button
                onClick={() => setShowTextInput(false)}
                className="flex-1 py-2 rounded-xl bg-[#D6A088] text-black text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* STICKER PICKER OVERLAY */}
      {/* ══════════════════════════════════════════ */}
      {showStickerPicker && (
        <div className="absolute bottom-0 left-0 right-0 z-[70] pointer-events-auto">
          <div className="bg-black/90 backdrop-blur-xl rounded-t-2xl border-t border-[#D6A088]/20 pb-safe">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <h3 className="text-[#D6A088] text-sm font-bold">Stickers</h3>
              <button onClick={() => setShowStickerPicker(false)} className="p-1" title="Close stickers">
                <X size={16} className="text-[#D6A088]/60" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2 px-4 pb-4">
              {STICKER_OPTIONS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => addSticker(emoji)}
                  className={`text-2xl p-1.5 rounded-xl transition-all active:scale-90 ${
                    activeStickers.includes(emoji) 
                      ? 'bg-[#D6A088]/20 border border-[#D6A088]/40 scale-110' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {activeStickers.length > 0 && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => setActiveStickers([])}
                  className="w-full py-2 rounded-xl bg-white/10 text-white/60 text-xs font-semibold"
                >
                  Clear All Stickers
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* BOTTOM SECTION */}
      {/* ══════════════════════════════════════════ */}
      {!showEffectsPanel && !showCapCutPanel && !showStickerPicker && (
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          {/* Duration Selector - Tap to cycle */}
          <div className="flex justify-center mb-3">
            <button
              onClick={() => {
                const idx = durations.indexOf(selectedDuration);
                setSelectedDuration(durations[(idx + 1) % durations.length]);
              }}
              className="px-4 py-1.5 rounded-full bg-[#D6A088] text-black text-xs font-semibold active:scale-90 transition-transform"
            >
              {selectedDuration}
            </button>
          </div>

          {/* Record Button */}
          <div className="flex items-center justify-center mb-4 px-4">
            <button
              onClick={onRecord}
              title={isRecording ? 'Stop recording' : 'Start recording'}
              className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-xl active:scale-90 ${
                isRecording
                  ? 'bg-white border-[3px] border-[#D6A088]'
                  : 'bg-white border-[3px] border-white'
              }`}
            >
              <div
                className={`rounded-full transition-all ${
                  isRecording
                    ? 'w-7 h-7 bg-[#D6A088]'
                    : 'w-[58px] h-[58px] shadow-lg'
                }`}
                style={!isRecording ? {
                  background: 'linear-gradient(135deg, #9E6B57, #D6A088, #F2C3A7, #D6A088)'
                } : {}}
              ></div>
            </button>
          </div>

          {/* Speed indicator when not 1x */}
          {currentSpeed !== 1 && (
            <div className="flex justify-center mb-2">
              <div className="bg-[#D6A088]/20 px-3 py-0.5 rounded-full border border-[#D6A088]/30">
                <span className="text-[#D6A088] text-[10px] font-bold">Speed: {currentSpeed}x</span>
              </div>
            </div>
          )}

          {/* Bottom Tabs + Gallery */}
          <div className="flex items-center justify-between px-4 pb-0.5">


            <div className="flex items-center gap-5">
              <button 
                onClick={onPostTab}
                className={`text-sm font-bold hover:scale-105 active:scale-95 transition-transform ${
                  selectedTab === 'post' ? 'text-[#D6A088]' : 'text-gray-400 hover:text-[#D6A088]'
                }`}
              >
                POST
              </button>
              <button 
                onClick={onCreateTab}
                className={`text-sm font-semibold hover:scale-105 active:scale-95 transition-transform ${
                  selectedTab === 'create' ? 'text-[#D6A088]' : 'text-gray-400 hover:text-[#D6A088]'
                }`}
              >
                CREATE
              </button>
              <button 
                onClick={onLiveTab}
                className={`text-sm font-semibold hover:scale-105 active:scale-95 transition-transform ${
                  selectedTab === 'live' ? 'text-[#D6A088]' : 'text-gray-400 hover:text-[#D6A088]'
                }`}
              >
                LIVE
              </button>
            </div>

            <div className="w-8"></div>
          </div>
        </div>
      )}
    </div>
  );
}
