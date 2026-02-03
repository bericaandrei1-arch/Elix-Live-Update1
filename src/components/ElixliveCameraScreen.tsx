import React from 'react';

// Example import paths, adjust as needed
export default function ElixStarLiveCameraScreen() {
  return (
    <div className="relative min-h-screen bg-black text-[#FFD6A0] font-sans overflow-hidden">
      {/* Top: Add Sound */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <button className="flex items-center px-6 py-2 rounded-full bg-[#1a1a1a] border border-[#FFD6A0] shadow-lg text-lg font-semibold">
          <span className="mr-2">🎵</span> Add sound
        </button>
      </div>

      {/* Right: Side Action Bar */}
      <div className="absolute right-4 top-1/4 flex flex-col gap-6 z-20">
        {/* Replace src with your actual icon paths */}
        <img src="/path/to/plus.png" alt="Plus" className="w-14 h-14" />
        <img src="/path/to/hand-heart.png" alt="Hand Heart" className="w-14 h-14" />
        <img src="/path/to/chat.png" alt="Chat" className="w-14 h-14" />
        <img src="/path/to/bookmark.png" alt="Bookmark" className="w-14 h-14" />
        <img src="/path/to/share.png" alt="Share" className="w-14 h-14" />
        <img src="/path/to/music.png" alt="Music" className="w-14 h-14" />
      </div>

      {/* Bottom: Record Controls */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <div className="flex gap-8 mb-4 text-lg">
          <span className="opacity-70">10m</span>
          <span className="opacity-70">60s</span>
          <span className="font-bold bg-[#FFD6A0] text-black px-4 py-1 rounded-full">PHOTO</span>
          <span className="opacity-70">TEXT</span>
        </div>
        <button className="w-28 h-28 rounded-full border-4 border-[#FFD6A0] bg-gradient-to-b from-[#FFD6A0] to-[#B8865B] shadow-2xl" />
        <div className="flex gap-8 mt-4 text-lg">
          <span>POST</span>
          <span className="font-bold">CREATE</span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Bottom Left: Upload */}
      <div className="absolute bottom-36 left-4 flex flex-col items-center z-20">
        <button className="flex flex-col items-center">
          <span className="bg-[#FFD6A0] text-black rounded-full p-2 mb-1">f</span>
          <span className="text-xs">Upload</span>
        </button>
      </div>

      {/* Bottom: Tab Bar */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 z-30">
        <div className="flex justify-between items-center bg-[#1a1a1a] rounded-2xl py-3 px-6 shadow-lg border border-[#FFD6A0]">
          <div className="flex flex-col items-center">
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">👥</span>
            <span className="text-xs mt-1">Friends</span>
          </div>
          <div className="relative -mt-8">
            <button className="w-16 h-16 rounded-full border-4 border-[#FFD6A0] bg-gradient-to-b from-[#FFD6A0] to-[#B8865B] shadow-2xl flex items-center justify-center text-3xl">+</button>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">📥</span>
            <span className="text-xs mt-1">Inbox</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">👤</span>
            <span className="text-xs mt-1">Profile</span>
          </div>
        </div>
      </div>

      {/* Top: Category Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-10">
        <div className="flex items-center justify-between bg-[#1a1a1a] rounded-full px-6 py-3 border border-[#FFD6A0] shadow-lg">
          <span className="flex items-center gap-2 font-bold"><span className="text-lg">📺</span>LIVE</span>
          <span>STEM</span>
          <span>Explore</span>
          <span>Following</span>
          <span>Shop</span>
          <span className="underline">For You</span>
          <span className="text-lg">🔍</span>
        </div>
      </div>
    </div>
  );
}
