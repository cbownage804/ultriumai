import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus, Edit, Trash2, Clock, Users, ArrowRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';

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
  trigger: string;
  condition: string;
  levels: EscalationLevel[];
  isActive: boolean;
  lastTriggered: string;
  triggerCount: number;
}

export const EscalationRules = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<EscalationRule[]>([
    {
      id: '1',
      name: 'Critical Ticket Escalation',
      trigger: 'ticket_unresolved',
      condition: 'priority = critical AND status != resolved',
      levels: [
        { level: 1, delay: 15, delayUnit: 'minutes', notifyVia: ['email', 'slack'], recipients: ['On-Call Team'] },
        { level: 2, delay: 30, delayUnit: 'minutes', notifyVia: ['email', 'sms'], recipients: ['IT Manager'] },
        { level: 3, delay: 1, delayUnit: 'hours', notifyVia: ['email', 'sms', 'call'], recipients: ['Director'] },
      ],
      isActive: true,
      lastTriggered: '2 hours ago',
      triggerCount: 45,
    },
    {
      id: '2',
      name: 'SLA Breach Prevention',
      trigger: 'sla_warning',
      condition: 'sla_remaining_time < 30 minutes',
      levels: [
        { level: 1, delay: 0, delayUnit: 'minutes', notifyVia: ['email', 'slack'], recipients: ['Assigned Tech'] },
        { level: 2, delay: 15, delayUnit: 'minutes', notifyVia: ['email', 'sms'], recipients: ['Team Lead'] },
      ],
      isActive: true,
      lastTriggered: '45 min ago',
      triggerCount: 128,
    },
    {
      id: '3',
      name: 'Security Incident Response',
      trigger: 'security_alert',
      condition: 'severity = critical OR threat_level = high',
      levels: [
        { level: 1, delay: 0, delayUnit: 'minutes', notifyVia: ['email', 'sms', 'slack'], recipients: ['Security Team'] },
        { level: 2, delay: 5, delayUnit: 'minutes', notifyVia: ['email', 'sms', 'call'], recipients: ['CISO'] },
        { level: 3, delay: 15, delayUnit: 'minutes', notifyVia: ['email', 'sms', 'call'], recipients: ['Executive Team'] },
      ],
      isActive: true,
      lastTriggered: '1 day ago',
      triggerCount: 12,
    },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Escalation rule deleted', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Escalation Rules</h3>
          <p className="text-sm text-muted-foreground">Automated escalation chains for incidents and alerts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>Create Escalation Rule</DialogTitle>
            </DialogHeader>
            <EscalationEditor onSave={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
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
                      {!rule.isActive && (
                        <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trigger: <code className="px-1 py-0.5 rounded bg-white/10 text-cyan-400">{rule.trigger}</code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Condition: {rule.condition}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <p className="text-xs text-muted-foreground">Last triggered</p>
                    <p className="text-sm">{rule.lastTriggered}</p>
                    <p className="text-xs text-muted-foreground">{rule.triggerCount} times total</p>
                  </div>
                  
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggle(rule.id)}
                  />
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {rule.levels.map((level, levelIndex) => (
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
                        {level.notifyVia.map(method => (
                          <Badge key={method} variant="outline" className="text-xs capitalize">
                            {method}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {level.recipients.join(', ')}
                      </div>
                    </div>
                    {levelIndex < rule.levels.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const EscalationEditor = ({ onSave }: { onSave: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [levels, setLevels] = useState<EscalationLevel[]>([
    { level: 1, delay: 15, delayUnit: 'minutes', notifyVia: ['email'], recipients: [] }
  ]);

  const addLevel = () => {
    setLevels(prev => [...prev, {
      level: prev.length + 1,
      delay: 30,
      delayUnit: 'minutes',
      notifyVia: ['email'],
      recipients: []
    }]);
  };

  const handleSave = () => {
    toast({ title: 'Escalation rule created successfully' });
    onSave();
  };

  return (
    <div className="space-y-4">
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
          <Select value={trigger} onValueChange={setTrigger}>
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
                  onClick={() => setLevels(prev => prev.filter((_, i) => i !== index))}
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
                    onChange={(e) => {
                      const newLevels = [...levels];
                      newLevels[index].delay = parseInt(e.target.value);
                      setLevels(newLevels);
                    }}
                  />
                  <Select 
                    value={level.delayUnit}
                    onValueChange={(val: 'minutes' | 'hours') => {
                      const newLevels = [...levels];
                      newLevels[index].delayUnit = val;
                      setLevels(newLevels);
                    }}
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
                <Select>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Recipients</Label>
                <Select>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" className="border-white/10">
          <Play className="h-4 w-4 mr-2" />
          Test Rule
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          Save Rule
        </Button>
      </div>
    </div>
  );
};
