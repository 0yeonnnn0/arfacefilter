'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODELS = [
  { id: 'cat',     emoji: '🐱', name: '고양이' },
  { id: 'bear',    emoji: '🐻', name: '곰' },
  { id: 'rabbit',  emoji: '🐰', name: '토끼' },
  { id: 'dog',     emoji: '🐶', name: '강아지' },
  { id: 'penguin', emoji: '🐧', name: '펭귄' },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState('cat');

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center text-white safe-bottom"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
    >
      <div className="text-center space-y-6 sm:space-y-8 px-5 w-full max-w-md">
        <div className="text-5xl sm:text-6xl">
          {MODELS.find((m) => m.id === selected)?.emoji}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          AR Face Filter
        </h1>
        <p className="text-white/50 text-sm sm:text-base leading-relaxed">
          내 얼굴을 3D 캐릭터에 입혀보세요
        </p>

        {/* Model selector */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`flex flex-col items-center gap-1 min-w-[56px] py-2.5 px-2 sm:px-3 sm:py-3 rounded-2xl transition-all touch-manipulation ${
                selected === m.id
                  ? 'bg-white/15 scale-110 ring-2 ring-white/30'
                  : 'bg-white/5 active:bg-white/15'
              }`}
            >
              <span className="text-2xl sm:text-3xl">{m.emoji}</span>
              <span className="text-[10px] sm:text-xs text-white/60">{m.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push(`/ar?model=${selected}`)}
          className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 rounded-2xl text-base font-semibold active:scale-95 transition-transform shadow-lg shadow-white/10 touch-manipulation"
        >
          시작하기
        </button>
        <p className="text-white/30 text-xs">카메라 권한이 필요합니다</p>
      </div>
    </main>
  );
}
