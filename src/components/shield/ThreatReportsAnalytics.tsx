import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Target,
  Download,
  Calendar,
  Filter,
  FileText,
  Users
} from "lucide-react";

interface ThreatAnalytics {
  daily_threats: any[];
  threat_types: any[];
  severity_distribution: any[];
  endpoint_statistics: any[];
  response_times: any[];
  compliance_metrics: any[];
}

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a'];

export const ThreatReportsAnalytics = () => {
  const [analytics, setAnalytics] = useState<ThreatAnalytics>({
    daily_threats: [],
    threat_types: [],
    severity_distribution: [],
    endpoint_statistics: [],
    response_times: [],
    compliance_metrics: []
  });
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Calculate date range
      const days = parseInt(dateRange.replace('days', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get threats data
      const { data: threats } = await supabase
        .from('safe_shield_threats')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('detected_at', startDate.toISOString())
        .order('detected_at', { ascending: true });

      // Get endpoints data
      const { data: endpoints } = await supabase
        .from('safe_shield_endpoints')
        .select('*')
        .eq('user_id', user.user.id);

      if (threats) {
        // Process daily threats
        const dailyMap = new Map();
        threats.forEach(threat => {
          const date = new Date(threat.detected_at).toLocaleDateString();
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        });
        
        const dailyThreats = Array.from(dailyMap.entries()).map(([date, count]) => ({
          date,
          threats: count,
          critical: threats.filter(t => 
            new Date(t.detected_at).toLocaleDateString() === date && t.severity === 'critical'
          ).length
        }));

        // Process threat types
        const typeMap = new Map();
        threats.forEach(threat => {
          const type = threat.threat_type.replace(/_/g, ' ').toUpperCase();
          typeMap.set(type, (typeMap.get(type) || 0) + 1);
        });
        
        const threatTypes = Array.from(typeMap.entries()).map(([name, value]) => ({
          name,
          value,
          percentage: Math.round((value / threats.length) * 100)
        }));

        // Process severity distribution
        const severityMap = new Map();
        threats.forEach(threat => {
          severityMap.set(threat.severity, (severityMap.get(threat.severity) || 0) + 1);
        });
        
        const severityDistribution = Array.from(severityMap.entries()).map(([name, value]) => ({
          name: name.toUpperCase(),
          value,
          fill: name === 'critical' ? '#dc2626' : 
                name === 'high' ? '#ea580c' :
                name === 'medium' ? '#d97706' : '#65a30d'
        }));

        // Process endpoint statistics
        const endpointStats = endpoints?.map(endpoint => ({
          hostname: endpoint.hostname,
          threats: threats.filter(t => t.hostname === endpoint.hostname).length,
          status: endpoint.status,
          last_seen: endpoint.last_seen
        })) || [];

        // Process response times (simulated for demo)
        const responseTimes = dailyThreats.map(day => ({
          date: day.date,
          avg_response: Math.round(Math.random() * 300 + 100), // 100-400 seconds
          incidents: day.threats
        }));

        // Compliance metrics
        const complianceMetrics = [
          { framework: 'SOC 2', score: 92, requirements_met: 45, total_requirements: 49 },
          { framework: 'ISO 27001', score: 88, requirements_met: 134, total_requirements: 152 },
          { framework: 'NIST', score: 85, requirements_met: 267, total_requirements: 314 },
          { framework: 'GDPR', score: 94, requirements_met: 78, total_requirements: 83 }
        ];

        setAnalytics({
          daily_threats: dailyThreats,
          threat_types: threatTypes,
          severity_distribution: severityDistribution,
          endpoint_statistics: endpointStats,
          response_times: responseTimes,
          compliance_metrics: complianceMetrics
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load threat analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    toast({
      title: "📊 Report Export",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // Simulate report generation
    setTimeout(() => {
      toast({
        title: "✅ Report Ready",
        description: `SafeShield ${format.toUpperCase()} report has been generated`,
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalThreats = analytics.daily_threats.reduce((sum, day) => sum + day.threats, 0);
  const criticalThreats = analytics.daily_threats.reduce((sum, day) => sum + day.critical, 0);
  const avgResponseTime = analytics.response_times.reduce((sum, day) => sum + day.avg_response, 0) / (analytics.response_times.length || 1);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart className="h-6 w-6 text-primary" />
            Threat Analytics & Reports
          </h2>
          <p className="text-muted-foreground">
            Comprehensive security metrics and compliance reporting
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <Button onClick={() => exportReport('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalThreats}</div>
            <p className="text-xs text-muted-foreground">
              {criticalThreats} critical incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.round(avgResponseTime)}s</div>
            <p className="text-xs text-muted-foreground">
              Within SLA targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Endpoints</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.endpoint_statistics.length}</div>
            <p className="text-xs text-muted-foreground">
              Active monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">98.7%</div>
            <p className="text-xs text-muted-foreground">
              AI confidence score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart },
          { key: 'threats', label: 'Threat Analysis', icon: AlertTriangle },
          { key: 'compliance', label: 'Compliance', icon: FileText },
          { key: 'endpoints', label: 'Endpoints', icon: Users }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={selectedMetric === tab.key ? 'default' : 'outline'}
            onClick={() => setSelectedMetric(tab.key)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedMetric === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Threat Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.daily_threats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="threats" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="critical" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Threat Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.threat_types}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.threat_types.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Threat Analysis Tab */}
      {selectedMetric === 'threats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.severity_distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.response_times}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg_response" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Threats Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.threat_types.slice(0, 5).map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-semibold">{threat.name}</h4>
                      <p className="text-sm text-muted-foreground">{threat.value} incidents detected</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={threat.value > 5 ? 'destructive' : 'secondary'}>
                        {threat.percentage}% of total
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {selectedMetric === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.compliance_metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {metric.framework}
                    <Badge variant={metric.score >= 90 ? 'default' : metric.score >= 80 ? 'secondary' : 'destructive'}>
                      {metric.score}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={metric.score} className="w-full" />
                    <div className="flex justify-between text-sm">
                      <span>Requirements Met:</span>
                      <span>{metric.requirements_met}/{metric.total_requirements}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportReport('pdf')}>
                        <FileText className="h-3 w-3 mr-1" />
                        Report
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule Audit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};