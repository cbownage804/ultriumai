import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Plus, Trash2, Save, AlertTriangle, 
  Zap, Shield, Bell, Loader2, CheckCircle, Brain
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AlertRule {
  id: string;
  rule_name: string;
  event_types: string[];
  severity_threshold: string;
  auto_create_ticket: boolean;
  notify_email: boolean;
  notify_slack: boolean;
  block_user: boolean;
  require_mfa_reset: boolean;
  use_ai_triage: boolean;
  is_active: boolean;
  created_at: string;
}

export function AlertRulesConfig() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    ruleName: '',
    eventTypes: [] as string[],
    severityThreshold: 'high',
    autoCreateTicket: true,
    notifyEmail: false,
    notifySlack: false,
    useAiTriage: true
  });

  useEffect(() => {
    fetchRules();
  }, [user]);

  const fetchRules = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vanguard_sentinel_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!formData.ruleName || formData.eventTypes.length === 0) {
      toast.error('Please provide a name and select at least one event type');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vanguard_sentinel_rules')
        .insert({
          user_id: user?.id,
          rule_name: formData.ruleName,
          event_types: formData.eventTypes,
          severity_threshold: formData.severityThreshold,
          auto_create_ticket: formData.autoCreateTicket,
          notify_email: formData.notifyEmail,
          notify_slack: formData.notifySlack,
          use_ai_triage: formData.useAiTriage,
          is_active: true
        });

      if (error) throw error;

      toast.success('Alert rule created');
      setShowAddDialog(false);
      setFormData({
        ruleName: '',
        eventTypes: [],
        severityThreshold: 'high',
        autoCreateTicket: true,
        notifyEmail: false,
        notifySlack: false,
        useAiTriage: true
      });
      fetchRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('vanguard_sentinel_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
      toast.success(isActive ? 'Rule enabled' : 'Rule disabled');
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this alert rule?')) return;

    try {
      const { error } = await supabase
        .from('vanguard_sentinel_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
      toast.success('Rule deleted');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const toggleEventType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type]
    }));
  };

  const getEventTypeBadge = (type: string) => {
    const config: Record<string, { label: string; color: string }> = {
      risky_signin: { label: 'Risky Sign-In', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      conditional_access: { label: 'CA Block', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      mfa_failure: { label: 'MFA Failure', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      mailbox_rule: { label: 'Mailbox Rule', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
    };
    const { label, color } = config[type] || { label: type, color: 'bg-slate-500/20 text-slate-400' };
    return <Badge key={type} className={color}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Alert Rules</h2>
          <p className="text-slate-400 text-sm">Configure automated responses for security events</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-400" />
                Create Alert Rule
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-slate-300">Rule Name</Label>
                <Input 
                  placeholder="e.g., Critical Sign-In Alert"
                  value={formData.ruleName}
                  onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  className="mt-1 bg-black/40 border-cyan-500/30 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 block mb-2">Event Types</Label>
                <div className="flex flex-wrap gap-2">
                  {['risky_signin', 'conditional_access', 'mfa_failure', 'mailbox_rule'].map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`border-cyan-500/30 ${formData.eventTypes.includes(type) ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'}`}
                      onClick={() => toggleEventType(type)}
                    >
                      {formData.eventTypes.includes(type) && <CheckCircle className="h-3 w-3 mr-1" />}
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Minimum Severity</Label>
                <Select 
                  value={formData.severityThreshold} 
                  onValueChange={(v) => setFormData({ ...formData, severityThreshold: v })}
                >
                  <SelectTrigger className="mt-1 bg-black/40 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/30">
                    <SelectItem value="low">Low & Above</SelectItem>
                    <SelectItem value="medium">Medium & Above</SelectItem>
                    <SelectItem value="high">High & Above</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-white text-sm">Auto-create ticket</span>
                </div>
                <Switch 
                  checked={formData.autoCreateTicket}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoCreateTicket: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan-400" />
                  <span className="text-white text-sm">Email Notification</span>
                </div>
                <Switch 
                  checked={formData.notifyEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyEmail: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-400" />
                  <span className="text-white text-sm">Slack Notification</span>
                </div>
                <Switch 
                  checked={formData.notifySlack}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifySlack: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-sm">Use AI Triage</span>
                </div>
                <Switch 
                  checked={formData.useAiTriage}
                  onCheckedChange={(checked) => setFormData({ ...formData, useAiTriage: checked })}
                />
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
                onClick={handleAddRule}
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Create Rule</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Total Rules</p>
                <p className="text-2xl font-bold text-white">{rules.length}</p>
              </div>
              <Settings className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active Rules</p>
                <p className="text-2xl font-bold text-green-400">
                  {rules.filter(r => r.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Auto-Ticket Rules</p>
                <p className="text-2xl font-bold text-purple-400">
                  {rules.filter(r => r.auto_create_ticket && r.is_active).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Configured Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-cyan-400/30 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Alert Rules</h3>
              <p className="text-slate-400 text-sm mb-4">Create your first rule to automate security responses</p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-cyan-500/20 hover:bg-transparent">
                  <TableHead className="text-slate-400">Rule Name</TableHead>
                  <TableHead className="text-slate-400">Event Types</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Notifications</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{rule.rule_name}</p>
                        {rule.auto_create_ticket && (
                          <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30 mt-1">
                            <Zap className="h-2.5 w-2.5 mr-0.5" />Auto-Ticket
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {rule.event_types.slice(0, 2).map(type => getEventTypeBadge(type))}
                        {rule.event_types.length > 2 && (
                          <Badge className="bg-slate-500/20 text-slate-400">+{rule.event_types.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 capitalize">
                        {rule.severity_threshold}+
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.notify_email && (
                          <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                            <Bell className="h-2.5 w-2.5 mr-0.5" />Email
                          </Badge>
                        )}
                        {rule.notify_slack && (
                          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                            Slack
                          </Badge>
                        )}
                        {!rule.notify_email && !rule.notify_slack && (
                          <span className="text-slate-500 text-xs">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
