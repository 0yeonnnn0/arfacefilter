'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  NormalizedLandmark,
  FaceMeshResults,
  FaceMeshInstance,
  initFaceMesh,
} from '@/lib/mediapipe/faceMeshInit';

export function useFaceTracker(
  onLandmarksRef: React.MutableRefObject<((landmarks: NormalizedLandmark[] | null) => void) | null>
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const faceMeshRef = useRef<FaceMeshInstance | null>(null);
  const animFrameRef = useRef<number>(0);

  const onResults = useCallback((results: FaceMeshResults) => {
    const lm = results.multiFaceLandmarks?.[0] ?? null;
    // Directly call ref callback — no React state update, no re-render
    onLandmarksRef.current?.(lm);
  }, [onLandmarksRef]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      await video.play();

      faceMeshRef.current = await initFaceMesh(onResults);

      let processing = false;
      const sendFrame = async () => {
        if (video && faceMeshRef.current && video.readyState >= 2 && !processing) {
          processing = true;
          try {
            await faceMeshRef.current.send({ image: video });
          } catch {
            // Ignore frame processing errors
          }
          processing = false;
        }
        animFrameRef.current = requestAnimationFrame(sendFrame);
      };

      setIsLoading(false);
      sendFrame();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '카메라에 접근할 수 없습니다.'
      );
      setIsLoading(false);
    }
  }, [onResults]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  return { videoRef, isLoading, error, start };
}
