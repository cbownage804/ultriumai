import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, Plus, Trash2, AlertTriangle, Workflow, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AlertTriggerRule {
  id: string;
  name: string;
  alertType: string;
  alertSeverity: string;
  runbookId: string;
  runbookName: string;
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

export function RunbookAlertTrigger() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertTriggerRule[]>([]);
  const [runbooks, setRunbooks] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    alertType: 'agent_offline',
    alertSeverity: 'high',
    runbookId: '',
  });

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const [{ data: rbs }, { data: rulesData }] = await Promise.all([
      supabase.from('vanguard_runbooks').select('id, name').eq('user_id', user.id).eq('is_active', true),
      supabase.from('runbook_alert_rules').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setRunbooks(rbs || []);

    if (rulesData) {
      setRules(rulesData.map((r: any) => ({
        id: r.id,
        name: r.name,
        alertType: r.alert_type,
        alertSeverity: r.alert_severity,
        runbookId: r.runbook_id || '',
        runbookName: rbs?.find(rb => rb.id === r.runbook_id)?.name || 'Unknown',
        isActive: r.is_active ?? true,
        triggerCount: r.trigger_count || 0,
        lastTriggered: r.last_triggered_at || undefined,
      })));
    }
    setLoading(false);
  };

  const handleAddRule = async () => {
    if (!user?.id || !newRule.name || !newRule.runbookId) {
      toast.error('Please fill in all fields');
      return;
    }
    const { error } = await supabase.from('runbook_alert_rules').insert({
      user_id: user.id, name: newRule.name, alert_type: newRule.alertType,
      alert_severity: newRule.alertSeverity, runbook_id: newRule.runbookId, is_active: true,
    } as any);
    if (error) { toast.error('Failed to create rule'); return; }
    setNewRule({ name: '', alertType: 'agent_offline', alertSeverity: 'high', runbookId: '' });
    setShowAdd(false);
    fetchData();
    toast.success('Auto-execution rule created');
  };

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    await supabase.from('runbook_alert_rules').update({ is_active: !rule.isActive } as any).eq('id', id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = async (id: string) => {
    await supabase.from('runbook_alert_rules').delete().eq('id', id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" />Runbook Auto-Execution</h2>
          <p className="text-muted-foreground">Trigger remediation scripts automatically when alerts fire</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
      </div>

      {showAdd && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-sm">New Auto-Execution Rule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Disk Full Auto-Cleanup" />
              </div>
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select value={newRule.alertType} onValueChange={v => setNewRule(p => ({ ...p, alertType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent_offline">Agent Offline</SelectItem>
                    <SelectItem value="disk_full">Disk Full</SelectItem>
                    <SelectItem value="high_cpu">High CPU Usage</SelectItem>
                    <SelectItem value="memory_critical">Memory Critical</SelectItem>
                    <SelectItem value="service_stopped">Service Stopped</SelectItem>
                    <SelectItem value="security_threat">Security Threat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minimum Severity</Label>
                <Select value={newRule.alertSeverity} onValueChange={v => setNewRule(p => ({ ...p, alertSeverity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Runbook to Execute</Label>
                <Select value={newRule.runbookId} onValueChange={v => setNewRule(p => ({ ...p, runbookId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select runbook" /></SelectTrigger>
                  <SelectContent>
                    {runbooks.map(rb => <SelectItem key={rb.id} value={rb.id}>{rb.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddRule}>Create Rule</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>When an alert matches these conditions, the linked runbook executes automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Workflow className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        When <Badge variant="outline" className="text-xs mx-1">{rule.alertType}</Badge>
                        at <Badge variant="outline" className="text-xs mx-1">{rule.alertSeverity}+</Badge>
                        → Run <Badge className="bg-cyan-500/20 text-cyan-400 text-xs mx-1">{rule.runbookName}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Triggered {rule.triggerCount}x
                        {rule.lastTriggered && ` · Last: ${new Date(rule.lastTriggered).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                    <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No auto-execution rules configured. Create one to automate alert responses.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
