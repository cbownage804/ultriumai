import { X, HeartPulse, Copy, Plus, Trash2 } from 'lucide-react';

interface Props {
  config: any;
  setConfig: (c: any) => void;
  addDependency: (name: string, type: string) => void;
  removeDependency: (id: string) => void;
  toggleDependency: (id: string) => void;
  updateDependency: (id: string, updates: any) => void;
  generateEdgeFunction: () => string;
  generateReactComponent: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function HealthCheckPanel({ config, setConfig, addDependency, removeDependency, toggleDependency, updateDependency, generateEdgeFunction, generateReactComponent, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-rose-400" /><span className="text-sm font-medium text-white">Health Check Generator</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Endpoint Path</label>
              <input value={config.path} onChange={e => setConfig({ ...config, path: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80 font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Format</label>
              <select value={config.format} onChange={e => setConfig({ ...config, format: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80">
                <option value="simple">Simple</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { label: 'Version', key: 'includeVersion' },
              { label: 'Uptime', key: 'includeUptime' },
              { label: 'Memory', key: 'includeMemory' },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-1.5 text-[11px] text-white/50">
                <input type="checkbox" checked={config[f.key]} onChange={e => setConfig({ ...config, [f.key]: e.target.checked })} className="rounded" />
                {f.label}
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Dependencies</span>
              <button onClick={() => addDependency('New Check', 'api')} className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {config.dependencies?.map((dep: any) => (
              <div key={dep.id} className={`flex items-center gap-2 p-2 rounded-lg border ${dep.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] opacity-40'}`}>
                <input type="checkbox" checked={dep.enabled} onChange={() => toggleDependency(dep.id)} className="rounded" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">{dep.name}</span>
                    <span className="text-[9px] text-white/30 font-mono">{dep.type}</span>
                    {dep.critical && <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded">critical</span>}
                  </div>
                </div>
                <button onClick={() => updateDependency(dep.id, { critical: !dep.critical })} className="text-[9px] text-white/30 hover:text-white/50">{dep.critical ? 'optional' : 'critical'}</button>
                <button onClick={() => removeDependency(dep.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Edge Function</span>
              <button onClick={() => navigator.clipboard.writeText(generateEdgeFunction())} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-rose-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-48 overflow-y-auto">{generateEdgeFunction()}</pre>
            <div className="flex gap-2">
              <button onClick={() => onInsertCode(generateEdgeFunction())} className="px-2.5 py-1 text-[10px] rounded bg-rose-500/20 text-rose-300">Insert Edge Function</button>
              <button onClick={() => onInsertCode(generateReactComponent())} className="px-2.5 py-1 text-[10px] rounded bg-emerald-500/20 text-emerald-300">Insert Status Badge</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
