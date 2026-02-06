import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, TrendingUp, Users, Building2, ArrowUpRight, ArrowDownRight,
  BarChart3, Percent, CreditCard, Calendar, Search
} from 'lucide-react';
import { useResellerPartner, useResellerTenants, useResellerBilling, useResellerMetrics } from '@/hooks/useResellerData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ResellerBillingPortal() {
  const { partner } = useResellerPartner();
  const { tenants } = useResellerTenants(partner?.id);
  const { billing } = useResellerBilling(partner?.id);
  const metrics = useResellerMetrics(partner?.id);
  const [search, setSearch] = useState('');

  const filteredTenants = useMemo(() => {
    if (!search) return tenants;
    return tenants.filter(t => 
      t.client_name.toLowerCase().includes(search.toLowerCase()) ||
      t.client_email.toLowerCase().includes(search.toLowerCase())
    );
  }, [tenants, search]);

  // Generate mock MRR trend data
  const mrrTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      mrr: Math.round(metrics.totalMRR * (0.5 + (i * 0.1))),
      margin: Math.round(metrics.totalMargin * (0.5 + (i * 0.1))),
    }));
  }, [metrics]);

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        <p>Join the Partner Program first to access billing.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-cyan-400" />
          Reseller Billing Portal
        </h1>
        <p className="text-white/50 text-sm">Track MRR, margins, and client subscriptions</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly MRR', value: `$${metrics.totalMRR.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', trend: '+12%' },
          { label: 'Total Margin', value: `$${metrics.totalMargin.toLocaleString()}`, icon: TrendingUp, color: 'text-cyan-400', trend: `${metrics.marginPercent}%` },
          { label: 'Active Clients', value: metrics.activeTenants.toString(), icon: Building2, color: 'text-violet-400', trend: null },
          { label: 'Total Seats', value: metrics.totalSeats.toString(), icon: Users, color: 'text-amber-400', trend: null },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <Card key={label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                {trend && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />{trend}
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/40">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrTrend}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff08" />
              <XAxis dataKey="month" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} />
              <Area type="monotone" dataKey="mrr" stroke="#06b6d4" fill="url(#mrrGrad)" strokeWidth={2} name="MRR" />
              <Area type="monotone" dataKey="margin" stroke="#8b5cf6" fill="none" strokeWidth={1.5} strokeDasharray="4 4" name="Margin" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Subscriptions Table */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">Client Subscriptions</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="bg-white/5 border-white/10 text-white text-xs pl-8 h-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No client tenants yet. Provision your first client from the Partner Program page.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs border-b border-white/10">
                    <th className="text-left py-2 px-2">Client</th>
                    <th className="text-center py-2 px-2">Seats</th>
                    <th className="text-center py-2 px-2">Modules</th>
                    <th className="text-right py-2 px-2">Wholesale</th>
                    <th className="text-right py-2 px-2">Resale</th>
                    <th className="text-right py-2 px-2">Margin</th>
                    <th className="text-center py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map(t => {
                    const wholesale = t.monthly_price_per_seat * t.seat_count;
                    const resale = t.resale_price_per_seat * t.seat_count;
                    const margin = resale - wholesale;
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2.5 px-2">
                          <div className="text-white font-medium">{t.client_name}</div>
                          <div className="text-white/30 text-xs">{t.client_email}</div>
                        </td>
                        <td className="text-center text-white/60">{t.seat_count}</td>
                        <td className="text-center">
                          <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
                            {t.enabled_modules.length} modules
                          </Badge>
                        </td>
                        <td className="text-right text-white/50">${wholesale.toFixed(0)}</td>
                        <td className="text-right text-white/70">${resale.toFixed(0)}</td>
                        <td className="text-right text-emerald-400 font-medium">${margin.toFixed(0)}</td>
                        <td className="text-center">
                          <Badge className={`border-0 text-xs ${
                            t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            t.status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                            t.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annual Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-white/10">
          <CardContent className="pt-4">
            <div className="text-xs text-white/40">Annual Revenue</div>
            <div className="text-3xl font-bold text-white">${metrics.annualRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-white/10">
          <CardContent className="pt-4">
            <div className="text-xs text-white/40">Churn Rate</div>
            <div className="text-3xl font-bold text-white">{metrics.churnRate}%</div>
            <div className="text-xs text-white/30">{metrics.churnedCount} churned of {metrics.totalTenants}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-white/10">
          <CardContent className="pt-4">
            <div className="text-xs text-white/40">Partner Discount</div>
            <div className="text-3xl font-bold text-white">{partner.discount_percent}%</div>
            <div className="text-xs text-white/30">Tier: {partner.tier}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
