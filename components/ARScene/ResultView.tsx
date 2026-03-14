'use client';

interface ResultViewProps {
  onSnapshot: () => void;
  onReset: () => void;
  onBack?: () => void;
}

export function ResultView({ onSnapshot, onReset, onBack }: ResultViewProps) {
  return (
    <>
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onReset}
          className="text-white/70 active:text-white text-sm flex items-center gap-1 transition-colors p-2 -ml-2 touch-manipulation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          다시 찍기
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="text-white/70 active:text-white text-sm flex items-center gap-1 transition-colors p-2 -mr-2 touch-manipulation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            선택화면
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pt-12"
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.4))', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/40 text-sm">드래그로 회전 · 핀치로 확대</p>
          <button
            onClick={onSnapshot}
            className="relative w-16 h-16 rounded-full flex items-center justify-center touch-manipulation"
            aria-label="저장"
          >
            <div className="absolute inset-0 rounded-full border-[3px] border-white/60 transition-colors" />
            <svg width="24" height="24" viewBox="0 0 24 24" className="active:scale-95 transition-transform">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" strokeWidth="1.5" fill="none"/>
              <polyline points="17,21 17,13 7,13 7,21" stroke="white" strokeWidth="1.5" fill="none"/>
              <polyline points="7,3 7,8 15,8" stroke="white" strokeWidth="1.5" fill="none"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
