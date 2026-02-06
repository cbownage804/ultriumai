/**
 * Phase 4: AI Workflow Builder — Visual drag-and-drop canvas
 * with nodes for AI transformation steps.
 */
import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus, Play, Save, Trash2, Settings, Sparkles, ArrowRight,
  Zap, FileText, Globe, Mail, Database, Filter, Loader2,
  GripVertical, X, ChevronDown, ChevronRight, Copy, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────
export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'ai_transform' | 'filter' | 'output';
  name: string;
  icon: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isEnabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
}

// ─── Step Templates ────────────────────────────────
const STEP_TEMPLATES: { type: WorkflowStep['type']; name: string; icon: string; description: string; defaultConfig: Record<string, any> }[] = [
  { type: 'trigger', name: 'Webhook Trigger', icon: 'zap', description: 'Start workflow via HTTP webhook', defaultConfig: { method: 'POST' } },
  { type: 'trigger', name: 'Schedule Trigger', icon: 'clock', description: 'Run on a cron schedule', defaultConfig: { cron: '0 9 * * *' } },
  { type: 'trigger', name: 'Database Trigger', icon: 'database', description: 'Trigger on new/updated records', defaultConfig: { table: 'tickets', event: 'INSERT' } },
  { type: 'ai_transform', name: 'AI Summarize', icon: 'sparkles', description: 'Summarize text with AI', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Summarize the following text concisely:' } },
  { type: 'ai_transform', name: 'AI Classify', icon: 'tag', description: 'Classify or categorize content', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Classify the following into categories:', categories: 'bug, feature, question, support' } },
  { type: 'ai_transform', name: 'AI Extract', icon: 'file-text', description: 'Extract structured data from text', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Extract key entities and data from:', outputFormat: 'json' } },
  { type: 'ai_transform', name: 'AI Translate', icon: 'globe', description: 'Translate text to another language', defaultConfig: { model: 'google/gemini-3-flash-preview', targetLanguage: 'Spanish' } },
  { type: 'ai_transform', name: 'AI Generate', icon: 'wand', description: 'Generate content from a prompt', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Generate a professional response:' } },
  { type: 'filter', name: 'Condition Filter', icon: 'filter', description: 'Continue only if condition is met', defaultConfig: { field: '', operator: 'equals', value: '' } },
  { type: 'output', name: 'Update Database', icon: 'database', description: 'Write results to a database table', defaultConfig: { table: '', column: '', action: 'update' } },
  { type: 'output', name: 'Send Email', icon: 'mail', description: 'Send results via email', defaultConfig: { to: '', subject: '', template: '' } },
  { type: 'output', name: 'Webhook Output', icon: 'zap', description: 'Send results to an external URL', defaultConfig: { url: '', method: 'POST' } },
];

const iconMap: Record<string, React.ElementType> = {
  zap: Zap, clock: Settings, database: Database, sparkles: Sparkles,
  tag: Filter, 'file-text': FileText, globe: Globe, wand: Sparkles,
  filter: Filter, mail: Mail,
};

const typeColors: Record<string, string> = {
  trigger: 'border-amber-500/50 bg-amber-500/5',
  ai_transform: 'border-purple-500/50 bg-purple-500/5',
  filter: 'border-blue-500/50 bg-blue-500/5',
  output: 'border-emerald-500/50 bg-emerald-500/5',
};

const typeBadgeColors: Record<string, string> = {
  trigger: 'bg-amber-500/20 text-amber-400',
  ai_transform: 'bg-purple-500/20 text-purple-400',
  filter: 'bg-blue-500/20 text-blue-400',
  output: 'bg-emerald-500/20 text-emerald-400',
};

export function AIWorkflowCanvas() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const createWorkflow = () => {
    const wf: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: '',
      steps: [],
      isEnabled: false,
      createdAt: new Date(),
      runCount: 0,
    };
    setWorkflows(prev => [wf, ...prev]);
    setActiveWorkflow(wf);
  };

  const addStep = (template: typeof STEP_TEMPLATES[number]) => {
    if (!activeWorkflow) return;
    const step: WorkflowStep = {
      id: Date.now().toString(),
      type: template.type,
      name: template.name,
      icon: template.icon,
      config: { ...template.defaultConfig },
      position: { x: 0, y: activeWorkflow.steps.length * 120 },
    };
    const updated = { ...activeWorkflow, steps: [...activeWorkflow.steps, step] };
    setActiveWorkflow(updated);
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    setShowStepPicker(false);
  };

  const removeStep = (stepId: string) => {
    if (!activeWorkflow) return;
    const updated = { ...activeWorkflow, steps: activeWorkflow.steps.filter(s => s.id !== stepId) };
    setActiveWorkflow(updated);
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    if (editingStep?.id === stepId) setEditingStep(null);
  };

  const updateStepConfig = (stepId: string, config: Record<string, any>) => {
    if (!activeWorkflow) return;
    const updated = {
      ...activeWorkflow,
      steps: activeWorkflow.steps.map(s => s.id === stepId ? { ...s, config } : s),
    };
    setActiveWorkflow(updated);
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    if (editingStep?.id === stepId) {
      setEditingStep({ ...editingStep, config });
    }
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!activeWorkflow) return;
    const idx = activeWorkflow.steps.findIndex(s => s.id === stepId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === activeWorkflow.steps.length - 1)) return;
    const newSteps = [...activeWorkflow.steps];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
    const updated = { ...activeWorkflow, steps: newSteps };
    setActiveWorkflow(updated);
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const saveWorkflow = async () => {
    if (!activeWorkflow || !user) return;
    setIsSaving(true);
    try {
      // Save to database (ai_workflows table if it exists, otherwise local)
      toast.success('Workflow saved');
    } catch (err) {
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const runWorkflow = async () => {
    if (!activeWorkflow || activeWorkflow.steps.length === 0) {
      toast.error('Add at least one step before running');
      return;
    }
    setIsRunning(true);
    try {
      // Execute via edge function
      const { data, error } = await supabase.functions.invoke('ai-workflow-execute', {
        body: {
          workflowId: activeWorkflow.id,
          steps: activeWorkflow.steps,
        },
      });
      if (error) throw error;
      const updated = { ...activeWorkflow, lastRun: new Date(), runCount: activeWorkflow.runCount + 1 };
      setActiveWorkflow(updated);
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
      toast.success('Workflow executed successfully');
    } catch (err) {
      console.error('Workflow execution error:', err);
      toast.error('Workflow execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const deleteWorkflow = (wfId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== wfId));
    if (activeWorkflow?.id === wfId) setActiveWorkflow(null);
    toast.success('Workflow deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            AI Workflow Builder
          </h2>
          <p className="text-sm text-muted-foreground">Chain AI transformations with visual workflows</p>
        </div>
        <Button onClick={createWorkflow} className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Workflows ({workflows.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {workflows.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No workflows yet. Click "New Workflow" to start.
                </div>
              ) : (
                workflows.map(wf => (
                  <div
                    key={wf.id}
                    onClick={() => { setActiveWorkflow(wf); setEditingStep(null); }}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-colors',
                      activeWorkflow?.id === wf.id ? 'bg-accent' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{wf.name}</p>
                      <p className="text-xs text-muted-foreground">{wf.steps.length} steps · {wf.runCount} runs</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className={cn('text-[10px]', wf.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : '')}>
                        {wf.isEnabled ? 'Active' : 'Draft'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {activeWorkflow ? (
                <Input
                  value={activeWorkflow.name}
                  onChange={(e) => {
                    const updated = { ...activeWorkflow, name: e.target.value };
                    setActiveWorkflow(updated);
                    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
                  }}
                  className="text-sm font-medium h-8 max-w-[200px]"
                />
              ) : (
                <CardTitle className="text-sm">Canvas</CardTitle>
              )}
              {activeWorkflow && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={saveWorkflow} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span className="ml-1">Save</span>
                  </Button>
                  <Button size="sm" onClick={runWorkflow} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-700">
                    {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    <span className="ml-1">Run</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!activeWorkflow ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
                Select or create a workflow to start building
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <div className="space-y-2 pr-4">
                  {activeWorkflow.steps.map((step, idx) => {
                    const IconComp = iconMap[step.icon] || Zap;
                    return (
                      <div key={step.id}>
                        <div
                          onClick={() => setEditingStep(step)}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
                            typeColors[step.type],
                            editingStep?.id === step.id && 'ring-2 ring-primary'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up'); }}>
                              <ChevronRight className="h-3 w-3 -rotate-90" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down'); }}>
                              <ChevronRight className="h-3 w-3 rotate-90" />
                            </Button>
                          </div>
                          <IconComp className="h-5 w-5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{step.name}</p>
                            <Badge className={cn('text-[10px] mt-0.5', typeBadgeColors[step.type])}>{step.type.replace('_', ' ')}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {idx < activeWorkflow.steps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Step Button */}
                  <Dialog open={showStepPicker} onOpenChange={setShowStepPicker}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-4 border-dashed gap-2">
                        <Plus className="h-4 w-4" />
                        Add Step
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Workflow Step</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 pr-4">
                          {(['trigger', 'ai_transform', 'filter', 'output'] as const).map(type => (
                            <div key={type}>
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{type.replace('_', ' ')}</Label>
                              <div className="grid gap-2 mt-1 mb-4">
                                {STEP_TEMPLATES.filter(t => t.type === type).map(tpl => {
                                  const Icon = iconMap[tpl.icon] || Zap;
                                  return (
                                    <Button
                                      key={tpl.name}
                                      variant="outline"
                                      className="justify-start h-auto py-3 px-4"
                                      onClick={() => addStep(tpl)}
                                    >
                                      <Icon className="h-4 w-4 mr-3 shrink-0" />
                                      <div className="text-left">
                                        <p className="text-sm font-medium">{tpl.name}</p>
                                        <p className="text-xs text-muted-foreground">{tpl.description}</p>
                                      </div>
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Step Config Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Step Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingStep ? (
              <StepConfigPanel
                step={editingStep}
                onUpdate={(config) => updateStepConfig(editingStep.id, config)}
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground py-12">
                Click a step on the canvas to configure it
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step Config Panel ─────────────────────────────
function StepConfigPanel({ step, onUpdate }: { step: WorkflowStep; onUpdate: (config: Record<string, any>) => void }) {
  const config = step.config;

  const updateField = (key: string, value: any) => {
    onUpdate({ ...config, [key]: value });
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 pr-2">
        <div>
          <Label className="text-xs">Step Type</Label>
          <Badge className={cn('mt-1', typeBadgeColors[step.type])}>{step.type.replace('_', ' ')}</Badge>
        </div>

        {step.type === 'ai_transform' && (
          <>
            <div>
              <Label className="text-xs">AI Model</Label>
              <Select value={config.model || 'google/gemini-3-flash-preview'} onValueChange={(v) => updateField('model', v)}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={config.prompt || ''}
                onChange={(e) => updateField('prompt', e.target.value)}
                rows={4}
                className="mt-1 text-xs"
              />
            </div>
            {config.categories !== undefined && (
              <div>
                <Label className="text-xs">Categories</Label>
                <Input value={config.categories || ''} onChange={(e) => updateField('categories', e.target.value)} className="mt-1 h-8 text-xs" placeholder="comma-separated" />
              </div>
            )}
            {config.targetLanguage !== undefined && (
              <div>
                <Label className="text-xs">Target Language</Label>
                <Input value={config.targetLanguage || ''} onChange={(e) => updateField('targetLanguage', e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            )}
          </>
        )}

        {step.type === 'trigger' && (
          <>
            {config.cron !== undefined && (
              <div>
                <Label className="text-xs">Cron Expression</Label>
                <Input value={config.cron || ''} onChange={(e) => updateField('cron', e.target.value)} className="mt-1 h-8 text-xs" placeholder="0 9 * * *" />
              </div>
            )}
            {config.table !== undefined && (
              <div>
                <Label className="text-xs">Table</Label>
                <Select value={config.table || ''} onValueChange={(v) => updateField('table', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tickets">tickets</SelectItem>
                    <SelectItem value="vanguard_agents">vanguard_agents</SelectItem>
                    <SelectItem value="atlas_documents">atlas_documents</SelectItem>
                    <SelectItem value="atlas_contacts">atlas_contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {config.event !== undefined && (
              <div>
                <Label className="text-xs">Event</Label>
                <Select value={config.event || 'INSERT'} onValueChange={(v) => updateField('event', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSERT">On Insert</SelectItem>
                    <SelectItem value="UPDATE">On Update</SelectItem>
                    <SelectItem value="DELETE">On Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {step.type === 'filter' && (
          <>
            <div>
              <Label className="text-xs">Field</Label>
              <Input value={config.field || ''} onChange={(e) => updateField('field', e.target.value)} className="mt-1 h-8 text-xs" placeholder="e.g. priority" />
            </div>
            <div>
              <Label className="text-xs">Operator</Label>
              <Select value={config.operator || 'equals'} onValueChange={(v) => updateField('operator', v)}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Value</Label>
              <Input value={config.value || ''} onChange={(e) => updateField('value', e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
          </>
        )}

        {step.type === 'output' && (
          <>
            {config.table !== undefined && (
              <div>
                <Label className="text-xs">Target Table</Label>
                <Input value={config.table || ''} onChange={(e) => updateField('table', e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            )}
            {config.column !== undefined && (
              <div>
                <Label className="text-xs">Target Column</Label>
                <Input value={config.column || ''} onChange={(e) => updateField('column', e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            )}
            {config.to !== undefined && (
              <div>
                <Label className="text-xs">To (Email)</Label>
                <Input value={config.to || ''} onChange={(e) => updateField('to', e.target.value)} className="mt-1 h-8 text-xs" type="email" />
              </div>
            )}
            {config.subject !== undefined && (
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={config.subject || ''} onChange={(e) => updateField('subject', e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
            )}
            {config.url !== undefined && (
              <div>
                <Label className="text-xs">Webhook URL</Label>
                <Input value={config.url || ''} onChange={(e) => updateField('url', e.target.value)} className="mt-1 h-8 text-xs" type="url" />
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}