import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function loadModel(url: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              // Enable transparency for morphing transition
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.transparent = true;
              mat.opacity = 0;
            }
          }
        });
        resolve(model);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

export function setModelOpacity(model: THREE.Group, opacity: number) {
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = opacity;
        mat.transparent = opacity < 1;
      }
    }
  });
}
