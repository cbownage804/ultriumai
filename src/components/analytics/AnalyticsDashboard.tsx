import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { FinancialAnalytics } from './FinancialAnalytics';
import { OperationalMetrics } from './OperationalMetrics';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { ROITracking } from './ROITracking';
import { CustomReports } from './CustomReports';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain,
  DollarSign,
  Settings,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsDashboardProps {
  timeRange?: string;
}

export const AnalyticsDashboard = ({ timeRange = '30d' }: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState('executive');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - would come from API
  const keyMetrics = {
    totalRevenue: 342800,
    monthlyGrowth: 12.5,
    clientRetention: 94.2,
    avgTicketResolution: 4.2,
    securityScore: 87,
    predictedChurn: 3.1
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API refresh
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Business intelligence and predictive insights for data-driven decisions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">${keyMetrics.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{keyMetrics.monthlyGrowth}%</div>
                <div className="text-sm text-muted-foreground">Monthly Growth</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{keyMetrics.clientRetention}%</div>
                <div className="text-sm text-muted-foreground">Client Retention</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{keyMetrics.avgTicketResolution}h</div>
                <div className="text-sm text-muted-foreground">Avg Resolution</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{keyMetrics.securityScore}</div>
                <div className="text-sm text-muted-foreground">Security Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold">{keyMetrics.predictedChurn}%</div>
                <div className="text-sm text-muted-foreground">Predicted Churn</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="roi">ROI Tracking</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <ExecutiveDashboard timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialAnalytics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="operational">
          <OperationalMetrics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalytics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="roi">
          <ROITracking timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReports timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};