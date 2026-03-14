import { NormalizedLandmark } from '@/lib/mediapipe/faceMeshInit';
import { BBox, getLandmarkBBox } from '@/lib/mediapipe/landmarkUtils';

function getIntersection(a: BBox, b: BBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

function getUnion(a: BBox, b: BBox): number {
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const intersection = getIntersection(a, b);
  return areaA + areaB - intersection;
}

function getScaleMatch(a: BBox, b: BBox): number {
  const scaleX = Math.min(a.width, b.width) / Math.max(a.width, b.width);
  const scaleY = Math.min(a.height, b.height) / Math.max(a.height, b.height);
  return (scaleX + scaleY) / 2;
}

export function calculateMatch(
  faceLandmarks: NormalizedLandmark[],
  silhouetteBBox: BBox
): number {
  const faceBBox = getLandmarkBBox(faceLandmarks);
  const intersection = getIntersection(faceBBox, silhouetteBBox);
  const union = getUnion(faceBBox, silhouetteBBox);

  if (union === 0) return 0;

  const iou = intersection / union;
  const scale = getScaleMatch(faceBBox, silhouetteBBox);
  return (iou * 0.7 + scale * 0.3) * 100;
}
