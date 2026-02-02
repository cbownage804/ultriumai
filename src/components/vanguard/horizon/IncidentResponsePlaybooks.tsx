import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, Play, Pause, CheckCircle2, XCircle, Clock,
  Plus, Edit2, Trash2, Copy, AlertTriangle, Zap, 
  ArrowRight, Settings, History, Target, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePlaybooks } from '@/hooks/useHorizon';

interface PlaybookStep {
  id: string;
  order: number;
  name: string;
  action: string;
  parameters: Record<string, string>;
  condition?: string;
  onFailure: 'stop' | 'continue' | 'rollback';
}

interface PlaybookExecution {
  id: string;
  playbookId: string;
  playbookName: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  stepsCompleted: number;
  totalSteps: number;
  affectedDevices: string[];
  error?: string;
}

export const IncidentResponsePlaybooks: React.FC = () => {
  const { toast } = useToast();
  const { playbooks: dbPlaybooks, isLoading, createPlaybook, executePlaybook, refetch } = usePlaybooks();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaybookName, setNewPlaybookName] = useState('');
  const [newPlaybookDescription, setNewPlaybookDescription] = useState('');
  const [newPlaybookCategory, setNewPlaybookCategory] = useState('');
  const [newPlaybookTrigger, setNewPlaybookTrigger] = useState<'manual' | 'automatic' | 'scheduled'>('manual');
  const [newPlaybookSeverity, setNewPlaybookSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  // Map DB playbooks to UI format
  const playbooks = dbPlaybooks.map(p => ({
    id: p.id,
    name: p.playbook_name,
    description: p.description || '',
    category: 'Security',
    severity: 'high' as const,
    triggerType: p.trigger_type as 'manual' | 'automatic' | 'scheduled',
    triggerCondition: JSON.stringify(p.trigger_conditions),
    steps: (p.steps as PlaybookStep[]) || [],
    isActive: p.is_active,
    executionCount: p.execution_count,
    lastExecuted: p.last_executed_at,
    averageRunTime: 30
  }));

  // Sample executions (would come from DB)
  const executions: PlaybookExecution[] = [];

  type PlaybookUI = typeof playbooks[number];

  const handleRunPlaybook = (playbook: PlaybookUI) => {
    executePlaybook(playbook.id);
    toast({
      title: "Playbook Started",
      description: `Executing "${playbook.name}" on selected devices...`
    });
  };

  const handleTogglePlaybook = (playbook: PlaybookUI) => {
    toast({
      title: playbook.isActive ? "Playbook Disabled" : "Playbook Enabled",
      description: `"${playbook.name}" has been ${playbook.isActive ? 'disabled' : 'enabled'}.`
    });
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const getStatusBadge = (status: PlaybookExecution['status']) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      running: { color: 'bg-blue-500/10 text-blue-500', icon: <Play className="h-3 w-3 animate-pulse" /> },
      completed: { color: 'bg-green-500/10 text-green-500', icon: <CheckCircle2 className="h-3 w-3" /> },
      failed: { color: 'bg-red-500/10 text-red-500', icon: <XCircle className="h-3 w-3" /> },
      stopped: { color: 'bg-muted text-muted-foreground', icon: <Pause className="h-3 w-3" /> }
    };
    const { color, icon } = config[status];
    return (
      <Badge className={color}>
        {icon}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Incident Response Playbooks
          </h2>
          <p className="text-muted-foreground">Automated response workflows for security threats</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Playbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Incident Response Playbook</DialogTitle>
              <DialogDescription>Define automated response steps for security incidents</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Playbook Name</Label>
                  <Input placeholder="e.g., Malware Containment" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malware">Malware</SelectItem>
                      <SelectItem value="credentials">Credential Access</SelectItem>
                      <SelectItem value="execution">Execution</SelectItem>
                      <SelectItem value="exfiltration">Exfiltration</SelectItem>
                      <SelectItem value="lateral">Lateral Movement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe what this playbook does..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Trigger Condition (for automatic triggers)</Label>
                <Input placeholder='e.g., threat_type == "ransomware"' className="font-mono" />
              </div>
              <Button onClick={() => setShowCreateDialog(false)} className="w-full">
                Continue to Step Builder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Playbooks</p>
                <p className="text-2xl font-bold">{playbooks.filter(p => p.isActive).length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{playbooks.reduce((acc, p) => acc + p.executionCount, 0)}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running Now</p>
                <p className="text-2xl font-bold text-blue-500">
                  {executions.filter(e => e.status === 'running').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                <p className="text-2xl font-bold">32s</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="playbooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="builder">Step Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Playbooks</CardTitle>
              <CardDescription>Automated incident response workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {playbooks.map((playbook) => (
                    <div key={playbook.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${playbook.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Target className={`h-5 w-5 ${playbook.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {playbook.name}
                              {getSeverityBadge(playbook.severity)}
                            </h4>
                            <p className="text-sm text-muted-foreground">{playbook.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={playbook.isActive} 
                            onCheckedChange={() => handleTogglePlaybook(playbook)}
                          />
                          <Button variant="outline" size="sm" onClick={() => handleRunPlaybook(playbook)}>
                            <Play className="h-4 w-4 mr-1" />
                            Run
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="outline">{playbook.category}</Badge>
                        <Badge variant="secondary">
                          {playbook.triggerType === 'automatic' ? 'Auto' : playbook.triggerType}
                        </Badge>
                        <Badge variant="outline">{playbook.steps.length} steps</Badge>
                      </div>

                      {/* Steps visualization */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {playbook.steps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs whitespace-nowrap">
                              <span className="text-muted-foreground">{index + 1}.</span>
                              {step.name}
                            </div>
                            {index < playbook.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                        <span>Executed {playbook.executionCount} times</span>
                        {playbook.lastExecuted && (
                          <span>Last run: {new Date(playbook.lastExecuted).toLocaleDateString()}</span>
                        )}
                        {playbook.averageRunTime && (
                          <span>Avg. time: {playbook.averageRunTime}s</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Execution History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div key={execution.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{execution.playbookName}</h4>
                          {getStatusBadge(execution.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Triggered by: {execution.triggeredBy}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <span>
                          Steps: {execution.stepsCompleted}/{execution.totalSteps}
                        </span>
                        <span>
                          Devices: {execution.affectedDevices.join(', ')}
                        </span>
                      </div>

                      {execution.error && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-500 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {execution.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Playbook Step Builder
              </CardTitle>
              <CardDescription>
                Drag and drop actions to build your response workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                {/* Available Actions */}
                <div className="col-span-1 space-y-2">
                  <Label>Available Actions</Label>
                  <div className="space-y-2">
                    {[
                      'Isolate Network',
                      'Kill Process',
                      'Block IP',
                      'Quarantine File',
                      'Force Password Reset',
                      'Revoke Sessions',
                      'Capture Forensics',
                      'Send Alert',
                      'Run Script',
                      'AI Analysis'
                    ].map((action) => (
                      <div 
                        key={action}
                        className="p-2 border rounded cursor-move hover:bg-muted transition-colors text-sm"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Canvas */}
                <div className="col-span-3">
                  <div className="border-2 border-dashed rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4" />
                      <p>Drag actions here to build your playbook</p>
                      <p className="text-sm">Or select an existing playbook to edit</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
