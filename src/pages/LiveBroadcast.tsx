import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Radio, Users, MessageCircle, Send, FlipVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { getCachedCameraStream } from '../lib/cameraStream';
import { websocket } from '../lib/websocket';

type BroadcastState = 'setup' | 'live' | 'ending';

interface ChatMsg {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

export default function LiveBroadcast() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [broadcastState, setBroadcastState] = useState<BroadcastState>('setup');
  const [title, setTitle] = useState('');
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Timer for live duration
  useEffect(() => {
    if (broadcastState !== 'live') return;
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [broadcastState]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize camera
  useEffect(() => {
    const cached = getCachedCameraStream();
    if (cached) {
      streamRef.current = cached;
      if (videoRef.current) {
        videoRef.current.srcObject = cached;
      }
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFrontCamera ? 'user' : 'environment' },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError('Camera access denied. Please allow camera and microphone.');
      }
    };
    startCamera();
    return () => { cancelled = true; };
  }, [isFrontCamera]);

  // WebSocket listeners for viewer count and chat
  useEffect(() => {
    if (!streamId) return;

    const handleViewerCount = (data: any) => {
      setViewerCount(data.count || 0);
    };

    const handleChat = (data: any) => {
      setChatMessages(prev => [...prev, {
        id: `${Date.now()}_${Math.random()}`,
        username: data.username || 'viewer',
        text: data.message || data.text || '',
        timestamp: data.timestamp || new Date().toISOString(),
      }]);
    };

    const handleUserJoined = (data: any) => {
      setChatMessages(prev => [...prev, {
        id: `sys_${Date.now()}`,
        username: 'system',
        text: `${data.username || 'A viewer'} joined`,
        timestamp: new Date().toISOString(),
      }]);
    };

    websocket.on('viewer_count_update', handleViewerCount);
    websocket.on('chat_message', handleChat);
    websocket.on('user_joined', handleUserJoined);

    return () => {
      websocket.off('viewer_count_update', handleViewerCount);
      websocket.off('chat_message', handleChat);
      websocket.off('user_joined', handleUserJoined);
    };
  }, [streamId]);

  const generateStreamKey = () => {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const goLive = async () => {
    if (!user) {
      setError('You must be logged in to go live.');
      return;
    }

    try {
      setError(null);
      const key = generateStreamKey();

      const { data: { session } } = await supabase.auth.getSession();

      const { data, error: dbError } = await supabase
        .from('live_streams')
        .insert({
          user_id: user.id,
          title: title.trim() || `${user.username}'s Live`,
          stream_key: key,
          is_live: true,
          viewer_count: 0,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setStreamId(data.id);
      setStreamKey(key);
      setBroadcastState('live');

      if (session?.access_token) {
        websocket.connect(data.id, session.access_token);
      }
    } catch (err: any) {
      console.error('Failed to go live:', err);
      setError(err.message || 'Failed to start stream. Please try again.');
    }
  };

  const endStream = async () => {
    setBroadcastState('ending');

    try {
      if (streamId) {
        await supabase
          .from('live_streams')
          .update({ is_live: false, ended_at: new Date().toISOString() })
          .eq('id', streamId);
      }

      websocket.disconnect();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch (err) {
      console.error('Error ending stream:', err);
    }

    navigate('/feed');
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text || !streamId) return;

    websocket.send('chat_message', {
      message: text,
      username: user?.username || 'streamer',
    });

    setChatMessages(prev => [...prev, {
      id: `own_${Date.now()}`,
      username: user?.username || 'You',
      text,
      timestamp: new Date().toISOString(),
    }]);

    setChatInput('');
  };

  const flipCamera = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsFrontCamera(prev => !prev);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Camera Preview */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: isFrontCamera ? 'scaleX(-1)' : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),16px)]">
        <button onClick={() => broadcastState === 'live' ? endStream() : navigate('/feed')} className="p-2" title="Close">
          <X size={24} />
        </button>

        {broadcastState === 'live' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 animate-pulse">
              <Radio size={14} />
              <span className="text-xs font-bold">LIVE</span>
            </div>
            <span className="text-xs text-white/80 font-mono">{formatDuration(duration)}</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50">
              <Users size={12} />
              <span className="text-xs font-bold">{viewerCount}</span>
            </div>
          </div>
        )}

        {broadcastState === 'live' && (
          <button onClick={flipCamera} className="p-2 rounded-full bg-black/40" title="Flip camera">
            <FlipVertical size={20} />
          </button>
        )}
      </div>

      {/* Setup Screen */}
      {broadcastState === 'setup' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          <h1 className="text-2xl font-bold mb-6">Go Live</h1>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Add a title for your stream..."
            className="w-full max-w-sm bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-center mb-4 focus:outline-none focus:border-[#E6B36A]"
            maxLength={100}
          />

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            onClick={goLive}
            className="px-10 py-3 bg-red-600 rounded-full text-white font-bold text-lg hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-600/30"
          >
            Go Live
          </button>

          <button
            onClick={() => navigate('/feed')}
            className="mt-4 text-white/50 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Live Chat Overlay */}
      {broadcastState === 'live' && (
        <div className="relative z-10 flex-1 flex flex-col justify-end pb-4">
          {/* Chat Messages */}
          <div className="max-h-[40vh] overflow-y-auto px-4 space-y-1 mb-3">
            {chatMessages.map(msg => (
              <div key={msg.id} className="flex items-start gap-2">
                <span className={`text-xs font-bold ${msg.username === 'system' ? 'text-[#E6B36A]' : 'text-white/80'}`}>
                  {msg.username === 'system' ? '' : `@${msg.username}`}
                </span>
                <span className={`text-xs ${msg.username === 'system' ? 'text-white/50 italic' : 'text-white/70'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 px-4">
            <div className="flex-1 flex items-center bg-white/10 rounded-full px-4 py-2">
              <MessageCircle size={16} className="text-white/40 mr-2" />
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Say something..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
              />
            </div>
            <button
              onClick={sendChat}
              disabled={!chatInput.trim()}
              className="p-2 rounded-full bg-[#E6B36A] disabled:opacity-30 transition"
              title="Send"
            >
              <Send size={16} className="text-black" />
            </button>
          </div>

          {/* End Stream Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={endStream}
              className="px-6 py-2 bg-red-600/80 rounded-full text-sm font-bold hover:bg-red-600 transition"
            >
              End Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
