import React from 'react';
import { ArrowLeft, Music, Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const MUSIC_VIDEOS = [
  { id: 1, url: '/gifts/Elix Lucky Kitty.mp4' },
  { id: 2, url: '/gifts/Emerald Sky Guardian.mp4' },
  { id: 3, url: '/gifts/Ember Dragon Egg.mp4' },
  { id: 4, url: '/gifts/Mythic Fire Unicorn.mp4' },
  { id: 5, url: '/gifts/Zeus.webm' },
  { id: 6, url: '/gifts/Beast Relic of the Ancients.webm' },
];

export default function MusicFeed() {
  const navigate = useNavigate();
  const { songId } = useParams();

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-[500px]">
        {/* Header Info */}
        <div className="p-4 pt-6 bg-gradient-to-b from-gray-900 to-black">
         <button onClick={() => navigate(-1)} className="p-2 mb-4">
           <ArrowLeft size={24} />
         </button>
         <div className="flex gap-4">
         <div className="w-24 h-24 bg-gray-800 rounded-md flex items-center justify-center shrink-0">
            <Music size={40} className="text-white/50" />
         </div>
         <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">Original Sound{songId ? ` #${songId}` : ''}</h1>
            <p className="text-white/60 text-sm mb-4">Trending • 1.2M Videos</p>
            <button className="bg-[#FE2C55] text-white px-6 py-1.5 rounded-sm font-semibold flex items-center gap-2 text-sm w-fit">
               <Play size={14} fill="white" /> Use this sound
            </button>
         </div>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {MUSIC_VIDEOS.map((video) => (
          <div key={video.id} className="aspect-[3/4] bg-gray-900 relative cursor-pointer" onClick={() => navigate('/')}>
             <video 
               src={video.url} 
               className="w-full h-full object-cover" 
               muted 
               loop 
               onMouseOver={e => e.currentTarget.play()} 
               onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
             />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
