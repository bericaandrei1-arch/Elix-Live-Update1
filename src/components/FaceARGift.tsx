import React, { useEffect, useRef, useState, useCallback } from 'react';

interface FaceARGiftProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  giftType: 'crown' | 'glasses' | 'mask' | 'ears' | 'hearts' | 'stars';
  intensity?: number;
  color?: string;
  isActive: boolean;
  onFaceDetected?: (hasFace: boolean) => void;
}

interface FaceLandmarks {
  landmarks: Array<[number, number, number]>;
  width: number;
  height: number;
}

export const FaceARGift: React.FC<FaceARGiftProps> = ({
  videoElement,
  canvasElement,
  giftType,
  intensity = 1.0,
  color = '#FFD700',
  isActive,
  onFaceDetected
}) => {
  const faceMeshRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const drawARGift = useCallback((ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    ctx.save();
    ctx.globalAlpha = intensity;

    switch (giftType) {
      case 'crown':
        drawCrown(ctx, landmarks, width, height);
        break;
      case 'glasses':
        drawGlasses(ctx, landmarks, width, height);
        break;
      case 'mask':
        drawMask(ctx, landmarks, width, height);
        break;
      case 'ears':
        drawAnimalEars(ctx, landmarks, width, height);
        break;
      case 'hearts':
        drawFloatingHearts(ctx, landmarks, width, height);
        break;
      case 'stars':
        drawSparklingStars(ctx, landmarks, width, height);
        break;
    }

    ctx.restore();
  }, [giftType, intensity, color]);

  // Initialize Face Mesh
  const initializeFaceMesh = useCallback(async () => {
    if (!videoElement || !canvasElement) return;

    try {
      // Load MediaPipe Face Mesh from CDN (no camera_utils; we use the existing <video> stream)
      // @ts-ignore - MediaPipe will be available globally
      if (!window.FaceMesh) {
        const scriptSrc = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js';
        const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
        const script = existing ?? document.createElement('script');
        if (!existing) {
          script.src = scriptSrc;
          script.async = true;
          document.head.appendChild(script);
        }
        await new Promise<void>((resolve, reject) => {
          if ((script as any).dataset?.loaded === '1') {
            resolve();
            return;
          }
          script.onload = () => {
            (script as any).dataset.loaded = '1';
            resolve();
          };
          script.onerror = () => reject(new Error('Failed to load MediaPipe face_mesh'));
        });
      }

      // @ts-ignore - MediaPipe will be available globally
      const FaceMesh = window.FaceMesh;

      if (!FaceMesh) {
        throw new Error('MediaPipe not loaded');
      }

      // Handle face detection results
      const onResults = (results: any) => {
        if (!canvasElement || !isActive) return;

        const canvasCtx = canvasElement.getContext('2d');
        if (!canvasCtx) return;

        // Clear canvas
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          setFaceLandmarks({
            landmarks: landmarks.map((point: any) => [point.x, point.y, point.z]),
            width: canvasElement.width,
            height: canvasElement.height,
          });
          onFaceDetected?.(true);

          // Draw the AR gift overlay
          drawARGift(canvasCtx, landmarks, canvasElement.width, canvasElement.height);
        } else {
          setFaceLandmarks(null);
          onFaceDetected?.(false);
        }
      };

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;
      
      try {
        setIsTracking(true);
        const processFrame = async () => {
          if (!isActive) return;
          const mesh = faceMeshRef.current;
          if (!mesh) return;
          if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
            animationFrameRef.current = window.requestAnimationFrame(processFrame);
            return;
          }
          try {
            await mesh.send({ image: videoElement });
          } catch {
          }
          animationFrameRef.current = window.requestAnimationFrame(processFrame);
        };
        animationFrameRef.current = window.requestAnimationFrame(processFrame);
      } catch (error) {
        console.error('Failed to start camera for face tracking:', error);
        setIsTracking(false);
      }
    } catch (error) {
      console.error('Failed to load MediaPipe modules:', error);
      setIsTracking(false);
    }
  }, [canvasElement, drawARGift, isActive, onFaceDetected, videoElement]);

  // Draw crown on forehead
  const drawCrown = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const forehead = landmarks[10]; // Forehead point
    const leftTemple = landmarks[234]; // Left temple
    const rightTemple = landmarks[454]; // Right temple

    if (!forehead || !leftTemple || !rightTemple) return;

    const centerX = forehead.x * width;
    const centerY = forehead.y * height;
    const leftX = leftTemple.x * width;
    const rightX = rightTemple.x * width;
    const crownWidth = Math.abs(rightX - leftX) * 1.2;

    // Draw crown base
    ctx.fillStyle = color;
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(centerX - crownWidth / 2, centerY);
    
    // Crown peaks
    for (let i = 0; i < 5; i++) {
      const x = centerX - crownWidth / 2 + (crownWidth / 4) * i;
      const peakHeight = i % 2 === 0 ? 20 : 15;
      ctx.lineTo(x, centerY - peakHeight);
      ctx.lineTo(x + crownWidth / 8, centerY);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Add crown jewels
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < 3; i++) {
      const x = centerX - crownWidth / 3 + (crownWidth / 3) * i;
      const y = centerY - 10;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Draw glasses on eyes
  const drawGlasses = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const leftEye = landmarks[33]; // Left eye outer corner
    const rightEye = landmarks[263]; // Right eye outer corner
    const leftEyeInner = landmarks[133]; // Left eye inner corner
    const rightEyeInner = landmarks[362]; // Right eye inner corner

    if (!leftEye || !rightEye || !leftEyeInner || !rightEyeInner) return;

    const eyeHeight = 20;
    const lensWidth = Math.abs(leftEyeInner.x * width - leftEye.x * width) + 10;
    const lensHeight = eyeHeight;

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

    // Left lens
    const leftCenterX = (leftEye.x + leftEyeInner.x) / 2 * width;
    const leftCenterY = (leftEye.y + leftEyeInner.y) / 2 * height;
    ctx.beginPath();
    ctx.ellipse(leftCenterX, leftCenterY, lensWidth / 2, lensHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Right lens
    const rightCenterX = (rightEye.x + rightEyeInner.x) / 2 * width;
    const rightCenterY = (rightEye.y + rightEyeInner.y) / 2 * height;
    ctx.beginPath();
    ctx.ellipse(rightCenterX, rightCenterY, lensWidth / 2, lensHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(leftCenterX + lensWidth / 2, leftCenterY);
    ctx.lineTo(rightCenterX - lensWidth / 2, rightCenterY);
    ctx.stroke();
  };

  // Draw mask on lower face
  const drawMask = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const noseTip = landmarks[1]; // Nose tip
    const chin = landmarks[152]; // Chin
    const leftCheek = landmarks[234]; // Left cheek
    const rightCheek = landmarks[454]; // Right cheek

    if (!noseTip || !chin || !leftCheek || !rightCheek) return;

    const centerX = noseTip.x * width;
    const topY = noseTip.y * height;
    const bottomY = chin.y * height;
    const leftX = leftCheek.x * width;
    const rightX = rightCheek.x * width;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(centerX, (topY + bottomY) / 2, (rightX - leftX) / 2, (bottomY - topY) / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  // Draw animal ears
  const drawAnimalEars = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const leftEar = landmarks[234]; // Left temple area
    const rightEar = landmarks[454]; // Right temple area
    const forehead = landmarks[10]; // Forehead

    if (!leftEar || !rightEar || !forehead) return;

    const earSize = 30;
    const earHeight = 40;

    // Left ear
    const leftX = leftEar.x * width - earSize / 2;
    const leftY = leftEar.y * height - earHeight;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(leftX, leftY, earSize / 2, earHeight / 2, -0.3, 0, 2 * Math.PI);
    ctx.fill();

    // Right ear
    const rightX = rightEar.x * width + earSize / 2;
    const rightY = rightEar.y * height - earHeight;
    
    ctx.beginPath();
    ctx.ellipse(rightX, rightY, earSize / 2, earHeight / 2, 0.3, 0, 2 * Math.PI);
    ctx.fill();
  };

  // Draw floating hearts
  const drawFloatingHearts = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const noseTip = landmarks[1]; // Nose tip
    const time = Date.now() / 1000;

    if (!noseTip) return;

    const centerX = noseTip.x * width;
    const centerY = noseTip.y * height;

    for (let i = 0; i < 5; i++) {
      const offsetX = Math.sin(time + i) * 20;
      const offsetY = Math.cos(time + i * 0.5) * 15;
      const heartX = centerX + offsetX;
      const heartY = centerY - 30 + offsetY;
      const heartSize = 8 + Math.sin(time * 2 + i) * 2;

      ctx.fillStyle = '#FF69B4';
      drawHeart(ctx, heartX, heartY, heartSize);
    }
  };

  // Draw sparkling stars
  const drawSparklingStars = (ctx: CanvasRenderingContext2D, landmarks: Array<{x: number, y: number, z: number}>, width: number, height: number) => {
    const forehead = landmarks[10]; // Forehead
    const time = Date.now() / 1000;

    if (!forehead) return;

    const centerX = forehead.x * width;
    const centerY = forehead.y * height;

    for (let i = 0; i < 8; i++) {
      const angle = (time + i * 0.8) % (2 * Math.PI);
      const radius = 40 + Math.sin(time * 3 + i) * 10;
      const starX = centerX + Math.cos(angle) * radius;
      const starY = centerY - 20 + Math.sin(angle) * radius * 0.5;
      const starSize = 4 + Math.sin(time * 4 + i) * 2;

      ctx.fillStyle = '#FFD700';
      drawStar(ctx, starX, starY, 5, starSize, starSize * 0.5);
    }
  };

  // Helper function to draw heart
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  };

  // Helper function to draw star
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
    }
    setIsTracking(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (isActive && videoElement && canvasElement) {
      initializeFaceMesh();
    }

    return cleanup;
  }, [isActive, videoElement, canvasElement, initializeFaceMesh, cleanup]);

  // Handle canvas resize
  useEffect(() => {
    if (canvasElement && videoElement) {
      const resizeCanvas = () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      };

      videoElement.addEventListener('loadedmetadata', resizeCanvas);
      resizeCanvas();

      return () => {
        videoElement.removeEventListener('loadedmetadata', resizeCanvas);
      };
    }
  }, [canvasElement, videoElement]);

  return (
    null
  );
};

export default FaceARGift;
