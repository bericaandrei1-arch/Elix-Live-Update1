import React from 'react';
import { Gem } from 'lucide-react';

interface LevelBadgeProps {
  level: number;
  className?: string;
  size?: number;
  layout?: 'fit' | 'fixed';
  variant?: 'clean' | 'default' | 'chat';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className = "", size = 40, layout = 'fit', variant = 'clean' }) => {
  const tier = level > 100 ? 'pink' : level > 60 ? 'purple' : level > 30 ? 'orange' : level > 20 ? 'green' : 'blue';
  const safeLevel = Number.isFinite(level) && level > 0 ? Math.floor(level) : 1;
  const isChat = variant === 'chat';
  const isClean = variant === 'clean';

  const colors =
    tier === 'blue'
      ? { bg: '#1e40af', border: '#3b82f6' } // Blue 800 bg, Blue 500 border
      : tier === 'green'
        ? { bg: '#166534', border: '#22c55e' } // Green 800 bg, Green 500 border
        : tier === 'orange'
          ? { bg: '#9a3412', border: '#f97316' } // Orange 800 bg, Orange 500 border
          : tier === 'purple'
            ? { bg: '#6b21a8', border: '#a855f7' } // Purple 800 bg, Purple 500 border
            : { bg: '#9d174d', border: '#ec4899' }; // Pink 800 bg, Pink 500 border

  // size=10 is used in chat. We are bumping it up significantly as requested.
  // ~4mm is approx 15px. User asked for +4mm height/width relative to original small size.
  // Original was 14px height. New target ~24px.
  // Original width 28px. New target ~50px.
  
  const height = size === 10 ? 18 : (size === 2 ? 2 : (size === 14 ? 14 : Math.max(46, Math.round(size * 1.5))));
  const width = size === 10 ? 40 : (size === 2 ? 3 : (size === 14 ? 16 : (layout === 'fixed' ? Math.round(height * 4.0) : undefined)));
  const radius = size === 10 ? 6 : (size === 2 ? 1 : (size === 14 ? 4 : (isChat ? 6 : Math.max(8, Math.round(height * 0.214)))));
  const fontSize = size === 10 ? 13 : size === 2 ? 1 : size === 14 ? 12 : Math.max(18, Math.round(height * 0.45));
  const iconSize = size === 10 ? 10 : Math.max(8, Math.round(fontSize * 0.8));

  return (
    <span
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{
        height,
        width,
        flexShrink: 0,
        paddingLeft: (layout === 'fixed' || size === 10) ? 0 : Math.round(height * 1.4), // +padding (~4mm width extra)
        paddingRight: (layout === 'fixed' || size === 10) ? 0 : Math.round(height * 1.4),
        filter: 'none',
      }}
    >
      {/* Main Background & Border */}
      <span
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background: colors.bg, // Solid dark background
          border: `1.5px solid ${colors.border}`, // Dark solid border
          boxShadow: 'none',
        }}
      />
      
      {/* Content: Icon + Text */}
      <div 
        className="relative z-10 flex items-center justify-center" 
        style={{ 
          gap: size === 10 ? 3 : Math.round(height * 0.1),
          transform: size === 10 ? 'none' : 'translateY(-1px)'
        }}
      >
        <Gem 
          size={iconSize} 
          strokeWidth={2.5}
          className="text-gray-200"
          fill="currentColor"
        />
        <span
          className={`antialiased ${size === 10 ? 'font-bold' : 'font-black'}`}
          style={{
            color: '#E5E7EB', // Gray-200 (alb-gri)
            fontSize,
            textShadow: 'none',
            WebkitTextStroke: 'none',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {safeLevel}
        </span>
      </div>
    </span>
  );
};
