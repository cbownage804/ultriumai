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
  ArrowRight, Settings, History, Target
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

interface PlaybookStep {
  id: string;
  order: number;
  name: string;
  action: string;
  parameters: Record<string, string>;
  condition?: string;
  onFailure: 'stop' | 'continue' | 'rollback';
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerType: 'manual' | 'automatic' | 'scheduled';
  triggerCondition?: string;
  steps: PlaybookStep[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
  averageRunTime?: number;
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const [playbooks] = useState<Playbook[]>([
    {
      id: '1',
      name: 'Ransomware Response',
      description: 'Automated response to ransomware detection including isolation and evidence collection',
      category: 'Malware',
      severity: 'critical',
      triggerType: 'automatic',
      triggerCondition: 'threat_type == "ransomware"',
      steps: [
        { id: '1', order: 1, name: 'Network Isolation', action: 'isolate_network', parameters: {}, onFailure: 'stop' },
        { id: '2', order: 2, name: 'Kill Malicious Process', action: 'kill_process', parameters: { pattern: '*crypto*' }, onFailure: 'continue' },
        { id: '3', order: 3, name: 'Collect Evidence', action: 'forensic_snapshot', parameters: {}, onFailure: 'continue' },
        { id: '4', order: 4, name: 'Notify SOC', action: 'send_alert', parameters: { channel: 'slack', severity: 'critical' }, onFailure: 'continue' }
      ],
      isActive: true,
      executionCount: 3,
      lastExecuted: new Date(Date.now() - 86400000).toISOString(),
      averageRunTime: 45
    },
    {
      id: '2',
      name: 'Credential Theft Response',
      description: 'Response to detected credential dumping or theft attempts',
      category: 'Credential Access',
      severity: 'high',
      triggerType: 'automatic',
      triggerCondition: 'mitre_attack contains "T1003"',
      steps: [
        { id: '1', order: 1, name: 'Terminate Suspicious Process', action: 'kill_process', parameters: {}, onFailure: 'continue' },
        { id: '2', order: 2, name: 'Force Password Reset', action: 'reset_password', parameters: {}, onFailure: 'stop' },
        { id: '3', order: 3, name: 'Revoke Active Sessions', action: 'revoke_sessions', parameters: {}, onFailure: 'continue' },
        { id: '4', order: 4, name: 'Enable MFA', action: 'enable_mfa', parameters: {}, onFailure: 'continue' }
      ],
      isActive: true,
      executionCount: 8,
      lastExecuted: new Date(Date.now() - 172800000).toISOString(),
      averageRunTime: 30
    },
    {
      id: '3',
      name: 'Suspicious PowerShell Activity',
      description: 'Response to encoded or obfuscated PowerShell execution',
      category: 'Execution',
      severity: 'medium',
      triggerType: 'automatic',
      triggerCondition: 'process_command contains "-EncodedCommand"',
      steps: [
        { id: '1', order: 1, name: 'Capture Process Details', action: 'log_process', parameters: {}, onFailure: 'continue' },
        { id: '2', order: 2, name: 'Decode Command', action: 'decode_base64', parameters: {}, onFailure: 'continue' },
        { id: '3', order: 3, name: 'Analyze with AI', action: 'ai_analysis', parameters: { model: 'threat_classifier' }, onFailure: 'continue' },
        { id: '4', order: 4, name: 'Block if Malicious', action: 'conditional_block', parameters: {}, onFailure: 'stop' }
      ],
      isActive: true,
      executionCount: 24,
      averageRunTime: 15
    },
    {
      id: '4',
      name: 'Data Exfiltration Prevention',
      description: 'Detect and prevent large data transfers to external destinations',
      category: 'Exfiltration',
      severity: 'high',
      triggerType: 'automatic',
      triggerCondition: 'bytes_out > 100MB AND destination_external',
      steps: [
        { id: '1', order: 1, name: 'Block Connection', action: 'block_connection', parameters: {}, onFailure: 'stop' },
        { id: '2', order: 2, name: 'Capture Network Traffic', action: 'pcap_capture', parameters: { duration: '60s' }, onFailure: 'continue' },
        { id: '3', order: 3, name: 'Alert Data Owner', action: 'notify_user', parameters: {}, onFailure: 'continue' }
      ],
      isActive: false,
      executionCount: 2
    }
  ]);

  const [executions] = useState<PlaybookExecution[]>([
    {
      id: '1',
      playbookId: '1',
      playbookName: 'Ransomware Response',
      status: 'completed',
      triggeredBy: 'Automatic - Threat Detection',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000 + 45000).toISOString(),
      stepsCompleted: 4,
      totalSteps: 4,
      affectedDevices: ['WORKSTATION-05']
    },
    {
      id: '2',
      playbookId: '2',
      playbookName: 'Credential Theft Response',
      status: 'running',
      triggeredBy: 'Automatic - MITRE T1003',
      startedAt: new Date(Date.now() - 60000).toISOString(),
      stepsCompleted: 2,
      totalSteps: 4,
      affectedDevices: ['SERVER-DC-01']
    },
    {
      id: '3',
      playbookId: '3',
      playbookName: 'Suspicious PowerShell Activity',
      status: 'failed',
      triggeredBy: 'Automatic - Process Monitor',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3600000 + 12000).toISOString(),
      stepsCompleted: 2,
      totalSteps: 4,
      affectedDevices: ['DEV-MACHINE-03'],
      error: 'AI analysis service timeout'
    }
  ]);

  const handleRunPlaybook = (playbook: Playbook) => {
    toast({
      title: "Playbook Started",
      description: `Executing "${playbook.name}" on selected devices...`
    });
  };

  const handleTogglePlaybook = (playbook: Playbook) => {
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
