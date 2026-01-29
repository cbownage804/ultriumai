import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  ArrowUpRight, ArrowDownRight, Target, Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface ClientMRR {
  id: string;
  clientName: string;
  currentMRR: number;
  previousMRR: number;
  contractValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  renewalDate: string;
}

const DEMO_CLIENTS: ClientMRR[] = [
  { id: '1', clientName: 'Global Finance LLC', currentMRR: 4850, previousMRR: 4500, contractValue: 58200, churnRisk: 'low', renewalDate: '2025-06-15' },
  { id: '2', clientName: 'Acme Corporation', currentMRR: 3200, previousMRR: 3200, contractValue: 38400, churnRisk: 'low', renewalDate: '2025-04-01' },
  { id: '3', clientName: 'TechStart Inc', currentMRR: 1850, previousMRR: 1650, contractValue: 22200, churnRisk: 'medium', renewalDate: '2025-03-20' },
  { id: '4', clientName: 'Healthcare Plus', currentMRR: 2400, previousMRR: 2600, contractValue: 28800, churnRisk: 'high', renewalDate: '2025-02-28' },
  { id: '5', clientName: 'Retail Solutions', currentMRR: 2100, previousMRR: 1900, contractValue: 25200, churnRisk: 'low', renewalDate: '2025-08-10' }
];

const MRR_HISTORY = [
  { month: 'Aug', mrr: 12400, newMrr: 800, churnMrr: 200 },
  { month: 'Sep', mrr: 13000, newMrr: 900, churnMrr: 300 },
  { month: 'Oct', mrr: 13500, newMrr: 700, churnMrr: 200 },
  { month: 'Nov', mrr: 13900, newMrr: 600, churnMrr: 200 },
  { month: 'Dec', mrr: 14200, newMrr: 500, churnMrr: 200 },
  { month: 'Jan', mrr: 14400, newMrr: 400, churnMrr: 200 }
];

const FORECAST_DATA = [
  { month: 'Feb', projected: 14800, conservative: 14500, optimistic: 15200 },
  { month: 'Mar', projected: 15200, conservative: 14700, optimistic: 15800 },
  { month: 'Apr', projected: 15600, conservative: 14900, optimistic: 16500 },
  { month: 'May', projected: 16100, conservative: 15100, optimistic: 17200 },
  { month: 'Jun', projected: 16600, conservative: 15300, optimistic: 18000 }
];

export function MRRCalculator() {
  const [clients] = useState<ClientMRR[]>(DEMO_CLIENTS);

  const totalMRR = clients.reduce((sum, c) => sum + c.currentMRR, 0);
  const previousMRR = clients.reduce((sum, c) => sum + c.previousMRR, 0);
  const mrrChange = totalMRR - previousMRR;
  const mrrChangePercent = ((mrrChange / previousMRR) * 100).toFixed(1);
  const totalACV = clients.reduce((sum, c) => sum + c.contractValue, 0);

  const expansionMRR = clients
    .filter(c => c.currentMRR > c.previousMRR)
    .reduce((sum, c) => sum + (c.currentMRR - c.previousMRR), 0);
  
  const contractionMRR = clients
    .filter(c => c.currentMRR < c.previousMRR)
    .reduce((sum, c) => sum + (c.previousMRR - c.currentMRR), 0);

  const getChurnBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">High Risk</Badge>;
      case 'medium': return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium</Badge>;
      default: return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Low Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">MRR Calculator</h2>
            <p className="text-sm text-slate-400">Monthly recurring revenue tracking & forecasting</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Current MRR</span>
              <div className={`flex items-center gap-1 ${mrrChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mrrChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="text-xs">{mrrChangePercent}%</span>
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-b from-white to-green-200 bg-clip-text text-transparent">
              ${totalMRR.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <span className="text-xs text-slate-500">Annual Contract Value</span>
            <p className="text-2xl font-bold text-white mt-2">
              ${(totalACV / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-500 mt-1">{clients.length} active contracts</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">Expansion MRR</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              +${expansionMRR.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-slate-500">Contraction MRR</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              -${contractionMRR.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm">MRR Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MRR_HISTORY}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line type="monotone" dataKey="mrr" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee' }} name="Total MRR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Revenue Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FORECAST_DATA}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line type="monotone" dataKey="optimistic" stroke="#4ade80" strokeWidth={1} strokeDasharray="5 5" name="Optimistic" />
                  <Line type="monotone" dataKey="projected" stroke="#a78bfa" strokeWidth={2} name="Projected" />
                  <Line type="monotone" dataKey="conservative" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" name="Conservative" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-400" />
                <span className="text-xs text-slate-400">Optimistic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-purple-400" />
                <span className="text-xs text-slate-400">Projected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-400" />
                <span className="text-xs text-slate-400">Conservative</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client MRR Table */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-amber-400 text-sm">Per-Client MRR Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400">Client</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Current MRR</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Change</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-slate-400">Contract Value</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Churn Risk</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-slate-400">Renewal</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const change = client.currentMRR - client.previousMRR;
                  return (
                    <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                      <td className="py-3 px-4">
                        <span className="text-sm text-white font-medium">{client.clientName}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-white font-medium">${client.currentMRR.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {change >= 0 ? '+' : ''}{change}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-slate-300">${client.contractValue.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getChurnBadge(client.churnRisk)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>{client.renewalDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
