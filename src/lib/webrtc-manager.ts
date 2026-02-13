type Listener = (...args: any[]) => void;

class SimpleEventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, callback: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Listener) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(cb => cb(...args));
  }
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export type WebRTCSignalData = {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  senderUserId: string;
};

export class WebRTCManager extends SimpleEventEmitter {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private socket: WebSocket | null = null;
  private userId: string | null = null;

  constructor(config?: WebRTCConfig) {
    super();
    this.config = config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
  }

  setSocket(socket: WebSocket, userId: string) {
    this.socket = socket;
    this.userId = userId;
  }

  async startLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      return this.localStream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      throw err;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Called when we receive a signal from signaling server
  async handleSignal(type: string, data: any) {
    const { senderUserId, sdp, candidate } = data;
    if (!this.socket || !this.userId) return;

    if (type === 'webrtc_offer') {
      await this.handleOffer(senderUserId, sdp);
    } else if (type === 'webrtc_answer') {
      await this.handleAnswer(senderUserId, sdp);
    } else if (type === 'webrtc_ice_candidate') {
      await this.handleCandidate(senderUserId, candidate);
    }
  }

  // Initiate connection to a peer (Mesh)
  async connectToPeer(targetUserId: string) {
    if (this.peers.has(targetUserId)) return;
    const pc = this.createPeerConnection(targetUserId);
    
    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
           pc.addTrack(track, this.localStream);
        }
      });
    }

    // Create Offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.sendSignal('webrtc_offer', {
        targetUserId,
        sdp: offer
      });
    } catch (e) {
      console.error("Error creating offer:", e);
    }
  }

  private createPeerConnection(remoteUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.config);
    this.peers.set(remoteUserId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('webrtc_ice_candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      this.emit('track', { userId: remoteUserId, streams: event.streams, track: event.track });
    };

    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            this.peers.delete(remoteUserId);
            this.emit('peer_disconnected', remoteUserId);
        }
    };

    return pc;
  }

  private async handleOffer(senderUserId: string, sdp: RTCSessionDescriptionInit) {
    // If we are already connected, ignore or renegotiate (simple ignore for MVP)
    let pc = this.peers.get(senderUserId);
    if (!pc) {
      pc = this.createPeerConnection(senderUserId);
    }

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Add local tracks if not already added (Mesh)
        if (this.localStream) {
           this.localStream.getTracks().forEach(track => {
             // Check if track already added? RTCPeerConnection handles this gracefully usually
             if (this.localStream) {
                // simple check
                const senders = pc!.getSenders();
                const alreadyAdded = senders.some(s => s.track?.id === track.id);
                if (!alreadyAdded) {
                   pc!.addTrack(track, this.localStream);
                }
             }
           });
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignal('webrtc_answer', {
          targetUserId: senderUserId,
          sdp: answer
        });
    } catch (e) {
        console.error("Error handling offer:", e);
    }
  }

  private async handleAnswer(senderUserId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(senderUserId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleCandidate(senderUserId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(senderUserId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private sendSignal(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        event: type,
        data: payload
      }));
    }
  }
  
  close() {
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.stopLocalStream();
  }
}

export const webrtcManager = new WebRTCManager();
