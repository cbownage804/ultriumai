/**
 * Phase 4: AI Workflow Builder — True drag-and-drop node-based canvas
 * powered by React Flow (@xyflow/react).
 */
import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type NodeProps,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus, Play, Save, Trash2, Settings, Sparkles, Zap, FileText,
  Globe, Mail, Database, Filter, Loader2, X, Clock, Tag, Wand2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────
type StepType = 'trigger' | 'ai_transform' | 'filter' | 'output';

interface StepData {
  [key: string]: unknown;
  label: string;
  stepType: StepType;
  icon: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  nodes: Node<StepData>[];
  edges: Edge[];
  isEnabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
}

// ─── Step Templates ────────────────────────────────
const STEP_TEMPLATES: { type: StepType; name: string; icon: string; description: string; defaultConfig: Record<string, any> }[] = [
  { type: 'trigger', name: 'Webhook', icon: 'zap', description: 'Start via HTTP webhook', defaultConfig: { method: 'POST' } },
  { type: 'trigger', name: 'Schedule', icon: 'clock', description: 'Run on a cron schedule', defaultConfig: { cron: '0 9 * * *' } },
  { type: 'trigger', name: 'DB Change', icon: 'database', description: 'Trigger on record changes', defaultConfig: { table: 'tickets', event: 'INSERT' } },
  { type: 'ai_transform', name: 'AI Summarize', icon: 'sparkles', description: 'Summarize text with AI', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Summarize the following text concisely:' } },
  { type: 'ai_transform', name: 'AI Classify', icon: 'tag', description: 'Classify or categorize', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Classify the following:', categories: 'bug, feature, question' } },
  { type: 'ai_transform', name: 'AI Extract', icon: 'file-text', description: 'Extract structured data', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Extract key entities:', outputFormat: 'json' } },
  { type: 'ai_transform', name: 'AI Translate', icon: 'globe', description: 'Translate text', defaultConfig: { model: 'google/gemini-3-flash-preview', targetLanguage: 'Spanish' } },
  { type: 'ai_transform', name: 'AI Generate', icon: 'wand', description: 'Generate content', defaultConfig: { model: 'google/gemini-3-flash-preview', prompt: 'Generate a professional response:' } },
  { type: 'filter', name: 'Condition', icon: 'filter', description: 'Continue if condition met', defaultConfig: { field: '', operator: 'equals', value: '' } },
  { type: 'output', name: 'Update DB', icon: 'database', description: 'Write to a database table', defaultConfig: { table: '', column: '', action: 'update' } },
  { type: 'output', name: 'Send Email', icon: 'mail', description: 'Send results via email', defaultConfig: { to: '', subject: '', template: '' } },
  { type: 'output', name: 'Webhook Out', icon: 'zap', description: 'POST to external URL', defaultConfig: { url: '', method: 'POST' } },
];

const iconMap: Record<string, React.ElementType> = {
  zap: Zap, clock: Clock, database: Database, sparkles: Sparkles,
  tag: Tag, 'file-text': FileText, globe: Globe, wand: Wand2,
  filter: Filter, mail: Mail,
};

const typeStyles: Record<StepType, { border: string; bg: string; badge: string; accent: string }> = {
  trigger:      { border: 'border-amber-500',   bg: 'bg-amber-500/10',   badge: 'bg-amber-500/20 text-amber-300', accent: '#f59e0b' },
  ai_transform: { border: 'border-purple-500',  bg: 'bg-purple-500/10',  badge: 'bg-purple-500/20 text-purple-300', accent: '#a855f7' },
  filter:       { border: 'border-blue-500',    bg: 'bg-blue-500/10',    badge: 'bg-blue-500/20 text-blue-300', accent: '#3b82f6' },
  output:       { border: 'border-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300', accent: '#10b981' },
};

// ─── Custom Node Component ─────────────────────────
function WorkflowNode({ data, selected }: NodeProps<Node<StepData>>) {
  const Icon = iconMap[data.icon] || Zap;
  const style = typeStyles[data.stepType];
  return (
    <div className={cn(
      'rounded-xl border-2 px-4 py-3 min-w-[180px] shadow-lg transition-all',
      style.border, style.bg,
      selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    )}>
      {data.stepType !== 'trigger' && (
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      )}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: style.accent + '30' }}>
          <Icon className="h-4 w-4" style={{ color: style.accent }} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{data.label}</p>
          <Badge className={cn('text-[10px] mt-0.5 px-1.5 py-0', style.badge)}>
            {data.stepType.replace('_', ' ')}
          </Badge>
        </div>
      </div>
      {data.stepType !== 'output' && (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = { workflowStep: WorkflowNode };

// ─── Main Component ────────────────────────────────
export function AIWorkflowCanvas() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const createWorkflow = () => {
    const wf: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      nodes: [],
      edges: [],
      isEnabled: false,
      createdAt: new Date(),
      runCount: 0,
    };
    setWorkflows(prev => [wf, ...prev]);
    selectWorkflow(wf);
  };

  const selectWorkflow = (wf: Workflow) => {
    // Save current state back
    if (activeWorkflow) {
      setWorkflows(prev => prev.map(w => w.id === activeWorkflow.id ? { ...w, nodes, edges } : w));
    }
    setActiveWorkflow(wf);
    setNodes(wf.nodes);
    setEdges(wf.edges);
    setSelectedNodeId(null);
  };

  const addStep = (template: typeof STEP_TEMPLATES[number]) => {
    const newNode: Node<StepData> = {
      id: `step-${Date.now()}`,
      type: 'workflowStep',
      position: { x: 250, y: nodes.length * 140 + 40 },
      data: {
        label: template.name,
        stepType: template.type,
        icon: template.icon,
        config: { ...template.defaultConfig },
      },
    };
    setNodes(nds => [...nds, newNode]);

    // Auto-connect to last node if exists
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      setEdges(eds => addEdge({
        id: `e-${lastNode.id}-${newNode.id}`,
        source: lastNode.id,
        target: newNode.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 2 },
      }, eds));
    }
    setShowStepPicker(false);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
    setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const updateStepConfig = (nodeId: string, config: Record<string, any>) => {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
    ));
  };

  const saveWorkflow = async () => {
    if (!activeWorkflow) return;
    setIsSaving(true);
    const updated = { ...activeWorkflow, nodes, edges };
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
    setActiveWorkflow(updated);
    await new Promise(r => setTimeout(r, 300)); // simulate save
    toast.success('Workflow saved');
    setIsSaving(false);
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) { toast.error('Add at least one step'); return; }
    setIsRunning(true);
    try {
      const steps = nodes.map(n => ({
        id: n.id,
        type: n.data.stepType,
        name: n.data.label,
        config: n.data.config,
      }));
      const { data, error } = await supabase.functions.invoke('ai-workflow-execute', {
        body: { workflowId: activeWorkflow?.id, steps },
      });
      if (error) throw error;

      if (activeWorkflow) {
        const updated = { ...activeWorkflow, nodes, edges, lastRun: new Date(), runCount: activeWorkflow.runCount + 1 };
        setActiveWorkflow(updated);
        setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
      }
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
    if (activeWorkflow?.id === wfId) {
      setActiveWorkflow(null);
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
    }
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
          <p className="text-sm text-muted-foreground">Chain AI transformations with a visual node canvas</p>
        </div>
        <Button onClick={createWorkflow} className="gap-2">
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: '620px' }}>
        {/* Workflow List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm">Workflows ({workflows.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {workflows.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No workflows yet.
                </div>
              ) : workflows.map(wf => (
                <div
                  key={wf.id}
                  onClick={() => selectWorkflow(wf)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-colors',
                    activeWorkflow?.id === wf.id ? 'bg-accent' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{wf.name}</p>
                    <p className="text-xs text-muted-foreground">{wf.nodes.length} nodes · {wf.runCount} runs</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              {activeWorkflow ? (
                <Input
                  value={activeWorkflow.name}
                  onChange={(e) => {
                    const updated = { ...activeWorkflow, name: e.target.value };
                    setActiveWorkflow(updated);
                    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
                  }}
                  className="text-sm font-medium h-8 max-w-[180px]"
                />
              ) : (
                <CardTitle className="text-sm">Canvas</CardTitle>
              )}
              {activeWorkflow && (
                <div className="flex items-center gap-2">
                  <Dialog open={showStepPicker} onOpenChange={setShowStepPicker}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 h-8">
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Workflow Step</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {(['trigger', 'ai_transform', 'filter', 'output'] as const).map(type => (
                            <div key={type}>
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{type.replace('_', ' ')}</Label>
                              <div className="grid gap-2 mt-1 mb-3">
                                {STEP_TEMPLATES.filter(t => t.type === type).map(tpl => {
                                  const Icon = iconMap[tpl.icon] || Zap;
                                  return (
                                    <Button key={tpl.name} variant="outline" className="justify-start h-auto py-2.5 px-4" onClick={() => addStep(tpl)}>
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
                  <Button variant="outline" size="sm" onClick={saveWorkflow} disabled={isSaving} className="h-8">
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" onClick={runWorkflow} disabled={isRunning} className="h-8 bg-emerald-600 hover:bg-emerald-700">
                    {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!activeWorkflow ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select or create a workflow
              </div>
            ) : (
              <div className="h-full w-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  onPaneClick={() => setSelectedNodeId(null)}
                  nodeTypes={nodeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                  className="bg-background"
                  defaultEdgeOptions={{
                    animated: true,
                    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
                    style: { strokeWidth: 2, stroke: 'hsl(var(--muted-foreground))' },
                  }}
                >
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
                  <Controls className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
                </ReactFlow>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Config Panel */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {selectedNode ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={cn('text-xs', typeStyles[selectedNode.data.stepType].badge)}>
                    {selectedNode.data.stepType.replace('_', ' ')}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={deleteSelectedNode}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <StepConfigPanel
                    stepType={selectedNode.data.stepType}
                    config={selectedNode.data.config}
                    onUpdate={(config) => updateStepConfig(selectedNode.id, config)}
                  />
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-12">
                Click a node to configure it
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step Config Panel ─────────────────────────────
function StepConfigPanel({ stepType, config, onUpdate }: { stepType: StepType; config: Record<string, any>; onUpdate: (config: Record<string, any>) => void }) {
  const updateField = (key: string, value: any) => onUpdate({ ...config, [key]: value });

  return (
    <div className="space-y-4 pr-2">
      {stepType === 'ai_transform' && (
        <>
          <div>
            <Label className="text-xs">AI Model</Label>
            <Select value={config.model || 'google/gemini-3-flash-preview'} onValueChange={(v) => updateField('model', v)}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
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
            <Textarea value={config.prompt || ''} onChange={(e) => updateField('prompt', e.target.value)} rows={4} className="mt-1 text-xs" />
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

      {stepType === 'trigger' && (
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

      {stepType === 'filter' && (
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

      {stepType === 'output' && (
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
  );
}
