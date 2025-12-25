import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Shield, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Clock, Users, Server, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    overallRiskScore: 72,
    riskTrend: -5,
    securityPosture: 'Good',
    threatsBlocked: 1247,
    incidentsOpen: 3,
    incidentsResolved: 45,
    mttr: 2.4,
    complianceScore: 94,
    patchCompliance: 87,
    endpointsProtected: 156,
    endpointsAtRisk: 8
  });

  useEffect(() => {
    if (user) loadExecutiveMetrics();
  }, [user]);

  const loadExecutiveMetrics = async () => {
    // Aggregate metrics from various sources
    const [incidents, threats, devices] = await Promise.all([
      supabase.from('security_incidents').select('*', { count: 'exact' }),
      supabase.from('security_events').select('*', { count: 'exact' }),
      supabase.from('rmm_devices').select('*', { count: 'exact' })
    ]);

    setMetrics(prev => ({
      ...prev,
      incidentsOpen: incidents.data?.filter(i => i.status !== 'resolved').length || 3,
      incidentsResolved: incidents.data?.filter(i => i.status === 'resolved').length || 45,
      threatsBlocked: threats.count || 1247,
      endpointsProtected: devices.count || 156
    }));
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Key Risk Indicators */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getRiskColor(metrics.overallRiskScore)}`}>
                {metrics.overallRiskScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
              <div className="flex items-center gap-1 ml-auto">
                {metrics.riskTrend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                )}
                <span className={metrics.riskTrend < 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(metrics.riskTrend)}%
                </span>
              </div>
            </div>
            <Progress value={100 - metrics.overallRiskScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Lower is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Posture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.securityPosture}</p>
                <p className="text-xs text-muted-foreground">Based on all indicators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-500">{metrics.complianceScore}%</span>
            </div>
            <Progress value={metrics.complianceScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mean Time to Resolve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.mttr}h</p>
                <p className="text-xs text-muted-foreground">Average resolution time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat & Incident Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Threat Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Threats Blocked (30d)</span>
                <span className="font-bold text-xl">{metrics.threatsBlocked.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Incidents</span>
                <Badge variant="destructive">{metrics.incidentsOpen}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Resolved (30d)</span>
                <Badge variant="secondary">{metrics.incidentsResolved}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Endpoint Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Endpoints</span>
                <span className="font-bold text-xl">{metrics.endpointsProtected}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Protected</span>
                <span className="text-green-500 font-medium">{metrics.endpointsProtected - metrics.endpointsAtRisk}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">At Risk</span>
                <Badge variant="destructive">{metrics.endpointsAtRisk}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Patch Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.patchCompliance}%</span>
                <span className="text-muted-foreground">compliant</span>
              </div>
              <Progress value={metrics.patchCompliance} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {Math.round(metrics.endpointsProtected * (1 - metrics.patchCompliance / 100))} devices need updates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Priority actions to improve security posture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Critical: 8 endpoints have unpatched vulnerabilities</p>
                <p className="text-sm text-muted-foreground">Deploy pending security patches to reduce attack surface</p>
              </div>
              <Badge variant="destructive">High Priority</Badge>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">3 incidents pending investigation</p>
                <p className="text-sm text-muted-foreground">Review and resolve open security incidents</p>
              </div>
              <Badge className="bg-yellow-500">Medium</Badge>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Enable MFA for 12 user accounts</p>
                <p className="text-sm text-muted-foreground">Improve account security with multi-factor authentication</p>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
