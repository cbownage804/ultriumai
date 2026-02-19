import { X, GitBranch, Copy, Plus, Trash2 } from 'lucide-react';

interface Props {
  pipelines: any[];
  activePipelineId: string;
  setActivePipelineId: (id: string) => void;
  getActivePipeline: () => any;
  createPipeline: (name: string) => void;
  deletePipeline: (id: string) => void;
  updatePipeline: (id: string, updates: any) => void;
  addStage: (pipelineId: string, name: string, type: string) => void;
  removeStage: (pipelineId: string, stageId: string) => void;
  toggleStage: (pipelineId: string, stageId: string) => void;
  generateGitHubActions: (pipeline: any) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function CICDPipelinePanel({ pipelines, activePipelineId, setActivePipelineId, getActivePipeline, createPipeline, deletePipeline, toggleStage, generateGitHubActions, onInsertCode, onClose }: Props) {
  const active = getActivePipeline();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-orange-400" /><span className="text-sm font-medium text-white">CI/CD Pipeline Designer</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex gap-2 items-center flex-wrap">
            {pipelines.map(p => (
              <button key={p.id} onClick={() => setActivePipelineId(p.id)} className={`px-2.5 py-1 text-[11px] rounded-md border ${p.id === activePipelineId ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' : 'border-white/[0.06] text-white/40 hover:text-white/60'}`}>
                {p.name}
              </button>
            ))}
            <button onClick={() => createPipeline('New Pipeline')} className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
          </div>

          {active && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-white/40 block mb-0.5">Trigger</label>
                  <span className="text-xs text-white/70 font-mono">{active.trigger}</span>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-0.5">Branch</label>
                  <span className="text-xs text-white/70 font-mono">{active.branch}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-white/50 font-medium">Stages</span>
                {active.stages.map((stage: any) => (
                  <div key={stage.id} className={`flex items-center gap-2 p-2 rounded-lg border ${stage.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] opacity-40'}`}>
                    <input type="checkbox" checked={stage.enabled} onChange={() => toggleStage(active.id, stage.id)} className="rounded" />
                    <div className="flex-1">
                      <span className="text-xs text-white/70">{stage.name}</span>
                      <span className="text-[10px] text-white/30 ml-2 font-mono">{stage.type}</span>
                    </div>
                    {stage.dependsOn.length > 0 && <span className="text-[9px] text-white/20">needs: {stage.dependsOn.join(', ')}</span>}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Generated GitHub Actions YAML</span>
                  <button onClick={() => navigator.clipboard.writeText(generateGitHubActions(active))} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
                </div>
                <pre className="text-[10px] text-orange-400/70 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg p-2 max-h-60 overflow-y-auto">{generateGitHubActions(active)}</pre>
                <button onClick={() => onInsertCode(generateGitHubActions(active))} className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30">Insert Pipeline YAML</button>
              </div>
            </>
          )}

          {pipelines.length > 1 && active && (
            <button onClick={() => deletePipeline(active.id)} className="text-[10px] text-red-400/60 hover:text-red-400 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete Pipeline</button>
          )}
        </div>
      </div>
    </div>
  );
}
