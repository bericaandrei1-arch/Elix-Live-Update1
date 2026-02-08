import React, { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { pickFirstPosterCandidate } from '../lib/giftPoster';

interface GiftOverlayProps {
  videoSrc: string | null;
  onEnded: () => void;
  isBattleMode?: boolean;
}

export function GiftOverlay({ videoSrc, onEnded, isBattleMode: _isBattleMode }: GiftOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { muteAllSounds } = useSettingsStore();
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    setVideoPlaying(false);
    if (videoSrc && videoRef.current) {
      videoRef.current.muted = muteAllSounds;
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video started playing
          })
          .catch((error) => {
            console.warn("Auto-play was prevented:", error);
            if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(e => {
                    console.error("Muted play also failed", e);
                    onEnded();
                });
            }
          });
      }
    }
  }, [muteAllSounds, videoSrc]);

  if (!videoSrc) return null;

  const isVideo = videoSrc.endsWith('.webm') || videoSrc.endsWith('.mp4');
  const poster = isVideo ? pickFirstPosterCandidate(videoSrc) : undefined;

  return (
    <div className="absolute left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)-10px)] z-[100] pointer-events-none flex justify-center">
      <div
        className="w-full h-[52vh] flex items-end justify-center overflow-hidden relative"
        style={{
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 62%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 0%, black 62%, transparent 100%)',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      >
        {isVideo ? (
          <>
            {/* PNG preview stays on top until video actually plays */}
            {poster && !videoPlaying && (
              <img
                src={poster}
                alt="Gift Preview"
                className="absolute inset-0 w-full h-full object-cover object-top opacity-90 drop-shadow-2xl elix-overlay-in z-10"
              />
            )}
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              className="w-full h-full object-cover object-top opacity-85 drop-shadow-2xl elix-overlay-in"
              playsInline
              preload="auto"
              muted={muteAllSounds}
              onPlaying={() => setVideoPlaying(true)}
              onEnded={onEnded}
              onError={(e) => {
                console.error("Video error:", e);
                onEnded();
              }}
            />
          </>
        ) : (
          <img
            src={videoSrc}
            alt="Gift"
            className="w-full h-full object-cover object-top opacity-90 drop-shadow-2xl animate-bounce-small elix-overlay-in"
            onLoad={() => {
              setTimeout(onEnded, 1500);
            }}
            onError={() => {
              console.error("Gift image failed to load:", videoSrc);
              onEnded();
            }}
          />
        )}
      </div>
    </div>
  );
}
