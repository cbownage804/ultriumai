import { X, Video, Plus, Trash2, Copy } from 'lucide-react';
import type { VideoEmbed } from '@/hooks/useVideoEmbedManager';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  embeds: VideoEmbed[];
  onAdd: (url: string, title?: string) => VideoEmbed | null;
  onRemove: (id: string) => void;
  onInsertCode: (code: string) => void;
}

export function VideoEmbedPanel({ open, onClose, embeds, onAdd, onRemove, onInsertCode }: Props) {
  const [url, setUrl] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Video className="h-4 w-4 text-red-400" /><span className="text-sm font-medium text-white">Video Embed Manager</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube, Vimeo, or Loom URL..." className="flex-1 bg-black/30 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20" />
            <button onClick={() => { const result = onAdd(url); if (result) setUrl(''); }} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {embeds.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {embeds.map(e => (
                <div key={e.id} className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                  {e.thumbnailUrl && <img src={e.thumbnailUrl} alt="" className="h-12 w-20 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70">{e.title}</div>
                    <div className="text-[10px] text-white/30">{e.platform} · {e.videoId}</div>
                  </div>
                  <button onClick={() => onInsertCode(e.embedCode)} className="text-[10px] text-cyan-400 hover:text-cyan-300 shrink-0">Insert</button>
                  <button onClick={() => onRemove(e.id)} className="text-white/20 hover:text-red-400 shrink-0"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
