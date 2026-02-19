import { useState, useCallback } from 'react';

export interface BudgetItem {
  id: string;
  name: string;
  service: string;
  monthlyBudget: number;
  currentSpend: number;
  alertThreshold: number; // percentage 0-100
  unit: string;
}

export function useBudgetCostMonitor() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [currency, setCurrency] = useState('USD');

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      name: 'API Calls',
      service: 'supabase',
      monthlyBudget: 100,
      currentSpend: 0,
      alertThreshold: 80,
      unit: 'USD',
    }]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<BudgetItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const getTotalBudget = useCallback(() => items.reduce((s, i) => s + i.monthlyBudget, 0), [items]);
  const getTotalSpend = useCallback(() => items.reduce((s, i) => s + i.currentSpend, 0), [items]);
  const getOverBudgetItems = useCallback(() => items.filter(i => (i.currentSpend / i.monthlyBudget) * 100 >= i.alertThreshold), [items]);

  const generateCode = useCallback((): string => {
    return `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface BudgetItem {
  name: string;
  service: string;
  budget: number;
  spent: number;
  threshold: number;
}

export function BudgetDashboard({ items, currency = '${currency}' }: { items: BudgetItem[]; currency?: string }) {
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);
  const totalBudget = items.reduce((s, i) => s + i.budget, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-2xl font-bold">{fmt(totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Spend</p><p className="text-2xl font-bold">{fmt(totalSpent)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Remaining</p><p className="text-2xl font-bold text-green-500">{fmt(totalBudget - totalSpent)}</p></CardContent></Card>
      </div>
      {items.map((item, i) => {
        const pct = Math.min((item.spent / item.budget) * 100, 100);
        const overThreshold = pct >= item.threshold;
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{item.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.service}</Badge>
                {overThreshold && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{fmt(item.spent)} / {fmt(item.budget)}</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <Progress value={pct} className={overThreshold ? '[&>div]:bg-yellow-500' : ''} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}`;
  }, [items, currency]);

  return { items, currency, setCurrency, addItem, updateItem, removeItem, getTotalBudget, getTotalSpend, getOverBudgetItems, generateCode };
}
