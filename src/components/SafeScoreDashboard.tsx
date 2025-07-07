import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useComplianceManager } from "@/hooks/useComplianceManager";
import { Shield, AlertTriangle, CheckCircle, Clock, Settings, FileText, Activity, Palette } from "lucide-react";
import { ComplianceConnectorManager } from "./ComplianceConnectorManager";
import { ComplianceEvidenceViewer } from "./ComplianceEvidenceViewer";
import { ComplianceAlertsPanel } from "./ComplianceAlertsPanel";
import { RealTimeComplianceMonitor } from "./RealTimeComplianceMonitor";
import AdvancedReportGenerator from "./AdvancedReportGenerator";
import { WhiteLabelCustomizer } from "./WhiteLabelCustomizer";

export const SafeCompDashboard = () => {
  const { loading, dashboardData, fetchDashboardData } = useComplianceManager();
  const [selectedFramework, setSelectedFramework] = useState<string>('soc2');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    overallCompliance: 0,
    totalControls: 0,
    compliantControls: 0,
    criticalIssues: 0,
    frameworkStatus: {}
  };

  const frameworks = ['soc2', 'hipaa', 'pci_dss', 'gdpr', 'iso27001'];
  const frameworkNames = {
    soc2: 'SOC 2',
    hipaa: 'HIPAA',
    pci_dss: 'PCI DSS',
    gdpr: 'GDPR',
    iso27001: 'ISO 27001'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SafeComp Dashboard</h1>
          <p className="text-muted-foreground">Continuous compliance monitoring and management</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={loading}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Metrics */}
      {/* Real-time Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallCompliance}%</div>
            <Progress value={metrics.overallCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalControls}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.compliantControls} compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connectors</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.connectors?.filter(c => c.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              / {dashboardData?.connectors?.length || 0} total
            </p>
          </CardContent>
        </Card>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <RealTimeComplianceMonitor />
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.criticalIssues > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Compliance Issues Detected</AlertTitle>
          <AlertDescription>
            You have {metrics.criticalIssues} critical compliance issues that require immediate attention.
            Review the alerts tab for detailed information.
          </AlertDescription>
        </Alert>
      )}

      {/* Framework Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Framework Status</CardTitle>
          <CardDescription>Current compliance status across all frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {frameworks.map(framework => {
              const status = metrics.frameworkStatus[framework] || {
                totalControls: 0,
                compliantControls: 0,
                compliancePercentage: 0,
                evidenceCount: 0
              };
              
              return (
                <div
                  key={framework}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedFramework === framework ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => setSelectedFramework(framework)}
                >
                  <div className="text-sm font-medium mb-2">
                    {frameworkNames[framework as keyof typeof frameworkNames]}
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {status.compliancePercentage}%
                  </div>
                  <Progress value={status.compliancePercentage} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    {status.compliantControls}/{status.totalControls} controls
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {status.evidenceCount} evidence items
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="connectors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connectors" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Connectors
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts
            {metrics.criticalIssues > 0 && (
              <Badge variant="destructive" className="ml-1">
                {metrics.criticalIssues}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Evidence
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            White Label
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connectors">
          <ComplianceConnectorManager 
            connectors={dashboardData?.connectors || []}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <ComplianceAlertsPanel 
            alerts={dashboardData?.alerts || []}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="evidence">
          <ComplianceEvidenceViewer 
            evidence={dashboardData?.evidence || []}
            framework={selectedFramework}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="reports">
          <AdvancedReportGenerator />
        </TabsContent>
        
        <TabsContent value="whitelabel">
          <WhiteLabelCustomizer />
        </TabsContent>
      </Tabs>
    </div>
  );
};