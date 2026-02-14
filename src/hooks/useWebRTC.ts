import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface WebRTCConfig {
  roomId: string;
  isBroadcaster: boolean;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  userId: string;
  stream?: MediaStream;
}

export function useWebRTC({ roomId, isBroadcaster }: WebRTCConfig) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const user = useAuthStore(s => s.user);

  // Initialize Local Stream (Camera/Mic)
  const startLocalStream = useCallback(async () => {
    try {
      // If we already have a stream, don't re-request
      if (localStreamRef.current) return localStreamRef.current;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      return null;
    }
  }, []);

  // Initialize WebSocket & WebRTC
  useEffect(() => {
    if (!roomId || !user) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?room=${roomId}&token=${user.accessToken || 'guest'}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log('WS Connected');
      setIsConnected(true);
      
      // If broadcaster, join and announce
      if (isBroadcaster) {
        const stream = await startLocalStream();
        if (stream) {
            // Broadcaster logic if needed
        }
      }
      
      ws.send(JSON.stringify({
        event: 'join_room',
        data: { roomId, userId: user.id, username: user.username || 'User' }
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleSignalingData(msg);
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    };

    ws.onclose = () => setIsConnected(false);

    return () => {
      ws.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      peersRef.current.forEach(p => p.pc.close());
    };
  }, [roomId, isBroadcaster, user, startLocalStream]);

  const handleSignalingData = async (msg: any) => {
    const { event, data } = msg;
    
    switch (event) {
      case 'user_joined':
        handleUserJoined(data.user_id);
        break;
      case 'offer':
        handleOffer(data);
        break;
      case 'answer':
        handleAnswer(data);
        break;
      case 'candidate':
        handleCandidate(data);
        break;
      case 'user_left':
        handleUserLeft(data.user_id);
        break;
    }
  };

  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers here if needed
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          event: 'candidate',
          data: { targetUserId: userId, candidate: event.candidate }
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, event.streams[0]);
        return newMap;
      });
    };

    // Add local tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peersRef.current.set(userId, { pc, userId });
    return pc;
  };

  const handleUserJoined = async (userId: string) => {
    // We are the existing user, new user joined -> We create Offer
    const pc = createPeerConnection(userId);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsRef.current?.send(JSON.stringify({
      event: 'offer',
      data: { targetUserId: userId, sdp: offer }
    }));
  };

  const handleOffer = async (data: any) => {
    const { senderUserId, sdp } = data;
    const pc = createPeerConnection(senderUserId); // Create PC as receiver
    
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    wsRef.current?.send(JSON.stringify({
      event: 'answer',
      data: { targetUserId: senderUserId, sdp: answer }
    }));
  };

  const handleAnswer = async (data: any) => {
    const { senderUserId, sdp } = data;
    const peer = peersRef.current.get(senderUserId);
    if (peer) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  };

  const handleCandidate = async (data: any) => {
    const { senderUserId, candidate } = data;
    const peer = peersRef.current.get(senderUserId);
    if (peer) {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleUserLeft = (userId: string) => {
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.pc.close();
      peersRef.current.delete(userId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }
  };

  return {
    localStream,
    remoteStreams,
    isConnected
  };
}