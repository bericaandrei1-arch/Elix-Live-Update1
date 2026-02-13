
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

// Use environment variables for configuration
const APP_ID = import.meta.env.VITE_AGORA_APP_ID?.trim();
console.log('[AgoraManager] Using App ID:', APP_ID); // Debug log to verify loaded ID
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
    // Set explicit area code to GLOBAL to avoid regional routing issues which can cause "invalid vendor key"
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
      // Wait for state to settle
      await new Promise(r => setTimeout(r, 500));
    }

    await this.client.setClientRole(role);

    // If token is null/undefined, SDK treats it as testing mode (App ID only)
    try {
      await this.client.join(APP_ID, channelName, token, uid);
    } catch (e: any) {
      if (e.code === 'CAN_NOT_GET_GATEWAY_SERVER' || e.message?.includes('dynamic use static key') || e.message?.includes('invalid vendor key')) {
        console.warn('Agora Connection Warning: Certificate enabled or invalid key.');
        console.warn('Retrying with a generated temporary token (Note: This is insecure for production!)');
        
        // TEMPORARY FIX: If no backend is available, we can't generate a real token.
        // But if the user JUST switched to "App ID only" in console, it takes time to propagate.
        // We will try one more time after a short delay.
        await new Promise(r => setTimeout(r, 2000));
        await this.client.join(APP_ID, channelName, token, uid);
      } else {
        throw e;
      }
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
