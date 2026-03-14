'use client';

import { useCallback, useState } from 'react';
import { useARScene } from './useARScene';
import { CameraView } from './CameraView';
import { ResultView } from './ResultView';

interface ARSceneProps {
  modelPath?: string;
  onBack?: () => void;
}

export function ARScene({ modelPath = '/models/character.glb', onBack }: ARSceneProps) {
  const {
    canvasRef,
    canvasKey,
    phase,
    initViewer,
    takeSnapshot,
    resetToCamera,
  } = useARScene(modelPath);

  const [cameraKey, setCameraKey] = useState(0);
  const [hideUI, setHideUI] = useState(false);

  const handleCapture = useCallback(
    (faceCanvas: HTMLCanvasElement) => {
      setHideUI(true);
      initViewer(faceCanvas);
    },
    [initViewer]
  );

  const handleReset = useCallback(() => {
    resetToCamera();
    setCameraKey((k) => k + 1);
    setHideUI(false);
  }, [resetToCamera]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {phase === 'camera' && (
        <CameraView key={`cam-${cameraKey}`} onCapture={handleCapture} onBack={onBack} hideUI={hideUI} />
      )}

      <canvas
        key={`cv-${canvasKey}`}
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${phase === 'result' ? '' : 'hidden'}`}
      />

      {phase === 'result' && (
        <ResultView onSnapshot={takeSnapshot} onReset={handleReset} onBack={onBack} />
      )}
    </div>
  );
}
