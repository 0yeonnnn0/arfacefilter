/**
 * Tests for the reset flow in useARScene.
 * Verifies that resetToCamera properly cleans up WebGL resources
 * and that a fresh viewer can be initialized after reset.
 */

// Mock Three.js
const mockDispose = jest.fn();
const mockForceContextLoss = jest.fn();
const mockRender = jest.fn();
const mockSetSize = jest.fn();
const mockSetPixelRatio = jest.fn();
const mockControlsDispose = jest.fn();
const mockControlsUpdate = jest.fn();
const mockControlsAddEventListener = jest.fn();

jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setPixelRatio: mockSetPixelRatio,
      setSize: mockSetSize,
      setClearColor: jest.fn(),
      render: mockRender,
      dispose: mockDispose,
      forceContextLoss: mockForceContextLoss,
      outputColorSpace: '',
      toneMapping: 0,
      toneMappingExposure: 1,
      domElement: {
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
      },
    })),
  };
});

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    enableDamping: false,
    dampingFactor: 0,
    enableZoom: false,
    enablePan: false,
    minDistance: 0,
    maxDistance: 0,
    target: { set: jest.fn() },
    update: mockControlsUpdate,
    dispose: mockControlsDispose,
    addEventListener: mockControlsAddEventListener,
  })),
}));

jest.mock('@/lib/three/modelLoader', () => ({
  loadModel: jest.fn().mockRejectedValue(new Error('no model in test')),
  setModelOpacity: jest.fn(),
}));

jest.mock('@/lib/three/faceTexture', () => ({
  projectFaceOntoModel: jest.fn((m) => m),
  createFaceHead: jest.fn(() => {
    const THREE = jest.requireActual('three');
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial()
    );
    group.add(mesh);
    return group;
  }),
}));

import { renderHook, act } from '@testing-library/react';
import { useARScene } from '@/components/ARScene/useARScene';

// Mock canvas — must cover both WebGL and 2D contexts
function createMockCanvas() {
  const canvas = document.createElement('canvas');
  const orig = canvas.getContext.bind(canvas);
  canvas.getContext = jest.fn().mockImplementation((type: string) => {
    if (type === '2d') {
      return {
        drawImage: jest.fn(),
        fillRect: jest.fn(),
        createLinearGradient: jest.fn().mockReturnValue({
          addColorStop: jest.fn(),
        }),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        fillStyle: '',
      };
    }
    return orig(type);
  }) as any;
  return canvas;
}

describe('useARScene', () => {
  const origCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 720, writable: true });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    // Patch document.createElement to return mock 2d context for all canvases
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'canvas') {
        (el as HTMLCanvasElement).getContext = jest.fn().mockImplementation(() => ({
          drawImage: jest.fn(),
          fillRect: jest.fn(),
          createLinearGradient: jest.fn().mockReturnValue({ addColorStop: jest.fn() }),
          save: jest.fn(), restore: jest.fn(), translate: jest.fn(), scale: jest.fn(),
          fillStyle: '',
        })) as any;
      }
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts in camera phase', () => {
    const { result } = renderHook(() => useARScene());
    expect(result.current.phase).toBe('camera');
  });

  test('initViewer transitions to result phase', async () => {
    const { result } = renderHook(() => useARScene());

    // Manually assign a canvas to the ref
    const canvas = createMockCanvas();
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    const faceCanvas = createMockCanvas();

    await act(async () => {
      await result.current.initViewer(faceCanvas);
    });

    expect(result.current.phase).toBe('result');
  });

  test('resetToCamera cleans up and returns to camera phase', async () => {
    const { result } = renderHook(() => useARScene());

    const canvas = createMockCanvas();
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    const faceCanvas = createMockCanvas();

    // Init viewer first
    await act(async () => {
      await result.current.initViewer(faceCanvas);
    });
    expect(result.current.phase).toBe('result');

    // Reset
    act(() => {
      result.current.resetToCamera();
    });

    expect(result.current.phase).toBe('camera');
    expect(mockForceContextLoss).toHaveBeenCalled();
    expect(mockDispose).toHaveBeenCalled();
    expect(mockControlsDispose).toHaveBeenCalled();
  });

  test('canvasKey increments on reset for fresh DOM element', async () => {
    const { result } = renderHook(() => useARScene());

    const initialKey = result.current.canvasKey;

    const canvas = createMockCanvas();
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    await act(async () => {
      await result.current.initViewer(createMockCanvas());
    });

    act(() => {
      result.current.resetToCamera();
    });

    expect(result.current.canvasKey).toBe(initialKey + 1);
  });

  test('can re-init viewer after reset (full cycle)', async () => {
    const { result } = renderHook(() => useARScene());

    const canvas = createMockCanvas();
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: canvas,
      writable: true,
    });

    // First cycle
    await act(async () => {
      await result.current.initViewer(createMockCanvas());
    });
    expect(result.current.phase).toBe('result');

    // Reset
    act(() => {
      result.current.resetToCamera();
    });
    expect(result.current.phase).toBe('camera');

    // Re-assign canvas ref (simulating new canvas from key change)
    const newCanvas = createMockCanvas();
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: newCanvas,
      writable: true,
    });

    // Second cycle — should work without errors
    await act(async () => {
      await result.current.initViewer(createMockCanvas());
    });
    expect(result.current.phase).toBe('result');

    // Renderer was created twice
    const THREE = require('three');
    expect(THREE.WebGLRenderer).toHaveBeenCalledTimes(2);
  });
});
