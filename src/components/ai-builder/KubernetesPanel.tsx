import { X, Server, Copy } from 'lucide-react';

interface Props {
  config: any;
  setConfig: (c: any) => void;
  addEnvVar: (key: string, value: string) => void;
  removeEnvVar: (key: string) => void;
  generateDeployment: () => string;
  generateService: () => string;
  generateIngress: () => string;
  generateHPA: () => string;
  generateAll: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function KubernetesPanel({ config, setConfig, addEnvVar, removeEnvVar, generateAll, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Server className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium text-white">Kubernetes Manifest Generator</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'App Name', key: 'appName' },
              { label: 'Namespace', key: 'namespace' },
              { label: 'Image', key: 'image' },
              { label: 'Health Path', key: 'healthPath' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-white/40 block mb-0.5">{f.label}</label>
                <input value={config[f.key]} onChange={e => setConfig({ ...config, [f.key]: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80 font-mono" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Replicas</label>
              <input type="number" value={config.replicas} onChange={e => setConfig({ ...config, replicas: +e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Service Type</label>
              <select value={config.serviceType} onChange={e => setConfig({ ...config, serviceType: e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80">
                <option value="ClusterIP">ClusterIP</option>
                <option value="NodePort">NodePort</option>
                <option value="LoadBalancer">LoadBalancer</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Container Port</label>
              <input type="number" value={config.containerPort} onChange={e => setConfig({ ...config, containerPort: +e.target.value })} className="w-full px-2 py-1 text-xs bg-white/[0.04] border border-white/[0.08] rounded text-white/80" />
            </div>
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-[11px] text-white/50">
              <input type="checkbox" checked={config.ingressEnabled} onChange={e => setConfig({ ...config, ingressEnabled: e.target.checked })} className="rounded" />
              Ingress
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-white/50">
              <input type="checkbox" checked={config.hpaEnabled} onChange={e => setConfig({ ...config, hpaEnabled: e.target.checked })} className="rounded" />
              HPA
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-white/50">
              <input type="checkbox" checked={config.tlsEnabled} onChange={e => setConfig({ ...config, tlsEnabled: e.target.checked })} className="rounded" />
              TLS
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Generated Manifests</span>
              <button onClick={() => navigator.clipboard.writeText(generateAll())} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
            </div>
            <pre className="text-[10px] text-violet-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-60 overflow-y-auto">{generateAll()}</pre>
            <button onClick={() => onInsertCode(generateAll())} className="px-3 py-1.5 text-xs rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30">Insert All Manifests</button>
          </div>
        </div>
      </div>
    </div>
  );
}
