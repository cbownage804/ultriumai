import { useState } from 'react';
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
  Mail, Phone, Bell, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EscalationLevel {
  level: number;
  delayMinutes: number;
  notifyType: 'email' | 'sms' | 'call' | 'all';
  recipients: string[];
}

interface EscalationPolicy {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  levels: EscalationLevel[];
  isActive: boolean;
  escalationsTriggered: number;
}

const mockPolicies: EscalationPolicy[] = [
  {
    id: '1',
    name: 'Critical Infrastructure',
    description: 'Server down, network outage, security breach',
    severity: 'critical',
    levels: [
      { level: 1, delayMinutes: 0, notifyType: 'all', recipients: ['on-call@company.com'] },
      { level: 2, delayMinutes: 15, notifyType: 'sms', recipients: ['manager@company.com'] },
      { level: 3, delayMinutes: 30, notifyType: 'call', recipients: ['director@company.com'] },
    ],
    isActive: true,
    escalationsTriggered: 8
  },
  {
    id: '2',
    name: 'High Priority Alerts',
    description: 'Performance degradation, backup failures',
    severity: 'high',
    levels: [
      { level: 1, delayMinutes: 0, notifyType: 'email', recipients: ['it-team@company.com'] },
      { level: 2, delayMinutes: 30, notifyType: 'sms', recipients: ['on-call@company.com'] },
    ],
    isActive: true,
    escalationsTriggered: 23
  },
  {
    id: '3',
    name: 'Standard Escalation',
    description: 'Disk space warnings, certificate expiry',
    severity: 'medium',
    levels: [
      { level: 1, delayMinutes: 0, notifyType: 'email', recipients: ['helpdesk@company.com'] },
      { level: 2, delayMinutes: 60, notifyType: 'email', recipients: ['it-team@company.com'] },
    ],
    isActive: true,
    escalationsTriggered: 45
  },
];

export function AlertEscalationRules() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState(mockPolicies);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<EscalationPolicy | null>(null);

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
      case 'all': return <Bell className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
    toast({ title: 'Policy updated' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Escalation Rules</h2>
          <p className="text-muted-foreground">Auto-escalate unacknowledged alerts through notification chains</p>
        </div>
        <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Policy</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Escalation Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Policy Name</Label>
                  <Input placeholder="e.g., Critical Infrastructure" />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="When to apply this policy..." />
              </div>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Escalation Levels</h4>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" /> Add Level
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Badge variant="outline">Level 1</Badge>
                    <span className="text-sm">Immediately</span>
                    <ChevronRight className="h-4 w-4" />
                    <Select defaultValue="email">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="all">All Channels</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Recipients..." className="flex-1" />
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Badge variant="outline">Level 2</Badge>
                    <Input type="number" defaultValue="15" className="w-16" />
                    <span className="text-sm text-muted-foreground">min</span>
                    <ChevronRight className="h-4 w-4" />
                    <Select defaultValue="sms">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="all">All Channels</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Recipients..." className="flex-1" />
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => setShowAddPolicy(false)}>
                Create Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-sm text-muted-foreground">Active Policies</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-400">3</div>
            <p className="text-sm text-muted-foreground">In Escalation</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">76</div>
            <p className="text-sm text-muted-foreground">Total Escalated</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">12m</div>
            <p className="text-sm text-muted-foreground">Avg Resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Policies */}
      <div className="grid gap-4">
        {policies.map(policy => (
          <Card key={policy.id} className="bg-card/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{policy.name}</h3>
                    <Badge className={getSeverityColor(policy.severity)}>{policy.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{policy.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={policy.isActive}
                    onCheckedChange={() => togglePolicy(policy.id)}
                  />
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Escalation Chain Visualization */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {policy.levels.map((level, idx) => (
                  <div key={level.level} className="flex items-center">
                    <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg min-w-[140px]">
                      <Badge variant="outline" className="mb-2">Level {level.level}</Badge>
                      <div className="flex items-center gap-1 text-sm mb-1">
                        <Clock className="h-3 w-3" />
                        {level.delayMinutes === 0 ? 'Immediately' : `+${level.delayMinutes}m`}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getNotifyIcon(level.notifyType)}
                        <span className="capitalize">{level.notifyType}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <Users className="h-3 w-3" />
                        {level.recipients.length} recipient(s)
                      </div>
                    </div>
                    {idx < policy.levels.length - 1 && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <span>Triggered {policy.escalationsTriggered} times</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
