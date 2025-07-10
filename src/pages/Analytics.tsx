import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Settings,
  Filter,
  RefreshCw
} from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SecurityMetrics } from "@/components/analytics/SecurityMetrics";
import { ComplianceAnalytics } from "@/components/analytics/ComplianceAnalytics";
import { PerformanceAnalytics } from "@/components/analytics/PerformanceAnalytics";
import { Header } from "@/components/layout/Header";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7_days');
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Replace with real analytics data from Supabase
  const keyMetrics = [];

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your security operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1_day">Last 24 Hours</SelectItem>
              <SelectItem value="7_days">Last 7 Days</SelectItem>
              <SelectItem value="30_days">Last 30 Days</SelectItem>
              <SelectItem value="90_days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {keyMetrics.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                <p className="text-muted-foreground">
                  Analytics data will appear here once you start using the platform.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          keyMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            const isPositive = metric.trend === 'up';
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <Card key={index} className="hover-scale">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`h-5 w-5 ${metric.color}`} />
                    <TrendIcon className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.title}</p>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change}
                      </span>
                      <span className="text-xs text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnalyticsDashboard timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityMetrics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceAnalytics timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAnalytics timeRange={timeRange} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Analytics;