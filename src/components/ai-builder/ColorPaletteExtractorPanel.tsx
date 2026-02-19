import { X, Pipette, Image, Copy } from 'lucide-react';
import { useState } from 'react';
import type { ColorPalette } from '@/hooks/useColorPaletteExtractor';

interface ColorPaletteExtractorPanelProps {
  open: boolean;
  onClose: () => void;
  palette: ColorPalette | null;
  isExtracting: boolean;
  onExtractFromImage: (url: string) => void;
  onExtractFromHex: (colors: string[]) => void;
  onClear: () => void;
  onApplyCSS: (css: string) => void;
}

export function ColorPaletteExtractorPanel({ open, onClose, palette, isExtracting, onExtractFromImage, onExtractFromHex, onClear, onApplyCSS }: ColorPaletteExtractorPanelProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [hexInput, setHexInput] = useState('');

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onExtractFromImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[500px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Pipette className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Color Palette Extractor</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!palette ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Upload Image</label>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs text-white/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Or paste image URL</label>
                <div className="flex gap-2">
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1 h-8 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
                  <button onClick={() => onExtractFromImage(imageUrl)} disabled={!imageUrl || isExtracting} className="px-3 h-8 bg-amber-500/20 text-amber-300 rounded text-xs hover:bg-amber-500/30 disabled:opacity-30">
                    <Image className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Or enter hex colors (comma separated)</label>
                <div className="flex gap-2">
                  <input value={hexInput} onChange={e => setHexInput(e.target.value)} placeholder="#ff0000, #00ff00, #0000ff" className="flex-1 h-8 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
                  <button onClick={() => onExtractFromHex(hexInput.split(',').map(h => h.trim()).filter(Boolean))} disabled={!hexInput} className="px-3 h-8 bg-amber-500/20 text-amber-300 rounded text-xs hover:bg-amber-500/30 disabled:opacity-30">Extract</button>
                </div>
              </div>
              {isExtracting && <p className="text-xs text-white/30 animate-pulse">Extracting colors...</p>}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Extracted {palette.colors.length} colors</span>
                <button onClick={onClear} className="text-xs text-white/30 hover:text-white/60">Clear</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {palette.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                    <div className="h-8 w-8 rounded" style={{ backgroundColor: c.hex }} />
                    <div>
                      <div className="text-[10px] text-white/70 font-medium">{c.name}</div>
                      <div className="text-[9px] text-white/30 font-mono">{c.hex}</div>
                      <div className="text-[9px] text-white/20">{c.usage}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">CSS Variables</span>
                  <button onClick={() => navigator.clipboard.writeText(palette.cssVariables)} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
                </div>
                <pre className="bg-black/40 rounded p-2 text-[10px] font-mono text-white/50 overflow-auto max-h-24">{palette.cssVariables}</pre>
              </div>
              <button onClick={() => onApplyCSS(palette.cssVariables)} className="w-full py-2 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30">
                Apply to Project
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
