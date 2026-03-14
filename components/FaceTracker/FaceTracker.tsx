'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { NormalizedLandmark } from '@/lib/mediapipe/faceMeshInit';
import { useFaceTracker } from './useFaceTracker';

export interface FaceTrackerHandle {
  videoElement: HTMLVideoElement | null;
}

interface FaceTrackerProps {
  onLandmarksRef: React.MutableRefObject<((landmarks: NormalizedLandmark[] | null) => void) | null>;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export const FaceTracker = forwardRef<FaceTrackerHandle, FaceTrackerProps>(
  function FaceTracker({ onLandmarksRef, onReady, onError }, ref) {
    const { videoRef, isLoading, error, start } = useFaceTracker(onLandmarksRef);

    useImperativeHandle(ref, () => ({
      get videoElement() {
        return videoRef.current;
      },
    }));

    const startedRef = useRef(false);
    useEffect(() => {
      if (!startedRef.current) {
        startedRef.current = true;
        start();
      }
    }, [start]);

    useEffect(() => {
      if (!isLoading && !error) {
        onReady?.();
      }
      if (error) {
        onError?.(error);
      }
    }, [isLoading, error, onReady, onError]);

    return (
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
    );
  }
);
