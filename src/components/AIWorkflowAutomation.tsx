import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Zap,
  Bot
} from 'lucide-react';

interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  successRate: number;
}

const AIWorkflowAutomation = () => {
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([
    {
      id: '1',
      name: 'Security Alert Analysis',
      description: 'Automatically analyze security alerts and categorize threats',
      trigger: 'New security alert received',
      actions: ['Analyze threat level', 'Categorize alert type', 'Generate response plan'],
      status: 'active',
      lastRun: '2 minutes ago',
      successRate: 94
    },
    {
      id: '2',
      name: 'Incident Response Automation',
      description: 'Streamline incident response with AI-powered workflows',
      trigger: 'Critical security incident detected',
      actions: ['Notify security team', 'Create incident ticket', 'Begin containment'],
      status: 'active',
      lastRun: '1 hour ago',
      successRate: 97
    }
  ]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: '',
    actions: ''
  });

  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || !newWorkflow.description || !newWorkflow.trigger) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const workflow: AIWorkflow = {
        id: Date.now().toString(),
        name: newWorkflow.name,
        description: newWorkflow.description,
        trigger: newWorkflow.trigger,
        actions: newWorkflow.actions.split('\n').filter(action => action.trim()),
        status: 'draft',
        successRate: 0
      };

      setWorkflows(prev => [...prev, workflow]);
      setNewWorkflow({ name: '', description: '', trigger: '', actions: '' });
      
      toast({
        title: "Workflow Created",
        description: "AI workflow has been created successfully",
      });
    } catch (error) {
      console.error('Workflow creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id 
        ? { ...workflow, status: workflow.status === 'active' ? 'paused' : 'active' }
        : workflow
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'draft': return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Workflow className="h-8 w-8 text-primary" />
            AI Workflow Automation
          </h2>
          <p className="text-muted-foreground mt-2">
            Create and manage intelligent workflows powered by AI
          </p>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="create">Create Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleWorkflowStatus(workflow.id)}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Trigger
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {workflow.trigger}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Actions</h4>
                      <div className="space-y-2">
                        {workflow.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4">
                        {workflow.lastRun && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Last run: {workflow.lastRun}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle className="h-3 w-3" />
                          Success rate: {workflow.successRate}%
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New AI Workflow
              </CardTitle>
              <CardDescription>
                Define triggers and actions for automated AI-powered workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  placeholder="e.g., Automated Threat Response"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this workflow does..."
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Event</label>
                <Select value={newWorkflow.trigger} onValueChange={(value) => 
                  setNewWorkflow(prev => ({ ...prev, trigger: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trigger event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_alert">New Security Alert</SelectItem>
                    <SelectItem value="system_anomaly">System Anomaly Detected</SelectItem>
                    <SelectItem value="user_login">Suspicious User Login</SelectItem>
                    <SelectItem value="network_intrusion">Network Intrusion Attempt</SelectItem>
                    <SelectItem value="malware_detection">Malware Detection</SelectItem>
                    <SelectItem value="compliance_violation">Compliance Violation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions (one per line)</label>
                <Textarea
                  placeholder="e.g.&#10;Analyze threat severity&#10;Notify security team&#10;Create incident ticket&#10;Begin containment procedures"
                  value={newWorkflow.actions}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, actions: e.target.value }))}
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={handleCreateWorkflow} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Workflow'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
                <p className="text-xs text-muted-foreground">
                  {workflows.filter(w => w.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(workflows.reduce((acc, w) => acc + w.successRate, 0) / workflows.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all workflows
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">
                  +18% from yesterday
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIWorkflowAutomation;