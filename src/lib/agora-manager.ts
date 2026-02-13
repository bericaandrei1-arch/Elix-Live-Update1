
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

// Use environment variables for configuration
const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
// In a real production app, token should be fetched from backend. 
// For this integration, we will support both direct token (if provided via props/API) or null (for testing mode with AppCertificate disabled).
// NOTE: If your project has App Certificate enabled in Agora Console, you MUST use a token.

export interface AgoraContextType {
  client: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  joinChannel: (channel: string, uid: string | number, token?: string | null) => Promise<void>;
  leaveChannel: () => Promise<void>;
  publishTracks: () => Promise<void>;
  unpublishTracks: () => Promise<void>;
  toggleAudio: (enabled: boolean) => Promise<void>;
  toggleVideo: (enabled: boolean) => Promise<void>;
  remoteUsers: UID[];
}

class AgoraManager {
  public client: IAgoraRTCClient;
  public localAudioTrack: IMicrophoneAudioTrack | null = null;
  public localVideoTrack: ICameraVideoTrack | null = null;

  constructor() {
    if (!APP_ID) {
      console.error('Agora App ID is missing in .env');
    }
    this.client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
  }

  async joinChannel(
    channelName: string,
    uid: string | number,
    role: 'host' | 'audience',
    token: string | null = null
  ) {
    if (!APP_ID) throw new Error('Agora App ID missing');

    // If already joined/connected to this channel, do nothing or rejoin
    if (this.client.connectionState === 'CONNECTED' || this.client.connectionState === 'CONNECTING') {
      console.warn('Agora client is already connected. Leaving first...');
      await this.leave();
    }

    await this.client.setClientRole(role);

    // If token is null/undefined, SDK treats it as testing mode (App ID only)
    try {
      await this.client.join(APP_ID, channelName, token, uid);
    } catch (e: any) {
      if (e.code === 'CAN_NOT_GET_GATEWAY_SERVER' || e.message?.includes('dynamic use static key')) {
        console.warn('Certificate enabled but no token provided. Retrying with App ID only mode if possible...');
        // Sometimes clearing session helps, but fundamentally this requires Console change.
      }
      throw e;
    }

    if (role === 'host') {
      await this.createLocalTracks();
      await this.publish();
    }
  }

  async createLocalTracks() {
    // Check if tracks already exist to prevent duplicate track creation
    if (this.localAudioTrack || this.localVideoTrack) {
        // Close existing tracks first
        if (this.localAudioTrack) {
            this.localAudioTrack.close();
            this.localAudioTrack = null;
        }
        if (this.localVideoTrack) {
            this.localVideoTrack.close();
            this.localVideoTrack = null;
        }
    }

    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
      { encoderConfig: 'music_standard' },
      { encoderConfig: '720p_1' }
    );
    this.localAudioTrack = audioTrack;
    this.localVideoTrack = videoTrack;
    return { audioTrack, videoTrack };
  }

  async publish() {
    if (this.localAudioTrack && this.localVideoTrack) {
      const localTracks = [this.localAudioTrack, this.localVideoTrack];
      
      // Ensure we are connected before publishing
      if (this.client.connectionState !== 'CONNECTED') {
          console.warn('Cannot publish: Client not connected');
          return;
      }

      try {
        await this.client.publish(localTracks);
      } catch (err) {
        // Ignore "already publishing" errors
        console.warn('Publish failed (likely already published):', err);
      }
    }
  }

  async unpublish() {
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    if (this.localVideoTrack) {
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }
    // Only unpublish if client is connected/connected
    if (this.client.connectionState === 'CONNECTED') {
       try {
         await this.client.unpublish();
       } catch (err) {
         console.warn('Unpublish failed:', err);
       }
    }
  }

  async leave() {
    await this.unpublish();
    if (this.client.connectionState !== 'DISCONNECTED') {
       await this.client.leave();
    }
  }
}

export const agoraManager = new AgoraManager();
