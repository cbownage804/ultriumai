import { X, Lock, Copy } from 'lucide-react';
import type { CSPConfig } from '@/hooks/useCSPGenerator';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface Props {
  open: boolean;
  onClose: () => void;
  config: CSPConfig;
  onAnalyze: (files: ProjectFile[]) => void;
  onToggleDirective: (name: string) => void;
  onAddSource: (directive: string, source: string) => void;
  onRemoveSource: (directive: string, source: string) => void;
  onSetReportOnly: (val: boolean) => void;
  onGenerateCSP: () => string;
  onGenerateMetaTag: () => string;
  files: ProjectFile[];
}

export function CSPGeneratorPanel({ open, onClose, config, onAnalyze, onToggleDirective, onRemoveSource, onSetReportOnly, onGenerateCSP, onGenerateMetaTag, files }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium text-white">CSP Generator</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => onAnalyze(files)} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg">Analyze Project</button>
            <label className="flex items-center gap-1.5 text-xs text-white/50">
              <input type="checkbox" checked={config.reportOnly} onChange={e => onSetReportOnly(e.target.checked)} className="rounded" />
              Report-Only Mode
            </label>
          </div>

          {config.directives.map(d => (
            <div key={d.name} className={`p-3 rounded-lg border ${d.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] bg-white/[0.01] opacity-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.enabled} onChange={() => onToggleDirective(d.name)} className="rounded" />
                  <span className="text-xs text-white/70 font-mono">{d.name}</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {d.sources.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-white/50 font-mono">
                    {s}
                    <button onClick={() => onRemoveSource(d.name, s)} className="text-white/20 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className="p-3 rounded-lg bg-white/[0.03]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/50">Generated Header</span>
              <button onClick={() => navigator.clipboard.writeText(onGenerateCSP())} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-cyan-400/70 font-mono whitespace-pre-wrap break-all">{onGenerateCSP()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
