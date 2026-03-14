'use client';

import { TransitionState } from '@/components/TransitionController/useTransition';

interface MatchIndicatorProps {
  matchPercent: number;
  state: TransitionState;
  lockProgress: number;
}

export function MatchIndicator({ matchPercent, state, lockProgress }: MatchIndicatorProps) {
  if (state === 'complete') return null;

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = state === 'locked' ? lockProgress : matchPercent / 100;
  const dashOffset = circumference * (1 - progress);

  const color = matchPercent >= 85 ? '#22c55e' : matchPercent >= 50 ? '#6366f1' : '#9ca3af';

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="rgba(0,0,0,0.5)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.1s, stroke 0.3s' }}
        />
        {/* Percentage text */}
        <text
          x="40"
          y="40"
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="14"
          fontWeight="bold"
        >
          {Math.round(matchPercent)}%
        </text>
      </svg>
      <span className="text-white/70 text-sm">
        {state === 'idle' && '얼굴을 실루엣에 맞춰보세요'}
        {state === 'tracking' && '좀 더 가까이...'}
        {state === 'locked' && '유지하세요!'}
        {state === 'transitioning' && '변환 중...'}
      </span>
    </div>
  );
}
