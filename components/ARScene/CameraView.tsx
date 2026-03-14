'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  NormalizedLandmark,
  FaceMeshInstance,
  initFaceMesh,
} from '@/lib/mediapipe/faceMeshInit';

interface CameraViewProps {
  onCapture: (faceCanvas: HTMLCanvasElement) => void;
  hideUI?: boolean;
}

/** Compute the square crop region from landmarks in pixel space */
function computePixelCrop(landmarks: NormalizedLandmark[], vw: number, vh: number) {
  let minX = vw, minY = vh, maxX = 0, maxY = 0;
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x * vw);
    minY = Math.min(minY, lm.y * vh);
    maxX = Math.max(maxX, lm.x * vw);
    maxY = Math.max(maxY, lm.y * vh);
  }
  const fw = maxX - minX, fh = maxY - minY;
  const pad = Math.max(fw, fh) * 0.4;
  const rawSide = Math.max(fw, fh) + pad * 2;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;

  let left = cx - rawSide / 2;
  let top = cy - rawSide / 2;

  left = Math.max(0, left);
  top = Math.max(0, top);
  const side = Math.min(rawSide, vw - left, vh - top);

  return { left, top, side };
}

export function CameraView({ onCapture, hideUI = false }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const animFrameRef = useRef<number>(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const throttleRef = useRef(0);

  const [guideRect, setGuideRect] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        // Try high-res first, fall back for low-end mobile
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
          });
        }

        // If unmounted during async getUserMedia, stop stream immediately
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await new Promise<void>((r) => { video.onloadedmetadata = () => r(); });
        if (!mounted) return;

        await video.play();
        if (!mounted) return;

        const fm = await initFaceMesh((results) => {
          if (!mounted) return;
          const lm = results.multiFaceLandmarks?.[0] ?? null;
          landmarksRef.current = lm;

          const now = Date.now();
          if (now - throttleRef.current > 80) {
            throttleRef.current = now;
            setFaceDetected(!!lm);

            if (lm && video.videoWidth > 0 && containerRef.current) {
              const vw = video.videoWidth;
              const vh = video.videoHeight;
              const cw = containerRef.current.clientWidth;
              const ch = containerRef.current.clientHeight;

              const crop = computePixelCrop(lm, vw, vh);

              const scale = Math.max(cw / vw, ch / vh);
              const displayW = vw * scale;
              const displayH = vh * scale;
              const offsetX = (cw - displayW) / 2;
              const offsetY = (ch - displayH) / 2;

              const screenLeft = offsetX + crop.left * scale;
              const screenTop = offsetY + crop.top * scale;
              const screenSide = crop.side * scale;

              const mirroredLeft = cw - screenLeft - screenSide;

              setGuideRect({
                left: mirroredLeft,
                top: screenTop,
                width: screenSide,
                height: screenSide,
              });
            } else {
              setGuideRect(null);
            }
          }
        });

        if (!mounted) {
          fm.close();
          return;
        }

        faceMeshRef.current = fm;

        let processing = false;
        const sendFrame = async () => {
          if (!mounted) return;
          if (video.readyState >= 2 && fm && !processing) {
            processing = true;
            try { await fm.send({ image: video }); } catch { /* */ }
            processing = false;
          }
          animFrameRef.current = requestAnimationFrame(sendFrame);
        };

        setLoading(false);
        sendFrame();
      } catch (err) {
        if (mounted) {
          console.error('CameraView init error:', err);
          setError(err instanceof Error ? err.message : '카메라에 접근할 수 없습니다.');
          setLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      // Close FaceMesh instance
      try { faceMeshRef.current?.close(); } catch { /* */ }
      faceMeshRef.current = null;

      // Stop all camera tracks via stored ref (guaranteed access)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const vw = video.videoWidth, vh = video.videoHeight;
    const landmarks = landmarksRef.current;

    if (landmarks && landmarks.length > 0) {
      const crop = computePixelCrop(landmarks, vw, vh);

      ctx.save();
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, crop.left, crop.top, crop.side, crop.side, 0, 0, size, size);
      ctx.restore();
    } else {
      const side = Math.min(vw, vh);
      const sx = (vw - side) / 2, sy = (vh - side) / 2;
      ctx.save();
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
      ctx.restore();
    }

    setFlash(true);
    setTimeout(() => {
      setFlash(false);
      onCapture(canvas);
    }, 350);
  }, [onCapture]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        muted
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Dynamic guide */}
      {!hideUI && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute rounded-2xl transition-all duration-150 ease-out"
            style={
              guideRect
                ? {
                    left: `${guideRect.left}px`,
                    top: `${guideRect.top}px`,
                    width: `${guideRect.width}px`,
                    height: `${guideRect.height}px`,
                    border: faceDetected
                      ? '2.5px solid rgba(34,197,94,0.8)'
                      : '2px dashed rgba(255,255,255,0.25)',
                    boxShadow: faceDetected
                      ? '0 0 40px rgba(34,197,94,0.15), inset 0 0 40px rgba(34,197,94,0.03)'
                      : 'none',
                  }
                : {
                    left: '50%',
                    top: '45%',
                    width: '50vmin',
                    height: '50vmin',
                    transform: 'translate(-50%, -50%)',
                    border: '2px dashed rgba(255,255,255,0.25)',
                  }
            }
          >
            {faceDetected && guideRect && (
              <>
                <div className="absolute -top-[1px] -left-[1px] w-5 h-5 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-lg" />
                <div className="absolute -top-[1px] -right-[1px] w-5 h-5 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-lg" />
                <div className="absolute -bottom-[1px] -left-[1px] w-5 h-5 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-lg" />
                <div className="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b-[3px] border-r-[3px] border-green-400 rounded-br-lg" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {!loading && !error && !hideUI && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pt-16 safe-bottom"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/80 text-sm">
              {faceDetected ? '준비 완료!' : '얼굴을 화면에 맞춰주세요'}
            </p>
            <button
              onClick={captureFrame}
              className="relative w-20 h-20 rounded-full flex items-center justify-center touch-manipulation"
              aria-label="촬영"
            >
              <div className="absolute inset-0 rounded-full border-[3px] border-white/80 transition-colors" />
              <div className="w-[62px] h-[62px] rounded-full bg-white active:scale-90 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Flash */}
      <div
        className={`absolute inset-0 bg-white z-40 pointer-events-none transition-opacity ${flash ? 'opacity-90 duration-100' : 'opacity-0 duration-300'}`}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white/50 text-sm">카메라 준비 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <p className="text-red-400 text-center px-8">{error}</p>
        </div>
      )}
    </div>
  );
}
