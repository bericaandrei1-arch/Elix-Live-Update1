import React, { useState, useEffect } from 'react';
import { LiveStreaming } from '../components/LiveStreaming';
import { LiveChat } from '../components/LiveChat';
import { LiveStreamingManager } from '../lib/liveStreaming';
import { AudioLibrary } from '../lib/audioLibrary';
import { useAuthStore } from '../store/useAuthStore';
import { Gift, Heart, Share2, Bookmark, MoreVertical, Settings, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { FACE_AR_GIFTS } from '../components/FaceARGiftPanel';
import { FaceARGift as FaceARGiftType } from '../lib/liveStreaming';

interface LiveStreamPageProps {
  streamId?: string;
  isStreamer?: boolean;
}

export const LiveStreamPage: React.FC<LiveStreamPageProps> = ({ 
  streamId,
  isStreamer = false 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [currentFaceARGift, setCurrentFaceARGift] = useState<FaceARGiftType | null>(null);
  const [streamerInfo, setStreamerInfo] = useState({
    username: 'ElixStarUser',
    avatar: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20avatar%20icon%20circular%20design%20modern%20clean%20minimalist&image_size=square',
    followers: 12500,
    isVerified: true
  });
  
  const { user } = useAuthStore();
  const streamManager = LiveStreamingManager.getInstance();
  const audioLibrary = AudioLibrary.getInstance();

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Update follower count
    setStreamerInfo(prev => ({
      ...prev,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Live Stream',
          text: `Check out ${streamerInfo.username}'s live stream!`,
          url: window.location.href
        });
      } catch (error) {
        // Handle share error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Stream link copied to clipboard!');
    }
  };

  const handleSendGift = (giftId: string, amount: number) => {
    // Implement gift sending logic
    
    // Show gift animation
    showGiftAnimation(giftId, amount);
  };

  const handleSendFaceARGift = (gift: any) => {
    // Implement Face AR gift sending logic
    const faceARGift: FaceARGiftType = {
      ...gift,
      senderId: 'current-user',
      senderUsername: 'Current User',
      timestamp: new Date(),
      duration: 30000
    };
    setCurrentFaceARGift(faceARGift);
    
    // Send through WebSocket
    if (streamManager) {
      streamManager.sendFaceARGift('current-user', faceARGift);
    }
  };

  const handleClearFaceARGift = () => {
    setCurrentFaceARGift(null);
    if (streamManager) {
      streamManager.removeFaceARGift('current-user');
    }
  };

  const showGiftAnimation = (giftId: string, amount: number) => {
    // Create floating gift animation
    const giftElement = document.createElement('div');
    giftElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none';
    giftElement.innerHTML = `
      <div class="animate-bounce">
        <div class="text-6xl">${getGiftEmoji(giftId)}</div>
        <div class="text-center text-white font-bold mt-2">+${amount}</div>
      </div>
    `;
    
    document.body.appendChild(giftElement);
    
    setTimeout(() => {
      giftElement.remove();
    }, 3000);
  };

  const getGiftEmoji = (giftId: string) => {
    const giftEmojis: Record<string, string> = {
      'rose': '🌹',
      'heart': '💝',
      'diamond': '💎',
      'rocket': '🚀',
      'crown': '👑'
    };
    return giftEmojis[giftId] || '🎁';
  };

  const StreamHeader = () => (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <div className="flex items-center gap-3">
        <img 
          src={streamerInfo.avatar} 
          alt={streamerInfo.username}
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{streamerInfo.username}</span>
            {streamerInfo.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <div className="text-sm opacity-90">
            {streamerInfo.followers.toLocaleString()} followers
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!isStreamer && (
          <Button
            onClick={handleFollow}
            variant={isFollowing ? "outline" : "default"}
            className={cn(
              "px-4 py-2 rounded-full",
              isFollowing && "bg-white text-purple-600 hover:bg-gray-100"
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
        
        <Button
          onClick={() => setShowGiftPanel(!showGiftPanel)}
          variant="ghost"
          className="p-2 rounded-full bg-white/20 hover:bg-white/30"
        >
          <Gift className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={handleShare}
          variant="ghost"
          className="p-2 rounded-full bg-white/20 hover:bg-white/30"
        >
          <Share2 className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          className="p-2 rounded-full bg-white/20 hover:bg-white/30"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  const GiftPanel = () => (
    <div className="absolute bottom-20 right-4 bg-white rounded-lg shadow-lg border p-4 z-20">
      <h3 className="font-semibold mb-3">Send Gift</h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'rose', name: '🌹 Rose', price: 1 },
          { id: 'heart', name: '💝 Heart', price: 5 },
          { id: 'diamond', name: '💎 Diamond', price: 10 },
          { id: 'rocket', name: '🚀 Rocket', price: 50 },
          { id: 'crown', name: '👑 Crown', price: 100 },
          { id: 'universe', name: '🌌 Universe', price: 1000 }
        ].map((gift) => (
          <Button
            key={gift.id}
            onClick={() => handleSendGift(gift.id, gift.price)}
            variant="outline"
            className="flex flex-col items-center gap-1 p-3"
          >
            <span className="text-2xl">{gift.name.split(' ')[0]}</span>
            <span className="text-xs text-gray-500">{gift.price} coins</span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Stream Header */}
      <StreamHeader />
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Stream */}
        <div className="flex-1 relative">
          <LiveStreaming 
            isStreamer={isStreamer} 
            streamId={streamId}
            currentFaceARGift={currentFaceARGift}
            onFaceARGiftComplete={handleClearFaceARGift}
          />
          
          {/* Gift Panel */}
          {showGiftPanel && <GiftPanel />}
        </div>
        
        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-900">
          <LiveChat
            streamId={streamId || 'demo-stream'}
            isStreamer={isStreamer}
            isModerator={isStreamer}
            onSendGift={handleSendGift}
            onSendFaceARGift={handleSendFaceARGift}
            currentFaceARGift={currentFaceARGift}
            onClearFaceARGift={handleClearFaceARGift}
          />
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-gray-700">
            <Users className="w-5 h-5 mr-2" />
            Viewers
          </Button>
          
          <Button variant="ghost" className="text-white hover:bg-gray-700">
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Your balance:</span>
          <span className="text-yellow-400 font-semibold">1,250 coins</span>
        </div>
      </div>
    </div>
  );
};
