import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Workflow, 
  Play, 
  Pause,
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Search,
  GitBranch,
  ArrowRight,
  Settings,
  Copy,
  Trash2,
  Edit,
  History,
  Zap,
  AlertTriangle,
  Terminal,
  Mail,
  MessageSquare,
  RefreshCw,
  Server,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RunbookStep {
  id: string;
  type: 'script' | 'condition' | 'notification' | 'approval' | 'delay' | 'api_call';
  name: string;
  config: Record<string, any>;
  onSuccess?: string; // next step id
  onFailure?: string; // next step id or 'abort'
}

interface Runbook {
  id: string;
  name: string;
  description: string;
  category: 'remediation' | 'maintenance' | 'onboarding' | 'offboarding' | 'security' | 'custom';
  trigger: 'manual' | 'scheduled' | 'alert' | 'event';
  triggerConfig?: Record<string, any>;
  steps: RunbookStep[];
  isActive: boolean;
  lastRun?: Date;
  totalRuns: number;
  successRate: number;
  createdAt: Date;
  createdBy: string;
}

interface RunbookExecution {
  id: string;
  runbookId: string;
  runbookName: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'awaiting_approval';
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  targetDevices: string[];
  currentStep?: string;
  stepResults: {
    stepId: string;
    status: 'success' | 'failed' | 'skipped' | 'pending';
    output?: string;
    duration?: number;
  }[];
}

const mockRunbooks: Runbook[] = [
  {
    id: '1',
    name: 'High CPU Remediation',
    description: 'Automatically diagnose and remediate high CPU usage on endpoints',
    category: 'remediation',
    trigger: 'alert',
    triggerConfig: { alertType: 'cpu_high', threshold: 90 },
    steps: [
      { id: 's1', type: 'script', name: 'Get Process List', config: { script: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10' } },
      { id: 's2', type: 'condition', name: 'Check for Known Issues', config: { condition: 'if process in known_issues' }, onSuccess: 's3', onFailure: 's4' },
      { id: 's3', type: 'script', name: 'Kill Problematic Process', config: { script: 'Stop-Process -Name $processName -Force' } },
      { id: 's4', type: 'notification', name: 'Notify Admin', config: { channel: 'teams', message: 'Manual intervention required' } },
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    totalRuns: 47,
    successRate: 89,
    createdAt: new Date(2024, 2, 15),
    createdBy: 'admin@example.com',
  },
  {
    id: '2',
    name: 'New Employee Onboarding',
    description: 'Automated workstation setup for new employees',
    category: 'onboarding',
    trigger: 'manual',
    steps: [
      { id: 's1', type: 'script', name: 'Install Core Apps', config: { packages: ['chrome', 'slack', 'zoom', 'office365'] } },
      { id: 's2', type: 'script', name: 'Configure Security', config: { script: 'Enable-BitLocker; Set-FirewallPolicy' } },
      { id: 's3', type: 'script', name: 'Join Domain', config: { domain: 'corp.local' } },
      { id: 's4', type: 'approval', name: 'Manager Approval', config: { approvers: ['manager'] } },
      { id: 's5', type: 'notification', name: 'Welcome Email', config: { template: 'welcome_new_employee' } },
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
    totalRuns: 23,
    successRate: 100,
    createdAt: new Date(2024, 1, 1),
    createdBy: 'admin@example.com',
  },
  {
    id: '3',
    name: 'Weekly Maintenance',
    description: 'Scheduled maintenance tasks including updates, cleanup, and health checks',
    category: 'maintenance',
    trigger: 'scheduled',
    triggerConfig: { schedule: '0 2 * * 0' }, // Sundays at 2 AM
    steps: [
      { id: 's1', type: 'script', name: 'Clear Temp Files', config: { script: 'Remove-Item $env:TEMP\\* -Recurse -Force' } },
      { id: 's2', type: 'script', name: 'Check Disk Space', config: { script: 'Get-PSDrive -PSProvider FileSystem' } },
      { id: 's3', type: 'condition', name: 'Disk Space Low?', config: { condition: 'freeSpace < 10GB' }, onSuccess: 's4', onFailure: 's5' },
      { id: 's4', type: 'notification', name: 'Disk Alert', config: { channel: 'email', severity: 'warning' } },
      { id: 's5', type: 'script', name: 'Install Updates', config: { script: 'Install-WindowsUpdate -AcceptAll' } },
    ],
    isActive: true,
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    totalRuns: 156,
    successRate: 95,
    createdAt: new Date(2023, 11, 1),
    createdBy: 'admin@example.com',
  },
  {
    id: '4',
    name: 'Security Incident Response',
    description: 'Automated response to security alerts including isolation and forensics',
    category: 'security',
    trigger: 'alert',
    triggerConfig: { alertType: 'security_threat' },
    steps: [
      { id: 's1', type: 'script', name: 'Isolate Endpoint', config: { script: 'Disable-NetworkAdapter -All' } },
      { id: 's2', type: 'notification', name: 'Alert SOC', config: { channel: 'pagerduty', priority: 'critical' } },
      { id: 's3', type: 'script', name: 'Collect Forensics', config: { script: 'Collect-ForensicData' } },
      { id: 's4', type: 'approval', name: 'SOC Review', config: { approvers: ['soc_team'], timeout: 30 } },
      { id: 's5', type: 'api_call', name: 'Update SIEM', config: { endpoint: '/api/incident', method: 'POST' } },
    ],
    isActive: true,
    totalRuns: 8,
    successRate: 100,
    createdAt: new Date(2024, 3, 1),
    createdBy: 'security@example.com',
  },
];

const mockExecutions: RunbookExecution[] = [
  {
    id: 'e1',
    runbookId: '1',
    runbookName: 'High CPU Remediation',
    status: 'running',
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
    triggeredBy: 'Alert: CPU > 90%',
    targetDevices: ['WS-DEV-01'],
    currentStep: 's2',
    stepResults: [
      { stepId: 's1', status: 'success', output: 'chrome.exe: 45%, vscode.exe: 23%', duration: 12 },
      { stepId: 's2', status: 'pending' },
    ],
  },
  {
    id: 'e2',
    runbookId: '2',
    runbookName: 'New Employee Onboarding',
    status: 'awaiting_approval',
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    triggeredBy: 'HR Portal',
    targetDevices: ['WS-NEW-042'],
    currentStep: 's4',
    stepResults: [
      { stepId: 's1', status: 'success', duration: 180 },
      { stepId: 's2', status: 'success', duration: 45 },
      { stepId: 's3', status: 'success', duration: 30 },
      { stepId: 's4', status: 'pending' },
    ],
  },
  {
    id: 'e3',
    runbookId: '1',
    runbookName: 'High CPU Remediation',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
    triggeredBy: 'Alert: CPU > 90%',
    targetDevices: ['SRV-APP-01'],
    stepResults: [
      { stepId: 's1', status: 'success', duration: 8 },
      { stepId: 's2', status: 'success', duration: 2 },
      { stepId: 's3', status: 'success', duration: 5 },
    ],
  },
  {
    id: 'e4',
    runbookId: '3',
    runbookName: 'Weekly Maintenance',
    status: 'failed',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 300000),
    triggeredBy: 'Schedule',
    targetDevices: ['SRV-DB-01'],
    stepResults: [
      { stepId: 's1', status: 'success', duration: 15 },
      { stepId: 's2', status: 'success', duration: 5 },
      { stepId: 's3', status: 'success', duration: 2 },
      { stepId: 's5', status: 'failed', output: 'Update KB5034441 failed to install' },
    ],
  },
];

export function RunbookAutomation() {
  const { toast } = useToast();
  const [runbooks, setRunbooks] = useState<Runbook[]>(mockRunbooks);
  const [executions] = useState<RunbookExecution[]>(mockExecutions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredRunbooks = runbooks.filter(rb => {
    const matchesSearch = rb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rb.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rb.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeExecutions = executions.filter(e => e.status === 'running' || e.status === 'awaiting_approval');
  const totalSuccess = executions.filter(e => e.status === 'completed').length;
  const totalFailed = executions.filter(e => e.status === 'failed').length;

  const handleToggleRunbook = (id: string) => {
    setRunbooks(prev => prev.map(rb => 
      rb.id === id ? { ...rb, isActive: !rb.isActive } : rb
    ));
  };

  const handleRunManually = (runbook: Runbook) => {
    toast({
      title: 'Runbook Started',
      description: `${runbook.name} is now executing...`,
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'script': return <Terminal className="h-4 w-4" />;
      case 'condition': return <GitBranch className="h-4 w-4" />;
      case 'notification': return <Mail className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'delay': return <Clock className="h-4 w-4" />;
      case 'api_call': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTriggerBadge = (trigger: string) => {
    const colors = {
      manual: 'bg-blue-500/20 text-blue-500',
      scheduled: 'bg-purple-500/20 text-purple-500',
      alert: 'bg-red-500/20 text-red-500',
      event: 'bg-green-500/20 text-green-500',
    };
    return colors[trigger as keyof typeof colors] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Workflow className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runbooks.length}</p>
                <p className="text-xs text-muted-foreground">Runbooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runbooks.filter(r => r.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <RefreshCw className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeExecutions.length}</p>
                <p className="text-xs text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {executions.filter(e => e.status === 'awaiting_approval').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <History className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSuccess}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFailed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="runbooks">
        <TabsList>
          <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
          <TabsTrigger value="executions">
            Executions
            {activeExecutions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeExecutions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Runbooks Tab */}
        <TabsContent value="runbooks" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search runbooks..."
                  className="pl-9 w-[200px]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="remediation">Remediation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="offboarding">Offboarding</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Runbook
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRunbooks.map(runbook => (
              <Card key={runbook.id} className={cn(!runbook.isActive && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{runbook.name}</h3>
                        <Badge className={getTriggerBadge(runbook.trigger)}>
                          {runbook.trigger}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {runbook.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{runbook.description}</p>
                      
                      {/* Steps Preview */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {runbook.steps.map((step, i) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm whitespace-nowrap">
                              {getStepIcon(step.type)}
                              <span>{step.name}</span>
                            </div>
                            {i < runbook.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right text-sm">
                        <p className="font-medium">{runbook.totalRuns} runs</p>
                        <p className="text-muted-foreground">{runbook.successRate}% success</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={runbook.isActive}
                          onCheckedChange={() => handleToggleRunbook(runbook.id)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRunManually(runbook)}
                          disabled={!runbook.isActive}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {runbook.lastRun && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last run: {formatDistanceToNow(runbook.lastRun, { addSuffix: true })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <div className="space-y-4">
            {executions.map(exec => (
              <Card key={exec.id} className={cn(
                exec.status === 'running' && 'border-cyan-500/30',
                exec.status === 'awaiting_approval' && 'border-yellow-500/30',
                exec.status === 'failed' && 'border-red-500/30',
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        exec.status === 'running' && 'bg-cyan-500/20',
                        exec.status === 'completed' && 'bg-green-500/20',
                        exec.status === 'failed' && 'bg-red-500/20',
                        exec.status === 'awaiting_approval' && 'bg-yellow-500/20',
                      )}>
                        {exec.status === 'running' && <RefreshCw className="h-5 w-5 text-cyan-500 animate-spin" />}
                        {exec.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {exec.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        {exec.status === 'awaiting_approval' && <Clock className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{exec.runbookName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exec.targetDevices.join(', ')} • Triggered by: {exec.triggeredBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          exec.status === 'completed' ? 'default' :
                          exec.status === 'failed' ? 'destructive' :
                          exec.status === 'running' ? 'secondary' : 'outline'
                        }
                      >
                        {exec.status.replace('_', ' ')}
                      </Badge>
                      {exec.status === 'running' && (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {exec.status === 'awaiting_approval' && (
                        <Button size="sm">Approve</Button>
                      )}
                    </div>
                  </div>

                  {/* Step Progress */}
                  <div className="flex items-center gap-2">
                    {exec.stepResults.map((result, i) => (
                      <div key={result.stepId} className="flex items-center gap-2">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                          result.status === 'success' && 'bg-green-500 text-white',
                          result.status === 'failed' && 'bg-red-500 text-white',
                          result.status === 'pending' && 'bg-muted border-2 border-cyan-500',
                          result.status === 'skipped' && 'bg-muted text-muted-foreground',
                        )}>
                          {result.status === 'success' && <CheckCircle className="h-4 w-4" />}
                          {result.status === 'failed' && <XCircle className="h-4 w-4" />}
                          {result.status === 'pending' && (i + 1)}
                          {result.status === 'skipped' && '-'}
                        </div>
                        {i < exec.stepResults.length - 1 && (
                          <div className={cn(
                            'h-0.5 w-8',
                            result.status === 'success' ? 'bg-green-500' : 'bg-muted'
                          )} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                    <span>Started: {format(exec.startedAt, 'MMM d, h:mm a')}</span>
                    {exec.completedAt && (
                      <span>Completed: {format(exec.completedAt, 'MMM d, h:mm a')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Disk Cleanup', category: 'maintenance', steps: 4 },
              { name: 'Password Reset', category: 'security', steps: 3 },
              { name: 'Software Install', category: 'onboarding', steps: 5 },
              { name: 'Account Disable', category: 'offboarding', steps: 6 },
              { name: 'Malware Response', category: 'security', steps: 8 },
              { name: 'Backup Verification', category: 'maintenance', steps: 4 },
            ].map((template, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline" className="capitalize">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.steps} pre-configured steps
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Runbook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Runbook</DialogTitle>
            <DialogDescription>
              Build automated workflows with conditional logic and approvals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Runbook Name</Label>
              <Input placeholder="e.g., High Memory Remediation" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe what this runbook does..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remediation">Remediation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="offboarding">Offboarding</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="alert">On Alert</SelectItem>
                    <SelectItem value="event">On Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCreateDialog(false);
              toast({
                title: 'Runbook Created',
                description: 'Open the workflow editor to add steps',
              });
            }}>
              Create & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
