import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, Server, Database, Zap, Globe, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface SystemMetric {
  name: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  uptime: number;
  response_time: number;
  last_check: string;
}

export const SystemMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchSystemStatus = async () => {
    try {
      // Simulate real system metrics
      const mockMetrics: SystemMetric[] = [
        {
          name: 'CPU Usage',
          value: Math.random() * 80 + 10,
          status: 'good',
          unit: '%',
          threshold: { warning: 70, critical: 90 }
        },
        {
          name: 'Memory Usage',
          value: Math.random() * 75 + 15,
          status: 'good',
          unit: '%',
          threshold: { warning: 80, critical: 95 }
        },
        {
          name: 'Database Connections',
          value: Math.random() * 200 + 50,
          status: 'good',
          unit: 'connections',
          threshold: { warning: 180, critical: 220 }
        },
        {
          name: 'API Response Time',
          value: Math.random() * 500 + 100,
          status: 'good',
          unit: 'ms',
          threshold: { warning: 1000, critical: 2000 }
        },
        {
          name: 'Error Rate',
          value: Math.random() * 2,
          status: 'good',
          unit: '%',
          threshold: { warning: 1, critical: 5 }
        },
        {
          name: 'Storage Usage',
          value: Math.random() * 60 + 20,
          status: 'good',
          unit: '%',
          threshold: { warning: 80, critical: 95 }
        }
      ];

      // Determine status based on thresholds
      const metricsWithStatus = mockMetrics.map(metric => ({
        ...metric,
        status: metric.value >= metric.threshold.critical ? 'critical' :
                metric.value >= metric.threshold.warning ? 'warning' : 'good'
      })) as SystemMetric[];

      const mockServices: ServiceStatus[] = [
        {
          name: 'Web Application',
          status: 'online',
          uptime: 99.9,
          response_time: Math.random() * 200 + 50,
          last_check: new Date().toISOString()
        },
        {
          name: 'Database',
          status: 'online',
          uptime: 99.95,
          response_time: Math.random() * 50 + 10,
          last_check: new Date().toISOString()
        },
        {
          name: 'Authentication Service',
          status: 'online',
          uptime: 99.8,
          response_time: Math.random() * 150 + 30,
          last_check: new Date().toISOString()
        },
        {
          name: 'Edge Functions',
          status: Math.random() > 0.9 ? 'degraded' : 'online',
          uptime: 99.7,
          response_time: Math.random() * 300 + 100,
          last_check: new Date().toISOString()
        },
        {
          name: 'File Storage',
          status: 'online',
          uptime: 99.99,
          response_time: Math.random() * 100 + 20,
          last_check: new Date().toISOString()
        }
      ];

      // Generate performance data for the last 24 hours
      const now = new Date();
      const performanceHistory = Array.from({ length: 24 }, (_, i) => {
        const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cpu: Math.random() * 70 + 10,
          memory: Math.random() * 60 + 20,
          response_time: Math.random() * 400 + 100,
          error_rate: Math.random() * 2
        };
      });

      setMetrics(metricsWithStatus);
      setServices(mockServices);
      setPerformanceData(performanceHistory);
      setLastUpdate(new Date());
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch system status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    // Update every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'good':
        return 'default';
      case 'degraded':
      case 'warning':
        return 'secondary';
      case 'offline':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'offline':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const overallSystemHealth = () => {
    const criticalCount = [...metrics, ...services].filter(item => 
      item.status === 'critical' || item.status === 'offline'
    ).length;
    const warningCount = [...metrics, ...services].filter(item => 
      item.status === 'warning' || item.status === 'degraded'
    ).length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'good';
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">System Monitoring</h3>
          <p className="text-sm text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={fetchSystemStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall System Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health Overview
            </CardTitle>
            <Badge variant={getStatusColor(overallSystemHealth())} className="flex items-center gap-1">
              {getStatusIcon(overallSystemHealth())}
              {overallSystemHealth().toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'online').length}
              </div>
              <div className="text-sm text-muted-foreground">Services Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'degraded').length}
              </div>
              <div className="text-sm text-muted-foreground">Services Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {services.filter(s => s.status === 'offline').length}
              </div>
              <div className="text-sm text-muted-foreground">Services Offline</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <Badge variant={getStatusColor(metric.status)} className="flex items-center gap-1">
                {getStatusIcon(metric.status)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.value.toFixed(1)}{metric.unit}
              </div>
              <Progress 
                value={(metric.value / (metric.threshold.critical * 1.2)) * 100} 
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Warning: {metric.threshold.warning}{metric.unit} • 
                Critical: {metric.threshold.critical}{metric.unit}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>Current status of all system services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusColor(service.status)} className="flex items-center gap-1">
                    {getStatusIcon(service.status)}
                    {service.status.toUpperCase()}
                  </Badge>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Uptime: {service.uptime}% • Response: {service.response_time.toFixed(0)}ms
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last check: {new Date(service.last_check).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              CPU & Memory Usage
            </CardTitle>
            <CardDescription>24-hour performance trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={2} name="Memory %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Response Time & Errors
            </CardTitle>
            <CardDescription>24-hour response metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="response_time" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  name="Response Time (ms)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="error_rate" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Error Rate %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};