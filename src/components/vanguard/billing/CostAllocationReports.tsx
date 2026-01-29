import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart as PieIcon, DollarSign, Users, Clock,
  Monitor, Ticket, TrendingUp, RefreshCw, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientCost {
  id: string;
  clientName: string;
  deviceCost: number;
  supportHours: number;
  supportCost: number;
  licensingCost: number;
  totalCost: number;
  revenue: number;
  margin: number;
}

interface TechUtilization {
  name: string;
  billable: number;
  nonBillable: number;
}

const COST_BREAKDOWN_COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#4ade80'];

export function CostAllocationReports() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [clients, setClients] = useState<ClientCost[]>([]);
  const [techUtilization, setTechUtilization] = useState<TechUtilization[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<{name: string; value: number; color: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user, selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load client costs
      const { data: costsData, error: costsError } = await supabase
        .from('vanguard_client_costs')
        .select('*')
        .eq('user_id', user?.id)
        .order('period_start', { ascending: false });

      // Load MSP clients to get names
      const { data: clientsData } = await (supabase as any)
        .from('msp_clients')
        .select('id, company_name')
        .eq('user_id', user?.id);

      const clientMap = new Map<string, string>((clientsData || []).map((c: any) => [c.id, c.company_name]));

      if (!costsError && costsData && costsData.length > 0) {
        const mapped: ClientCost[] = costsData.map((c: any) => ({
          id: c.id,
          clientName: String(clientMap.get(c.client_id) || 'Unknown Client'),
          deviceCost: Number(c.device_cost) || 0,
          supportHours: Number(c.support_hours) || 0,
          supportCost: Number(c.support_cost) || 0,
          licensingCost: Number(c.licensing_cost) || 0,
          totalCost: Number(c.total_cost) || 0,
          revenue: Number(c.revenue) || 0,
          margin: Number(c.margin_percent) || 0,
        }));
        setClients(mapped);

        // Calculate cost breakdown from real data
        const totalDevice = mapped.reduce((sum, c) => sum + c.deviceCost, 0);
        const totalSupport = mapped.reduce((sum, c) => sum + c.supportCost, 0);
        const totalLicensing = mapped.reduce((sum, c) => sum + c.licensingCost, 0);
        const total = totalDevice + totalSupport + totalLicensing;
        
        if (total > 0) {
          setCostBreakdown([
            { name: 'Device Management', value: Math.round((totalDevice / total) * 100), color: '#22d3ee' },
            { name: 'Support Hours', value: Math.round((totalSupport / total) * 100), color: '#a78bfa' },
            { name: 'Licensing', value: Math.round((totalLicensing / total) * 100), color: '#f59e0b' },
            { name: 'Infrastructure', value: 10, color: '#4ade80' }
          ]);
        }
      } else {
        // Use demo data if no real data
        setClients([
          { id: '1', clientName: 'Acme Corporation', deviceCost: 1450, supportHours: 24, supportCost: 1800, licensingCost: 500, totalCost: 3750, revenue: 4850, margin: 22.7 },
          { id: '2', clientName: 'Global Finance LLC', deviceCost: 2340, supportHours: 18, supportCost: 1350, licensingCost: 800, totalCost: 4490, revenue: 5200, margin: 13.7 },
          { id: '3', clientName: 'TechStart Inc', deviceCost: 670, supportHours: 32, supportCost: 2400, licensingCost: 250, totalCost: 3320, revenue: 3200, margin: -3.8 },
        ]);
        setCostBreakdown([
          { name: 'Device Management', value: 35, color: '#22d3ee' },
          { name: 'Support Hours', value: 40, color: '#a78bfa' },
          { name: 'Licensing', value: 15, color: '#f59e0b' },
          { name: 'Infrastructure', value: 10, color: '#4ade80' }
        ]);
      }

      // Load technician utilization
      const { data: utilData, error: utilError } = await supabase
        .from('vanguard_technician_utilization')
        .select('*')
        .eq('user_id', user?.id)
        .order('period_date', { ascending: false })
        .limit(10);

      if (!utilError && utilData && utilData.length > 0) {
        // Aggregate by technician
        const techMap = new Map<string, {billable: number; nonBillable: number; count: number}>();
        utilData.forEach((u: any) => {
          const existing = techMap.get(u.technician_name) || { billable: 0, nonBillable: 0, count: 0 };
          techMap.set(u.technician_name, {
            billable: existing.billable + Number(u.billable_hours),
            nonBillable: existing.nonBillable + Number(u.non_billable_hours),
            count: existing.count + 1
          });
        });

        const mapped: TechUtilization[] = Array.from(techMap.entries()).map(([name, data]) => ({
          name,
          billable: Math.round((data.billable / (data.billable + data.nonBillable)) * 100) || 0,
          nonBillable: Math.round((data.nonBillable / (data.billable + data.nonBillable)) * 100) || 0,
        }));
        setTechUtilization(mapped);
      } else {
        // Demo data
        setTechUtilization([
          { name: 'Alex R.', billable: 75, nonBillable: 25 },
          { name: 'Sarah C.', billable: 82, nonBillable: 18 },
          { name: 'Marcus J.', billable: 68, nonBillable: 32 },
          { name: 'Emily W.', billable: 79, nonBillable: 21 }
        ]);
      }
    } catch (err) {
      console.error('Failed to load cost data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = clients.reduce((sum, c) => sum + c.totalCost, 0);
  const totalRevenue = clients.reduce((sum, c) => sum + c.revenue, 0);
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : '0';
  const totalSupportHours = clients.reduce((sum, c) => sum + c.supportHours, 0);

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return 'text-green-400';
    if (margin >= 10) return 'text-cyan-400';
    if (margin >= 0) return 'text-amber-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <PieIcon className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Cost Allocation Reports</h2>
            <p className="text-sm text-slate-400">Analyze profitability and resource allocation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px] bg-slate-900/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="previous">Previous Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-500">Total Costs</span>
            </div>
            <p className="text-2xl font-bold text-white">${(totalCost / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${(totalRevenue / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <PieIcon className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Avg Margin</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{avgMargin}%</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-500">Support Hours</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{totalSupportHours}h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">Cost Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {costBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technician Utilization */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Technician Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {techUtilization.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-slate-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No utilization data yet</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={techUtilization} layout="vertical">
                      <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={70} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #22d3ee40',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="billable" stackId="a" fill="#22d3ee" name="Billable %" />
                      <Bar dataKey="nonBillable" stackId="a" fill="#64748b" name="Non-Billable %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-400">Billable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500" />
                    <span className="text-xs text-slate-400">Non-Billable</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Profitability Table */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-amber-400 text-sm">Client Profitability Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cost data yet</p>
              <p className="text-sm">Add client cost records to see profitability analysis</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Client</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Device Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Support (hrs)</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Total Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Revenue</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                      <td className="py-3 px-4">
                        <span className="text-sm text-white font-medium">{client.clientName}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-slate-300">${client.deviceCost.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-slate-300">{client.supportHours}h (${client.supportCost})</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-red-400">${client.totalCost.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-green-400">${client.revenue.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-bold ${getMarginColor(client.margin)}`}>
                          {client.margin > 0 ? '+' : ''}{client.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
