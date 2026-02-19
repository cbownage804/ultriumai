import { X, Upload, FileCode, Layers } from 'lucide-react';
import { useState } from 'react';

interface FigmaImportPanelProps {
  open: boolean;
  onClose: () => void;
  onImport: (jsonStr: string) => void;
  importResult: { componentName: string; jsx: string; layerCount: number } | null;
  isImporting: boolean;
  error: string | null;
  onInsert: (code: string, fileName: string) => void;
  onClear: () => void;
}

export function FigmaImportPanel({ open, onClose, onImport, importResult, isImporting, error, onInsert, onClear }: FigmaImportPanelProps) {
  const [jsonInput, setJsonInput] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Figma Import</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!importResult ? (
            <>
              <p className="text-xs text-white/40">Paste Figma JSON export to convert layers into React + Tailwind components.</p>
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{"name": "Frame", "type": "FRAME", "children": [...]}'
                className="w-full h-48 bg-black/30 border border-white/[0.08] rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:outline-none focus:border-purple-500/30"
              />
              <button
                onClick={() => onImport(jsonInput)}
                disabled={!jsonInput.trim() || isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/30 disabled:opacity-30"
              >
                <Upload className="h-3.5 w-3.5" />
                {isImporting ? 'Importing...' : 'Import & Convert'}
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-white">{importResult.componentName}</span>
                  <span className="text-[10px] text-white/30">{importResult.layerCount} layers</span>
                </div>
                <button onClick={onClear} className="text-xs text-white/30 hover:text-white/60">Clear</button>
              </div>
              <pre className="bg-black/40 rounded-lg p-3 text-[11px] font-mono text-white/70 overflow-auto max-h-60">{importResult.jsx}</pre>
              <button
                onClick={() => onInsert(importResult.jsx, `${importResult.componentName}.tsx`)}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30"
              >
                Insert as Component
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
