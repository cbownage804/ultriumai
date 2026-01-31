import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Play, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Clock, Zap, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PlaybookStep {
  id: string;
  action: string;
  description: string;
  automated: boolean;
  timeout?: number;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  threatType: string;
  severity: string;
  steps: PlaybookStep[];
  lastUsed?: string;
  usageCount: number;
}

export const IncidentResponsePlaybooks = () => {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadPlaybooks();
  }, [user]);

  const loadPlaybooks = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('incident_playbooks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          threatType: p.threat_type,
          severity: p.severity,
          steps: Array.isArray(p.steps) ? (p.steps as any[]).map((s: any, idx: number) => ({
            id: `s${idx}`,
            action: s.action || s.title || `Step ${idx + 1}`,
            description: s.description || '',
            automated: s.automated || false,
            timeout: s.timeout
          })) : [],
          lastUsed: p.last_executed_at,
          usageCount: p.times_executed || 0
        }));
        setPlaybooks(mapped);
      } else {
        setPlaybooks([]);
      }
    } catch (err) {
      console.error('Failed to load playbooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executePlaybook = async (playbookId: string) => {
    setIsExecuting(playbookId);
    try {
      const { data, error } = await supabase.functions.invoke('execute-playbook', {
        body: { action: 'execute', playbook_id: playbookId }
      });

      if (error) throw error;
      
      toast.success(`Playbook executing: ${data.playbook_name}`, {
        description: `${data.commands_queued} commands queued to ${data.target_agents} agents`
      });
      
      // Refresh to update usage count
      loadPlaybooks();
    } catch (err: any) {
      toast.error('Failed to execute playbook', { description: err.message });
    } finally {
      setIsExecuting(null);
    }
  };

  const deletePlaybook = async (playbookId: string) => {
    if (!confirm('Delete this playbook?')) return;
    
    try {
      const { error } = await supabase.functions.invoke('execute-playbook', {
        body: { action: 'delete', playbook_id: playbookId }
      });

      if (error) throw error;
      toast.success('Playbook deleted');
      loadPlaybooks();
    } catch (err: any) {
      toast.error('Failed to delete playbook', { description: err.message });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return <Badge className={colors[severity] || 'bg-muted'}>{severity}</Badge>;
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'ransomware': return '🔐';
      case 'phishing': return '🎣';
      case 'malware': return '🦠';
      case 'data_breach': return '📤';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Incident Response Playbooks
              </CardTitle>
              <CardDescription>
                Automated and guided response procedures for security incidents
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Playbook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            {playbooks.map(playbook => (
              <AccordionItem key={playbook.id} value={playbook.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl">{getThreatIcon(playbook.threatType)}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{playbook.name}</h4>
                        {getSeverityBadge(playbook.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">{playbook.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{playbook.steps.length} steps</span>
                      <span>Used {playbook.usageCount}x</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => executePlaybook(playbook.id)}
                        disabled={isExecuting === playbook.id}
                      >
                        {isExecuting === playbook.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Execute Playbook
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deletePlaybook(playbook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {playbook.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{step.action}</p>
                              {step.automated ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Auto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Manual
                                </Badge>
                              )}
                              {step.timeout && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {step.timeout}s
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {playbook.lastUsed && (
                      <p className="text-xs text-muted-foreground">
                        Last executed: {new Date(playbook.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Automated Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {playbooks.reduce((sum, p) => sum + p.steps.filter(s => s.automated).length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all playbooks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Playbooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playbooks.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to execute
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="h-4 w-4" />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {playbooks.reduce((sum, p) => sum + p.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
