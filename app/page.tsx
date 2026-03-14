'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODELS = [
  { id: 'cat',      emoji: '🐱', name: '고양이' },
  { id: 'bear',     emoji: '🐻', name: '곰' },
  { id: 'rabbit',   emoji: '🐰', name: '토끼' },
  { id: 'dog',      emoji: '🐶', name: '강아지' },
  { id: 'penguin',  emoji: '🐧', name: '펭귄' },
  { id: 'fox',      emoji: '🦊', name: '여우' },
  { id: 'panda',    emoji: '🐼', name: '판다' },
  { id: 'frog',     emoji: '🐸', name: '개구리' },
  { id: 'owl',      emoji: '🦉', name: '부엉이' },
  { id: 'lion',     emoji: '🦁', name: '사자' },
  { id: 'duck',     emoji: '🦆', name: '오리' },
  { id: 'hamster',  emoji: '🐹', name: '햄스터' },
  { id: 'elephant', emoji: '🐘', name: '코끼리' },
  { id: 'unicorn',  emoji: '🦄', name: '유니콘' },
  { id: 'monkey',   emoji: '🐵', name: '원숭이' },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleStart = () => {
    if (!selected) return;
    router.push(`/ar?model=${selected}`);
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center text-white safe-bottom"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
    >
      <div className="w-full max-w-lg px-5 py-8 sm:py-12 flex flex-col items-center overflow-y-auto"
           style={{ maxHeight: '100dvh' }}>
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
          AR Face Filter
        </h1>
        <p className="text-white/50 text-sm mb-6">
          캐릭터를 선택하고 내 얼굴을 입혀보세요
        </p>

        {/* Model Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full mb-6">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl transition-all touch-manipulation ${
                selected === m.id
                  ? 'bg-white/20 scale-105 ring-2 ring-white/40 shadow-lg shadow-white/5'
                  : 'bg-white/[0.06] hover:bg-white/10 active:bg-white/15'
              }`}
            >
              <span className="text-3xl sm:text-4xl">{m.emoji}</span>
              <span className="text-[11px] sm:text-xs text-white/70 font-medium">{m.name}</span>
            </button>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!selected}
          className={`w-full max-w-xs py-4 rounded-2xl text-base font-semibold transition-all touch-manipulation shadow-lg ${
            selected
              ? 'bg-white text-gray-900 active:scale-95 shadow-white/10'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {selected
            ? `${MODELS.find((m) => m.id === selected)?.emoji} 시작하기`
            : '캐릭터를 선택하세요'}
        </button>
        <p className="text-white/30 text-xs mt-3">카메라 권한이 필요합니다</p>
      </div>
    </main>
  );
}
