import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertTriangle, MapPin, Clock, TrendingUp, Shield, Activity, UserX, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserActivity {
  id: string;
  user_email: string;
  action: string;
  ip_address: string;
  location: string;
  timestamp: string;
  risk_score: number;
  anomaly_type?: string;
}

export const UserBehaviorAnalytics = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    anomaliesDetected: 0,
    highRiskUsers: 0
  });

  useEffect(() => {
    if (user) {
      loadData();
      setupSubscription();
    }
  }, [user]);

  const loadData = async () => {
    // Load audit logs for user behavior
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logs) {
      const activities: UserActivity[] = logs.map(log => ({
        id: log.id,
        user_email: log.user_id || 'Unknown',
        action: log.action,
        ip_address: String(log.ip_address || 'N/A'),
        location: 'Unknown',
        timestamp: log.created_at,
        risk_score: calculateRiskScore(log),
        anomaly_type: detectAnomaly(log)
      }));
      setActivities(activities);
      
      const anomalyList = activities.filter(a => a.anomaly_type);
      setAnomalies(anomalyList);

      setStats({
        totalUsers: new Set(activities.map(a => a.user_email)).size,
        activeToday: activities.filter(a => 
          new Date(a.timestamp).toDateString() === new Date().toDateString()
        ).length,
        anomaliesDetected: anomalyList.length,
        highRiskUsers: activities.filter(a => a.risk_score > 70).length
      });
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('uba-analysis', {
        body: { action: 'analyze', days_back: 30 }
      });

      if (error) throw error;
      
      toast.success(`Analysis complete`, {
        description: `${data.anomalies_detected} anomalies detected across ${data.unique_users} users`
      });
      
      // Refresh data
      loadData();
    } catch (err: any) {
      toast.error('Analysis failed', { description: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acknowledgeAnomaly = async (anomalyId: string) => {
    try {
      const { error } = await supabase.functions.invoke('uba-analysis', {
        body: { action: 'acknowledge_anomaly', anomaly_id: anomalyId }
      });

      if (error) throw error;
      setAnomalies(prev => prev.filter(a => a.id !== anomalyId));
      toast.success('Anomaly acknowledged');
    } catch (err: any) {
      toast.error('Failed to acknowledge', { description: err.message });
    }
  };

  const setupSubscription = () => {
    const channel = supabase
      .channel('uba-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        loadData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const calculateRiskScore = (log: any): number => {
    let score = 10;
    if (log.action?.includes('delete')) score += 30;
    if (log.action?.includes('admin')) score += 25;
    if (log.action?.includes('export')) score += 20;
    if (log.action?.includes('failed')) score += 40;
    return Math.min(score, 100);
  };

  const detectAnomaly = (log: any): string | undefined => {
    if (log.action?.includes('failed_login')) return 'Failed Login Attempt';
    if (log.action?.includes('privilege')) return 'Privilege Escalation';
    if (log.action?.includes('bulk_delete')) return 'Mass Deletion';
    if (log.action?.includes('export')) return 'Data Export';
    if (log.action?.includes('unusual')) return 'Unusual Activity';
    return undefined;
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500">Critical</Badge>;
    if (score >= 60) return <Badge className="bg-orange-500">High</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-green-500">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.anomaliesDetected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4" />
              High Risk Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.highRiskUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="anomalies">
        <TabsList>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="activity">All Activity</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Detected Anomalies
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Run Analysis
                </Button>
              </div>
            </CardHeader>
            <CardDescription className="px-6 -mt-2">
              Unusual behavior patterns requiring investigation
            </CardDescription>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">No anomalies detected</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{anomaly.anomaly_type}</Badge>
                            {getRiskBadge(anomaly.risk_score)}
                          </div>
                          <p className="mt-2 text-sm">{anomaly.action}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {anomaly.ip_address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(anomaly.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAnomaly(anomaly.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                          <Button size="sm" variant="outline">Investigate</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activities.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activity.ip_address}</span>
                      <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      {getRiskBadge(activity.risk_score)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Behavior Patterns
              </CardTitle>
              <CardDescription>
                Machine learning analysis of user behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Login Time Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Most users login between 8AM-6PM. After-hours access triggers alerts.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Location Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Unusual geographic locations trigger impossible travel alerts.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Access Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    Baseline established for normal resource access. Deviations flagged.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Privilege Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Admin actions monitored for unauthorized privilege escalation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
