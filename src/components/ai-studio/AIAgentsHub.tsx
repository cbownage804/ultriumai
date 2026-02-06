import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Plus, Play, Pause, Clock, Zap, BarChart3, 
  Loader2, Trash2, Settings2, History, Sparkles,
  Tag, FileText, Search, Shield, Monitor, AlertTriangle,
  Database
} from 'lucide-react';
import { AIAgentTemplates, AGENT_TEMPLATES } from './AIAgentTemplates';
import { AIAgentRunHistory } from './AIAgentRunHistory';

interface AIAgent {
  id: string;
  name: string;
  description: string | null;
  target_table: string;
  trigger_type: string;
  model: string;
  is_enabled: boolean;
  credit_budget: number;
  credits_used: number;
  run_count: number;
  last_run_at: string | null;
  template_id: string | null;
  created_at: string;
}

export function AIAgentsHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('ai_agents' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAgents((data as unknown as AIAgent[]) || []);
    } catch (err) {
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_agents' as any)
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
      setAgents(prev => prev.map(a => a.id === id ? { ...a, is_enabled: enabled } : a));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_agents' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      setAgents(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Agent deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const executeAgent = async (agent: AIAgent) => {
    setExecuting(agent.id);
    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-execute', {
        body: { agentId: agent.id }
      });
      if (error) throw error;
      toast({
        title: 'Agent executed',
        description: data?.message || `${agent.name} completed successfully`,
      });
      await loadAgents();
    } catch (err: any) {
      toast({ title: 'Execution failed', description: err.message, variant: 'destructive' });
    } finally {
      setExecuting(null);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (!template || !user) return;

    try {
      const { data, error } = await supabase
        .from('ai_agents' as any)
        .insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          target_table: template.targetTable,
          trigger_type: template.triggerType,
          model: template.model,
          system_prompt: template.systemPrompt,
          output_mapping: template.outputMapping,
          conditions: template.conditions || {},
          template_id: template.id,
          credit_budget: 100,
          is_enabled: false,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Agent created from template', description: `${template.name} is ready to configure` });
      await loadAgents();
      setTab('agents');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getTriggerBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      manual: { label: 'Manual', variant: 'outline' },
      on_create: { label: 'On Create', variant: 'default' },
      on_update: { label: 'On Update', variant: 'default' },
      schedule: { label: 'Scheduled', variant: 'secondary' },
    };
    return map[type] || { label: type, variant: 'outline' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Agents
          </h1>
          <p className="text-muted-foreground mt-1">
            Autonomous AI agents that auto-fill, enrich, and transform your data
          </p>
        </div>
        <Button onClick={() => navigate('/ai-studio/agents/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agents.length}</p>
            <p className="text-xs text-muted-foreground">Total Agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agents.filter(a => a.is_enabled).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.run_count, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.credits_used, 0)}</p>
            <p className="text-xs text-muted-foreground">Credits Used</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4 mt-4">
          {agents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No AI agents yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create autonomous agents that process your data, auto-tag records, enrich contacts, and more.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/ai-studio/agents/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Agent
                  </Button>
                  <Button variant="outline" onClick={() => setTab('templates')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            agents.map(agent => {
              const trigger = getTriggerBadge(agent.trigger_type);
              return (
                <Card key={agent.id} className="group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {agent.name}
                            {agent.template_id && (
                              <Badge variant="outline" className="text-xs">Template</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">{agent.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={trigger.variant} className="text-xs">{trigger.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {agent.target_table} · {agent.model.split('/').pop()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted-foreground mr-2">
                          <p>{agent.run_count} runs</p>
                          <p>{agent.credits_used}/{agent.credit_budget} credits</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={executing === agent.id}
                          onClick={() => executeAgent(agent)}
                        >
                          {executing === agent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Switch
                          checked={agent.is_enabled}
                          onCheckedChange={(checked) => toggleAgent(agent.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/ai-studio/agents/${agent.id}`)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteAgent(agent.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <AIAgentTemplates onCreateFromTemplate={handleCreateFromTemplate} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AIAgentRunHistory agentId={selectedAgentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
