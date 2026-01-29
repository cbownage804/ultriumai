import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Route, Users, Zap, Target,
  CheckCircle2, Clock, BarChart3, Settings, Brain, Plus, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Technician {
  id: string;
  name: string;
  avatar: string;
  skills: string[];
  activeTickets: number;
  maxCapacity: number;
  avgResolutionTime: string;
  rating: number;
  status: 'available' | 'busy' | 'away' | 'offline';
}

interface RoutingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  matchCount: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function SmartTicketRouter() {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [autoRouting, setAutoRouting] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', condition: '', action: '' });

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([loadTechnicians(), loadRules(), loadCategories()]);
    setIsLoading(false);
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_technicians')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;

      setTechnicians((data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        avatar: t.avatar || t.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        skills: t.skills || [],
        activeTickets: t.active_tickets || 0,
        maxCapacity: t.max_capacity || 8,
        avgResolutionTime: `${Math.round((t.avg_resolution_time_minutes || 120) / 60 * 10) / 10}h`,
        rating: Number(t.rating) || 4.5,
        status: t.status || 'available'
      })));
    } catch (err) {
      console.error('Failed to load technicians:', err);
    }
  };

  const loadRules = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_routing_rules')
        .select('*')
        .eq('user_id', user?.id)
        .order('priority', { ascending: false });

      if (error) throw error;

      setRules((data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        condition: `${r.condition_field} ${r.condition_operator} "${r.condition_value}"`,
        action: `${r.action_type}: ${r.action_target || 'Auto'}`,
        enabled: r.is_enabled,
        matchCount: r.match_count || 0
      })));
    } catch (err) {
      console.error('Failed to load routing rules:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_ticket_categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('percentage', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setCategories(data.map((c: any) => ({
          name: c.category_name,
          value: Number(c.percentage) || 0,
          color: c.color || '#22d3ee'
        })));
      } else {
        // Default empty state visualization
        setCategories([
          { name: 'No Data', value: 100, color: '#64748b' }
        ]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const { error } = await (supabase as any)
        .from('vanguard_routing_rules')
        .update({ is_enabled: !rule.enabled, updated_at: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) throw error;

      setRules(rules.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ));
      toast.success(rule.enabled ? 'Rule disabled' : 'Rule enabled');
    } catch (err) {
      toast.error('Failed to update rule');
    }
  };

  const addRule = async () => {
    if (!newRule.name || !newRule.condition || !newRule.action) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('vanguard_routing_rules')
        .insert({
          user_id: user?.id,
          name: newRule.name,
          condition_field: 'custom',
          condition_operator: 'matches',
          condition_value: newRule.condition,
          action_type: 'route',
          action_target: newRule.action,
          is_enabled: true
        });

      if (error) throw error;

      toast.success('Rule created');
      setNewRule({ name: '', condition: '', action: '' });
      setShowAddRule(false);
      loadRules();
    } catch (err) {
      toast.error('Failed to create rule');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      case 'away': return 'bg-slate-500';
      default: return 'bg-red-500';
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
          <Button variant="outline" size="sm" onClick={loadAllData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categories.map((entry, index) => (
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
              {categories.map((cat) => (
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
            {technicians.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No technicians configured</p>
                <p className="text-sm">Add team members to enable smart routing</p>
              </div>
            ) : (
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
            )}
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
            <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Routing Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-slate-400">Rule Name</label>
                    <Input
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="e.g., VIP Clients → Senior Tech"
                      className="mt-1 bg-black/40 border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Condition</label>
                    <Input
                      value={newRule.condition}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      placeholder="e.g., priority = critical"
                      className="mt-1 bg-black/40 border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Action</label>
                    <Input
                      value={newRule.action}
                      onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                      placeholder="e.g., Assign to senior pool"
                      className="mt-1 bg-black/40 border-slate-700"
                    />
                  </div>
                  <Button onClick={addRule} className="w-full">
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No routing rules configured</p>
              <p className="text-sm">Create rules to automate ticket assignment</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
