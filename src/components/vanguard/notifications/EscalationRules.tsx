import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus, Edit, Trash2, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EscalationLevel {
  level: number;
  delay: number;
  delayUnit: 'minutes' | 'hours';
  notifyVia: string[];
  recipients: string[];
}

interface EscalationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_conditions: Record<string, any>;
  escalation_levels: EscalationLevel[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EscalationRules = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);

  useEffect(() => {
    if (user) loadRules();
  }, [user]);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedRules = (data || []).map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        trigger_conditions: (rule.trigger_conditions || {}) as Record<string, any>,
        escalation_levels: (rule.escalation_levels || []) as unknown as EscalationLevel[],
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
      }));
      
      setRules(parsedRules);
    } catch (error: any) {
      console.error('Error loading rules:', error);
      toast({ title: 'Error loading escalation rules', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (rule: EscalationRule) => {
    try {
      const { error } = await supabase
        .from('escalation_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);

      if (error) throw error;
      setRules(prev => prev.map(r => 
        r.id === rule.id ? { ...r, is_active: !r.is_active } : r
      ));
    } catch (error) {
      toast({ title: 'Error updating rule', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('escalation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Escalation rule deleted' });
    } catch (error) {
      toast({ title: 'Error deleting rule', variant: 'destructive' });
    }
  };

  const handleSave = async (ruleData: Partial<EscalationRule>) => {
    if (!user) return;
    try {
      if (editingRule) {
        const { error } = await supabase
          .from('escalation_rules')
          .update({
            name: ruleData.name,
            description: ruleData.description,
            trigger_conditions: ruleData.trigger_conditions as any,
            escalation_levels: ruleData.escalation_levels as any,
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        setRules(prev => prev.map(r => 
          r.id === editingRule.id ? { ...r, ...ruleData } : r
        ));
        toast({ title: 'Escalation rule updated' });
      } else {
        const { data, error } = await supabase
          .from('escalation_rules')
          .insert([{
            user_id: user.id,
            name: ruleData.name!,
            description: ruleData.description,
            trigger_conditions: (ruleData.trigger_conditions || {}) as any,
            escalation_levels: (ruleData.escalation_levels || []) as any,
          }])
          .select()
          .single();

        if (error) throw error;
        
        const newRule: EscalationRule = {
          id: data.id,
          name: data.name,
          description: data.description,
          trigger_conditions: (data.trigger_conditions || {}) as Record<string, any>,
          escalation_levels: (data.escalation_levels || []) as unknown as EscalationLevel[],
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        
        setRules(prev => [newRule, ...prev]);
        toast({ title: 'Escalation rule created' });
      }
      setIsCreateOpen(false);
      setEditingRule(null);
    } catch (error: any) {
      toast({ title: 'Error saving rule', variant: 'destructive' });
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Escalation Rules</h3>
          <p className="text-sm text-muted-foreground">Automated escalation chains for incidents and alerts</p>
        </div>
        <Dialog open={isCreateOpen || !!editingRule} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingRule(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Escalation Rule' : 'Create Escalation Rule'}</DialogTitle>
            </DialogHeader>
            <EscalationEditor 
              rule={editingRule}
              onSave={handleSave}
              onCancel={() => {
                setIsCreateOpen(false);
                setEditingRule(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <PremiumCard variant="glass" className="p-8 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">No escalation rules</h4>
          <p className="text-sm text-muted-foreground mb-4">Create your first escalation rule to automate incident response</p>
        </PremiumCard>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PremiumCard variant="glass" className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                      <GitBranch className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        {!rule.is_active && (
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                            Paused
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated: {formatTime(rule.updated_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggle(rule)}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Escalation Levels */}
                {rule.escalation_levels.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {rule.escalation_levels.map((level, levelIndex) => (
                      <div key={level.level} className="flex items-center">
                        <div className="flex-shrink-0 p-3 rounded-lg bg-white/5 border border-white/10 min-w-[180px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-cyan-500/20 text-cyan-400">Level {level.level}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {level.delay === 0 ? 'Immediate' : `${level.delay} ${level.delayUnit}`}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {level.notifyVia?.map(method => (
                              <Badge key={method} variant="outline" className="text-xs capitalize">
                                {method}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {level.recipients?.join(', ') || 'No recipients'}
                          </div>
                        </div>
                        {levelIndex < rule.escalation_levels.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface EscalationEditorProps {
  rule?: EscalationRule | null;
  onSave: (data: Partial<EscalationRule>) => void;
  onCancel: () => void;
}

const EscalationEditor = ({ rule, onSave, onCancel }: EscalationEditorProps) => {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [triggerEvent, setTriggerEvent] = useState(
    (rule?.trigger_conditions as any)?.event || ''
  );
  const [levels, setLevels] = useState<EscalationLevel[]>(
    rule?.escalation_levels?.length ? rule.escalation_levels : [
      { level: 1, delay: 15, delayUnit: 'minutes', notifyVia: ['email'], recipients: [] }
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  const addLevel = () => {
    setLevels(prev => [...prev, {
      level: prev.length + 1,
      delay: 30,
      delayUnit: 'minutes',
      notifyVia: ['email'],
      recipients: []
    }]);
  };

  const updateLevel = (index: number, updates: Partial<EscalationLevel>) => {
    setLevels(prev => prev.map((level, i) => 
      i === index ? { ...level, ...updates } : level
    ));
  };

  const removeLevel = (index: number) => {
    setLevels(prev => prev.filter((_, i) => i !== index).map((level, i) => ({
      ...level,
      level: i + 1
    })));
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsSaving(true);
    await onSave({ 
      name, 
      description: description || null,
      trigger_conditions: { event: triggerEvent },
      escalation_levels: levels 
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rule Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Critical Ticket Escalation"
            className="bg-white/5 border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label>Trigger Event</Label>
          <Select value={triggerEvent} onValueChange={setTriggerEvent}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue placeholder="Select trigger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ticket_unresolved">Ticket Unresolved</SelectItem>
              <SelectItem value="sla_warning">SLA Warning</SelectItem>
              <SelectItem value="sla_breach">SLA Breach</SelectItem>
              <SelectItem value="security_alert">Security Alert</SelectItem>
              <SelectItem value="incident_created">Incident Created</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe when this rule should trigger..."
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Escalation Levels</Label>
          <Button variant="outline" size="sm" onClick={addLevel} className="border-white/10">
            <Plus className="h-4 w-4 mr-1" />
            Add Level
          </Button>
        </div>

        {levels.map((level, index) => (
          <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-cyan-500/20 text-cyan-400">Level {level.level}</Badge>
              {levels.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-red-400"
                  onClick={() => removeLevel(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Delay</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={level.delay}
                    className="bg-white/5 border-white/10 w-20"
                    onChange={(e) => updateLevel(index, { delay: parseInt(e.target.value) || 0 })}
                  />
                  <Select 
                    value={level.delayUnit}
                    onValueChange={(val: 'minutes' | 'hours') => updateLevel(index, { delayUnit: val })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Notify Via</Label>
                <Select
                  value={level.notifyVia[0] || 'email'}
                  onValueChange={(val) => updateLevel(index, { notifyVia: [val] })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Recipients</Label>
                <Select
                  value={level.recipients[0] || ''}
                  onValueChange={(val) => updateLevel(index, { recipients: [val] })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_call">On-Call Team</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="manager">IT Manager</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-[hsl(var(--vanguard-card))]">
        <Button variant="outline" className="border-white/10" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-cyan-500 to-blue-500"
          disabled={isSaving || !name}
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {rule ? 'Update Rule' : 'Save Rule'}
        </Button>
      </div>
    </div>
  );
};
