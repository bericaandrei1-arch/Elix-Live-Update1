
import { supabase } from './supabase';
import { trackEvent } from './analytics';

export interface UploadProgress {
  stage: 'validating' | 'compressing' | 'uploading' | 'processing' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
}

// Configuration
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DURATION = 180; // 3 minutes (in seconds)
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm'];

export class VideoUploadService {
  private onProgressCallback: ((progress: UploadProgress) => void) | null = null;

  /**
   * Register callback for upload progress updates
   */
  onProgress(callback: (progress: UploadProgress) => void) {
    this.onProgressCallback = callback;
  }

  private updateProgress(stage: UploadProgress['stage'], progress: number, message: string) {
    if (this.onProgressCallback) {
      this.onProgressCallback({ stage, progress, message });
    }
  }

  /**
   * Validate video file before upload
   */
  async validateVideo(file: File): Promise<VideoMetadata> {
    this.updateProgress('validating', 10, 'Validating video...');

    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      throw new Error(`Invalid format. Allowed: ${ALLOWED_FORMATS.join(', ')}`);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Get video metadata
    const metadata = await this.getVideoMetadata(file);

    // Check duration
    if (metadata.duration > MAX_DURATION) {
      throw new Error(`Video too long. Maximum: ${MAX_DURATION} seconds`);
    }

    this.updateProgress('validating', 30, 'Validation complete');
    return metadata;
  }

  /**
   * Get video metadata using browser API
   */
  private getVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          format: file.type,
        });
      };

      video.onerror = () => {
        reject(new Error('Failed to read video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload video to storage
   */
  async uploadVideo(
    file: File,
    userId: string,
    metadata: { description: string; hashtags: string[]; isPrivate: boolean }
  ): Promise<string> {
    try {
      // Validate
      const videoMeta = await this.validateVideo(file);

      this.updateProgress('uploading', 40, 'Uploading video...');

      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'mp4';
      // Use 'videos/' prefix for folder organization in the single bucket
      const fileName = `videos/${userId}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage ('user-content' bucket)
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      this.updateProgress('uploading', 70, 'Upload complete');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-content')
        .getPublicUrl(fileName);

      this.updateProgress('processing', 80, 'Creating video record...');

      // Generate and upload thumbnail
      const thumbnailUrl = await this.generateThumbnail(file, userId);

      // Create video record in database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          url: publicUrl, // Matches schema 'url'
          thumbnail_url: thumbnailUrl, // Matches schema 'thumbnail_url'
          caption: metadata.description, // Matches schema 'caption'
          // Note: 'views', 'likes' default to 0
          // Note: 'created_at' defaults to now()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add hashtags
      if (metadata.hashtags.length > 0) {
        await this.addHashtags(videoData.id, metadata.hashtags);
      }

      this.updateProgress('complete', 100, 'Video uploaded successfully!');

      trackEvent('video_upload', {
        video_id: videoData.id,
        duration: videoMeta.duration,
        size_mb: (file.size / 1024 / 1024).toFixed(2),
      });

      return videoData.id;
    } catch (error) {
      console.error('Upload failed:', error);
      trackEvent('video_upload_failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(file: File, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2); // 1 second or halfway
      };

      video.onseeked = async () => {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(async blob => {
            if (!blob) {
              reject(new Error('Failed to generate thumbnail'));
              return;
            }

            // Upload thumbnail to 'user-content' bucket with 'thumbnails/' prefix
            const fileName = `thumbnails/${userId}/${Date.now()}_thumb.jpg`;
            const { error } = await supabase.storage
              .from('user-content')
              .upload(fileName, blob);

            if (error) {
              console.warn('Thumbnail upload failed, using placeholder', error);
              resolve('https://picsum.photos/400/600'); // Fallback
              return;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('user-content')
              .getPublicUrl(fileName);

            resolve(publicUrl);
          }, 'image/jpeg', 0.85);
        } catch (error) {
          console.warn('Thumbnail generation failed', error);
          resolve('https://picsum.photos/400/600');
        }
      };

      video.onerror = () => {
        console.warn('Video load for thumbnail failed');
        resolve('https://picsum.photos/400/600');
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Add hashtags to video
   */
  private async addHashtags(videoId: string, hashtags: string[]) {
    // Clean and normalize hashtags
    const cleanTags = [...new Set(hashtags.map(tag => tag.toLowerCase().replace(/[^a-z0-9_]/g, '')))].filter(t => t.length > 0);

    for (const tag of cleanTags) {
      let hashtagId: string | null = null;

      // 1. Try to find existing hashtag
      const { data: existingTag } = await supabase
        .from('hashtags')
        .select('id, use_count')
        .eq('tag', tag)
        .single();

      if (existingTag) {
        hashtagId = existingTag.id;
        // Increment use count
        await supabase
            .from('hashtags')
            .update({ use_count: (existingTag.use_count || 0) + 1 })
            .eq('id', hashtagId);
      } else {
        // 2. Create new hashtag
        const { data: newTag, error } = await supabase
          .from('hashtags')
          .insert({ tag, use_count: 1 })
          .select('id')
          .single();
        
        if (newTag) {
          hashtagId = newTag.id;
        } else if (error) {
             // Handle race condition where tag might have been created by another user in between
             const { data: retryTag } = await supabase.from('hashtags').select('id').eq('tag', tag).single();
             if (retryTag) hashtagId = retryTag.id;
        }
      }

      // 3. Link video to hashtag
      if (hashtagId) {
        await supabase
            .from('video_hashtags')
            .insert({ video_id: videoId, hashtag_id: hashtagId });
      }
    }
  }
}

export const videoUploadService = new VideoUploadService();
