import React from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FOLLOWING_VIDEOS = [
  { id: 1, url: '/gifts/Lightning Hypercar.mp4' },
  { id: 2, url: '/gifts/Emerald Colossus Rhino.mp4' },
  { id: 3, url: '/gifts/Majestic ice unicorn in enchanted snow.mp4' },
];

export default function FollowingFeed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-[500px]">
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Following</h1>
        </div>

      {/* Content */}
      {FOLLOWING_VIDEOS.length > 0 ? (
        <div className="grid grid-cols-1 gap-1">
          {FOLLOWING_VIDEOS.map((video) => (
            <div key={video.id} className="aspect-[9/16] bg-gray-900 relative">
               <video 
                 src={video.url} 
                 className="w-full h-full object-cover" 
                 muted 
                 loop 
                 onMouseOver={e => e.currentTarget.play()} 
                 onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
               />
               <div className="absolute bottom-4 left-4">
                 <p className="font-bold">@friend_user</p>
                 <p className="text-sm opacity-80">Check this out!</p>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 opacity-60">
          <UserPlus size={48} className="mb-4" />
          <h2 className="text-xl font-bold mb-2">Follow your friends</h2>
          <p>Videos from people you follow will appear here.</p>
        </div>
      )}
      </div>
    </div>
  );
}
