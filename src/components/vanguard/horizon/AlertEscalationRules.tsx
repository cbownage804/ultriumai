import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowUpCircle, Plus, Trash2, Edit, Clock, Users, 
  Mail, Phone, Bell, ChevronRight, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  severity_threshold: string;
  conditions: any;
  notification_channels: any;
  is_active: boolean;
  created_at: string;
}

export function AlertEscalationRules() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPolicy, setShowAddPolicy] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRules(data || []);
    } catch (err) {
      console.error('Error fetching alert rules:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getNotifyIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'sms': return <Phone className="h-3 w-3" />;
      case 'call': return <Phone className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    const { error } = await supabase
      .from('alert_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to toggle rule', variant: 'destructive' });
    } else {
      fetchRules();
    }
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Escalation rule removed' });
      fetchRules();
    }
  };

  const handleAddRule = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('alert_rules')
      .insert({
        user_id: user.id,
        name: 'New Escalation Rule',
        severity_threshold: 'high',
        conditions: {},
        notification_channels: { channels: ['email'] },
        is_active: true,
      });
    if (error) {
      toast({ title: 'Error', description: 'Failed to create rule', variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: 'New escalation rule created' });
      setShowAddPolicy(false);
      fetchRules();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ArrowUpCircle className="h-6 w-6" />
            Alert Escalation Rules
          </h2>
          <p className="text-muted-foreground">
            {rules.length > 0 ? 'Live escalation policies from your alert rules' : 'No escalation rules configured'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRules}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{rules.length}</p>
            <p className="text-xs text-muted-foreground">Total Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-400">{rules.filter(r => r.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{rules.filter(r => !r.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Policies</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule) => {
                const channels = rule.notification_channels as any;
                const channelList = channels?.channels || [];
                return (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge className={getSeverityColor(rule.severity_threshold)}>{rule.severity_threshold}</Badge>
                        <Badge variant={rule.is_active ? 'default' : 'outline'}>
                          {rule.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.is_active} onCheckedChange={() => toggleRule(rule.id)} />
                        <Button size="sm" variant="ghost" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {rule.description && <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Channels:</span>
                      {channelList.length > 0 ? channelList.map((ch: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded">
                          {getNotifyIcon(ch)}
                          <span>{ch}</span>
                        </div>
                      )) : <span>No channels configured</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(rule.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ArrowUpCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No escalation rules</p>
              <p className="text-sm">Create rules to automatically escalate alerts based on severity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
