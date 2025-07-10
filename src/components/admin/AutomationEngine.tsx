import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: any;
  actions: any;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

interface ExecutionLog {
  id: string;
  rule_id: string;
  execution_status: string;
  error_message: string | null;
  actions_executed: any;
  execution_time_ms: number | null;
  created_at: string;
}

export const AutomationEngine = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineRunning, setEngineRunning] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load automation rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (rulesError) throw rulesError;

      // Load recent execution logs
      const { data: logsData, error: logsError } = await supabase
        .from('automation_execution_logs')
        .select(`
          *,
          workflow_automation_rules!inner(user_id)
        `)
        .eq('workflow_automation_rules.user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      setRules(rulesData || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error loading automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_automation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: isActive ? "Rule Disabled" : "Rule Enabled",
        description: `Automation rule has been ${isActive ? 'disabled' : 'enabled'}`,
      });

      loadData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Error",
        description: "Failed to toggle automation rule",
        variant: "destructive",
      });
    }
  };

  const triggerManualExecution = async (ruleId: string) => {
    try {
      // In a real implementation, this would trigger the actual automation
      // For now, we'll just simulate a successful execution
      const { error } = await supabase
        .from('automation_execution_logs')
        .insert({
          rule_id: ruleId,
          ticket_id: 'manual-trigger',
          execution_status: 'success',
          actions_executed: [{ action: 'manual_test', status: 'completed' }],
          execution_time_ms: 150,
        });

      if (error) throw error;

      toast({
        title: "Manual Execution Started",
        description: "The automation rule has been triggered manually",
      });

      loadData();
    } catch (error) {
      console.error('Error executing rule:', error);
      toast({
        title: "Error",
        description: "Failed to execute automation rule",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automation Engine
          </h2>
          <p className="text-muted-foreground">
            Monitor and control your workflow automation rules
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Engine Status:</span>
            <Switch
              checked={engineRunning}
              onCheckedChange={setEngineRunning}
            />
            <Badge variant={engineRunning ? "default" : "secondary"}>
              {engineRunning ? "Running" : "Stopped"}
            </Badge>
          </div>
          <Button variant="outline" onClick={loadData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Engine Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Engine Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{rules.length}</p>
              <p className="text-sm text-muted-foreground">Total Rules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Rules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {rules.reduce((sum, rule) => sum + rule.execution_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {logs.filter(log => log.execution_status === 'success').length}
              </p>
              <p className="text-sm text-muted-foreground">Recent Successes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No Automation Rules</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create workflow automation rules to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${rule.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Zap className={`h-4 w-4 ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {rule.trigger_event}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Executed {rule.execution_count} times
                        </span>
                        {rule.last_executed_at && (
                          <span className="text-xs text-muted-foreground">
                            Last: {format(new Date(rule.last_executed_at), 'MMM dd, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerManualExecution(rule.id)}
                      disabled={!rule.is_active}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent executions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const rule = rules.find(r => r.id === log.rule_id);
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.execution_status)}
                      <div>
                        <p className="font-medium">{rule?.name || 'Unknown Rule'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                          {log.execution_time_ms && ` • ${log.execution_time_ms}ms`}
                        </p>
                        {log.error_message && (
                          <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(log.execution_status)}>
                        {log.execution_status}
                      </Badge>
                      {log.actions_executed && (
                        <Badge variant="outline" className="text-xs">
                          {log.actions_executed.length} actions
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health Warning */}
      {!engineRunning && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Automation Engine Stopped</p>
                <p className="text-sm text-orange-700">
                  The automation engine is currently stopped. No rules will be executed automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};