import { useState, useCallback } from 'react';

export interface RevenueEntry {
  id: string;
  date: string;
  amount: number; // cents
  source: 'subscription' | 'one_time' | 'addon' | 'overage' | 'refund';
  productName: string;
  customerEmail: string;
}

export interface RevenueMetric {
  label: string;
  value: number;
  change: number; // percentage vs prior period
  format: 'currency' | 'number' | 'percent';
}

export function useRevenueDashboard() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const addEntry = useCallback((entry: Omit<RevenueEntry, 'id'>) => {
    setEntries(prev => [...prev, { ...entry, id: crypto.randomUUID() }]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const seedDemoData = useCallback(() => {
    const sources: RevenueEntry['source'][] = ['subscription', 'one_time', 'addon', 'overage'];
    const products = ['Pro Plan', 'Enterprise Plan', 'API Add-on', 'Storage Add-on'];
    const demo: RevenueEntry[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const count = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < count; j++) {
        demo.push({
          id: crypto.randomUUID(),
          date: d.toISOString().split('T')[0],
          amount: (Math.floor(Math.random() * 500) + 10) * 100,
          source: sources[Math.floor(Math.random() * sources.length)],
          productName: products[Math.floor(Math.random() * products.length)],
          customerEmail: `user${Math.floor(Math.random() * 100)}@example.com`,
        });
      }
    }
    setEntries(demo);
  }, []);

  const getMetrics = useCallback((): RevenueMetric[] => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    const priorCutoff = new Date(now.getTime() - 2 * days * 86400000).toISOString().split('T')[0];

    const current = entries.filter(e => e.date >= cutoff);
    const prior = entries.filter(e => e.date >= priorCutoff && e.date < cutoff);

    const totalRevenue = current.reduce((s, e) => s + (e.source === 'refund' ? -e.amount : e.amount), 0);
    const priorRevenue = prior.reduce((s, e) => s + (e.source === 'refund' ? -e.amount : e.amount), 0);
    const revenueChange = priorRevenue > 0 ? ((totalRevenue - priorRevenue) / priorRevenue) * 100 : 0;

    const txCount = current.length;
    const priorTx = prior.length;
    const txChange = priorTx > 0 ? ((txCount - priorTx) / priorTx) * 100 : 0;

    const avgOrder = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
    const priorAvg = priorTx > 0 ? Math.round(priorRevenue / priorTx) : 0;
    const avgChange = priorAvg > 0 ? ((avgOrder - priorAvg) / priorAvg) * 100 : 0;

    const refunds = current.filter(e => e.source === 'refund').reduce((s, e) => s + e.amount, 0);
    const refundRate = totalRevenue > 0 ? (refunds / (totalRevenue + refunds)) * 100 : 0;

    return [
      { label: 'Total Revenue', value: totalRevenue, change: revenueChange, format: 'currency' },
      { label: 'Transactions', value: txCount, change: txChange, format: 'number' },
      { label: 'Avg. Order Value', value: avgOrder, change: avgChange, format: 'currency' },
      { label: 'Refund Rate', value: refundRate, change: 0, format: 'percent' },
    ];
  }, [entries, dateRange]);

  const getRevenueBySource = useCallback(() => {
    const map = new Map<string, number>();
    entries.forEach(e => {
      if (e.source !== 'refund') map.set(e.source, (map.get(e.source) || 0) + e.amount);
    });
    return Array.from(map, ([source, amount]) => ({ source, amount }));
  }, [entries]);

  const getDailyRevenue = useCallback(() => {
    const map = new Map<string, number>();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    entries.filter(e => e.date >= cutoff).forEach(e => {
      const amt = e.source === 'refund' ? -e.amount : e.amount;
      map.set(e.date, (map.get(e.date) || 0) + amt);
    });
    return Array.from(map, ([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, dateRange]);

  const generateDashboardComponent = useCallback(() => {
    return `import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function RevenueDashboard({ metrics, dailyRevenue }: { metrics: any[]; dailyRevenue: any[] }) {
  const fmt = (v: number, f: string) => f === 'currency' ? '$' + (v / 100).toFixed(2) : f === 'percent' ? v.toFixed(1) + '%' : v.toLocaleString();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">{metrics.map(m => (
        <div key={m.label} className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">{m.label}</p>
          <p className="text-2xl font-bold">{fmt(m.value, m.format)}</p>
          <p className={\`text-sm \${m.change >= 0 ? 'text-green-600' : 'text-red-600'}\`}>
            {m.change >= 0 ? '↑' : '↓'} {Math.abs(m.change).toFixed(1)}%
          </p>
        </div>
      ))}</div>
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Daily Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyRevenue}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={(v) => '$' + (v / 100)} />
            <Tooltip formatter={(v: number) => '$' + (v / 100).toFixed(2)} />
            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}`;
  }, []);

  return {
    entries, dateRange, setDateRange,
    addEntry, removeEntry, seedDemoData,
    getMetrics, getRevenueBySource, getDailyRevenue,
    generateDashboardComponent,
  };
}
