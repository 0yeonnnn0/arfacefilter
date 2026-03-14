/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FaceMeshResults {
  multiFaceLandmarks: NormalizedLandmark[][];
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
}

export interface FaceMeshInstance {
  setOptions(options: Record<string, any>): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

export async function initFaceMesh(
  onResults: (results: FaceMeshResults) => void
): Promise<FaceMeshInstance> {
  await loadScript(
    'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
  );

  const win = window as any;
  const FaceMesh = win.FaceMesh;
  if (!FaceMesh) throw new Error('FaceMesh not loaded from CDN');

  const faceMesh = new FaceMesh({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });

  faceMesh.onResults(onResults);
  return faceMesh as FaceMeshInstance;
}

/** Crop face region from video into a canvas texture */
export function captureFaceTexture(
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Get face bounding box from landmarks
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x);
    minY = Math.min(minY, lm.y);
    maxX = Math.max(maxX, lm.x);
    maxY = Math.max(maxY, lm.y);
  }

  // Add padding
  const padX = (maxX - minX) * 0.15;
  const padY = (maxY - minY) * 0.15;
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(1, maxX + padX);
  maxY = Math.min(1, maxY + padY);

  // Make square crop
  const w = maxX - minX;
  const h = maxY - minY;
  const side = Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfSide = side / 2;

  const sx = Math.max(0, cx - halfSide) * video.videoWidth;
  const sy = Math.max(0, cy - halfSide) * video.videoHeight;
  const sSize = side * Math.max(video.videoWidth, video.videoHeight);

  // Mirror horizontally (webcam is mirrored)
  ctx.save();
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sSize, sSize, 0, 0, size, size);
  ctx.restore();

  return canvas;
}
