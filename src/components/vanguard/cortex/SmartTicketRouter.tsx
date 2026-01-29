import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Route, Users, Zap, TrendingUp, Target,
  CheckCircle2, Clock, BarChart3, Settings, Brain
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Technician {
  id: string;
  name: string;
  avatar: string;
  skills: string[];
  activeTickets: number;
  maxCapacity: number;
  avgResolutionTime: string;
  rating: number;
  status: 'available' | 'busy' | 'away';
}

interface RoutingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  matchCount: number;
}

const DEMO_TECHNICIANS: Technician[] = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    avatar: 'AR',
    skills: ['Network', 'Security', 'VPN'],
    activeTickets: 4,
    maxCapacity: 8,
    avgResolutionTime: '2.5h',
    rating: 4.8,
    status: 'available'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: 'SC',
    skills: ['Email', 'O365', 'Azure AD'],
    activeTickets: 6,
    maxCapacity: 8,
    avgResolutionTime: '1.8h',
    rating: 4.9,
    status: 'available'
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    avatar: 'MJ',
    skills: ['Hardware', 'Printers', 'Workstations'],
    activeTickets: 7,
    maxCapacity: 8,
    avgResolutionTime: '3.2h',
    rating: 4.6,
    status: 'busy'
  },
  {
    id: '4',
    name: 'Emily Watson',
    avatar: 'EW',
    skills: ['Cloud', 'Backup', 'Storage'],
    activeTickets: 3,
    maxCapacity: 8,
    avgResolutionTime: '2.1h',
    rating: 4.7,
    status: 'available'
  }
];

const DEMO_RULES: RoutingRule[] = [
  {
    id: '1',
    name: 'Priority Critical → Senior Tech',
    condition: 'priority = "critical"',
    action: 'Assign to senior technician pool',
    enabled: true,
    matchCount: 156
  },
  {
    id: '2',
    name: 'Email Issues → O365 Specialists',
    condition: 'category contains "email" OR "outlook"',
    action: 'Route to O365 skill group',
    enabled: true,
    matchCount: 423
  },
  {
    id: '3',
    name: 'VIP Clients → Dedicated Team',
    condition: 'client.tier = "enterprise"',
    action: 'Assign to VIP support team',
    enabled: true,
    matchCount: 89
  },
  {
    id: '4',
    name: 'After Hours → On-Call',
    condition: 'created_at.hour < 8 OR > 18',
    action: 'Route to on-call rotation',
    enabled: false,
    matchCount: 67
  }
];

const CATEGORY_DISTRIBUTION = [
  { name: 'Email', value: 35, color: '#22d3ee' },
  { name: 'Network', value: 25, color: '#a78bfa' },
  { name: 'Hardware', value: 20, color: '#f59e0b' },
  { name: 'Cloud', value: 15, color: '#4ade80' },
  { name: 'Other', value: 5, color: '#64748b' }
];

export function SmartTicketRouter() {
  const [technicians] = useState<Technician[]>(DEMO_TECHNICIANS);
  const [rules, setRules] = useState<RoutingRule[]>(DEMO_RULES);
  const [autoRouting, setAutoRouting] = useState(true);

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getWorkloadColor = (active: number, max: number) => {
    const percent = (active / max) * 100;
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <Route className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Smart Ticket Router</h2>
            <p className="text-sm text-slate-400">ML-powered assignment based on skills & workload</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 border border-cyan-500/30">
            <Brain className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Auto-Routing</span>
            <Switch
              checked={autoRouting}
              onCheckedChange={setAutoRouting}
            />
          </div>
          <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white">
            <Zap className="h-3 w-3 mr-1" />
            {autoRouting ? 'Active' : 'Manual'}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Ticket Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {CATEGORY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {CATEGORY_DISTRIBUTION.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-slate-400">{cat.name} ({cat.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technician Workload */}
        <Card className="bg-black/80 border-cyan-500/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Technician Workload & Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {tech.avatar}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(tech.status)}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{tech.name}</p>
                        <p className="text-xs text-slate-500">{tech.avgResolutionTime} avg</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="text-sm text-slate-300">{tech.rating}</span>
                    </div>
                  </div>

                  {/* Workload Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Workload</span>
                      <span className="text-xs text-slate-400">{tech.activeTickets}/{tech.maxCapacity}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getWorkloadColor(tech.activeTickets, tech.maxCapacity)} transition-all`}
                        style={{ width: `${(tech.activeTickets / tech.maxCapacity) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5">
                    {tech.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routing Rules */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Routing Rules
              </CardTitle>
              <CardDescription className="text-slate-500">
                Configure automatic ticket assignment rules
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Settings className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border transition-all ${
                  rule.enabled
                    ? 'bg-slate-900/50 border-slate-700'
                    : 'bg-slate-900/30 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">{rule.name}</p>
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {rule.matchCount} matches
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      <span className="text-cyan-400">IF</span> {rule.condition}{' '}
                      <span className="text-purple-400">THEN</span> {rule.action}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
