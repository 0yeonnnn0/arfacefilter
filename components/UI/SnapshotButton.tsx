'use client';

interface SnapshotButtonProps {
  visible: boolean;
  onSnapshot: () => void;
  onReset: () => void;
}

export function SnapshotButton({ visible, onSnapshot, onReset }: SnapshotButtonProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-3">
      <button
        onClick={onSnapshot}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="스냅샷 촬영"
      >
        <div className="w-12 h-12 rounded-full border-4 border-gray-800" />
      </button>
      <button
        onClick={onReset}
        className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
