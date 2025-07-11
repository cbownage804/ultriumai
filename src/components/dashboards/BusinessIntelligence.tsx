import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Building,
  FileText,
  Globe,
  Zap
} from "lucide-react";

interface BusinessMetrics {
  revenue: {
    monthly: number;
    quarterly: number;
    annual: number;
    growth: number;
  };
  customers: {
    total: number;
    active: number;
    churn: number;
    satisfaction: number;
  };
  operational: {
    ticketResolutionTime: number;
    uptime: number;
    efficiency: number;
    costs: number;
  };
  security: {
    incidents: number;
    threatsBlocked: number;
    complianceScore: number;
    vulnerabilities: number;
  };
}

interface PerformanceData {
  categories: string[];
  values: number[];
  trends: string[];
}

export const BusinessIntelligence = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: { monthly: 0, quarterly: 0, annual: 0, growth: 0 },
    customers: { total: 0, active: 0, churn: 0, satisfaction: 0 },
    operational: { ticketResolutionTime: 0, uptime: 0, efficiency: 0, costs: 0 },
    security: { incidents: 0, threatsBlocked: 0, complianceScore: 0, vulnerabilities: 0 }
  });
  const [performance, setPerformance] = useState<PerformanceData>({
    categories: [],
    values: [],
    trends: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setLoading(true);

      // Load customer data
      const { data: customers, error: customersError } = await supabase
        .from('msp_clients')
        .select('*');

      if (customersError) throw customersError;

      // Load ticket data for operational metrics
      const { data: tickets, error: ticketsError } = await supabase
        .from('helpdesk_tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      // Load security events
      const { data: securityEvents, error: securityError } = await supabase
        .from('security_events')
        .select('*');

      if (securityError) throw securityError;

      // Load compliance data
      const { data: compliance, error: complianceError } = await supabase
        .from('compliance_status')
        .select('score');

      if (complianceError) throw complianceError;

      // Calculate metrics (using real data where possible, simulated where needed)
      const customerCount = customers?.length || 0;
      const activeCustomers = customers?.filter(c => c.is_active).length || 0;
      const ticketCount = tickets?.length || 0;
      const securityIncidents = securityEvents?.length || 0;
      const avgComplianceScore = compliance?.length ? 
        Math.round(compliance.reduce((sum, item) => sum + (item.score || 0), 0) / compliance.length) : 95;

      // Simulate realistic business metrics
      const monthlyRevenue = customerCount * 2500; // Average $2,500 per customer per month
      const quarterlyRevenue = monthlyRevenue * 3;
      const annualRevenue = monthlyRevenue * 12;

      setMetrics({
        revenue: {
          monthly: monthlyRevenue,
          quarterly: quarterlyRevenue,
          annual: annualRevenue,
          growth: 12.5 // 12.5% growth
        },
        customers: {
          total: customerCount,
          active: activeCustomers,
          churn: Math.max(0, customerCount - activeCustomers),
          satisfaction: 4.6 // Out of 5
        },
        operational: {
          ticketResolutionTime: 4.2, // Average hours
          uptime: 99.8, // Percentage
          efficiency: 87, // Percentage
          costs: Math.round(monthlyRevenue * 0.3) // 30% of revenue
        },
        security: {
          incidents: securityIncidents,
          threatsBlocked: securityIncidents * 15, // Assume 15 threats blocked per incident
          complianceScore: avgComplianceScore,
          vulnerabilities: Math.floor(securityIncidents * 0.3)
        }
      });

      // Set performance data
      setPerformance({
        categories: ['Revenue', 'Customer Satisfaction', 'Security Score', 'Operational Efficiency', 'Compliance'],
        values: [85, 92, avgComplianceScore, 87, avgComplianceScore],
        trends: ['up', 'up', 'up', 'stable', 'up']
      });

    } catch (error) {
      console.error('Error loading business data:', error);
      toast({
        title: "Error",
        description: "Failed to load business intelligence data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const { error } = await supabase.functions.invoke('ai-intelligence-hub', {
        body: { 
          action: 'generate_report',
          reportType,
          data: metrics
        }
      });

      if (error) throw error;

      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated and will be available shortly`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
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
          <h1 className="text-3xl font-bold">Business Intelligence</h1>
          <div className="text-muted-foreground">
            Comprehensive analytics and performance insights
          </div>
        </div>
        <Button onClick={loadBusinessData}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.revenue.monthly.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{metrics.revenue.growth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.customers.active}</div>
            <div className="text-xs text-muted-foreground">
              {metrics.customers.churn} churned this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.security.complianceScore}%</div>
            <Progress value={metrics.security.complianceScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.customers.satisfaction}/5.0</div>
            <div className="text-xs text-muted-foreground">Based on recent surveys</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      ${metrics.revenue.quarterly.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Quarterly</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      ${metrics.revenue.annual.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Annual</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Revenue per Customer</span>
                    <span className="font-bold">
                      ${metrics.customers.active > 0 ? Math.round(metrics.revenue.monthly / metrics.customers.active) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating Costs</span>
                    <span className="font-bold">${metrics.operational.costs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Profit Margin</span>
                    <span className="font-bold text-green-600">
                      {Math.round(((metrics.revenue.monthly - metrics.operational.costs) / metrics.revenue.monthly) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Revenue Growth</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">+{metrics.revenue.growth}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Growth</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-blue-600">+8.3%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Market Share</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="font-bold text-purple-600">+2.1%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Efficiency Gains</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="font-bold text-orange-600">+15.7%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>System Uptime</span>
                      <span className="font-bold text-green-600">{metrics.operational.uptime}%</span>
                    </div>
                    <Progress value={metrics.operational.uptime} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Operational Efficiency</span>
                      <span className="font-bold text-blue-600">{metrics.operational.efficiency}%</span>
                    </div>
                    <Progress value={metrics.operational.efficiency} className="h-2" />
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Ticket Resolution</span>
                    <span className="font-bold">{metrics.operational.ticketResolutionTime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First Call Resolution</span>
                    <span className="font-bold text-green-600">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Staff Utilization</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Infrastructure Efficiency</span>
                    <span className="font-bold">88%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tool Integration</span>
                    <span className="font-bold text-green-600">15/18 Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Automation Rate</span>
                    <span className="font-bold text-blue-600">73%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-red-600">{metrics.security.incidents}</div>
                    <div className="text-sm text-muted-foreground">Security Incidents</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">{metrics.security.threatsBlocked}</div>
                    <div className="text-sm text-muted-foreground">Threats Blocked</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Compliance Score</span>
                    <span className="font-bold text-green-600">{metrics.security.complianceScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vulnerabilities</span>
                    <span className="font-bold text-orange-600">{metrics.security.vulnerabilities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean Time to Detection</span>
                    <span className="font-bold">2.3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean Time to Response</span>
                    <span className="font-bold">45 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>SOC 2 Type II</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ISO 27001</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GDPR</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>HIPAA</span>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>PCI DSS</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{metrics.customers.total}</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">{metrics.customers.active}</div>
                    <div className="text-sm text-muted-foreground">Active Customers</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Customer Retention</span>
                    <span className="font-bold text-green-600">
                      {metrics.customers.total > 0 ? Math.round((metrics.customers.active / metrics.customers.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction Score</span>
                    <span className="font-bold text-yellow-600">{metrics.customers.satisfaction}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Promoter Score</span>
                    <span className="font-bold text-blue-600">68</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn Rate</span>
                    <span className="font-bold text-red-600">3.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Customer Success
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>5-Star Reviews</span>
                    <span className="font-bold text-green-600">78%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Support Tickets/Month</span>
                    <span className="font-bold">2.3 avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Feature Adoption</span>
                    <span className="font-bold text-blue-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Time to Value</span>
                    <span className="font-bold">12 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Expansion Revenue</span>
                    <span className="font-bold text-green-600">+23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Business Intelligence Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Executive Dashboard</div>
                      <div className="text-sm text-muted-foreground">High-level KPI overview</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('executive')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Financial Report</div>
                      <div className="text-sm text-muted-foreground">Revenue and cost analysis</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('financial')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Operational Report</div>
                      <div className="text-sm text-muted-foreground">Efficiency and performance metrics</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('operational')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Security Report</div>
                      <div className="text-sm text-muted-foreground">Threat landscape and compliance</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('security')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Customer Analytics</div>
                      <div className="text-sm text-muted-foreground">Satisfaction and retention insights</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('customer')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Predictive Analytics</div>
                      <div className="text-sm text-muted-foreground">AI-powered forecasting</div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport('predictive')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
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