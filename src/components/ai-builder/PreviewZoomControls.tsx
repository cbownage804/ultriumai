import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150];

export function PreviewZoomControls({ zoom, onZoomChange }: PreviewZoomControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => {
          const idx = ZOOM_STEPS.indexOf(zoom);
          if (idx > 0) onZoomChange(ZOOM_STEPS[idx - 1]);
          else if (zoom > 50) onZoomChange(Math.max(50, zoom - 25));
        }}
        disabled={zoom <= 50}
        className={cn(
          "h-6 w-6 rounded flex items-center justify-center transition-colors",
          zoom <= 50 ? "text-white/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
        )}
      >
        <ZoomOut className="h-3 w-3" />
      </button>
      <button
        onClick={() => onZoomChange(100)}
        className={cn(
          "text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors min-w-[36px] text-center",
          zoom === 100 ? "text-white/20" : "text-cyan-400/60 hover:text-cyan-400 hover:bg-white/5"
        )}
      >
        {zoom}%
      </button>
      <button
        onClick={() => {
          const idx = ZOOM_STEPS.indexOf(zoom);
          if (idx >= 0 && idx < ZOOM_STEPS.length - 1) onZoomChange(ZOOM_STEPS[idx + 1]);
          else if (zoom < 150) onZoomChange(Math.min(150, zoom + 25));
        }}
        disabled={zoom >= 150}
        className={cn(
          "h-6 w-6 rounded flex items-center justify-center transition-colors",
          zoom >= 150 ? "text-white/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
        )}
      >
        <ZoomIn className="h-3 w-3" />
      </button>
    </div>
  );
}
