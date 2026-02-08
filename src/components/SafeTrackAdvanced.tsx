import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Shield, QrCode, BarChart3, Bell, Zap, Target, Wrench, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Eye, Download, Filter, Search } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as QRCode from 'qrcode';

interface SmartAlert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category: string;
  assetId?: string;
  assetName?: string;
  daysRemaining?: number;
  daysOverdue?: number;
}

interface PredictiveMaintenance {
  assetId: string;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  estimatedNextMaintenance: number;
  recommendations: string[];
  analysis: string;
}

interface AdvancedAnalytics {
  totalValue: number;
  monthlyDepreciation: number;
  utilizationRate: number;
  maintenanceCosts: number;
  complianceScore: number;
  riskDistribution: { level: string; count: number; color: string }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
  costTrends: { month: string; maintenance: number; depreciation: number; value: number }[];
  performanceMetrics: { metric: string; current: number; target: number; trend: string }[];
}

const SafeTrackAdvanced = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [predictions, setPredictions] = useState<PredictiveMaintenance[]>([]);
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<any>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    if (user) {
      loadAdvancedData();
    }
  }, [user]);

  const loadAdvancedData = async () => {
    setLoading(true);
    try {
      // Load smart alerts
      await loadSmartAlerts();
      
      // Load advanced analytics
      await loadAdvancedAnalytics();
      
    } catch (error) {
      console.error('Error loading advanced data:', error);
      toast({
        title: "Error",
        description: "Failed to load advanced analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSmartAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-smart-alerts', {
        body: { userId: user?.id }
      });

      if (error) throw error;
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Smart alerts error:', error);
    }
  };

  const loadAdvancedAnalytics = async () => {
    try {
      // Fetch assets and software data
      const { data: assets } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(name, icon),
          maintenance:asset_maintenance(*)
        `)
        .eq('user_id', user?.id);

      const { data: software } = await supabase
        .from('software_assets')
        .select('*')
        .eq('user_id', user?.id);

      if (!assets || !software) return;

      // Calculate advanced metrics
      const totalValue = assets.reduce((sum, asset) => 
        sum + (asset.current_value || asset.purchase_price || 0), 0);
      
      const maintenanceCosts = assets.reduce((sum, asset) => 
        sum + (asset.maintenance?.reduce((mSum: number, m: any) => 
          mSum + (m.cost || 0), 0) || 0), 0);

      const monthlyDepreciation = assets.reduce((sum, asset) => {
        if (asset.purchase_price && asset.depreciation_rate) {
          return sum + (asset.purchase_price * (asset.depreciation_rate / 100) / 12);
        }
        return sum;
      }, 0);

      // Calculate compliance score
      const compliantSoftware = software.filter(s => s.compliance_status === 'compliant').length;
      const complianceScore = software.length > 0 ? (compliantSoftware / software.length) * 100 : 100;

      // Risk distribution
      const riskDistribution = [
        { level: 'Low Risk', count: 0, color: '#22c55e' },
        { level: 'Medium Risk', count: 0, color: '#f59e0b' },
        { level: 'High Risk', count: 0, color: '#ef4444' }
      ];

      alerts.forEach(alert => {
        const riskIndex = alert.severity === 'low' ? 0 : alert.severity === 'medium' ? 1 : 2;
        riskDistribution[riskIndex].count++;
      });

      // Category breakdown
      const categoryMap = new Map();
      assets.forEach(asset => {
        const category = asset.category?.name || 'Other';
        const value = asset.current_value || asset.purchase_price || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + value);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 6]
      }));

      // Mock cost trends (in real app, this would come from historical data)
      const costTrends = [
        { month: 'Jan', maintenance: 5000, depreciation: 8000, value: 250000 },
        { month: 'Feb', maintenance: 4500, depreciation: 8200, value: 245000 },
        { month: 'Mar', maintenance: 6200, depreciation: 8100, value: 248000 },
        { month: 'Apr', maintenance: 5800, depreciation: 8300, value: 252000 },
        { month: 'May', maintenance: 7100, depreciation: 8000, value: 246000 },
        { month: 'Jun', maintenance: 5500, depreciation: 8400, value: 249000 }
      ];

      // Performance metrics
      const performanceMetrics = [
        { metric: 'Asset Utilization', current: 87, target: 90, trend: 'up' },
        { metric: 'Maintenance Efficiency', current: 92, target: 95, trend: 'up' },
        { metric: 'Compliance Score', current: Math.round(complianceScore), target: 100, trend: 'stable' },
        { metric: 'Cost Optimization', current: 78, target: 85, trend: 'down' }
      ];

      setAnalytics({
        totalValue,
        monthlyDepreciation,
        utilizationRate: 87, // Mock data
        maintenanceCosts,
        complianceScore,
        riskDistribution,
        categoryBreakdown,
        costTrends,
        performanceMetrics
      });

    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const runPredictiveMaintenance = async (assetId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictive-maintenance', {
        body: { assetId, userId: user?.id }
      });

      if (error) throw error;
      
      setPredictions(prev => [
        ...prev.filter(p => p.assetId !== assetId),
        data.prediction
      ]);

      toast({
        title: "Prediction Complete",
        description: `Maintenance analysis generated for asset`,
      });
    } catch (error) {
      console.error('Predictive maintenance error:', error);
      toast({
        title: "Error",
        description: "Failed to generate maintenance prediction",
        variant: "destructive",
      });
    }
  };

  const generateQRCode = async (asset: any) => {
    try {
      const assetData = {
        id: asset.id,
        name: asset.name,
        model: asset.model,
        serial: asset.serial_number,
        tag: asset.asset_tag,
        location: asset.location,
        url: `${window.location.origin}/safetrack/asset/${asset.id}`
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(assetData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeData(qrString);
      setSelectedAssetForQR(asset);
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalValue.toFixed(0) || '0'}</div>
            <p className="text-xs text-muted-foreground">
              -{analytics?.monthlyDepreciation.toFixed(0)} monthly depreciation
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Alerts</CardTitle>
            <Bell className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.severity === 'high').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-success/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.complianceScore.toFixed(0) || '0'}%</div>
            <Progress value={analytics?.complianceScore || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.utilizationRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 90%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Tools</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Smart Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Intelligent Alerts
              </CardTitle>
              <CardDescription>
                AI-powered alerts for warranties, maintenance, compliance, and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p>All systems running smoothly!</p>
                    <p className="text-sm">No alerts at this time.</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {alert.category}</span>
                            {alert.daysRemaining && <span>{alert.daysRemaining} days remaining</span>}
                            {alert.daysOverdue && <span>{alert.daysOverdue} days overdue</span>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Value Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Value Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.costTrends || []}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="value" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="maintenance" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.riskDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={({ level, count }) => `${level}: ${count}`}
                    >
                      {analytics?.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Categories by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.categoryBreakdown || []}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.performanceMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.metric}</span>
                        <span>{metric.current}% / {metric.target}%</span>
                      </div>
                      <Progress value={metric.current} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Maintenance Tab */}
        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Predictive Maintenance
              </CardTitle>
              <CardDescription>
                Machine learning predictions for optimal maintenance scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Asset ID: {prediction.assetId}</h4>
                      <Badge className={getRiskColor(prediction.riskLevel)}>
                        {prediction.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <div className="text-2xl font-bold">{prediction.riskScore}/100</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Next Maintenance</span>
                        <div className="text-lg font-medium">
                          {prediction.estimatedNextMaintenance > 0 
                            ? `${prediction.estimatedNextMaintenance} days`
                            : 'Overdue'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Recommendations</span>
                        <div className="text-sm">{prediction.recommendations.length} items</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-sm">
                      <strong>AI Analysis:</strong> {prediction.analysis?.substring(0, 200)}...
                    </div>
                  </div>
                ))}
                
                <Button onClick={() => {
                  // This would open a dialog to select an asset for prediction
                  toast({
                    title: "Feature Demo",
                    description: "Select an asset from the main inventory to run predictive maintenance analysis",
                  });
                }}>
                  <Target className="h-4 w-4 mr-2" />
                  Run Prediction Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Tools Tab */}
        <TabsContent value="mobile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Generator
                </CardTitle>
                <CardDescription>
                  Generate QR codes for quick asset identification and management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => {
                  // Mock asset for demo
                  const mockAsset = {
                    id: 'demo-asset-001',
                    name: 'Dell OptiPlex 7090',
                    model: 'OptiPlex 7090',
                    serial_number: 'ABC123456789',
                    asset_tag: 'IT-001',
                    location: 'Office Floor 3'
                  };
                  generateQRCode(mockAsset);
                }}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Demo QR Code
                </Button>
                
                {qrCodeData && (
                  <div className="space-y-2">
                    <img src={qrCodeData} alt="Asset QR Code" className="mx-auto" />
                    <p className="text-sm text-center text-muted-foreground">
                      QR Code for {selectedAssetForQR?.name}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-3 w-3 mr-1" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Mobile Scanner
                </CardTitle>
                <CardDescription>
                  Scan QR codes to quickly access asset information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowQRScanner(true)} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Open QR Scanner
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan asset QR codes for instant access to maintenance history, specifications, and management tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Automation
              </CardTitle>
              <CardDescription>
                Automated compliance reporting and evidence collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                  <h4 className="font-medium">SOC 2 Aligned</h4>
                  <p className="text-sm text-muted-foreground">Controls in place</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <h4 className="font-medium">HIPAA Review</h4>
                  <p className="text-sm text-muted-foreground">3 items pending</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <h4 className="font-medium">ISO 27001</h4>
                  <p className="text-sm text-muted-foreground">Action required</p>
                </div>
              </div>
              <Button className="mt-4">
                <Download className="h-4 w-4 mr-2" />
                Generate Compliance Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Workflow Automation
              </CardTitle>
              <CardDescription>
                Automated workflows for onboarding, lifecycle management, and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Employee Onboarding</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically assign assets, create accounts, and update directories when new employees start.
                  </p>
                  <Button size="sm" variant="outline">Configure Workflow</Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Asset Lifecycle Management</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Auto-retire assets, transfer licenses, and update security policies based on asset age and condition.
                  </p>
                  <Button size="sm" variant="outline">Configure Workflow</Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Integration Hub</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect with RMM tools, ticketing systems, and procurement platforms.
                  </p>
                  <Button size="sm" variant="outline">View Integrations</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafeTrackAdvanced;