import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { VisualSnapshot } from '@/hooks/useVisualDiff';

interface VisualDiffOverlayProps {
  before: VisualSnapshot;
  after: VisualSnapshot;
  onClose: () => void;
}

/**
 * Wave 16: Visual Diff Overlay — Before/After slider comparison.
 * Renders two preview snapshots with a draggable divider.
 */
export function VisualDiffOverlay({ before, after, onClose }: VisualDiffOverlayProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'slider' | 'toggle'>('slider');
  const [showBefore, setShowBefore] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && mode !== 'slider') return;
    if (mode === 'slider' && isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(0, Math.min(100, pos)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#12121a] border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Visual Diff</span>
          <div className="flex gap-1">
            <button
              onClick={() => setMode('slider')}
              className={`px-2.5 py-1 text-xs rounded ${mode === 'slider' ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-white/60'}`}
            >
              Slider
            </button>
            <button
              onClick={() => setMode('toggle')}
              className={`px-2.5 py-1 text-xs rounded ${mode === 'toggle' ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-white/60'}`}
            >
              Toggle
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'toggle' && (
            <button
              onClick={() => setShowBefore(!showBefore)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-white/60 hover:text-white/90 bg-white/[0.05] rounded"
            >
              {showBefore ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showBefore ? 'Before' : 'After'}
            </button>
          )}
          <button onClick={onClose} className="text-white/30 hover:text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comparison area */}
      <div
        className="flex-1 relative overflow-hidden cursor-col-resize select-none"
        onMouseMove={handleMove}
        onMouseDown={() => mode === 'slider' && setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {mode === 'slider' ? (
          <>
            {/* After (full) */}
            <img
              src={after.dataUrl}
              alt="After"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
            {/* Before (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={before.dataUrl}
                alt="Before"
                className="w-full h-full object-contain"
                style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
                draggable={false}
              />
            </div>
            {/* Divider */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg shadow-primary/30"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground text-xs font-bold">⇔</span>
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 text-white text-xs rounded">Before</div>
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/60 text-white text-xs rounded">After</div>
          </>
        ) : (
          <img
            src={showBefore ? before.dataUrl : after.dataUrl}
            alt={showBefore ? 'Before' : 'After'}
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
