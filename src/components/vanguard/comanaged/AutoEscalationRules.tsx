import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Edit,
  Zap,
  ArrowUpCircle,
  Timer,
  Tag,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

interface EscalationRule {
  id: string;
  rule_name: string;
  description: string;
  trigger_type: 'time_based' | 'priority_based' | 'category_based' | 'skill_mismatch';
  conditions: Record<string, any>;
  escalate_after_minutes: number;
  escalate_to: 'msp' | 'internal_manager' | 'oncall';
  priority_bump: boolean;
  is_active: boolean;
  execution_count: number;
  last_triggered_at?: string;
}

export function AutoEscalationRules() {
  const [rules, setRules] = useState<EscalationRule[]>([
    {
      id: '1',
      rule_name: 'Critical Ticket SLA Breach',
      description: 'Escalate critical tickets if not responded within 15 minutes',
      trigger_type: 'time_based',
      conditions: { priority: 'critical', status: 'new' },
      escalate_after_minutes: 15,
      escalate_to: 'msp',
      priority_bump: false,
      is_active: true,
      execution_count: 24,
      last_triggered_at: '2024-01-18T14:30:00',
    },
    {
      id: '2',
      rule_name: 'High Priority Auto-Escalate',
      description: 'Escalate high priority tickets after 1 hour without resolution progress',
      trigger_type: 'time_based',
      conditions: { priority: 'high', status: 'in_progress' },
      escalate_after_minutes: 60,
      escalate_to: 'oncall',
      priority_bump: true,
      is_active: true,
      execution_count: 12,
      last_triggered_at: '2024-01-17T09:15:00',
    },
    {
      id: '3',
      rule_name: 'Network Issues to MSP',
      description: 'Route all network-related tickets directly to MSP team',
      trigger_type: 'category_based',
      conditions: { category: 'network', subcategory: 'any' },
      escalate_after_minutes: 0,
      escalate_to: 'msp',
      priority_bump: false,
      is_active: true,
      execution_count: 45,
    },
    {
      id: '4',
      rule_name: 'Skill Mismatch Detection',
      description: 'Escalate if assigned tech lacks required skills for ticket category',
      trigger_type: 'skill_mismatch',
      conditions: { check_skills: true },
      escalate_after_minutes: 30,
      escalate_to: 'internal_manager',
      priority_bump: false,
      is_active: false,
      execution_count: 8,
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    description: '',
    trigger_type: 'time_based' as const,
    escalate_after_minutes: 60,
    escalate_to: 'msp' as const,
    priority_bump: false,
  });

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'time_based': return <Timer className="h-4 w-4" />;
      case 'priority_based': return <AlertTriangle className="h-4 w-4" />;
      case 'category_based': return <Tag className="h-4 w-4" />;
      case 'skill_mismatch': return <UserCog className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'time_based': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'priority_based': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'category_based': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'skill_mismatch': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getEscalateToLabel = (to: string) => {
    switch (to) {
      case 'msp': return 'MSP Team';
      case 'internal_manager': return 'Internal Manager';
      case 'oncall': return 'On-Call';
      default: return to;
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return 'Immediately';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleCreate = () => {
    if (!newRule.rule_name) {
      toast.error('Rule name is required');
      return;
    }

    const rule: EscalationRule = {
      id: Date.now().toString(),
      ...newRule,
      conditions: {},
      is_active: true,
      execution_count: 0,
    };

    setRules([...rules, rule]);
    setNewRule({
      rule_name: '',
      description: '',
      trigger_type: 'time_based',
      escalate_after_minutes: 60,
      escalate_to: 'msp',
      priority_bump: false,
    });
    setIsCreateOpen(false);
    toast.success('Escalation rule created');
  };

  const handleToggle = (id: string) => {
    setRules(rules.map(r => 
      r.id === id ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success('Rule deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowUpCircle className="h-6 w-6 text-primary" />
            Auto-Escalation Rules
          </h2>
          <p className="text-muted-foreground">
            Automatically escalate tickets based on time, priority, or skill requirements
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Escalation Rule</DialogTitle>
              <DialogDescription>
                Define conditions for automatic ticket escalation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                  placeholder="Critical Ticket Escalation"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Describe when this rule triggers"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={newRule.trigger_type}
                    onValueChange={(v: any) => setNewRule({ ...newRule, trigger_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_based">Time-Based</SelectItem>
                      <SelectItem value="priority_based">Priority-Based</SelectItem>
                      <SelectItem value="category_based">Category-Based</SelectItem>
                      <SelectItem value="skill_mismatch">Skill Mismatch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Escalate After (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newRule.escalate_after_minutes}
                    onChange={(e) => setNewRule({ ...newRule, escalate_after_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Escalate To</Label>
                <Select
                  value={newRule.escalate_to}
                  onValueChange={(v: any) => setNewRule({ ...newRule, escalate_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msp">MSP Team</SelectItem>
                    <SelectItem value="internal_manager">Internal IT Manager</SelectItem>
                    <SelectItem value="oncall">On-Call Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bump Priority</Label>
                  <p className="text-xs text-muted-foreground">Increase ticket priority when escalated</p>
                </div>
                <Switch
                  checked={newRule.priority_bump}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, priority_bump: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-sm text-muted-foreground">Total Rules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {rules.filter(r => r.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {rules.reduce((sum, r) => sum + r.execution_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Executions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {rules.filter(r => r.trigger_type === 'time_based').length}
              </p>
              <p className="text-sm text-muted-foreground">Time-Based</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Rules</CardTitle>
          <CardDescription>
            Configure when tickets should automatically escalate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Escalate To</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.rule_name}</p>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTriggerColor(rule.trigger_type)}>
                      {getTriggerIcon(rule.trigger_type)}
                      <span className="ml-1">{rule.trigger_type.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatMinutes(rule.escalate_after_minutes)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getEscalateToLabel(rule.escalate_to)}
                    </Badge>
                    {rule.priority_bump && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        +Priority
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{rule.execution_count}</span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggle(rule.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
