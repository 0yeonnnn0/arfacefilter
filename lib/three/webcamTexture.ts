import * as THREE from 'three';

export function createWebcamPlane(
  video: HTMLVideoElement,
  scene: THREE.Scene
): { mesh: THREE.Mesh; texture: THREE.VideoTexture } {
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const geometry = new THREE.PlaneGeometry(16, 9);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1; // Mirror the webcam
  mesh.position.z = -10;
  mesh.renderOrder = 0;
  scene.add(mesh);

  return { mesh, texture };
}

export function updateWebcamPlaneSize(
  mesh: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  videoAspect: number
) {
  const dist = camera.position.z - mesh.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const planeHeight = 2 * dist * Math.tan(vFov / 2);
  const planeWidth = planeHeight * camera.aspect;

  // Fill the screen while maintaining video aspect ratio
  const scaleX = planeWidth / 16;
  const scaleY = planeHeight / 9;
  const scale = Math.max(scaleX, scaleY);

  mesh.scale.set(-scale, scale, 1); // Negative x for mirror
}
