import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  ThermometerSun
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const SENTIMENT_COLORS = {
  frustrated: '#ef4444',
  urgent: '#f97316',
  confused: '#eab308',
  neutral: '#6b7280',
  appreciative: '#22c55e'
};

const SENTIMENT_ICONS = {
  frustrated: Frown,
  urgent: AlertTriangle,
  confused: Meh,
  neutral: Meh,
  appreciative: Smile
};

export function SentimentTrendDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
  const startDate = startOfDay(subDays(new Date(), days));

  const { data: tickets } = useQuery({
    queryKey: ['sentiment-trends', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('vanguard_service_tickets')
        .select('ai_user_sentiment, ai_frustration_level, created_at, status')
        .gte('created_at', startDate.toISOString())
        .not('ai_user_sentiment', 'is', null);
      return data || [];
    }
  });

  // Process data for charts
  const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
  
  const trendData = dateRange.map(date => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayTickets = tickets?.filter(t => 
      format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr
    ) || [];
    
    const avgFrustration = dayTickets.length > 0
      ? dayTickets.reduce((sum, t) => sum + (t.ai_frustration_level || 0), 0) / dayTickets.length
      : 0;
    
    return {
      date: format(date, 'MMM dd'),
      frustrated: dayTickets.filter(t => t.ai_user_sentiment === 'frustrated').length,
      urgent: dayTickets.filter(t => t.ai_user_sentiment === 'urgent').length,
      confused: dayTickets.filter(t => t.ai_user_sentiment === 'confused').length,
      neutral: dayTickets.filter(t => t.ai_user_sentiment === 'neutral').length,
      appreciative: dayTickets.filter(t => t.ai_user_sentiment === 'appreciative').length,
      avgFrustration: Math.round(avgFrustration * 10) / 10,
      total: dayTickets.length
    };
  });

  // Sentiment distribution
  const sentimentCounts = {
    frustrated: tickets?.filter(t => t.ai_user_sentiment === 'frustrated').length || 0,
    urgent: tickets?.filter(t => t.ai_user_sentiment === 'urgent').length || 0,
    confused: tickets?.filter(t => t.ai_user_sentiment === 'confused').length || 0,
    neutral: tickets?.filter(t => t.ai_user_sentiment === 'neutral').length || 0,
    appreciative: tickets?.filter(t => t.ai_user_sentiment === 'appreciative').length || 0,
  };

  const pieData = Object.entries(sentimentCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SENTIMENT_COLORS[name as keyof typeof SENTIMENT_COLORS]
  }));

  // Calculate metrics
  const totalTickets = tickets?.length || 0;
  const avgFrustration = totalTickets > 0
    ? tickets!.reduce((sum, t) => sum + (t.ai_frustration_level || 0), 0) / totalTickets
    : 0;
  const highFrustrationCount = tickets?.filter(t => (t.ai_frustration_level || 0) >= 7).length || 0;
  const positiveRate = totalTickets > 0
    ? ((sentimentCounts.neutral + sentimentCounts.appreciative) / totalTickets) * 100
    : 0;

  // Week-over-week comparison
  const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
  const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
  const firstHalfFrustration = firstHalf.reduce((sum, d) => sum + d.avgFrustration, 0) / (firstHalf.length || 1);
  const secondHalfFrustration = secondHalf.reduce((sum, d) => sum + d.avgFrustration, 0) / (secondHalf.length || 1);
  const frustrationTrend = secondHalfFrustration - firstHalfFrustration;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ThermometerSun className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Sentiment Analytics</h2>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Frustration</p>
                <p className="text-2xl font-bold">{avgFrustration.toFixed(1)}/10</p>
              </div>
              <div className={`flex items-center gap-1 ${frustrationTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {frustrationTrend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm">{Math.abs(frustrationTrend).toFixed(1)}</span>
              </div>
            </div>
            <Progress value={avgFrustration * 10} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Frustration</p>
                <p className="text-2xl font-bold text-red-500">{highFrustrationCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTickets > 0 ? ((highFrustrationCount / totalTickets) * 100).toFixed(1) : 0}% of tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive Rate</p>
                <p className="text-2xl font-bold text-green-500">{positiveRate.toFixed(1)}%</p>
              </div>
              <Smile className="h-8 w-8 text-green-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Neutral + Appreciative
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Analyzed</p>
                <p className="text-2xl font-bold">{totalTickets}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tickets with sentiment data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Frustration Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Frustration Level Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 10]} className="text-xs" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgFrustration" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((entry) => {
                  const Icon = SENTIMENT_ICONS[entry.name.toLowerCase() as keyof typeof SENTIMENT_ICONS] || Meh;
                  return (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <Icon className="h-4 w-4" style={{ color: entry.color }} />
                      <span className="text-sm">{entry.name}</span>
                      <Badge variant="secondary" className="ml-auto">{entry.value}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Daily Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="appreciative" stackId="a" fill={SENTIMENT_COLORS.appreciative} />
                  <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
                  <Bar dataKey="confused" stackId="a" fill={SENTIMENT_COLORS.confused} />
                  <Bar dataKey="urgent" stackId="a" fill={SENTIMENT_COLORS.urgent} />
                  <Bar dataKey="frustrated" stackId="a" fill={SENTIMENT_COLORS.frustrated} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
