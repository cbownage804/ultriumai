import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  Users, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface OperationalMetricsProps {
  timeRange: string;
}

export const OperationalMetrics = ({ timeRange }: OperationalMetricsProps) => {
  // Mock operational data
  const performanceMetrics = [
    {
      title: 'Average Response Time',
      value: '2.3 hours',
      change: '-15%',
      trend: 'up',
      target: '2 hours',
      progress: 85
    },
    {
      title: 'Ticket Resolution Rate',
      value: '94.2%',
      change: '+3.1%',
      trend: 'up',
      target: '95%',
      progress: 99.2
    },
    {
      title: 'First Call Resolution',
      value: '78%',
      change: '+5%',
      trend: 'up',
      target: '80%',
      progress: 97.5
    },
    {
      title: 'System Uptime',
      value: '99.8%',
      change: '+0.1%',
      trend: 'up',
      target: '99.9%',
      progress: 99.9
    }
  ];

  const ticketTrends = [
    { date: '2024-01-01', created: 45, resolved: 42, pending: 3 },
    { date: '2024-01-02', created: 38, resolved: 41, pending: 0 },
    { date: '2024-01-03', created: 52, resolved: 48, pending: 4 },
    { date: '2024-01-04', created: 41, resolved: 45, pending: -4 },
    { date: '2024-01-05', created: 47, resolved: 49, pending: -2 }
  ];

  const teamProductivity = [
    { member: 'John Doe', tickets: 85, avg_time: 2.1, satisfaction: 4.8 },
    { member: 'Jane Smith', tickets: 92, avg_time: 1.8, satisfaction: 4.9 },
    { member: 'Mike Wilson', tickets: 78, avg_time: 2.4, satisfaction: 4.6 },
    { member: 'Sarah Jones', tickets: 89, avg_time: 2.0, satisfaction: 4.7 }
  ];

  const systemHealth = [
    { system: 'Primary Servers', uptime: 99.9, alerts: 2, status: 'healthy' },
    { system: 'Database Cluster', uptime: 99.8, alerts: 1, status: 'healthy' },
    { system: 'Backup Systems', uptime: 100, alerts: 0, status: 'healthy' },
    { system: 'Monitoring Tools', uptime: 99.5, alerts: 3, status: 'warning' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className={`flex items-center text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Target: {metric.target}</span>
                    <span>{metric.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={metric.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trends */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ticket Volume Trends
            </CardTitle>
            <CardDescription>Daily ticket creation vs resolution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health Overview
            </CardTitle>
            <CardDescription>Infrastructure status and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((system, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(system.status)}
                    <div>
                      <div className="font-medium">{system.system}</div>
                      <div className="text-sm text-muted-foreground">
                        {system.uptime}% uptime
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={system.alerts === 0 ? 'default' : 'destructive'}>
                      {system.alerts} alerts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Productivity */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
          <CardDescription>Individual team member metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamProductivity.map((member, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{member.member}</div>
                  <div className="text-sm text-muted-foreground">Team Member</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{member.tickets}</div>
                  <div className="text-sm text-muted-foreground">Tickets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{member.avg_time}h</div>
                  <div className="text-sm text-muted-foreground">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{member.satisfaction}/5</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};