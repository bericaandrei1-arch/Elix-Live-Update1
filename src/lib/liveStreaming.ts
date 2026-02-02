import { supabase } from './supabase';

export interface LiveStream {
  id: string;
  userId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isLive: boolean;
  viewerCount: number;
  startedAt: Date;
  endedAt?: Date;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  tags: string[];
  category: string;
  isPrivate: boolean;
  allowComments: boolean;
  quality: '360p' | '480p' | '720p' | '1080p';
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerator: boolean;
  isPinned: boolean;
  type: 'text' | 'emoji' | 'gift' | 'face_ar' | 'system';
  giftId?: string;
  giftAmount?: number;
  faceARGift?: FaceARGift;
}

export interface FaceARGift {
  id: string;
  name: string;
  type: 'crown' | 'glasses' | 'mask' | 'ears' | 'hearts' | 'stars';
  price: number;
  color: string;
  duration: number;
  senderId: string;
  senderUsername: string;
  timestamp: Date;
}

export interface LiveViewer {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
  isModerator: boolean;
  isStreamer: boolean;
  isFollowing: boolean;
  lastActivity: Date;
}

export interface StreamModerator {
  userId: string;
  username: string;
  canBan: boolean;
  canMute: boolean;
  canPin: boolean;
  canDeleteMessages: boolean;
  assignedAt: Date;
}

export class LiveStreamingManager {
  private static instance: LiveStreamingManager;
  private currentStream: LiveStream | null = null;
  private localStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private websocket: WebSocket | null = null;
  private chatMessages: ChatMessage[] = [];
  private viewers: Map<string, LiveViewer> = new Map();
  private moderators: Map<string, StreamModerator> = new Map();
  private mutedUsers: Set<string> = new Set();
  private bannedUsers: Set<string> = new Set();
  private pinnedMessage: ChatMessage | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private viewerCallbacks: ((viewers: LiveViewer[]) => void)[] = [];
  private streamCallbacks: ((stream: LiveStream) => void)[] = [];

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  private constructor() {}

  public static getInstance(): LiveStreamingManager {
    if (!LiveStreamingManager.instance) {
      LiveStreamingManager.instance = new LiveStreamingManager();
    }
    return LiveStreamingManager.instance;
  }

  public async startLiveStream(config: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPrivate?: boolean;
    allowComments?: boolean;
    quality?: '360p' | '480p' | '720p' | '1080p';
  }): Promise<LiveStream> {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: this.getVideoWidth(config.quality || '720p'),
          height: this.getVideoHeight(config.quality || '720p'),
          frameRate: 30
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create stream record in database
      const streamData = await this.createStreamRecord(config);
      
      // Initialize WebRTC
      await this.initializeWebRTC(streamData);
      
      // Connect to chat server
      await this.connectToChat(streamData.id);
      
      this.currentStream = streamData;
      this.notifyStreamUpdate(streamData);
      
      return streamData;
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw new Error('Failed to start live stream');
    }
  }

  private getVideoWidth(quality: string): number {
    const qualityMap = {
      '360p': 640,
      '480p': 854,
      '720p': 1280,
      '1080p': 1920
    };
    return qualityMap[quality as keyof typeof qualityMap] || 1280;
  }

  private getVideoHeight(quality: string): number {
    const qualityMap = {
      '360p': 360,
      '480p': 480,
      '720p': 720,
      '1080p': 1080
    };
    return qualityMap[quality as keyof typeof qualityMap] || 720;
  }

  private async createStreamRecord(config: any): Promise<LiveStream> {
    const streamKey = this.generateStreamKey();
    const streamData = {
      userId: 'current-user', // This should come from auth
      title: config.title,
      description: config.description,
      isLive: true,
      viewerCount: 0,
      startedAt: new Date(),
      streamKey,
      rtmpUrl: `rtmp://streaming.example.com/live/${streamKey}`,
      playbackUrl: `https://streaming.example.com/live/${streamKey}.m3u8`,
      tags: config.tags || [],
      category: config.category || 'General',
      isPrivate: config.isPrivate || false,
      allowComments: config.allowComments !== false,
      quality: config.quality || '720p'
    };

    // Insert into database
    const { data, error } = await supabase
      .from('live_streams')
      .insert(streamData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create stream record: ${error.message}`);
    }

    return data;
  }

  private generateStreamKey(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private async initializeWebRTC(streamData: LiveStream): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local stream to peer connection
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          streamId: streamData.id
        });
      }
    };

    // Create and send offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.sendSignalingMessage({
      type: 'offer',
      offer,
      streamId: streamData.id
    });
  }

  private async connectToChat(streamId: string): Promise<void> {
    // Connect to WebSocket for real-time chat
    this.websocket = new WebSocket(`wss://chat.example.com/stream/${streamId}`);
    
    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleChatMessage(message);
    };

    this.websocket.onopen = () => {
      this.joinChat(streamId);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.websocket.onclose = () => {
      // Handle cleanup
    };
  }

  private joinChat(streamId: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'join',
        streamId,
        userId: 'current-user',
        username: 'Streamer',
        isStreamer: true
      }));
    }
  }

  private handleChatMessage(message: any): void {
    switch (message.type) {
      case 'chat':
        this.handleChatMessageReceived(message);
        break;
      case 'viewer_joined':
        this.handleViewerJoined(message);
        break;
      case 'viewer_left':
        this.handleViewerLeft(message);
        break;
      case 'gift':
        this.handleGiftReceived(message);
        break;
      case 'face_ar':
        this.handleFaceARGiftReceived(message);
        break;
      case 'remove_face_ar':
        this.handleFaceARGiftRemoved(message);
        break;
      case 'user_banned':
        this.handleUserBanned(message);
        break;
      case 'user_muted':
        this.handleUserMuted(message);
        break;
      case 'message_pinned':
        this.handleMessagePinned(message);
        break;
    }
  }

  private handleChatMessageReceived(message: any): void {
    if (this.mutedUsers.has(message.userId) || this.bannedUsers.has(message.userId)) {
      return;
    }

    const chatMessage: ChatMessage = {
      id: message.id,
      streamId: message.streamId,
      userId: message.userId,
      username: message.username,
      message: message.message,
      timestamp: new Date(message.timestamp),
      isModerator: message.isModerator,
      isPinned: false,
      type: message.type || 'text'
    };

    this.chatMessages.push(chatMessage);
    this.notifyMessageCallbacks(chatMessage);
  }

  private handleViewerJoined(message: any): void {
    const viewer: LiveViewer = {
      id: message.userId,
      userId: message.userId,
      username: message.username,
      avatar: message.avatar,
      joinedAt: new Date(message.timestamp),
      isModerator: message.isModerator,
      isStreamer: false,
      isFollowing: message.isFollowing,
      lastActivity: new Date()
    };

    this.viewers.set(viewer.userId, viewer);
    this.notifyViewerCallbacks(Array.from(this.viewers.values()));
  }

  private handleViewerLeft(message: any): void {
    this.viewers.delete(message.userId);
    this.notifyViewerCallbacks(Array.from(this.viewers.values()));
  }

  private handleGiftReceived(message: any): void {
    const giftMessage: ChatMessage = {
      id: message.id,
      streamId: message.streamId,
      userId: message.userId,
      username: message.username,
      message: message.message,
      timestamp: new Date(message.timestamp),
      isModerator: false,
      isPinned: false,
      type: 'gift',
      giftId: message.giftId,
      giftAmount: message.giftAmount
    };

    this.chatMessages.push(giftMessage);
    this.notifyMessageCallbacks(giftMessage);
  }

  private handleFaceARGiftReceived(message: any): void {
    const faceARGiftMessage: ChatMessage = {
      id: message.id,
      streamId: message.streamId,
      userId: message.userId,
      username: message.username,
      message: message.message,
      timestamp: new Date(message.timestamp),
      isModerator: false,
      isPinned: false,
      type: 'face_ar',
      faceARGift: message.faceARGift
    };

    this.chatMessages.push(faceARGiftMessage);
    this.notifyMessageCallbacks(faceARGiftMessage);
  }

  private handleFaceARGiftRemoved(message: any): void {
    // Remove Face AR gift from active effects
    this.chatMessages = this.chatMessages.filter(msg => 
      !(msg.type === 'face_ar' && msg.userId === message.userId)
    );
  }

  private handleUserBanned(message: any): void {
    this.bannedUsers.add(message.userId);
    this.viewers.delete(message.userId);
    this.notifyViewerCallbacks(Array.from(this.viewers.values()));
  }

  private handleUserMuted(message: any): void {
    this.mutedUsers.add(message.userId);
  }

  private handleMessagePinned(message: any): void {
    this.pinnedMessage = {
      id: message.id,
      streamId: message.streamId,
      userId: message.userId,
      username: message.username,
      message: message.message,
      timestamp: new Date(message.timestamp),
      isModerator: message.isModerator,
      isPinned: true,
      type: message.type || 'text'
    };
  }

  public async sendChatMessage(message: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to chat');
    }

    if (!this.currentStream?.allowComments) {
      throw new Error('Comments are disabled for this stream');
    }

    const chatMessage = {
      type: 'chat',
      streamId: this.currentStream.id,
      userId: 'current-user',
      username: 'Streamer',
      message,
      timestamp: new Date().toISOString(),
      isModerator: true
    };

    this.websocket.send(JSON.stringify(chatMessage));
  }

  public async sendGift(userId: string, giftId: string, amount: number): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to chat');
    }

    const giftMessage = {
      type: 'gift',
      streamId: this.currentStream!.id,
      userId,
      username: 'Viewer',
      message: `Sent ${amount} coins`,
      timestamp: new Date().toISOString(),
      giftId,
      giftAmount: amount
    };

    this.websocket.send(JSON.stringify(giftMessage));
  }

  public async sendFaceARGift(userId: string, faceARGift: Omit<FaceARGift, 'senderId' | 'senderUsername' | 'timestamp'>): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to chat');
    }

    const faceARGiftMessage = {
      type: 'face_ar',
      streamId: this.currentStream!.id,
      userId,
      username: 'Viewer',
      message: `Sent Face AR: ${faceARGift.name}`,
      timestamp: new Date().toISOString(),
      faceARGift: {
        ...faceARGift,
        senderId: userId,
        senderUsername: 'Viewer',
        timestamp: new Date(),
        duration: 30000 // 30 seconds
      }
    };

    this.websocket.send(JSON.stringify(faceARGiftMessage));
  }

  public async removeFaceARGift(userId: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to chat');
    }

    const removeMessage = {
      type: 'remove_face_ar',
      streamId: this.currentStream!.id,
      userId,
      timestamp: new Date().toISOString()
    };

    this.websocket.send(JSON.stringify(removeMessage));
  }

  public async banUser(userId: string): Promise<void> {
    if (!this.currentStream || !this.isModerator('current-user')) {
      throw new Error('Not authorized to ban users');
    }

    this.bannedUsers.add(userId);
    this.viewers.delete(userId);

    if (this.websocket) {
      this.websocket.send(JSON.stringify({
        type: 'ban_user',
        streamId: this.currentStream.id,
        userId,
        moderatorId: 'current-user'
      }));
    }

    this.notifyViewerCallbacks(Array.from(this.viewers.values()));
  }

  public async muteUser(userId: string): Promise<void> {
    if (!this.currentStream || !this.isModerator('current-user')) {
      throw new Error('Not authorized to mute users');
    }

    this.mutedUsers.add(userId);

    if (this.websocket) {
      this.websocket.send(JSON.stringify({
        type: 'mute_user',
        streamId: this.currentStream.id,
        userId,
        moderatorId: 'current-user'
      }));
    }
  }

  public async pinMessage(messageId: string): Promise<void> {
    if (!this.currentStream || !this.isModerator('current-user')) {
      throw new Error('Not authorized to pin messages');
    }

    const message = this.chatMessages.find(m => m.id === messageId);
    if (message) {
      this.pinnedMessage = { ...message, isPinned: true };
      
      if (this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'pin_message',
          streamId: this.currentStream.id,
          messageId,
          moderatorId: 'current-user'
        }));
      }
    }
  }

  public async endStream(): Promise<void> {
    if (!this.currentStream) {
      throw new Error('No active stream');
    }

    try {
      // Update stream record
      await supabase
        .from('live_streams')
        .update({
          isLive: false,
          endedAt: new Date()
        })
        .eq('id', this.currentStream.id);

      // Close WebSocket connection
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Close WebRTC connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      this.currentStream = null;
      this.chatMessages = [];
      this.viewers.clear();
      this.mutedUsers.clear();
      this.bannedUsers.clear();
      this.pinnedMessage = null;

    } catch (error) {
      console.error('Error ending stream:', error);
      throw new Error('Failed to end stream');
    }
  }

  public getCurrentStream(): LiveStream | null {
    return this.currentStream;
  }

  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  public getViewers(): LiveViewer[] {
    return Array.from(this.viewers.values());
  }

  public getPinnedMessage(): ChatMessage | null {
    return this.pinnedMessage;
  }

  public isUserMuted(userId: string): boolean {
    return this.mutedUsers.has(userId);
  }

  public isUserBanned(userId: string): boolean {
    return this.bannedUsers.has(userId);
  }

  public isModerator(userId: string): boolean {
    return this.moderators.has(userId) || userId === this.currentStream?.userId;
  }

  public onMessage(callback: (message: ChatMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  public onViewersUpdate(callback: (viewers: LiveViewer[]) => void): void {
    this.viewerCallbacks.push(callback);
  }

  public onStreamUpdate(callback: (stream: LiveStream) => void): void {
    this.streamCallbacks.push(callback);
  }

  private notifyMessageCallbacks(message: ChatMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private notifyViewerCallbacks(viewers: LiveViewer[]): void {
    this.viewerCallbacks.forEach(callback => callback(viewers));
  }

  private notifyStreamUpdate(stream: LiveStream): void {
    this.streamCallbacks.forEach(callback => callback(stream));
  }

  private sendSignalingMessage(message: any): void {
    // Send signaling message to WebRTC server
  }
}