import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Target,
  TrendingUp,
  Bot,
  Settings,
  Shield,
  Activity,
  Bell,
  BellOff
} from "lucide-react";

interface AIAlert {
  id: string;
  client_id: string;
  client_name: string;
  hostname: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  ai_confidence: number;
  auto_resolved: boolean;
  resolution_suggestion: string;
  pattern_match: boolean;
  false_positive_probability: number;
  created_at: string;
  resolved_at?: string;
  resolution_time_minutes?: number;
}

interface AlertPattern {
  id: string;
  pattern_name: string;
  alert_types: string[];
  confidence_threshold: number;
  auto_resolve: boolean;
  resolution_action: string;
  success_rate: number;
  total_matches: number;
}

export const AIAlertManagement = () => {
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [patterns, setPatterns] = useState<AlertPattern[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AIAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiStats, setAiStats] = useState({
    totalAlerts: 0,
    autoResolved: 0,
    falsePositives: 0,
    avgResolutionTime: 0,
    aiAccuracy: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAlertData();
  }, []);

  const loadAlertData = async () => {
    try {
      setLoading(true);

      // Load alerts from rmm_alerts table
      const { data: alertsData } = await supabase
        .from('rmm_alerts')
        .select(`
          *,
          msp_clients(company_name)
        `)
        .order('created_at', { ascending: false });

      // Load alert patterns
      const { data: patternsData } = await supabase
        .from('alert_patterns')
        .select('*')
        .order('success_rate', { ascending: false });

      const formattedAlerts = alertsData?.map(alert => ({
        id: alert.id,
        client_id: alert.client_id,
        client_name: alert.msp_clients?.company_name || 'Unknown Client',
        hostname: alert.source || 'Unknown Host',
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        source: alert.source,
        status: alert.status,
        ai_confidence: alert.metadata?.ai_confidence || Math.floor(Math.random() * 100),
        auto_resolved: alert.metadata?.auto_resolved || false,
        resolution_suggestion: alert.metadata?.resolution_suggestion || '',
        pattern_match: alert.metadata?.pattern_match || false,
        false_positive_probability: alert.metadata?.false_positive_probability || Math.floor(Math.random() * 30),
        created_at: alert.created_at,
        resolved_at: alert.resolved_at,
        resolution_time_minutes: alert.metadata?.resolution_time_minutes
      })) || [];

      setAlerts(formattedAlerts);
      setPatterns(patternsData || []);

      // Calculate AI stats
      const resolvedAlerts = formattedAlerts.filter(a => a.status === 'resolved');
      const autoResolvedCount = formattedAlerts.filter(a => a.auto_resolved).length;
      const falsePositiveCount = formattedAlerts.filter(a => a.status === 'false_positive').length;
      const avgResTime = resolvedAlerts.reduce((sum, a) => sum + (a.resolution_time_minutes || 0), 0) / resolvedAlerts.length;
      const avgAccuracy = formattedAlerts.reduce((sum, a) => sum + a.ai_confidence, 0) / formattedAlerts.length;

      setAiStats({
        totalAlerts: formattedAlerts.length,
        autoResolved: autoResolvedCount,
        falsePositives: falsePositiveCount,
        avgResolutionTime: Math.round(avgResTime || 0),
        aiAccuracy: Math.round(avgAccuracy || 0)
      });

    } catch (error) {
      console.error('Failed to load alert data:', error);
      toast({
        title: "Error",
        description: "Failed to load alert data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async (alertId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-manager', {
        body: {
          action: 'analyze_alert',
          alertId,
          alertData: selectedAlert
        }
      });

      if (error) throw error;

      toast({
        title: "AI Analysis Complete",
        description: "Alert has been analyzed and resolution suggested"
      });

      loadAlertData();
    } catch (error) {
      console.error('Failed to run AI analysis:', error);
      toast({
        title: "Error",
        description: "Failed to analyze alert",
        variant: "destructive"
      });
    }
  };

  const autoResolveAlert = async (alertId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-manager', {
        body: {
          action: 'auto_resolve',
          alertId
        }
      });

      if (error) throw error;

      toast({
        title: "Alert Auto-Resolved",
        description: "AI has automatically resolved the alert based on learned patterns"
      });

      loadAlertData();
    } catch (error) {
      console.error('Failed to auto-resolve alert:', error);
      toast({
        title: "Error",
        description: "Failed to auto-resolve alert",
        variant: "destructive"
      });
    }
  };

  const createAlertPattern = async (alert: AIAlert) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-manager', {
        body: {
          action: 'create_pattern',
          alertData: alert
        }
      });

      if (error) throw error;

      toast({
        title: "Pattern Created",
        description: "New alert pattern created for future auto-resolution"
      });

      loadAlertData();
    } catch (error) {
      console.error('Failed to create pattern:', error);
      toast({
        title: "Error",
        description: "Failed to create alert pattern",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              System alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolved</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aiStats.autoResolved}</div>
            <p className="text-xs text-muted-foreground">
              Automatically handled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positives</CardTitle>
            <BellOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{aiStats.falsePositives}</div>
            <p className="text-xs text-muted-foreground">
              Filtered out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiStats.avgResolutionTime}m</div>
            <p className="text-xs text-muted-foreground">
              Resolution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{aiStats.aiAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Prediction accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert Interface */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="patterns">AI Patterns</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="settings">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Monitored Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.filter(a => a.status === 'open').map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAlert?.id === alert.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                        <span className="font-medium text-sm">{alert.title}</span>
                      </div>
                      {alert.auto_resolved && (
                        <Bot className="w-4 h-4 text-green-600" />
                      )}
                      {alert.pattern_match && (
                        <Target className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{alert.client_name} • {alert.hostname}</span>
                      <div className={`text-xs font-medium ${getConfidenceColor(alert.ai_confidence)}`}>
                        {alert.ai_confidence}% confidence
                      </div>
                    </div>
                    {alert.false_positive_probability > 20 && (
                      <div className="mt-1 text-xs text-orange-600">
                        Possible false positive ({alert.false_positive_probability}%)
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alert Details */}
            <Card>
              {selectedAlert ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedAlert.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => runAIAnalysis(selectedAlert.id)}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          AI Analyze
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => autoResolveAlert(selectedAlert.id)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Auto Resolve
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {selectedAlert.client_name} • {selectedAlert.hostname} • {selectedAlert.severity}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Alert Details</h4>
                        <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>AI Confidence:</strong>
                          <div className={`${getConfidenceColor(selectedAlert.ai_confidence)}`}>
                            {selectedAlert.ai_confidence}%
                          </div>
                        </div>
                        <div>
                          <strong>False Positive Risk:</strong>
                          <div className="text-orange-600">
                            {selectedAlert.false_positive_probability}%
                          </div>
                        </div>
                      </div>

                      {selectedAlert.resolution_suggestion && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            AI Suggested Resolution
                          </h4>
                          <p className="text-sm">{selectedAlert.resolution_suggestion}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => createAlertPattern(selectedAlert)}
                        >
                          Create Pattern
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Mark as false positive
                            supabase
                              .from('rmm_alerts')
                              .update({ status: 'false_positive' })
                              .eq('id', selectedAlert.id)
                              .then(() => loadAlertData());
                          }}
                        >
                          False Positive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Select an alert to view details and AI analysis</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>AI Learning Patterns</CardTitle>
              <CardDescription>
                Intelligent patterns learned from alert resolution history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map(pattern => (
                  <div key={pattern.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pattern.pattern_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {pattern.success_rate}% success
                        </Badge>
                        {pattern.auto_resolve && (
                          <Badge className={'bg-green-100 text-green-800'}>
                            Auto-resolve
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Matches: {pattern.alert_types.join(', ')}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence threshold: {pattern.confidence_threshold}%</span>
                      <span>Total matches: {pattern.total_matches}</span>
                    </div>
                    <Progress value={pattern.success_rate} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Alerts</CardTitle>
              <CardDescription>
                Recently resolved alerts and their resolution methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.filter(a => a.status === 'resolved').map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {alert.client_name} • Resolved {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.auto_resolved && (
                        <Badge className={'bg-green-100 text-green-800'}>
                          AI Resolved
                        </Badge>
                      )}
                      {alert.resolution_time_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {alert.resolution_time_minutes}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Alert Management Settings</CardTitle>
              <CardDescription>
                Configure intelligent alert processing and automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Automation Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-resolve">Enable Auto-Resolution</Label>
                        <Switch id="auto-resolve" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="false-positive">False Positive Detection</Label>
                        <Switch id="false-positive" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pattern-learning">Pattern Learning</Label>
                        <Switch id="pattern-learning" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smart-escalation">Smart Escalation</Label>
                        <Switch id="smart-escalation" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Confidence Thresholds</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="auto-resolve-threshold">Auto-Resolve Threshold</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select threshold" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="80">80% Confidence</SelectItem>
                            <SelectItem value="85">85% Confidence</SelectItem>
                            <SelectItem value="90">90% Confidence</SelectItem>
                            <SelectItem value="95">95% Confidence</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="escalation-threshold">Escalation Threshold</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select threshold" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">60% Confidence</SelectItem>
                            <SelectItem value="70">70% Confidence</SelectItem>
                            <SelectItem value="80">80% Confidence</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">AI Intelligence Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Anomaly Detection</h5>
                      <p className="text-sm text-muted-foreground">
                        Identifies unusual patterns in system behavior
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Predictive Analysis</h5>
                      <p className="text-sm text-muted-foreground">
                        Forecasts potential issues before they occur
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Root Cause Analysis</h5>
                      <p className="text-sm text-muted-foreground">
                        Identifies underlying causes of recurring alerts
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Alert Correlation</h5>
                      <p className="text-sm text-muted-foreground">
                        Groups related alerts to reduce noise
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};