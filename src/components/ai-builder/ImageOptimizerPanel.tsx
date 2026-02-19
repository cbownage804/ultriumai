import { X, Image, Upload, Trash2 } from 'lucide-react';
import type { OptimizedImage } from '@/hooks/useImageOptimizer';
import { useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  images: OptimizedImage[];
  isProcessing: boolean;
  onOptimize: (file: File) => void;
  onGenerateTag: (image: OptimizedImage) => string;
  onRemove: (id: string) => void;
  onInsertCode: (code: string) => void;
}

export function ImageOptimizerPanel({ open, onClose, images, isProcessing, onOptimize, onGenerateTag, onRemove, onInsertCode }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Image className="h-4 w-4 text-pink-400" /><span className="text-sm font-medium text-white">Image Optimizer</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-white/40">Upload images to auto-compress, convert to WebP, and generate responsive srcset tags.</p>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(f => onOptimize(f)); }} />
          <button onClick={() => inputRef.current?.click()} disabled={isProcessing} className="px-3 py-1.5 text-xs bg-pink-500/20 text-pink-300 rounded-lg hover:bg-pink-500/30 disabled:opacity-30 flex items-center gap-1.5">
            <Upload className="h-3 w-3" /> {isProcessing ? 'Processing...' : 'Upload Images'}
          </button>
          {images.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {images.map(img => (
                <div key={img.id} className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                  <img src={img.dataUrl} alt="" className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70 truncate">{img.originalName}</div>
                    <div className="text-[10px] text-white/30">{img.width}×{img.height} · {img.format} · -{img.savings}%</div>
                  </div>
                  <button onClick={() => onInsertCode(onGenerateTag(img))} className="text-[10px] text-cyan-400 hover:text-cyan-300 shrink-0">Insert</button>
                  <button onClick={() => onRemove(img.id)} className="text-white/20 hover:text-red-400 shrink-0"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
