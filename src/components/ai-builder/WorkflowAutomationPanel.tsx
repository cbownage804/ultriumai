import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Workflow, X, Plus, Trash2, Play, Download } from 'lucide-react';
import type { Workflow as WorkflowType } from '@/hooks/useNLWorkflowAutomation';

interface WorkflowAutomationPanelProps {
  workflows: WorkflowType[];
  nlPrompt: string;
  onSetNlPrompt: (p: string) => void;
  onAddWorkflow: (name: string, desc: string) => void;
  onRemoveWorkflow: (id: string) => void;
  onToggleWorkflow: (id: string) => void;
  onGenerateFromNL: (prompt: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function WorkflowAutomationPanel({
  workflows, nlPrompt, onSetNlPrompt,
  onAddWorkflow, onRemoveWorkflow, onToggleWorkflow,
  onGenerateFromNL, onGenerateCode, onInsertCode, onClose,
}: WorkflowAutomationPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Workflow Automation</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Describe workflow in natural language</Label>
            <Textarea value={nlPrompt} onChange={e => onSetNlPrompt(e.target.value)} placeholder="e.g. When a user signs up, send welcome email and create profile" className="text-xs min-h-[80px]" />
          </div>
          <Button size="sm" onClick={() => { if (nlPrompt.trim()) onGenerateFromNL(nlPrompt); }} className="w-full gap-1" disabled={!nlPrompt.trim()}>
            <Play className="w-3 h-3" /> Generate Workflow
          </Button>
          <div className="space-y-2 pt-2">
            <Label className="text-xs text-muted-foreground">Workflows ({workflows.length})</Label>
            {workflows.map(wf => (
              <div key={wf.id} className="bg-muted/30 rounded p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{wf.name}</span>
                  <div className="flex items-center gap-1">
                    <Switch checked={wf.isActive} onCheckedChange={() => onToggleWorkflow(wf.id)} />
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onRemoveWorkflow(wf.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{wf.description}</p>
                <div className="flex flex-wrap gap-1">
                  {wf.steps.map(s => (
                    <Badge key={s.id} variant="outline" className="text-[10px]">{s.type}: {s.name}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>Runs: {wf.runCount}</span>
                  {wf.isActive && <Badge variant="default" className="text-[10px]">Active</Badge>}
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateCode())}>
            <Download className="w-3 h-3" /> Export Engine Code
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
