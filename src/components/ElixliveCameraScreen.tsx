import React from 'react';

export default function ElixStarLiveCameraScreen() {
  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Camera Preview Background */}
      <div className="absolute inset-0 w-full h-full bg-black" />
      
      {/* Top Bar */}
      <img 
        src="/Icons/topbar.png" 
        alt="Top Bar" 
        className="absolute top-0 left-0 w-full z-10 pointer-events-auto"
        style={{ height: 'auto' }}
      />
      
      {/* Power Button (Top Right) */}
      <img 
        src="/Icons/power-button.png" 
        alt="Close" 
        className="absolute top-4 right-4 w-16 h-16 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto z-20"
      />
      
      {/* Right Side Action Buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
        <img 
          src="/Icons/side-comment.png" 
          alt="Comment" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
        <img 
          src="/Icons/side-like.png" 
          alt="Like" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
        <img 
          src="/Icons/side-save.png" 
          alt="Save" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
        <img 
          src="/Icons/side-share.png" 
          alt="Share" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
        <img 
          src="/Icons/add-sound-button.png" 
          alt="Add Sound" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
        <img 
          src="/Icons/side-menu.png" 
          alt="Menu" 
          className="w-20 h-20 object-contain cursor-pointer hover:scale-110 transition pointer-events-auto"
        />
      </div>
    </div>
  );
}
