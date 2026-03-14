'use client';

import { forwardRef } from 'react';

interface SilhouetteGuideProps {
  matchPercent: number;
  visible: boolean;
}

function getStrokeColor(matchPercent: number): string {
  if (matchPercent >= 85) return '#22c55e'; // green
  if (matchPercent >= 50) return '#6366f1'; // indigo
  return '#9ca3af'; // gray
}

export const SilhouetteGuide = forwardRef<SVGSVGElement, SilhouetteGuideProps>(
  function SilhouetteGuide({ matchPercent, visible }, ref) {
    if (!visible) return null;

    const strokeColor = getStrokeColor(matchPercent);

    return (
      <svg
        ref={ref}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Head silhouette - small oval in center */}
        <ellipse
          cx="50"
          cy="45"
          rx="10"
          ry="13"
          fill="none"
          stroke={strokeColor}
          strokeWidth={matchPercent >= 85 ? 0.6 : 0.35}
          strokeDasharray={matchPercent >= 85 ? 'none' : '1.5 1.5'}
          style={{
            transition: 'stroke 0.3s, stroke-width 0.3s, stroke-dasharray 0.3s',
          }}
        />
        {/* Shoulders hint */}
        <path
          d="M 40 58 Q 40 55, 44 54 Q 50 53, 56 54 Q 60 55, 60 58"
          fill="none"
          stroke={strokeColor}
          strokeWidth={matchPercent >= 85 ? 0.6 : 0.35}
          strokeDasharray={matchPercent >= 85 ? 'none' : '1.5 1.5'}
          style={{
            transition: 'stroke 0.3s, stroke-width 0.3s, stroke-dasharray 0.3s',
          }}
        />
      </svg>
    );
  }
);
