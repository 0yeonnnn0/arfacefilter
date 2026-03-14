import { BBox } from '@/lib/mediapipe/landmarkUtils';

// Default silhouette bounding box in normalized coordinates (0~1)
// Centered on screen, approximately where a face should be
export function getSilhouetteBBox(): BBox {
  return {
    x: 0.40,    // left edge at 40% from left
    y: 0.32,    // top edge at 32% from top
    width: 0.20, // 20% of screen width
    height: 0.26, // 26% of screen height
  };
}
