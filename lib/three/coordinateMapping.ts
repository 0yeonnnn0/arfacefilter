import * as THREE from 'three';
import { NormalizedLandmark } from '@/lib/mediapipe/faceMeshInit';
import { LANDMARKS, calculateFaceRotation, calculateFaceScale } from '@/lib/mediapipe/landmarkUtils';

export function landmarkToWorldPosition(
  landmark: NormalizedLandmark,
  camera: THREE.PerspectiveCamera,
  depth: number = 0.5
): THREE.Vector3 {
  const ndc = new THREE.Vector3(
    (landmark.x * 2) - 1,      // x: 0~1 → -1~1
    -(landmark.y * 2) + 1,     // y: flip (canvas vs WebGL coordinate)
    depth
  );
  return ndc.unproject(camera);
}

export interface FaceTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
}

export function getFaceTransform(
  landmarks: NormalizedLandmark[],
  camera: THREE.PerspectiveCamera
): FaceTransform {
  const nose = landmarks[LANDMARKS.NOSE_TIP];
  const leftEye = landmarks[LANDMARKS.LEFT_EYE_INNER] ?? landmarks[LANDMARKS.LEFT_EYE_OUTER];
  const rightEye = landmarks[LANDMARKS.RIGHT_EYE_INNER] ?? landmarks[LANDMARKS.RIGHT_EYE_OUTER];

  // Position based on nose tip
  const position = landmarkToWorldPosition(nose, camera);

  // Rotation from eye positions
  const rotData = calculateFaceRotation(leftEye, rightEye, nose);
  const rotation = new THREE.Euler(
    rotData.pitch,
    -rotData.yaw, // Negate for mirror
    rotData.roll,
    'YXZ'
  );

  // Scale based on face height
  const faceHeight = calculateFaceScale(landmarks);
  const scale = faceHeight * 8; // Scale factor to match Three.js units

  return { position, rotation, scale };
}
