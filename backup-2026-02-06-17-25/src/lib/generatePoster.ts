export async function generatePoster(
  file: File,
  seekTo = 0.5,
  type: string = 'image/webp',
  quality = 0.9
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  (video as HTMLVideoElement & { crossOrigin: string }).crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('video metadata load failed'));
  });

  const t = Math.min(Math.max(seekTo, 0), Math.max(0, video.duration - 0.1));
  video.currentTime = t;

  await new Promise<void>((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('seek failed'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context failed');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('poster encode failed'))), type, quality);
  });

  URL.revokeObjectURL(url);
  return blob;
}

