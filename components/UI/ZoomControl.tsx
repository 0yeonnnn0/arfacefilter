'use client';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2">
      <button
        onClick={() => onZoomChange(zoom + 0.2)}
        disabled={zoom >= 3.0}
        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white text-xl font-bold flex items-center justify-center hover:bg-black/70 disabled:opacity-30 transition-colors"
        aria-label="확대"
      >
        +
      </button>

      <div className="relative h-32 w-10 flex items-center justify-center">
        <div className="absolute w-1 h-full bg-white/20 rounded-full" />
        <div
          className="absolute w-1 bg-white/80 rounded-full bottom-0 transition-all"
          style={{ height: `${((zoom - 0.5) / 2.5) * 100}%` }}
        />
        <input
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="absolute w-32 h-10 opacity-0 cursor-pointer"
          style={{ transform: 'rotate(-90deg)' }}
          aria-label="줌 슬라이더"
        />
      </div>

      <button
        onClick={() => onZoomChange(zoom - 0.2)}
        disabled={zoom <= 0.5}
        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white text-xl font-bold flex items-center justify-center hover:bg-black/70 disabled:opacity-30 transition-colors"
        aria-label="축소"
      >
        −
      </button>

      <span className="text-white/60 text-xs mt-1">
        {zoom.toFixed(1)}x
      </span>
    </div>
  );
}
