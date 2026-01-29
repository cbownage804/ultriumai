import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, HardDrive, Activity, TrendingUp, Users, 
  Server, Cpu, Database, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ClientUsage {
  id: string;
  clientName: string;
  deviceCount: number;
  apiCalls: number;
  storageGb: number;
  activeUsers: number;
  monthlyTrend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

const DEMO_CLIENTS: ClientUsage[] = [
  { id: '1', clientName: 'Acme Corporation', deviceCount: 145, apiCalls: 12450, storageGb: 256, activeUsers: 89, monthlyTrend: 'up', trendPercent: 12 },
  { id: '2', clientName: 'TechStart Inc', deviceCount: 67, apiCalls: 5230, storageGb: 128, activeUsers: 42, monthlyTrend: 'up', trendPercent: 8 },
  { id: '3', clientName: 'Global Finance LLC', deviceCount: 234, apiCalls: 18900, storageGb: 512, activeUsers: 156, monthlyTrend: 'stable', trendPercent: 2 },
  { id: '4', clientName: 'Healthcare Plus', deviceCount: 89, apiCalls: 7650, storageGb: 192, activeUsers: 67, monthlyTrend: 'down', trendPercent: 5 },
  { id: '5', clientName: 'Retail Solutions', deviceCount: 112, apiCalls: 9340, storageGb: 384, activeUsers: 78, monthlyTrend: 'up', trendPercent: 15 }
];

const USAGE_TREND = [
  { month: 'Aug', devices: 520, api: 42000, storage: 1200 },
  { month: 'Sep', devices: 548, api: 45000, storage: 1280 },
  { month: 'Oct', devices: 589, api: 48500, storage: 1350 },
  { month: 'Nov', devices: 612, api: 51200, storage: 1420 },
  { month: 'Dec', devices: 635, api: 54000, storage: 1490 },
  { month: 'Jan', devices: 647, api: 53570, storage: 1472 }
];

export function ClientUsageDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [clients] = useState<ClientUsage[]>(DEMO_CLIENTS);

  const totalDevices = clients.reduce((sum, c) => sum + c.deviceCount, 0);
  const totalApiCalls = clients.reduce((sum, c) => sum + c.apiCalls, 0);
  const totalStorage = clients.reduce((sum, c) => sum + c.storageGb, 0);
  const totalUsers = clients.reduce((sum, c) => sum + c.activeUsers, 0);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />;
    if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
    return <span className="text-slate-400">~</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <Activity className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Client Usage Dashboard</h2>
            <p className="text-sm text-slate-400">Track resource consumption per client</p>
          </div>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Devices</p>
                <p className="text-2xl font-bold text-white">{totalDevices.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Monitor className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+23 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">API Calls</p>
                <p className="text-2xl font-bold text-white">{(totalApiCalls / 1000).toFixed(1)}k</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Server className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">This billing period</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Storage Used</p>
                <p className="text-2xl font-bold text-white">{(totalStorage / 1024).toFixed(1)} TB</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Database className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <Progress value={68} className="mt-2 h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <Users className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Across all clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend Chart */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-sm">Usage Trends (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={USAGE_TREND}>
                <defs>
                  <linearGradient id="devicesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #22d3ee40',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="devices" stroke="#22d3ee" fill="url(#devicesGrad)" strokeWidth={2} name="Devices" />
                <Line type="monotone" dataKey="api" stroke="#a78bfa" strokeWidth={2} dot={false} name="API Calls (hundreds)" yAxisId="right" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 text-sm">Per-Client Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Client</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Devices</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">API Calls</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Storage</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Users</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                    <td className="py-3 px-4">
                      <span className="text-sm text-white font-medium">{client.clientName}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-300">{client.deviceCount}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-300">{client.apiCalls.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-300">{client.storageGb} GB</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-300">{client.activeUsers}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(client.monthlyTrend)}
                        <span className={`text-xs ${
                          client.monthlyTrend === 'up' ? 'text-green-400' :
                          client.monthlyTrend === 'down' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {client.trendPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
