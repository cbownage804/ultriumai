import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  status: string;
  threshold_warning: number;
  threshold_critical: number;
  metadata: any;
  recorded_at: string;
}

export const SystemHealthMonitoring = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState('all');
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const { toast } = useToast();

  const metricTypes = [
    { value: 'all', label: 'All Metrics' },
    { value: 'api', label: 'API Performance' },
    { value: 'database', label: 'Database' },
    { value: 'server', label: 'Server Resources' },
    { value: 'network', label: 'Network' },
    { value: 'storage', label: 'Storage' }
  ];

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('system_health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (selectedMetricType !== 'all') {
        query = query.eq('metric_type', selectedMetricType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMetrics(data || []);

      // Determine overall system status
      const criticalCount = data?.filter(m => m.status === 'critical').length || 0;
      const warningCount = data?.filter(m => m.status === 'warning').length || 0;

      if (criticalCount > 0) {
        setSystemStatus('critical');
      } else if (warningCount > 0) {
        setSystemStatus('warning');
      } else {
        setSystemStatus('healthy');
      }

    } catch (error: any) {
      toast({
        title: "Error fetching health metrics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleMetrics = async () => {
    try {
      const sampleMetrics = [
        // API Metrics
        {
          metric_type: 'api',
          metric_name: 'response_time_ms',
          metric_value: Math.random() * 200 + 50,
          status: 'healthy',
          threshold_warning: 500,
          threshold_critical: 1000,
          metadata: { endpoint: '/api/users' }
        },
        {
          metric_type: 'api',
          metric_name: 'requests_per_minute',
          metric_value: Math.random() * 1000 + 100,
          status: 'healthy',
          threshold_warning: 5000,
          threshold_critical: 10000,
          metadata: { endpoint: '/api/auth' }
        },
        // Database Metrics
        {
          metric_type: 'database',
          metric_name: 'connection_count',
          metric_value: Math.random() * 50 + 10,
          status: 'healthy',
          threshold_warning: 80,
          threshold_critical: 95,
          metadata: { pool: 'main' }
        },
        {
          metric_type: 'database',
          metric_name: 'query_time_ms',
          metric_value: Math.random() * 100 + 10,
          status: 'healthy',
          threshold_warning: 500,
          threshold_critical: 1000,
          metadata: { operation: 'SELECT' }
        },
        // Server Metrics
        {
          metric_type: 'server',
          metric_name: 'cpu_usage_percent',
          metric_value: Math.random() * 60 + 20,
          status: 'healthy',
          threshold_warning: 80,
          threshold_critical: 95,
          metadata: { server: 'web-01' }
        },
        {
          metric_type: 'server',
          metric_name: 'memory_usage_percent',
          metric_value: Math.random() * 70 + 15,
          status: 'healthy',
          threshold_warning: 85,
          threshold_critical: 95,
          metadata: { server: 'web-01' }
        },
        // Network Metrics
        {
          metric_type: 'network',
          metric_name: 'bandwidth_mbps',
          metric_value: Math.random() * 800 + 100,
          status: 'healthy',
          threshold_warning: 900,
          threshold_critical: 950,
          metadata: { interface: 'eth0' }
        },
        // Storage Metrics
        {
          metric_type: 'storage',
          metric_name: 'disk_usage_percent',
          metric_value: Math.random() * 50 + 20,
          status: 'healthy',
          threshold_warning: 80,
          threshold_critical: 90,
          metadata: { mount: '/var' }
        }
      ];

      // Randomly make some metrics warning/critical
      sampleMetrics.forEach(metric => {
        if (Math.random() < 0.1) { // 10% chance of warning
          metric.status = 'warning';
          metric.metric_value = metric.threshold_warning + (Math.random() * 10);
        } else if (Math.random() < 0.05) { // 5% chance of critical
          metric.status = 'critical';
          metric.metric_value = metric.threshold_critical + (Math.random() * 10);
        }
      });

      const { error } = await supabase
        .from('system_health_metrics')
        .insert(sampleMetrics);

      if (error) throw error;

      toast({
        title: "Sample metrics generated",
        description: "System health sample data has been created",
      });

      fetchMetrics();
    } catch (error: any) {
      toast({
        title: "Error generating sample metrics",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'api': return <Network className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'server': return <Server className="h-5 w-5" />;
      case 'network': return <Wifi className="h-5 w-5" />;
      case 'storage': return <HardDrive className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const formatMetricValue = (name: string, value: number) => {
    if (name.includes('percent')) {
      return `${value.toFixed(1)}%`;
    } else if (name.includes('ms') || name.includes('time')) {
      return `${value.toFixed(0)}ms`;
    } else if (name.includes('mbps')) {
      return `${value.toFixed(1)} Mbps`;
    } else {
      return value.toFixed(0);
    }
  };

  const getHealthScore = () => {
    if (metrics.length === 0) return 0;
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    return (healthyCount / metrics.length) * 100;
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedMetricType]);

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(systemStatus)}
                  <span className="font-semibold capitalize">{systemStatus}</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthScore.toFixed(0)}%</p>
                <Progress value={healthScore} className="mt-2" />
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">
                  {metrics.filter(m => m.status !== 'healthy').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Metrics</p>
                <p className="text-2xl font-bold">{metrics.length}</p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Metrics
              </CardTitle>
              <CardDescription>
                Real-time monitoring of system performance and health
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedMetricType} onValueChange={setSelectedMetricType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={fetchMetrics}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {metrics.length === 0 && (
                <Button
                  onClick={generateSampleMetrics}
                  variant="outline"
                  size="sm"
                >
                  Generate Sample Data
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.metric_type)}
                      <span className="text-sm font-medium">{metric.metric_name.replace('_', ' ')}</span>
                    </div>
                    <Badge variant={getStatusColor(metric.status) as any}>
                      {getStatusIcon(metric.status)}
                      {metric.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatMetricValue(metric.metric_name, metric.metric_value)}
                    </div>
                    
                    {metric.threshold_warning && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Warning: {formatMetricValue(metric.metric_name, metric.threshold_warning)}</span>
                          <span>Critical: {formatMetricValue(metric.metric_name, metric.threshold_critical)}</span>
                        </div>
                        <Progress 
                          value={(metric.metric_value / metric.threshold_critical) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(metric.recorded_at), 'MMM dd, HH:mm:ss')}</span>
                    </div>
                    
                    {metric.metadata && Object.keys(metric.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(metric.metadata).map(([key, value]) => (
                          <div key={key}>{key}: {String(value)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!loading && metrics.length === 0 && (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No health metrics available</h3>
              <p className="text-muted-foreground mb-4">
                Start monitoring your system by generating sample data or integrating with your monitoring tools
              </p>
              <Button onClick={generateSampleMetrics}>
                Generate Sample Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};