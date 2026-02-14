import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, UserPlus, Gift, Bell, Mail } from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'gift' | 'battle_invite' | 'system';
  actor_id: string;
  actor?: { username: string; avatar_url: string | null };
  title: string;
  body: string | null;
  image_url: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  otherUser?: { username: string; avatar_url: string | null };
  lastMessage?: string;
}

export default function Inbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  };

  const loadNotifications = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(username, avatar_url)')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [currentUserId]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${currentUserId},participant_2.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      if (!convs || convs.length === 0) {
        setConversations([]);
        return;
      }

      // Extract other user IDs
      const otherUserIds = convs.map(c => 
        c.participant_1 === currentUserId ? c.participant_2 : c.participant_1
      );

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, display_name')
        .in('user_id', otherUserIds);

      // Create a map for easy lookup
      const profileMap = new Map();
      profiles?.forEach(p => {
        profileMap.set(p.user_id, {
            username: p.display_name || p.username || 'User',
            avatar_url: p.avatar_url
        });
      });

      // Merge data
      const enrichedConvs = convs.map(c => {
        const otherId = c.participant_1 === currentUserId ? c.participant_2 : c.participant_1;
        const profile = profileMap.get(otherId);
        return {
            ...c,
            otherUser: profile || { username: 'User', avatar_url: null },
            lastMessage: c.last_message // Map snake_case to camelCase property
        };
      });

      setConversations(enrichedConvs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      if (activeTab === 'notifications') {
        loadNotifications();
      } else {
        loadConversations();
      }
    }
  }, [activeTab, currentUserId, loadNotifications, loadConversations]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'gift':
        return <Gift className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 px-4 py-4 border-b border-transparent">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/feed')} className="p-1 hover:brightness-125 transition" title="Back to For You">
            <img src="/Icons/power-button.png" alt="Back" className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Inbox</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition ${
              activeTab === 'notifications'
                ? 'bg-[#E6B36A] text-black'
                : 'text-white'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition ${
              activeTab === 'messages'
                ? 'bg-[#E6B36A] text-black'
                : 'text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-1.5" />
            Messages
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === 'notifications' ? (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.action_url) {
                    navigate(notif.action_url);
                  }
                }}
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                  notif.is_read ? 'bg-transparent' : 'bg-[#E6B36A]/10'
                }`}
              >
                <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {notif.actor && (
                      <img
                        src={notif.actor.avatar_url || ''}
                        alt={notif.actor.username}
                        className="w-8 h-8 object-cover bg-gray-700 rounded-full"
                      />
                    )}
                    <span className="font-semibold">{notif.actor?.username || 'System'}</span>
                    <span className="text-white/60">{notif.title}</span>
                  </div>
                  {notif.body && <p className="text-sm text-white/70">{notif.body}</p>}
                  <p className="text-xs text-white/40 mt-1">{formatTime(notif.created_at)}</p>
                </div>
                {!notif.is_read && <div className="w-2 h-2 bg-[#E6B36A] rounded-full mt-2"></div>}
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-12 text-white/40">No notifications yet</div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate(`/inbox/${conv.id}`)}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:brightness-125 transition"
              >
                <img
                  src={conv.otherUser?.avatar_url || ''}
                  alt="User"
                  className="w-12 h-12 object-cover bg-gray-700 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{conv.otherUser?.username || 'User'}</p>
                  <p className="text-sm text-white/60 truncate">{conv.lastMessage || 'No messages yet'}</p>
                </div>
                <span className="text-xs text-white/40">{formatTime(conv.last_message_at)}</span>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="text-center py-12 text-white/40">No messages yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}
