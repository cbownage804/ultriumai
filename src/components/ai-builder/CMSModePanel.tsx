import { X, Pencil, Eye, Download } from 'lucide-react';
import type { CMSBlock } from '@/hooks/useCMSMode';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: () => void;
  blocks: CMSBlock[];
  onUpdateBlock: (id: string, content: string) => void;
  onExport: () => string;
  editingBlock: string | null;
  onSetEditing: (id: string | null) => void;
}

export function CMSModePanel({ open, onClose, isEnabled, onToggle, blocks, onUpdateBlock, onExport, editingBlock, onSetEditing }: Props) {
  const [editValue, setEditValue] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Pencil className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium text-white">CMS Mode</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(onExport()); }} className="text-[10px] text-white/30 hover:text-white/60">Export JSON</button>
            <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Content editing mode</span>
            <button onClick={onToggle} className={`h-6 w-10 rounded-full transition-colors ${isEnabled ? 'bg-violet-500' : 'bg-white/10'} relative`}>
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${isEnabled ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {blocks.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No content blocks detected. Enable CMS mode and load a preview.</p>
            ) : blocks.map(b => (
              <div key={b.id} className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                {editingBlock === b.id ? (
                  <div className="space-y-1">
                    <input value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white/80" autoFocus />
                    <div className="flex gap-1">
                      <button onClick={() => { onUpdateBlock(b.id, editValue); onSetEditing(null); }} className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">Save</button>
                      <button onClick={() => onSetEditing(null)} className="text-[10px] px-2 py-0.5 text-white/30">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-white/20 mr-2">{b.type}</span>
                      <span className="text-xs text-white/70">{b.content.slice(0, 60)}</span>
                    </div>
                    <button onClick={() => { setEditValue(b.content); onSetEditing(b.id); }} className="text-[10px] text-cyan-400 hover:text-cyan-300">Edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
