import { X, FileText, Copy } from 'lucide-react';

interface Props {
  config: any;
  setConfig: (c: any) => void;
  addTransport: (type: string) => void;
  removeTransport: (id: string) => void;
  toggleTransport: (id: string) => void;
  addRedactKey: (key: string) => void;
  removeRedactKey: (key: string) => void;
  generateCode: () => string;
  previewLog: (log: any) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function StructuredLoggerPanel({ config, setConfig, toggleTransport, removeRedactKey, generateCode, previewLog, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-teal-400" /><span className="text-sm font-medium text-white">Structured Logger</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Level</label>
              <select value={config.level} onChange={e => setConfig({ ...config, level: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80">
                {['trace','debug','info','warn','error','fatal'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Format</label>
              <select value={config.format} onChange={e => setConfig({ ...config, format: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80">
                {['json','pretty','compact'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Timestamp</label>
              <select value={config.timestampFormat} onChange={e => setConfig({ ...config, timestampFormat: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80">
                {['iso','epoch','locale'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span className="text-xs text-white/50 font-medium">Transports</span>
            <div className="space-y-1 mt-1">
              {config.transports?.map((t: any) => (
                <div key={t.id} className={`flex items-center gap-2 p-1.5 rounded border ${t.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] opacity-40'}`}>
                  <input type="checkbox" checked={t.enabled} onChange={() => toggleTransport(t.id)} className="rounded" />
                  <span className="text-xs text-white/70 font-mono">{t.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-white/50 font-medium">Redacted Keys</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.redactKeys?.map((k: string) => (
                <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-[10px] text-red-300 font-mono">
                  {k} <button onClick={() => removeRedactKey(k)} className="text-red-400/50 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-white/50 font-medium">Sample Output</span>
            <div className="space-y-1 mt-1">
              {config.sampleLogs?.map((log: any, i: number) => (
                <pre key={i} className="text-[10px] text-teal-400/60 font-mono bg-white/[0.02] rounded p-1.5 whitespace-pre-wrap">{previewLog(log)}</pre>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Generated Logger</span>
              <button onClick={() => navigator.clipboard.writeText(generateCode())} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-teal-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-48 overflow-y-auto">{generateCode()}</pre>
            <button onClick={() => onInsertCode(generateCode())} className="px-3 py-1.5 text-xs rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30">Insert Logger Code</button>
          </div>
        </div>
      </div>
    </div>
  );
}
