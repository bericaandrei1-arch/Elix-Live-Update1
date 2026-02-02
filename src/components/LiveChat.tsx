import React, { useState, useEffect, useRef } from 'react';
import { LiveStreamingManager, ChatMessage, LiveViewer, FaceARGift } from '../lib/liveStreaming';
import { Send, Heart, Gift, Shield, VolumeX, Volume2, Pin, Trash2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { FaceARGiftPanel, FACE_AR_GIFTS } from './FaceARGiftPanel';

interface LiveChatProps {
  streamId: string;
  isStreamer?: boolean;
  isModerator?: boolean;
  onSendGift?: (giftId: string, amount: number) => void;
  onSendFaceARGift?: (gift: FaceARGift) => void;
  currentFaceARGift?: FaceARGift | null;
  onClearFaceARGift?: () => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ 
  streamId, 
  isStreamer = false, 
  isModerator = false,
  onSendGift,
  onSendFaceARGift,
  currentFaceARGift,
  onClearFaceARGift
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showFaceARGiftPanel, setShowFaceARGiftPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const liveManager = LiveStreamingManager.getInstance();

  useEffect(() => {
    // Set up event listeners
    liveManager.onMessage((message) => {
      setMessages(prev => [...prev, message]);
      if (message.isPinned) {
        setPinnedMessage(message);
      }
    });

    liveManager.onViewersUpdate((updatedViewers) => {
      setViewers(updatedViewers);
    });

    // Connect to chat
    setIsConnected(true);

    return () => {
      // Cleanup
    };
  }, [streamId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await liveManager.sendChatMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await liveManager.banUser(userId);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    }
  };

  const handleMuteUser = async (userId: string) => {
    try {
      await liveManager.muteUser(userId);
    } catch (error) {
      console.error('Error muting user:', error);
      alert('Failed to mute user');
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await liveManager.pinMessage(messageId);
    } catch (error) {
      console.error('Error pinning message:', error);
      alert('Failed to pin message');
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendFaceARGiftWrapper = (gift: any) => {
    // Convert FaceARGiftPanel.FaceARGift to LiveStreaming.FaceARGift
    const liveStreamingGift: FaceARGift = {
      id: gift.id,
      name: gift.name,
      type: gift.type,
      price: gift.price,
      color: gift.color,
      duration: 30000, // 30 seconds default
      senderId: 'current-user',
      senderUsername: 'Current User',
      timestamp: new Date()
    };
    
    if (onSendFaceARGift) {
      onSendFaceARGift(liveStreamingGift);
    }
  };

  const getCurrentGiftForPanel = () => {
    if (!currentFaceARGift) return null;
    
    // Find the corresponding gift from FACE_AR_GIFTS
    const baseGift = FACE_AR_GIFTS.find(g => g.id === currentFaceARGift?.id);
    if (!baseGift) return null;
    
    return {
      ...baseGift,
      color: currentFaceARGift.color
    };
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Live Chat</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{viewers.length} viewers</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFaceARGiftPanel(!showFaceARGiftPanel)}
              className="text-purple-600 hover:text-purple-700"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Face AR Gift Panel */}
      {showFaceARGiftPanel && onSendFaceARGift && (
        <div className="p-4 border-b bg-gray-50">
          <FaceARGiftPanel
            onSelectGift={handleSendFaceARGiftWrapper}
            userCoins={1000} // This should come from user context
            isStreamer={isStreamer}
            currentGift={getCurrentGiftForPanel()}
            onClearGift={onClearFaceARGift}
          />
        </div>
      )}

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start gap-2">
            <Pin className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">{pinnedMessage.username}</span>
                <span className="text-xs text-gray-500">{formatTime(pinnedMessage.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-700">{pinnedMessage.message}</p>
            </div>
            {isModerator && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePinMessage(pinnedMessage.id)}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <Pin className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-2',
              message.type === 'system' && 'justify-center text-gray-500 text-sm italic',
              message.type === 'gift' && 'bg-yellow-50 p-2 rounded-lg border border-yellow-200',
              message.type === 'face_ar' && 'bg-purple-50 p-2 rounded-lg border border-purple-200'
            )}
          >
            {message.type === 'system' ? (
              <span className="text-center">{message.message}</span>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'font-medium text-sm',
                      message.isModerator ? 'text-red-600' : 'text-gray-900'
                    )}>
                      {message.username}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.type === 'gift' && <Gift className="w-3 h-3 text-yellow-500" />}
                    {message.type === 'face_ar' && <Sparkles className="w-3 h-3 text-purple-500" />}
                  </div>
                  <p className="text-sm text-gray-700 break-words">{message.message}</p>
                  
                  {/* Gift details */}
                  {message.type === 'gift' && message.giftAmount && (
                    <div className="text-xs text-yellow-600 font-medium mt-1">
                      Sent {message.giftAmount} coins
                    </div>
                  )}
                  
                  {/* Face AR gift details */}
                  {message.type === 'face_ar' && message.faceARGift && (
                    <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Face AR: {message.faceARGift.name}
                    </div>
                  )}
                </div>
                
                {/* Moderation buttons */}
                {isModerator && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMuteUser(message.userId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <VolumeX className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBanUser(message.userId)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Shield className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePinMessage(message.id)}
                      className="text-yellow-400 hover:text-yellow-600"
                    >
                      <Pin className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGiftPanel(!showGiftPanel)}
            className="text-yellow-600 hover:text-yellow-700"
          >
            <Gift className="w-4 h-4" />
            <span className="ml-1 text-xs">Gifts</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFaceARGiftPanel(!showFaceARGiftPanel)}
            className="text-purple-600 hover:text-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            <span className="ml-1 text-xs">Face AR</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
