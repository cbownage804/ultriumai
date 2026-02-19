import { useState, useCallback } from 'react';

export interface KPICard {
  id: string;
  label: string;
  valueSource: string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  trendDirection: 'up' | 'down' | 'neutral';
  color: string;
  showSparkline: boolean;
  goal?: number;
}

export function useKPIDashboardBuilder() {
  const [cards, setCards] = useState<KPICard[]>([]);
  const [dashboardName, setDashboardName] = useState('KPI Dashboard');
  const [columns, setColumns] = useState(4);

  const addCard = useCallback(() => {
    setCards(prev => [...prev, {
      id: crypto.randomUUID(),
      label: 'New KPI',
      valueSource: 'data.total',
      format: 'number',
      trendDirection: 'up',
      color: '#22c55e',
      showSparkline: true,
    }]);
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<KPICard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const generateCode = useCallback((): string => {
    const formatFn = (f: string) => {
      if (f === 'currency') return `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)`;
      if (f === 'percentage') return `\`\${(value * 100).toFixed(1)}%\``;
      if (f === 'duration') return `\`\${Math.floor(value / 60)}m \${value % 60}s\``;
      return `value.toLocaleString()`;
    };

    return `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const formatValue = (value: number, format: string) => {
  ${cards.map(c => `if (format === '${c.format}') return ${formatFn(c.format)};`).join('\n  ')}
  return value.toLocaleString();
};

const TrendIcon = ({ dir }: { dir: string }) => {
  if (dir === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (dir === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export function ${dashboardName.replace(/\\s+/g, '')}({ data }: { data: Record<string, any> }) {
  const kpis = ${JSON.stringify(cards.map(c => ({ label: c.label, key: c.valueSource, format: c.format, trend: c.trendDirection, color: c.color, sparkline: c.showSparkline, goal: c.goal })), null, 2)};

  return (
    <div className="grid grid-cols-${columns} gap-4">
      {kpis.map((kpi, i) => {
        const value = kpi.key.split('.').reduce((o: any, k: string) => o?.[k], data) ?? 0;
        return (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <TrendIcon dir={kpi.trend} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatValue(value, kpi.format)}</div>
              {kpi.sparkline && (
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={[{ v: value * 0.8 }, { v: value * 0.9 }, { v: value }]}>
                    <Line type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {kpi.goal && <p className="text-xs text-muted-foreground mt-1">Goal: {formatValue(kpi.goal, kpi.format)}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}`;
  }, [cards, dashboardName, columns]);

  return { cards, dashboardName, setDashboardName, columns, setColumns, addCard, updateCard, removeCard, generateCode };
}
