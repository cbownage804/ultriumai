import { useState, useEffect } from 'react';
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
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Search,
  GitBranch,
  ArrowRight,
  Settings,
  Trash2,
  History,
  Zap,
  Terminal,
  Mail,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RunbookStep {
  id: string;
  type: 'script' | 'condition' | 'notification' | 'approval' | 'delay' | 'api_call';
  name: string;
  config: Record<string, any>;
}

interface Runbook {
  id: string;
  name: string;
  description: string;
  category: 'remediation' | 'maintenance' | 'onboarding' | 'offboarding' | 'security' | 'custom';
  trigger_type: 'manual' | 'scheduled' | 'alert' | 'event';
  trigger_config?: Record<string, any>;
  steps: RunbookStep[];
  is_active: boolean;
  last_run?: string;
  total_runs: number;
  success_rate: number;
  created_at: string;
  created_by?: string;
}

interface RunbookExecution {
  id: string;
  runbook_id: string;
  runbook_name?: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'awaiting_approval' | 'pending';
  started_at: string;
  completed_at?: string;
  triggered_by?: string;
  target_devices: string[];
  current_step?: string;
  step_results: any[];
}

export function RunbookAutomation() {
  const { user } = useAuth();
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [executions, setExecutions] = useState<RunbookExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRunbook, setNewRunbook] = useState({
    name: '',
    description: '',
    category: 'custom' as const,
    trigger_type: 'manual' as const,
  });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [runbooksRes, executionsRes] = await Promise.all([
        supabase
          .from('vanguard_runbooks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('vanguard_runbook_executions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(20)
      ]);

      if (runbooksRes.error) throw runbooksRes.error;
      if (executionsRes.error) throw executionsRes.error;

      const transformedRunbooks: Runbook[] = (runbooksRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        category: r.category || 'custom',
        trigger_type: r.trigger_type || 'manual',
        trigger_config: r.trigger_config || {},
        steps: r.steps || [],
        is_active: r.is_active ?? true,
        last_run: r.last_run,
        total_runs: r.total_runs || 0,
        success_rate: Number(r.success_rate) || 0,
        created_at: r.created_at,
        created_by: r.created_by,
      }));

      const transformedExecutions: RunbookExecution[] = (executionsRes.data || []).map((e: any) => ({
        id: e.id,
        runbook_id: e.runbook_id,
        status: e.status || 'pending',
        started_at: e.started_at,
        completed_at: e.completed_at,
        triggered_by: e.triggered_by,
        target_devices: e.target_devices || [],
        current_step: e.current_step,
        step_results: e.step_results || [],
      }));

      setRunbooks(transformedRunbooks);
      setExecutions(transformedExecutions);
    } catch (error) {
      console.error('Error fetching runbooks:', error);
      toast.error('Failed to load runbooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRunbook = async () => {
    if (!user?.id || !newRunbook.name) return;

    try {
      const { error } = await supabase
        .from('vanguard_runbooks')
        .insert({
          user_id: user.id,
          name: newRunbook.name,
          description: newRunbook.description,
          category: newRunbook.category,
          trigger_type: newRunbook.trigger_type,
          is_active: false,
          steps: [],
          created_by: user.email,
        });

      if (error) throw error;
      toast.success('Runbook created');
      setShowCreateDialog(false);
      setNewRunbook({ name: '', description: '', category: 'custom', trigger_type: 'manual' });
      fetchData();
    } catch (error) {
      console.error('Error creating runbook:', error);
      toast.error('Failed to create runbook');
    }
  };

  const handleToggleRunbook = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('vanguard_runbooks')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      setRunbooks(prev => prev.map(rb => 
        rb.id === id ? { ...rb, is_active: !currentState } : rb
      ));
      toast.success(`Runbook ${!currentState ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling runbook:', error);
      toast.error('Failed to update runbook');
    }
  };

  const handleDeleteRunbook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_runbooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRunbooks(prev => prev.filter(rb => rb.id !== id));
      toast.success('Runbook deleted');
    } catch (error) {
      console.error('Error deleting runbook:', error);
      toast.error('Failed to delete runbook');
    }
  };

  const handleRunManually = async (runbook: Runbook) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('vanguard_runbook_executions')
        .insert({
          user_id: user.id,
          runbook_id: runbook.id,
          status: 'running',
          triggered_by: 'Manual',
          target_devices: [],
          step_results: [],
        });

      if (error) throw error;
      
      // Update runbook stats
      await supabase
        .from('vanguard_runbooks')
        .update({ 
          last_run: new Date().toISOString(),
          total_runs: runbook.total_runs + 1
        })
        .eq('id', runbook.id);

      toast.success(`${runbook.name} is now executing...`);
      fetchData();
    } catch (error) {
      console.error('Error starting runbook:', error);
      toast.error('Failed to start runbook');
    }
  };

  const filteredRunbooks = runbooks.filter(rb => {
    const matchesSearch = rb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rb.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rb.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const activeExecutions = executions.filter(e => e.status === 'running' || e.status === 'awaiting_approval');
  const totalSuccess = executions.filter(e => e.status === 'completed').length;
  const totalFailed = executions.filter(e => e.status === 'failed').length;

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
    const colors: Record<string, string> = {
      manual: 'bg-blue-500/20 text-blue-500',
      scheduled: 'bg-purple-500/20 text-purple-500',
      alert: 'bg-red-500/20 text-red-500',
      event: 'bg-green-500/20 text-green-500',
    };
    return colors[trigger] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

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
                <p className="text-2xl font-bold">{runbooks.filter(r => r.is_active).length}</p>
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
        </TabsList>

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

          {filteredRunbooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No runbooks found. Create your first automation runbook.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRunbooks.map(runbook => (
                <Card key={runbook.id} className={cn(!runbook.is_active && 'opacity-60')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{runbook.name}</h3>
                          <Badge className={getTriggerBadge(runbook.trigger_type)}>
                            {runbook.trigger_type}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {runbook.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{runbook.description}</p>
                        
                        {runbook.steps.length > 0 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {runbook.steps.map((step, i) => (
                              <div key={step.id} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm whitespace-nowrap">
                                  {getStepIcon(step.type)}
                                  <span>{step.name}</span>
                                </div>
                                {i < runbook.steps.length - 1 && (
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                          <span>{runbook.total_runs} runs</span>
                          <span>{runbook.success_rate}% success</span>
                          {runbook.last_run && (
                            <span>Last run: {formatDistanceToNow(new Date(runbook.last_run), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={runbook.is_active} 
                          onCheckedChange={() => handleToggleRunbook(runbook.id, runbook.is_active)} 
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRunManually(runbook)}
                          disabled={!runbook.is_active}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRunbook(runbook.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No execution history yet. Run a runbook to see results here.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {executions.map(exec => {
                const runbook = runbooks.find(r => r.id === exec.runbook_id);
                return (
                  <Card key={exec.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{runbook?.name || 'Unknown Runbook'}</p>
                          <p className="text-sm text-muted-foreground">
                            Started {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                            {exec.triggered_by && ` • Triggered by ${exec.triggered_by}`}
                          </p>
                        </div>
                        <Badge className={cn(
                          exec.status === 'completed' && 'bg-green-500/20 text-green-500',
                          exec.status === 'running' && 'bg-blue-500/20 text-blue-500',
                          exec.status === 'failed' && 'bg-red-500/20 text-red-500',
                          exec.status === 'awaiting_approval' && 'bg-yellow-500/20 text-yellow-500'
                        )}>
                          {exec.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Runbook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Runbook</DialogTitle>
            <DialogDescription>Define an automation workflow</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Runbook Name</Label>
              <Input
                value={newRunbook.name}
                onChange={(e) => setNewRunbook({ ...newRunbook, name: e.target.value })}
                placeholder="e.g., High CPU Remediation"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRunbook.description}
                onChange={(e) => setNewRunbook({ ...newRunbook, description: e.target.value })}
                placeholder="What does this runbook do?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newRunbook.category}
                  onValueChange={(v: any) => setNewRunbook({ ...newRunbook, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select
                  value={newRunbook.trigger_type}
                  onValueChange={(v: any) => setNewRunbook({ ...newRunbook, trigger_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="alert">Alert-Triggered</SelectItem>
                    <SelectItem value="event">Event-Driven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRunbook}>Create Runbook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
