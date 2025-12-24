import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Clock, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricsData {
  securityScore: number;
  threatDetectionRate: number;
  responseTime: number;
  incidentsResolved: number;
  vulnerabilitiesPatched: number;
  complianceScore: number;
}

export const SecurityMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData>({
    securityScore: 0,
    threatDetectionRate: 0,
    responseTime: 0,
    incidentsResolved: 0,
    vulnerabilitiesPatched: 0,
    complianceScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Load real data from database
      const [incidentsResult, scansResult] = await Promise.all([
        supabase.from('security_incidents').select('status, severity, created_at, resolved_at'),
        supabase.from('security_scans').select('critical_count, high_count, medium_count, low_count, status')
      ]);

      const incidents = incidentsResult.data || [];
      const scans = scansResult.data || [];

      // Calculate metrics from real data
      const totalIncidents = incidents.length;
      const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
      const incidentsResolvedRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 100;

      // Calculate vulnerability metrics
      const totalVulns = scans.reduce((sum, s) => sum + (s.critical_count || 0) + (s.high_count || 0) + (s.medium_count || 0) + (s.low_count || 0), 0);
      const criticalVulns = scans.reduce((sum, s) => sum + (s.critical_count || 0), 0);
      const highVulns = scans.reduce((sum, s) => sum + (s.high_count || 0), 0);
      
      // Calculate security score based on real data
      let score = 100;
      score -= criticalVulns * 10; // -10 for each critical
      score -= highVulns * 5; // -5 for each high
      score -= incidents.filter(i => i.status === 'open').length * 3;
      score = Math.max(0, Math.min(100, score));

      // Threat detection rate (completed scans / total scans)
      const completedScans = scans.filter(s => s.status === 'completed').length;
      const threatDetectionRate = scans.length > 0 ? (completedScans / scans.length) * 100 : 100;

      // Calculate average response time for resolved incidents
      const resolvedWithTime = incidents.filter(i => i.resolved_at && i.created_at);
      let avgResponseTime = 0;
      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((sum, i) => {
          const created = new Date(i.created_at).getTime();
          const resolved = new Date(i.resolved_at).getTime();
          return sum + (resolved - created);
        }, 0);
        avgResponseTime = (totalTime / resolvedWithTime.length) / (1000 * 60 * 60); // Convert to hours
      }

      setMetrics({
        securityScore: Math.round(score),
        threatDetectionRate: Math.round(threatDetectionRate * 10) / 10,
        responseTime: Math.round(avgResponseTime * 10) / 10,
        incidentsResolved: Math.round(incidentsResolvedRate * 10) / 10,
        vulnerabilitiesPatched: totalVulns > 0 ? Math.round((1 - (criticalVulns + highVulns) / totalVulns) * 100) : 100,
        complianceScore: 0 // Set to 0 until compliance audits are run
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Metrics Dashboard</CardTitle>
        <CardDescription>Real-time security performance indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Security Score */}
        <div className="text-center p-4 border rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Overall Security Score</h3>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.securityScore)}`}>
            {metrics.securityScore}/100
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(metrics.securityScore)}`}
              style={{ width: `${metrics.securityScore}%` }}
            ></div>
          </div>
          <Badge variant={metrics.securityScore >= 90 ? "default" : metrics.securityScore >= 75 ? "secondary" : "destructive"} className="mt-2">
            {metrics.securityScore >= 90 ? "Excellent" : metrics.securityScore >= 75 ? "Good" : "Needs Improvement"}
          </Badge>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Scan Success Rate</span>
              </div>
              <span className="text-sm font-bold text-green-500">{metrics.threatDetectionRate}%</span>
            </div>
            <Progress value={metrics.threatDetectionRate} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <span className="text-sm font-bold">{metrics.responseTime > 0 ? `${metrics.responseTime}h` : 'N/A'}</span>
            </div>
            <Progress value={metrics.responseTime > 0 ? Math.max(0, 100 - (metrics.responseTime * 10)) : 100} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Incidents Resolved</span>
              </div>
              <span className="text-sm font-bold text-green-500">{metrics.incidentsResolved}%</span>
            </div>
            <Progress value={metrics.incidentsResolved} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Low Risk Score</span>
              </div>
              <span className="text-sm font-bold">{metrics.vulnerabilitiesPatched}%</span>
            </div>
            <Progress value={metrics.vulnerabilitiesPatched} className="h-2" />
          </div>
        </div>

        {/* Security Health Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium">System Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Platform Status</div>
                <div className="text-xs text-green-600">Operational</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Database</div>
                <div className="text-xs text-green-600">Connected</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 border rounded">
              {metrics.complianceScore > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <div>
                <div className="text-sm font-medium">Compliance</div>
                <div className={`text-xs ${metrics.complianceScore > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {metrics.complianceScore > 0 ? `${metrics.complianceScore}%` : 'Not configured'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};