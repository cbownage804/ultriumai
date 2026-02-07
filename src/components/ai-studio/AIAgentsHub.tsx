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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted/50 rounded-lg" />
            <div className="h-4 w-72 bg-muted/30 rounded" />
          </div>
          <div className="h-10 w-32 bg-muted/50 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            AI Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous AI agents that auto-fill, enrich, and transform your data
          </p>
        </div>
        <Button onClick={() => navigate('/ai-studio/agents/new')} className="w-full sm:w-auto">
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
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold flex items-center gap-2 flex-wrap">
                            <span className="truncate">{agent.name}</span>
                            {agent.template_id && (
                              <Badge variant="outline" className="text-xs">Template</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={trigger.variant} className="text-xs">{trigger.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {agent.target_table} · {agent.model.split('/').pop()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end pl-13 sm:pl-0">
                        <div className="text-right text-xs text-muted-foreground mr-1 sm:mr-2">
                          <p>{agent.run_count} runs</p>
                          <p>{agent.credits_used}/{agent.credit_budget} credits</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={executing === agent.id}
                          onClick={() => executeAgent(agent)}
                          className="min-h-[36px] min-w-[36px]"
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
                          className="h-8 w-8 min-h-[36px] min-w-[36px]"
                          onClick={() => navigate(`/ai-studio/agents/${agent.id}`)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[36px] min-w-[36px] text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
