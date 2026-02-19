import { useState } from 'react';
import { X, GitBranch, Plus, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WorkflowConfig } from '@/hooks/useGitHubActionsGenerator';

interface GitHubActionsPanel_Props {
  workflows: WorkflowConfig[];
  onAddWorkflow: (name: string, trigger: WorkflowConfig['trigger']) => void;
  onRemoveWorkflow: (index: number) => void;
  onToggleStep: (wfIndex: number, stepId: string) => void;
  onGenerateYAML: (wf: WorkflowConfig) => string;
  onClose: () => void;
}

export function GitHubActionsPanel({ workflows, onAddWorkflow, onRemoveWorkflow, onToggleStep, onGenerateYAML, onClose }: GitHubActionsPanel_Props) {
  const [expandedWf, setExpandedWf] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState('');

  const copyYAML = (wf: WorkflowConfig) => {
    navigator.clipboard.writeText(onGenerateYAML(wf));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#0a0a0f] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-white">GitHub Actions Generator</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {workflows.map((wf, i) => (
          <div key={i} className="bg-white/[0.03] rounded-lg border border-white/[0.06] overflow-hidden">
            <button onClick={() => setExpandedWf(expandedWf === i ? -1 : i)} className="w-full flex items-center gap-2 p-3 text-left">
              {expandedWf === i ? <ChevronDown className="h-3 w-3 text-white/40" /> : <ChevronRight className="h-3 w-3 text-white/40" />}
              <span className="text-sm text-white font-medium flex-1">{wf.name}</span>
              <span className="text-[10px] text-white/30 bg-white/[0.06] rounded px-1.5 py-0.5">{wf.trigger}</span>
              <button onClick={e => { e.stopPropagation(); onRemoveWorkflow(i); }} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
            </button>
            {expandedWf === i && (
              <div className="px-3 pb-3 space-y-2">
                <Label className="text-white/50 text-[10px]">Steps</Label>
                {wf.steps.map(step => (
                  <label key={step.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={step.enabled} onChange={() => onToggleStep(i, step.id)} className="rounded border-white/20" />
                    <span className={step.enabled ? 'text-white/80' : 'text-white/30'}>{step.name}</span>
                  </label>
                ))}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-white/50 text-[10px]">Generated YAML</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyYAML(wf)} className="h-5 px-1.5 text-[10px] text-white/40 hover:text-white">
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <pre className="bg-black/40 rounded p-2 text-[10px] text-white/50 font-mono overflow-auto max-h-48 whitespace-pre-wrap">{onGenerateYAML(wf)}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Workflow name" className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8 flex-1" />
          <Button size="sm" onClick={() => { if (newName) { onAddWorkflow(newName, 'push'); setNewName(''); } }} className="h-8 px-3 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/20 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
