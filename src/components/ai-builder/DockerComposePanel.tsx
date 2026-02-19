import { X, Container, Copy, Plus, Trash2 } from 'lucide-react';

interface Props {
  config: any;
  setConfig: (c: any) => void;
  presetKeys: string[];
  applyPreset: (key: string) => void;
  addService: (name: string, image: string) => void;
  removeService: (id: string) => void;
  updateService: (id: string, updates: any) => void;
  generateDockerfile: () => string;
  generateCompose: () => string;
  generateNginxConf: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function DockerComposePanel({ config, presetKeys, applyPreset, addService, removeService, generateDockerfile, generateCompose, generateNginxConf, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Container className="h-4 w-4 text-blue-400" /><span className="text-sm font-medium text-white">Docker Compose Generator</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {presetKeys.map(k => (
              <button key={k} onClick={() => applyPreset(k)} className="px-2.5 py-1 text-[11px] rounded-md bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20">{k}</button>
            ))}
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-white/50">
              <input type="checkbox" checked={config.useMultiStage} onChange={e => config.setConfig?.({ ...config, useMultiStage: e.target.checked })} className="rounded" />
              Multi-stage build
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 font-medium">Services ({config.services?.length || 0})</span>
              <button onClick={() => addService('new-service', 'alpine:latest')} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {config.services?.map((svc: any) => (
              <div key={svc.id} className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/70 font-mono">{svc.name}</span>
                  <button onClick={() => removeService(svc.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
                <span className="text-[10px] text-white/30 font-mono">{svc.image}</span>
                {svc.ports.length > 0 && <div className="text-[10px] text-white/40 mt-1">Ports: {svc.ports.join(', ')}</div>}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Dockerfile</span>
              <button onClick={() => { navigator.clipboard.writeText(generateDockerfile()); }} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-cyan-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-40 overflow-y-auto">{generateDockerfile()}</pre>
            <button onClick={() => onInsertCode(generateDockerfile())} className="px-2.5 py-1 text-[10px] rounded bg-blue-500/20 text-blue-300">Insert Dockerfile</button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">docker-compose.yml</span>
              <button onClick={() => { navigator.clipboard.writeText(generateCompose()); }} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-green-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-40 overflow-y-auto">{generateCompose()}</pre>
            <button onClick={() => onInsertCode(generateCompose())} className="px-2.5 py-1 text-[10px] rounded bg-green-500/20 text-green-300">Insert Compose</button>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-white/50">nginx.conf</span>
            <pre className="text-[10px] text-amber-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-32 overflow-y-auto">{generateNginxConf()}</pre>
            <button onClick={() => onInsertCode(generateNginxConf())} className="px-2.5 py-1 text-[10px] rounded bg-amber-500/20 text-amber-300">Insert nginx.conf</button>
          </div>
        </div>
      </div>
    </div>
  );
}
