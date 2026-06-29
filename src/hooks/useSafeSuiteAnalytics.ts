/**
 * Wrayth Analytics Hook
 * Provides real-time analytics data for the Wrayth dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WraythMetrics {
  scans: {
    total: number;
    threats: number;
    safe: number;
    weeklyChange: number;
  };
  passwords: {
    total: number;
    weak: number;
    breached: number;
    averageStrength: number;
  };
  assets: {
    total: number;
    monitored: number;
    atRisk: number;
  };
  darkWeb: {
    monitored: number;
    exposures: number;
    lastScan: string | null;
  };
  trends: {
    scansOverTime: { date: string; count: number; threats: number }[];
    threatsByType: { type: string; count: number }[];
  };
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: 'security' | 'compliance' | 'performance' | 'executive';
  status: 'generating' | 'completed' | 'failed';
  generated_at: string;
  file_url?: string;
  metadata?: Record<string, unknown>;
}

export const useWraythAnalytics = (timeRange: string = '7_days') => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<WraythMetrics>({
    scans: { total: 0, threats: 0, safe: 0, weeklyChange: 0 },
    passwords: { total: 0, weak: 0, breached: 0, averageStrength: 0 },
    assets: { total: 0, monitored: 0, atRisk: 0 },
    darkWeb: { monitored: 0, exposures: 0, lastScan: null },
    trends: { scansOverTime: [], threatsByType: [] }
  });
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    const days = timeRange === '1_day' ? 1 : timeRange === '7_days' ? 7 : timeRange === '30_days' ? 30 : 90;
    start.setDate(end.getDate() - days);
    return { start, end, days };
  }, [timeRange]);

  const loadScanMetrics = useCallback(async () => {
    if (!user?.id) return { total: 0, threats: 0, safe: 0, weeklyChange: 0 };

    const { start } = getDateRange();

    // Get document scans
    const { data: docScans } = await supabase
      .from('document_scans')
      .select('id, threat_level, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString());

    // Get security scans from gpt_analytics
    const { data: securityScans } = await supabase
      .from('gpt_analytics')
      .select('id, metadata, created_at')
      .eq('user_id', user.id)
      .eq('interaction_type', 'security_scan')
      .gte('created_at', start.toISOString());

    const allScans = [
      ...(docScans || []).map(s => ({ 
        id: s.id, 
        isThreat: s.threat_level !== 'safe',
        created_at: s.created_at 
      })),
      ...(securityScans || []).map(s => {
        const meta = s.metadata as Record<string, unknown>;
        return { 
          id: s.id, 
          isThreat: meta?.risk_level !== 'safe',
          created_at: s.created_at 
        };
      })
    ];

    const total = allScans.length;
    const threats = allScans.filter(s => s.isThreat).length;

    // Calculate weekly change
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { count: thisWeek } = await supabase
      .from('document_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    const { count: lastWeek } = await supabase
      .from('document_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    const weeklyChange = lastWeek && lastWeek > 0 
      ? Math.round(((thisWeek || 0) - lastWeek) / lastWeek * 100)
      : 0;

    return {
      total,
      threats,
      safe: total - threats,
      weeklyChange
    };
  }, [user?.id, getDateRange]);

  const loadPasswordMetrics = useCallback(async () => {
    if (!user?.id) return { total: 0, weak: 0, breached: 0, averageStrength: 0 };

    const { data: entries } = await supabase
      .from('safepass_entries')
      .select('id, password_strength_score, is_compromised')
      .eq('user_id', user.id);

    const total = entries?.length || 0;
    const weak = entries?.filter(e => (e.password_strength_score || 0) < 60).length || 0;
    const breached = entries?.filter(e => e.is_compromised).length || 0;
    const averageStrength = total > 0 
      ? Math.round(entries!.reduce((acc, e) => acc + (e.password_strength_score || 0), 0) / total)
      : 0;

    return { total, weak, breached, averageStrength };
  }, [user?.id]);

  const loadAssetMetrics = useCallback(async () => {
    if (!user?.id) return { total: 0, monitored: 0, atRisk: 0 };

    const { data: assets } = await supabase
      .from('assets')
      .select('id, status')
      .eq('user_id', user.id);

    const total = assets?.length || 0;
    const monitored = assets?.filter(a => a.status === 'active').length || 0;
    const atRisk = assets?.filter(a => a.status === 'needs_attention').length || 0;

    return { total, monitored, atRisk };
  }, [user?.id]);

  const loadDarkWebMetrics = useCallback(async () => {
    if (!user?.id) return { monitored: 0, exposures: 0, lastScan: null };

    // Query safeweb_assets for accurate count
    const { data: monitors } = await supabase
      .from('safeweb_assets')
      .select('id, threats_found, last_scan_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_scan_at', { ascending: false });

    const monitored = monitors?.length || 0;
    const exposures = monitors?.reduce((acc, m) => acc + (m.threats_found || 0), 0) || 0;
    const lastScan = monitors?.[0]?.last_scan_at || null;

    return { monitored, exposures, lastScan };
  }, [user?.id]);

  const loadTrends = useCallback(async () => {
    if (!user?.id) return { scansOverTime: [], threatsByType: [] };

    const { start, days } = getDateRange();

    // Get scans grouped by day
    const { data: scans } = await supabase
      .from('document_scans')
      .select('created_at, threat_level')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    // Group by date
    const scansByDate: Record<string, { count: number; threats: number }> = {};
    scans?.forEach(scan => {
      const date = new Date(scan.created_at).toISOString().split('T')[0];
      if (!scansByDate[date]) {
        scansByDate[date] = { count: 0, threats: 0 };
      }
      scansByDate[date].count++;
      if (scan.threat_level !== 'safe') {
        scansByDate[date].threats++;
      }
    });

    const scansOverTime = Object.entries(scansByDate).map(([date, data]) => ({
      date,
      count: data.count,
      threats: data.threats
    }));

    // Get threat types distribution
    const threatsByType = [
      { type: 'Malware', count: scans?.filter(s => s.threat_level === 'malicious').length || 0 },
      { type: 'Phishing', count: scans?.filter(s => s.threat_level === 'suspicious').length || 0 },
      { type: 'Safe', count: scans?.filter(s => s.threat_level === 'safe').length || 0 }
    ];

    return { scansOverTime, threatsByType };
  }, [user?.id, getDateRange]);

  const loadReports = useCallback(async () => {
    if (!user?.id) return [];

    const { data } = await supabase
      .from('bi_reports')
      .select('id, report_name, report_type, last_generated_at, is_active')
      .eq('user_id', user.id)
      .order('last_generated_at', { ascending: false })
      .limit(20);

    return (data || []).map(r => ({
      id: r.id,
      title: r.report_name,
      type: r.report_type as GeneratedReport['type'],
      status: r.is_active ? 'completed' as const : 'failed' as const,
      generated_at: r.last_generated_at || new Date().toISOString()
    }));
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [scans, passwords, assets, darkWeb, trends, reportsData] = await Promise.all([
        loadScanMetrics(),
        loadPasswordMetrics(),
        loadAssetMetrics(),
        loadDarkWebMetrics(),
        loadTrends(),
        loadReports()
      ]);

      setMetrics({
        scans,
        passwords,
        assets,
        darkWeb,
        trends
      });
      setReports(reportsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadScanMetrics, loadPasswordMetrics, loadAssetMetrics, loadDarkWebMetrics, loadTrends, loadReports]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    metrics,
    reports,
    loading,
    error,
    refreshData
  };
};
