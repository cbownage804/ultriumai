import { X, Server, ArrowRight, Check } from 'lucide-react';
import type { Environment } from '@/hooks/useEnvironmentManager';

interface Props {
  open: boolean;
  onClose: () => void;
  environments: Environment[];
  activeEnv: string;
  onSwitch: (id: string) => void;
  onPromote: (from: string, to: string) => void;
  onUpdateVars: (id: string, vars: Record<string, string>) => void;
}

export function EnvironmentManagerPanel({ open, onClose, environments, activeEnv, onSwitch, onPromote, onUpdateVars }: Props) {
  if (!open) return null;
  const colors: Record<string, string> = { development: 'text-cyan-400', staging: 'text-amber-400', production: 'text-emerald-400' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Server className="h-4 w-4 text-cyan-400" /><span className="text-sm font-medium text-white">Environment Manager</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {environments.map((env, i) => (
            <div key={env.id} className="flex items-center gap-3">
              <div className={`flex-1 p-3 rounded-lg border ${env.id === activeEnv ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${colors[env.name] || 'text-white'}`}>{env.label}</span>
                  {env.id === activeEnv && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Active</span>}
                  {env.lastDeployed && <span className="text-[10px] text-white/30">deployed {env.lastDeployed.toLocaleDateString()}</span>}
                </div>
                <div className="text-[10px] text-white/30">{Object.keys(env.envVars).length} env vars configured</div>
                {env.id !== activeEnv && (
                  <button onClick={() => onSwitch(env.id)} className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300">Switch to this environment</button>
                )}
              </div>
              {i < environments.length - 1 && (
                <button onClick={() => onPromote(env.id, environments[i + 1].id)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5" title={`Promote to ${environments[i + 1].label}`}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
