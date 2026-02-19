import { X, Plus, Trash2, Upload, Code, Shield } from 'lucide-react';
import type { UploadConfig, UploadPreview } from '@/hooks/useFileUploadManager';
import { cn } from '@/lib/utils';

interface FileUploadPanelProps {
  open: boolean;
  onClose: () => void;
  configs: UploadConfig[];
  previews: UploadPreview[];
  activeConfig: UploadConfig | null;
  mimePresets: Record<string, string[]>;
  onSetActiveConfig: (id: string) => void;
  onCreateConfig: (name: string) => void;
  onUpdateConfig: (id: string, update: Partial<UploadConfig>) => void;
  onRemoveConfig: (id: string) => void;
  onSimulateUpload: (configId: string, fileName: string) => void;
  onClearPreviews: () => void;
  onGeneratePolicy: (configId: string) => string;
  onGenerateComponent: (configId: string) => string;
  onInsertCode: (code: string) => void;
}

export function FileUploadPanel({ open, onClose, configs, previews, activeConfig, mimePresets, onSetActiveConfig, onCreateConfig, onUpdateConfig, onRemoveConfig, onSimulateUpload, onClearPreviews, onGeneratePolicy, onGenerateComponent, onInsertCode }: FileUploadPanelProps) {
  if (!open) return null;

  const configPreviews = activeConfig ? previews.filter(p => p.configId === activeConfig.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[750px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">File Upload Manager</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 border-r border-white/[0.06] p-2 overflow-y-auto space-y-1">
            <button onClick={() => onCreateConfig('Uploads')} className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded">
              <Plus className="h-3 w-3" /> New Config
            </button>
            {configs.map(c => (
              <button key={c.id} onClick={() => onSetActiveConfig(c.id)} className={cn("w-full text-left px-3 py-1.5 text-[11px] rounded truncate", activeConfig?.id === c.id ? 'bg-emerald-500/10 text-emerald-300' : 'text-white/40 hover:bg-white/5')}>
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeConfig ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Bucket Name</label>
                    <input value={activeConfig.bucket} onChange={e => onUpdateConfig(activeConfig.id, { bucket: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Max Size (MB)</label>
                    <input type="number" value={activeConfig.maxSizeMB} onChange={e => onUpdateConfig(activeConfig.id, { maxSizeMB: Number(e.target.value) })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 block mb-1">Max Files</label>
                    <input type="number" value={activeConfig.maxFiles} onChange={e => onUpdateConfig(activeConfig.id, { maxFiles: Number(e.target.value) })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <label className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <input type="checkbox" checked={activeConfig.isPublic} onChange={e => onUpdateConfig(activeConfig.id, { isPublic: e.target.checked })} className="h-3 w-3" /> Public
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/50">
                      <input type="checkbox" checked={activeConfig.generateThumbnails} onChange={e => onUpdateConfig(activeConfig.id, { generateThumbnails: e.target.checked })} className="h-3 w-3" /> Thumbnails
                    </label>
                  </div>
                </div>

                {/* MIME presets */}
                <div>
                  <label className="text-[10px] text-white/30 block mb-1">Allowed Types</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(mimePresets).map(preset => (
                      <button key={preset} onClick={() => onUpdateConfig(activeConfig.id, { allowedTypes: mimePresets[preset] })} className={cn("px-2 py-0.5 text-[10px] rounded border", activeConfig.allowedTypes === mimePresets[preset] ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'text-white/30 border-white/[0.06] hover:bg-white/5')}>
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Test Uploads</span>
                    <button onClick={() => onSimulateUpload(activeConfig.id, `test-${Date.now()}.png`)} className="text-[10px] text-emerald-400 hover:text-emerald-300">Simulate Upload</button>
                  </div>
                  {configPreviews.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-black/20 rounded px-2 py-1">
                      <span className="text-[10px] text-white/40 flex-1 truncate">{p.fileName}</span>
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", p.status === 'success' ? 'bg-emerald-400' : p.status === 'error' ? 'bg-red-400' : 'bg-cyan-400')} style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-[9px] text-white/20">{Math.round(p.progress)}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                  <button onClick={() => onInsertCode(onGeneratePolicy(activeConfig.id))} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded text-[11px] hover:bg-emerald-500/30">
                    <Shield className="h-3 w-3" /> Storage Policy
                  </button>
                  <button onClick={() => onInsertCode(onGenerateComponent(activeConfig.id))} className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-[11px] hover:bg-violet-500/30">
                    <Code className="h-3 w-3" /> Upload Component
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/20 text-center py-8">Create a config to get started</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
