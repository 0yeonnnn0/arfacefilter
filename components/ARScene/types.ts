import * as THREE from 'three';

export interface ARSceneState {
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  scene: THREE.Scene | null;
  webcamMesh: THREE.Mesh | null;
  model: THREE.Group | null;
}
