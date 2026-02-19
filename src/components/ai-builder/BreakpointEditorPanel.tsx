import { X, Monitor, Tablet, Smartphone, Plus, Trash2, Download } from 'lucide-react';
import type { Breakpoint, BreakpointOverride } from '@/hooks/useResponsiveBreakpointEditor';
import { useState } from 'react';

interface BreakpointEditorPanelProps {
  open: boolean;
  onClose: () => void;
  breakpoints: Breakpoint[];
  activeBreakpoint: string;
  onSetActive: (id: string) => void;
  overrides: BreakpointOverride[];
  onAddOverride: (bpId: string, selector: string, property: string, value: string) => void;
  onRemoveOverride: (id: string) => void;
  generatedCSS: string;
  onApplyCSS: (css: string) => void;
}

export function BreakpointEditorPanel({ open, onClose, breakpoints, activeBreakpoint, onSetActive, overrides, onAddOverride, onRemoveOverride, generatedCSS, onApplyCSS }: BreakpointEditorPanelProps) {
  const [newSelector, setNewSelector] = useState('');
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');

  if (!open) return null;

  const activeOverrides = overrides.filter(o => o.breakpointId === activeBreakpoint);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Responsive Breakpoint Editor</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-1 overflow-x-auto">
            {breakpoints.map(bp => (
              <button
                key={bp.id}
                onClick={() => onSetActive(bp.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${activeBreakpoint === bp.id ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                style={{ backgroundColor: activeBreakpoint === bp.id ? `${bp.color}33` : 'transparent', borderColor: activeBreakpoint === bp.id ? `${bp.color}66` : 'transparent', borderWidth: 1 }}
              >
                {bp.icon} {bp.name} ({bp.minWidth}–{bp.maxWidth}px)
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Overrides ({activeOverrides.length})</span>
            </div>
            {activeOverrides.map(o => (
              <div key={o.id} className="flex items-center gap-2 p-2 bg-black/20 rounded-lg text-[10px]">
                <code className="text-cyan-400/60">{o.selector}</code>
                <span className="text-white/20">→</span>
                <code className="text-amber-400/60">{o.property}: {o.value}</code>
                <button onClick={() => onRemoveOverride(o.id)} className="ml-auto text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input value={newSelector} onChange={e => setNewSelector(e.target.value)} placeholder=".class" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-[10px] text-white/80" />
            <input value={newProperty} onChange={e => setNewProperty(e.target.value)} placeholder="font-size" className="w-24 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-[10px] text-white/80" />
            <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="14px" className="w-20 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-[10px] text-white/80" />
            <button onClick={() => { if (newSelector && newProperty && newValue) { onAddOverride(activeBreakpoint, newSelector, newProperty, newValue); setNewSelector(''); setNewProperty(''); setNewValue(''); } }} className="h-7 w-7 flex items-center justify-center bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {generatedCSS && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/30">Generated CSS</span>
              <pre className="bg-black/40 rounded-lg p-2 text-[10px] font-mono text-white/50 overflow-auto max-h-32">{generatedCSS}</pre>
              <button onClick={() => onApplyCSS(generatedCSS)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30">
                <Download className="h-3 w-3 inline mr-1" />Apply to Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
