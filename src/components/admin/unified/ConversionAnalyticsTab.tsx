/**
 * Admin Conversion Analytics Dashboard
 * Visualizes funnel metrics and conversion goals
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign,
  ArrowRight,
  Loader2,
  BarChart3,
  Zap
} from 'lucide-react';
import { FUNNELS, FunnelName } from '@/hooks/useConversionTracking';

interface FunnelStepMetric {
  step_name: string;
  step_order: number;
  count: number;
}

interface ConversionGoalMetric {
  goal_name: string;
  count: number;
  total_value: number;
}

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export const ConversionAnalyticsTab = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelName>('signup');

  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

  // Fetch funnel metrics
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['funnel-metrics', selectedFunnel, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_events')
        .select('step_name, step_order')
        .eq('funnel_name', selectedFunnel)
        .gte('created_at', startDate);

      if (error) throw error;

      // Aggregate by step
      const stepCounts: Record<string, { step_order: number; count: number }> = {};
      (data || []).forEach((event: { step_name: string; step_order: number }) => {
        if (!stepCounts[event.step_name]) {
          stepCounts[event.step_name] = { step_order: event.step_order, count: 0 };
        }
        stepCounts[event.step_name].count++;
      });

      return Object.entries(stepCounts)
        .map(([step_name, { step_order, count }]) => ({ step_name, step_order, count }))
        .sort((a, b) => a.step_order - b.step_order) as FunnelStepMetric[];
    },
  });

  // Fetch conversion goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['conversion-goals', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversion_goals')
        .select('goal_name, goal_value')
        .gte('created_at', startDate);

      if (error) throw error;

      // Aggregate by goal
      const goalCounts: Record<string, { count: number; total_value: number }> = {};
      (data || []).forEach((goal: { goal_name: string; goal_value: number }) => {
        if (!goalCounts[goal.goal_name]) {
          goalCounts[goal.goal_name] = { count: 0, total_value: 0 };
        }
        goalCounts[goal.goal_name].count++;
        goalCounts[goal.goal_name].total_value += goal.goal_value || 0;
      });

      return Object.entries(goalCounts)
        .map(([goal_name, { count, total_value }]) => ({ goal_name, count, total_value }))
        .sort((a, b) => b.count - a.count) as ConversionGoalMetric[];
    },
  });

  // Fetch summary stats
  const { data: summaryData } = useQuery({
    queryKey: ['conversion-summary', dateRange],
    queryFn: async () => {
      const [funnelResult, goalsResult, sessionsResult] = await Promise.all([
        supabase.from('funnel_events').select('id', { count: 'exact', head: true }).gte('created_at', startDate),
        supabase.from('conversion_goals').select('goal_value').gte('created_at', startDate),
        supabase.from('funnel_events').select('session_id').gte('created_at', startDate),
      ]);

      const uniqueSessions = new Set((sessionsResult.data || []).map((e: { session_id: string }) => e.session_id)).size;
      const totalRevenue = (goalsResult.data || []).reduce((sum: number, g: { goal_value: number }) => sum + (g.goal_value || 0), 0);
      const totalGoals = goalsResult.data?.length || 0;

      return {
        totalEvents: funnelResult.count || 0,
        uniqueSessions,
        totalGoals,
        totalRevenue,
        conversionRate: uniqueSessions > 0 ? (totalGoals / uniqueSessions * 100).toFixed(1) : '0',
      };
    },
  });

  // Calculate funnel conversion rates
  const funnelWithRates = funnelData?.map((step, index) => {
    const previousCount = index === 0 ? step.count : (funnelData[index - 1]?.count || 1);
    const dropoffRate = previousCount > 0 ? ((previousCount - step.count) / previousCount * 100) : 0;
    const conversionRate = previousCount > 0 ? (step.count / previousCount * 100) : 100;
    return { ...step, dropoffRate, conversionRate };
  }) || [];

  const firstStepCount = funnelData?.[0]?.count || 0;
  const lastStepCount = funnelData?.[funnelData.length - 1]?.count || 0;
  const overallConversion = firstStepCount > 0 ? (lastStepCount / firstStepCount * 100).toFixed(1) : '0';

  const isLoading = funnelLoading || goalsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Conversion Analytics</h2>
          <p className="text-muted-foreground">Track user journeys and conversion funnels</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.totalEvents.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Unique Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.uniqueSessions.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.totalGoals || 0}</div>
            <p className="text-xs text-muted-foreground">{summaryData?.conversionRate}% rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData?.totalRevenue.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnels">Conversion Funnels</TabsTrigger>
          <TabsTrigger value="goals">Conversion Goals</TabsTrigger>
        </TabsList>

        {/* Funnels Tab */}
        <TabsContent value="funnels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Funnel Analysis</CardTitle>
                  <CardDescription>Step-by-step conversion tracking</CardDescription>
                </div>
                <Select value={selectedFunnel} onValueChange={(v) => setSelectedFunnel(v as FunnelName)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(FUNNELS).map(funnel => (
                      <SelectItem key={funnel} value={funnel}>
                        {funnel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : funnelWithRates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No funnel data for this period</p>
                  <p className="text-sm">Events will appear as users navigate through the funnel</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overall conversion */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Overall Conversion</span>
                    <Badge variant={parseFloat(overallConversion) > 10 ? 'default' : 'secondary'}>
                      {overallConversion}%
                    </Badge>
                  </div>

                  {/* Funnel steps */}
                  <div className="space-y-3">
                    {funnelWithRates.map((step, index) => (
                      <div key={step.step_name} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-sm">
                              {step.step_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            {index > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                {step.conversionRate.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <span className="font-bold">{step.count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={firstStepCount > 0 ? (step.count / firstStepCount * 100) : 0} 
                            className="h-2 flex-1"
                          />
                          {index > 0 && step.dropoffRate > 0 && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              -{step.dropoffRate.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Goals</CardTitle>
              <CardDescription>Completed conversions and their values</CardDescription>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !goalsData || goalsData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversion goals recorded</p>
                  <p className="text-sm">Goals will appear when users complete conversions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goalsData.map(goal => (
                    <div key={goal.goal_name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {goal.goal_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {goal.count} conversion{goal.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {goal.total_value > 0 && (
                          <p className="font-bold text-green-600">${goal.total_value.toLocaleString()}</p>
                        )}
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {goal.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversionAnalyticsTab;
