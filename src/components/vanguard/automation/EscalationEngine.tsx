import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, Bell, Clock, ArrowUp, Shield, 
  Mail, MessageSquare, Phone, Settings, Play, Pause,
  ChevronRight, Zap, Users, Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EscalationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  level: number;
  enabled: boolean;
  lastTriggered?: string;
}

export function EscalationEngine() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);

  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([
    {
      id: '1',
      name: 'SLA Breach Warning',
      trigger: 'time_based',
      conditions: ['Ticket age > 75% SLA', 'No response in 2 hours'],
      actions: ['Notify assigned tech', 'Alert team lead'],
      level: 1,
      enabled: true,
      lastTriggered: '2 hours ago'
    },
    {
      id: '2',
      name: 'Critical Priority Auto-Escalate',
      trigger: 'priority_based',
      conditions: ['Priority = Critical', 'Unacknowledged > 15 min'],
      actions: ['Escalate to Tier 2', 'Send SMS alert', 'Create incident'],
      level: 2,
      enabled: true,
      lastTriggered: '1 day ago'
    },
    {
      id: '3',
      name: 'Customer VIP Escalation',
      trigger: 'customer_based',
      conditions: ['Customer tier = VIP', 'Satisfaction < 3'],
      actions: ['Notify account manager', 'Priority boost', 'Executive alert'],
      level: 3,
      enabled: true
    },
    {
      id: '4',
      name: 'Repeated Issue Pattern',
      trigger: 'pattern_based',
      conditions: ['3+ tickets same issue', 'Within 7 days'],
      actions: ['Create problem ticket', 'Notify engineering', 'Root cause analysis'],
      level: 2,
      enabled: false
    }
  ]);

  const testEscalation = async (ticketId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-escalation-engine', {
        body: {
          ticket: {
            id: ticketId,
            subject: 'Network outage affecting multiple users',
            status: 'open',
            priority: 'critical',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString(),
            response_count: 1
          },
          escalationRules: escalationRules.filter(r => r.enabled),
          ticketHistory: [
            { action: 'created', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { action: 'assigned', timestamp: new Date(Date.now() - 3500000).toISOString() },
            { action: 'response', timestamp: new Date(Date.now() - 1800000).toISOString() }
          ]
        }
      });

      if (error) throw error;

      if (data?.success && data.escalation) {
        setActiveEscalations([data.escalation]);
        toast({
          title: data.escalation.escalation_required ? "Escalation Required" : "No Escalation Needed",
          description: data.escalation.escalation_notes,
          variant: data.escalation.escalation_required ? "destructive" : "default"
        });
      }
    } catch (error) {
      console.error('Escalation error:', error);
      toast({
        title: "Escalation Check Failed",
        description: "Could not analyze escalation requirements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setEscalationRules(rules => 
      rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
    );
    toast({
      title: "Rule Updated",
      description: "Escalation rule has been toggled"
    });
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-red-500';
      case 4: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rules">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Escalation Rules</TabsTrigger>
          <TabsTrigger value="active">Active Escalations</TabsTrigger>
          <TabsTrigger value="test">Test Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <CardTitle>Escalation Rules Engine</CardTitle>
                </div>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              <CardDescription>
                Configure automated escalation triggers and actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {escalationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${rule.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className={getLevelColor(rule.level)}>Level {rule.level}</Badge>
                        <h4 className="font-semibold">{rule.name}</h4>
                        {rule.lastTriggered && (
                          <span className="text-xs text-muted-foreground">
                            Last triggered: {rule.lastTriggered}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 text-sm">
                        <div>
                          <p className="text-muted-foreground font-medium">Conditions:</p>
                          <ul className="space-y-1">
                            {rule.conditions.map((c, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ChevronRight className="h-3 w-3" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Actions:</p>
                          <ul className="space-y-1">
                            {rule.actions.map((a, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Zap className="h-3 w-3 text-primary" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Active Escalations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">7</p>
                    <p className="text-sm text-muted-foreground">At Risk Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Resolved Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">48</p>
                    <p className="text-sm text-muted-foreground">Notifications Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Escalations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 'TKT-1234', subject: 'Server down - Production', level: 3, time: '45 min', action: 'Awaiting response' },
                  { id: 'TKT-1189', subject: 'Email delivery issues', level: 2, time: '2 hours', action: 'Escalated to Tier 2' },
                  { id: 'TKT-1156', subject: 'VPN connectivity', level: 1, time: '3 hours', action: 'SLA warning sent' }
                ].map((esc) => (
                  <div key={esc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={getLevelColor(esc.level)}>L{esc.level}</Badge>
                      <div>
                        <p className="font-medium">{esc.id}: {esc.subject}</p>
                        <p className="text-sm text-muted-foreground">{esc.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{esc.time}</span>
                      <Button size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Escalation Engine
              </CardTitle>
              <CardDescription>
                Test escalation rules against a sample ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Enter ticket ID to test..." defaultValue="TKT-1234" />
                <Button onClick={() => testEscalation('TKT-1234')} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Run Escalation Check'}
                </Button>
              </div>

              {activeEscalations.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-semibold">Analysis Result:</h4>
                  {activeEscalations.map((esc, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {esc.escalation_required ? (
                          <Badge variant="destructive">Escalation Required</Badge>
                        ) : (
                          <Badge variant="secondary">No Escalation Needed</Badge>
                        )}
                        {esc.escalation_level && (
                          <Badge className={getLevelColor(esc.escalation_level)}>
                            Level {esc.escalation_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{esc.escalation_notes}</p>
                      {esc.recommended_actions && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Recommended Actions:</p>
                          {esc.recommended_actions.map((action: any, aIdx: number) => (
                            <div key={aIdx} className="flex items-center gap-2 text-sm">
                              <Zap className="h-3 w-3 text-primary" />
                              {action.action}: {action.target}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
