'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadModel, setModelOpacity } from '@/lib/three/modelLoader';
import { projectFaceOntoModel, createFaceHead } from '@/lib/three/faceTexture';

export type AppPhase = 'camera' | 'result';

export function useARScene(modelPath: string = '/models/character.glb') {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const autoRotateRef = useRef(true);
  const cleanupResizeRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<AppPhase>('camera');
  const [canvasKey, setCanvasKey] = useState(0);

  const initViewer = useCallback(async (faceCanvas: HTMLCanvasElement) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: false, antialias: true, preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // Camera — push back on portrait (mobile) so model fits
    const aspect = w / h;
    const camZ = aspect < 1 ? 4 + (1 - aspect) * 3 : 4;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(0, 1.0, camZ);

    // Scene with gradient background
    const scene = new THREE.Scene();
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2; bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    const grad = bgCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, 2, 512);
    scene.background = new THREE.CanvasTexture(bgCanvas);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    keyLight.position.set(3, 4, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xddddff, 0.6);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);

    // Ground shadow
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    scene.add(ground);

    // OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 8;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.target.set(0, 0.8, 0);
    controls.update();
    controlsRef.current = controls;
    controls.addEventListener('start', () => { autoRotateRef.current = false; });

    // Load model + project face
    let model: THREE.Group;
    try {
      model = await loadModel(modelPath);
      setModelOpacity(model, 1);
      model = projectFaceOntoModel(model, faceCanvas);
    } catch {
      model = createFaceHead(faceCanvas);
    }

    // Center model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    model.position.y += size.y / 2;
    scene.add(model);

    // Entrance animation
    model.scale.setScalar(0.01);
    const startTime = Date.now();

    // Render loop
    const renderLoop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed < 1.0) {
        const t = elapsed;
        const ease = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI);
        model.scale.setScalar(Math.max(0.01, ease));
      } else {
        model.scale.setScalar(1);
      }
      if (autoRotateRef.current && elapsed > 0.8) {
        model.rotation.y += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Resize
    const handleResize = () => {
      const rw = window.innerWidth, rh = window.innerHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
    };
    window.addEventListener('resize', handleResize);
    cleanupResizeRef.current = () => window.removeEventListener('resize', handleResize);

    setPhase('result');
  }, [modelPath]);

  const takeSnapshot = useCallback(() => {
    if (!rendererRef.current) return;
    const srcCanvas = rendererRef.current.domElement;

    // Create a new canvas with watermark
    const out = document.createElement('canvas');
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d')!;

    ctx.drawImage(srcCanvas, 0, 0);

    // Small watermark at bottom-right
    const fontSize = Math.round(w * 0.022);
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('arfacefilter.vercel.app', w - fontSize * 0.6, h - fontSize * 0.5);

    const dataURL = out.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ar-filter-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const resetToCamera = useCallback(() => {
    // 1. Stop render loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }

    // 2. Cleanup resize listener
    if (cleanupResizeRef.current) {
      cleanupResizeRef.current();
      cleanupResizeRef.current = null;
    }

    // 3. Dispose OrbitControls
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    // 4. Dispose renderer + force lose WebGL context
    if (rendererRef.current) {
      rendererRef.current.forceContextLoss();
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    autoRotateRef.current = true;

    // 5. Force new canvas element via key change
    setCanvasKey((k) => k + 1);

    // 6. Switch phase
    setPhase('camera');
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cleanupResizeRef.current) cleanupResizeRef.current();
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.forceContextLoss();
        rendererRef.current.dispose();
      }
    };
  }, []);

  return { canvasRef, canvasKey, phase, initViewer, takeSnapshot, resetToCamera };
}
