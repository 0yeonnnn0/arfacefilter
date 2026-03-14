'use client';

import { useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { setModelOpacity } from '@/lib/three/modelLoader';

export type TransitionState = 'idle' | 'tracking' | 'locked' | 'transitioning' | 'complete';

export function useTransition() {
  const [state, setState] = useState<TransitionState>('idle');
  const lockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lockStartRef = useRef<number>(0);
  const [lockProgress, setLockProgress] = useState(0);

  const triggerTransition = useCallback((
    webcamMesh: THREE.Mesh,
    model: THREE.Group,
    silhouetteEl: SVGSVGElement | null,
    onComplete: () => void
  ) => {
    setState('transitioning');

    const tl = gsap.timeline({
      onComplete: () => {
        setState('complete');
        onComplete();
      },
    });

    timelineRef.current = tl;

    // Phase 1: Silhouette emphasis
    if (silhouetteEl) {
      tl.to(silhouetteEl, {
        attr: { 'stroke-width': 3 },
        duration: 0.8,
      });
    }

    // Phase 2: Webcam fade out + Model fade in
    const webcamMat = webcamMesh.material as THREE.MeshBasicMaterial;
    tl.to(webcamMat, {
      opacity: 0,
      duration: 1.2,
      onUpdate: () => {
        webcamMat.transparent = true;
      },
    }, '+=0');

    const modelOpacity = { value: 0 };
    tl.to(modelOpacity, {
      value: 1,
      duration: 1.2,
      onUpdate: () => {
        setModelOpacity(model, modelOpacity.value);
      },
    }, '<'); // Simultaneous with webcam fadeout

    // Phase 3: Silhouette fadeout
    if (silhouetteEl) {
      tl.to(silhouetteEl, {
        opacity: 0,
        duration: 0.5,
      });
    }
  }, []);

  const updateMatchState = useCallback((matchPercent: number, args: {
    webcamMesh: THREE.Mesh;
    model: THREE.Group;
    silhouetteEl: SVGSVGElement | null;
    onComplete: () => void;
  }) => {
    if (state === 'transitioning' || state === 'complete') return;

    if (matchPercent < 50) {
      setState('idle');
      if (lockedTimerRef.current) {
        clearTimeout(lockedTimerRef.current);
        lockedTimerRef.current = null;
      }
      setLockProgress(0);
      return;
    }

    if (matchPercent < 85) {
      setState('tracking');
      if (lockedTimerRef.current) {
        clearTimeout(lockedTimerRef.current);
        lockedTimerRef.current = null;
      }
      setLockProgress(0);
      return;
    }

    // matchPercent >= 85
    if (state !== 'locked') {
      setState('locked');
      lockStartRef.current = Date.now();

      // Start 1.5s countdown
      lockedTimerRef.current = setTimeout(() => {
        triggerTransition(
          args.webcamMesh,
          args.model,
          args.silhouetteEl,
          args.onComplete
        );
      }, 1500);
    }

    // Update lock progress
    const elapsed = Date.now() - lockStartRef.current;
    setLockProgress(Math.min(elapsed / 1500, 1));
  }, [state, triggerTransition]);

  const reset = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    if (lockedTimerRef.current) {
      clearTimeout(lockedTimerRef.current);
      lockedTimerRef.current = null;
    }
    setState('idle');
    setLockProgress(0);
  }, []);

  return { state, lockProgress, updateMatchState, reset };
}
