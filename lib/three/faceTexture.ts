import * as THREE from 'three';

/**
 * Front-projection mapping: projects the face photo onto the entire 3D model
 * as if a projector is shining the photo from the front.
 * Every vertex gets UV based on its screen-space position when viewed from front.
 */
export function projectFaceOntoModel(
  model: THREE.Group,
  faceCanvas: HTMLCanvasElement
): THREE.Group {
  const texture = new THREE.CanvasTexture(faceCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  // Compute model bounding box to normalize coordinates
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // The longest axis determines the projection scale
  const maxDim = Math.max(size.x, size.y);

  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;

    const geo = mesh.geometry;
    const posAttr = geo.getAttribute('position');

    // Create new UV attribute based on front projection
    const uvs = new Float32Array(posAttr.count * 2);

    for (let i = 0; i < posAttr.count; i++) {
      // Get vertex world position
      const localPos = new THREE.Vector3(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      );
      // Transform to world space
      const worldPos = localPos.applyMatrix4(mesh.matrixWorld);

      // Project from front (looking down -Z axis):
      // U = x position normalized to 0~1
      // V = y position normalized to 0~1
      const u = (worldPos.x - center.x) / maxDim + 0.5;
      const v = (worldPos.y - center.y) / maxDim + 0.5;

      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }

    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Replace material with face texture
    mesh.material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.05,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
  });

  return model;
}

/** Standalone face head (fallback if model fails to load) */
export function createFaceHead(faceCanvas: HTMLCanvasElement): THREE.Group {
  const texture = new THREE.CanvasTexture(faceCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 64, 64);

  // Front-projection UV for sphere
  const uv = geo.getAttribute('uv');
  const norm = geo.getAttribute('normal');
  for (let i = 0; i < uv.count; i++) {
    const nx = norm.getX(i);
    const ny = norm.getY(i);
    const nz = norm.getZ(i);

    if (nz > 0) {
      uv.setXY(i, nx * 0.5 + 0.5, ny * 0.5 + 0.5);
    } else {
      uv.setXY(i, 0.5 + nx * 0.05, 0.5 + ny * 0.05);
    }
  }
  uv.needsUpdate = true;

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.0,
  });
  group.add(new THREE.Mesh(geo, mat));
  return group;
}
