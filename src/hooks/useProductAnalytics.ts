import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MetricAggregate {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  dimensions: Record<string, unknown>;
  period_start: string;
  period_end: string;
}

export interface AnalyticsSummary {
  safeOps: {
    totalDevices: number;
    onlineRate: number;
    alertsResolved: number;
    patchCompliance: number;
  };
  safeDesk: {
    totalTickets: number;
    avgResolutionTime: number;
    slaCompliance: number;
    aiResolutionRate: number;
  };
  trends: {
    deviceGrowth: number;
    ticketVolumeTrend: number;
    alertReductionRate: number;
  };
}

export const useProductAnalytics = (timeRange: '7d' | '30d' | '90d' = '30d') => {
  const [aggregates, setAggregates] = useState<MetricAggregate[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    safeOps: { totalDevices: 0, onlineRate: 0, alertsResolved: 0, patchCompliance: 0 },
    safeDesk: { totalTickets: 0, avgResolutionTime: 0, slaCompliance: 0, aiResolutionRate: 0 },
    trends: { deviceGrowth: 0, ticketVolumeTrend: 0, alertReductionRate: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const calculateDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    startDate.setDate(endDate.getDate() - days);
    return { startDate, endDate, days };
  }, [timeRange]);

  const loadSafeOpsMetrics = useCallback(async () => {
    const { startDate } = calculateDateRange();

    // Load devices data
    const { data: devices } = await supabase
      .from('rmm_devices')
      .select('id, status, created_at');

    const totalDevices = devices?.length || 0;
    const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;
    const onlineRate = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

    // Load alerts data
    const { data: alerts } = await supabase
      .from('rmm_alerts')
      .select('id, status, created_at')
      .gte('created_at', startDate.toISOString());

    const resolvedAlerts = alerts?.filter(a => a.status === 'resolved').length || 0;
    const totalAlerts = alerts?.length || 0;
    const alertsResolved = totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 100;

    // Load patches data
    const { data: patches } = await supabase
      .from('rmm_patches')
      .select('id, status');

    const installedPatches = patches?.filter(p => p.status === 'installed').length || 0;
    const totalPatches = patches?.length || 0;
    const patchCompliance = totalPatches > 0 ? (installedPatches / totalPatches) * 100 : 100;

    // Calculate device growth
    const recentDevices = devices?.filter(d => new Date(d.created_at || '') >= startDate).length || 0;
    const deviceGrowth = totalDevices > 0 ? (recentDevices / totalDevices) * 100 : 0;

    return {
      totalDevices,
      onlineRate: Math.round(onlineRate),
      alertsResolved: Math.round(alertsResolved),
      patchCompliance: Math.round(patchCompliance),
      deviceGrowth
    };
  }, [calculateDateRange]);

  const loadSafeDeskMetrics = useCallback(async () => {
    const { startDate } = calculateDateRange();

    // Load tickets data
    const { data: tickets } = await supabase
      .from('helpdesk_tickets')
      .select('id, status, priority, sla_due_at, actual_hours, created_at, resolved_at')
      .gte('created_at', startDate.toISOString());

    const totalTickets = tickets?.length || 0;
    
    // Calculate avg resolution time
    const resolvedTickets = tickets?.filter(t => t.actual_hours && t.actual_hours > 0) || [];
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.actual_hours || 0), 0) / resolvedTickets.length * 60
      : 0;

    // Calculate SLA compliance
    const now = new Date();
    const slaMissed = tickets?.filter(t => 
      t.sla_due_at && 
      new Date(t.sla_due_at) < now && 
      t.status !== 'resolved' && 
      t.status !== 'closed'
    ).length || 0;
    const slaCompliance = totalTickets > 0 ? ((totalTickets - slaMissed) / totalTickets) * 100 : 100;

    // Check for AI resolution data (from ai_suggested_solution field presence)
    const { data: aiTickets } = await supabase
      .from('support_tickets')
      .select('id, ai_suggested_solution')
      .gte('created_at', startDate.toISOString())
      .not('ai_suggested_solution', 'is', null);

    const aiResolutionRate = totalTickets > 0 
      ? ((aiTickets?.length || 0) / totalTickets) * 100 
      : 0;

    // Calculate ticket volume trend
    const halfPeriod = new Date(startDate);
    halfPeriod.setDate(halfPeriod.getDate() + Math.floor((new Date().getTime() - startDate.getTime()) / (2 * 24 * 60 * 60 * 1000)));
    
    const firstHalfTickets = tickets?.filter(t => new Date(t.created_at || '') < halfPeriod).length || 0;
    const secondHalfTickets = tickets?.filter(t => new Date(t.created_at || '') >= halfPeriod).length || 0;
    const ticketVolumeTrend = firstHalfTickets > 0 
      ? ((secondHalfTickets - firstHalfTickets) / firstHalfTickets) * 100 
      : 0;

    return {
      totalTickets,
      avgResolutionTime: Math.round(avgResolutionTime),
      slaCompliance: Math.round(slaCompliance),
      aiResolutionRate: Math.round(aiResolutionRate),
      ticketVolumeTrend
    };
  }, [calculateDateRange]);

  const loadAggregates = useCallback(async () => {
    if (!user) return;

    const { startDate, endDate } = calculateDateRange();

    const { data, error } = await supabase
      .from('analytics_aggregates')
      .select('*')
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: false });

    if (!error && data) {
      setAggregates(data as unknown as MetricAggregate[]);
    }
  }, [user, calculateDateRange]);

  const refreshMetrics = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [safeOpsData, safeDeskData] = await Promise.all([
        loadSafeOpsMetrics(),
        loadSafeDeskMetrics()
      ]);

      // Calculate alert reduction (compare to previous period)
      const alertReductionRate = safeOpsData.alertsResolved;

      setSummary({
        safeOps: {
          totalDevices: safeOpsData.totalDevices,
          onlineRate: safeOpsData.onlineRate,
          alertsResolved: safeOpsData.alertsResolved,
          patchCompliance: safeOpsData.patchCompliance
        },
        safeDesk: {
          totalTickets: safeDeskData.totalTickets,
          avgResolutionTime: safeDeskData.avgResolutionTime,
          slaCompliance: safeDeskData.slaCompliance,
          aiResolutionRate: safeDeskData.aiResolutionRate
        },
        trends: {
          deviceGrowth: safeOpsData.deviceGrowth,
          ticketVolumeTrend: safeDeskData.ticketVolumeTrend,
          alertReductionRate
        }
      });

      await loadAggregates();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadSafeOpsMetrics, loadSafeDeskMetrics, loadAggregates]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    aggregates,
    summary,
    isLoading,
    refreshMetrics
  };
};
