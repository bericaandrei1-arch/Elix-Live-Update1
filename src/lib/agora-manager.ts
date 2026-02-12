
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

    await this.client.setClientRole(role);

    // If token is null/undefined, SDK treats it as testing mode (App ID only)
    await this.client.join(APP_ID, channelName, token, uid);

    if (role === 'host') {
      await this.createLocalTracks();
      await this.publish();
    }
  }

  async createLocalTracks() {
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
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
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
    await this.client.unpublish();
  }

  async leave() {
    await this.unpublish();
    await this.client.leave();
  }
}

export const agoraManager = new AgoraManager();
