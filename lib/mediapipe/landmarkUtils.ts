import { NormalizedLandmark } from '@/lib/mediapipe/faceMeshInit';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Key landmark indices
export const LANDMARKS = {
  NOSE_TIP: 1,
  FOREHEAD: 10,
  CHIN: 152,
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  LEFT_EYE_INNER: 468,
  RIGHT_EYE_INNER: 473,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
} as const;

export function getLandmarkBBox(landmarks: NormalizedLandmark[]): BBox {
  const forehead = landmarks[LANDMARKS.FOREHEAD];
  const chin = landmarks[LANDMARKS.CHIN];
  const leftEar = landmarks[LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[LANDMARKS.RIGHT_EAR];

  const x = Math.min(leftEar.x, rightEar.x);
  const y = Math.min(forehead.y, chin.y);
  const width = Math.abs(rightEar.x - leftEar.x);
  const height = Math.abs(chin.y - forehead.y);

  return { x, y, width, height };
}

export function calculateFaceRotation(
  leftEye: NormalizedLandmark,
  rightEye: NormalizedLandmark,
  nose: NormalizedLandmark
) {
  // Yaw: rotation around Y axis (left-right head turn)
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const yaw = (nose.x - eyeMidX) * Math.PI * 2;

  // Pitch: rotation around X axis (head tilt up-down)
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const pitch = (nose.y - eyeMidY) * Math.PI * 1.5;

  // Roll: rotation around Z axis (head tilt sideways)
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  return { yaw, pitch, roll };
}

export function calculateFaceScale(landmarks: NormalizedLandmark[]): number {
  const forehead = landmarks[LANDMARKS.FOREHEAD];
  const chin = landmarks[LANDMARKS.CHIN];
  const faceHeight = Math.abs(chin.y - forehead.y);
  return faceHeight;
}
