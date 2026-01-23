import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Monitor, 
  Ticket, 
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";

export const ProductAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { summary, isLoading, refreshMetrics } = useProductAnalytics(timeRange);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Analytics</h2>
          <p className="text-muted-foreground">
            Unified metrics across SafeOps and SafeDesk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refreshMetrics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-500" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.safeOps.totalDevices}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(summary.trends.deviceGrowth)}
              <span className={summary.trends.deviceGrowth > 0 ? 'text-green-500' : ''}>
                {summary.trends.deviceGrowth > 0 ? '+' : ''}{summary.trends.deviceGrowth.toFixed(1)}% growth
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="h-4 w-4 text-purple-500" />
              Tickets Handled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.safeDesk.totalTickets}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(-summary.trends.ticketVolumeTrend)}
              <span>{Math.abs(summary.trends.ticketVolumeTrend).toFixed(1)}% vs prev period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Online Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(summary.safeOps.onlineRate)}`}>
              {summary.safeOps.onlineRate}%
            </div>
            <Progress value={summary.safeOps.onlineRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              AI Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.safeDesk.aiResolutionRate}%</div>
            <p className="text-sm text-muted-foreground">Tickets resolved by AI</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="safeops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="safeops">SafeOps Metrics</TabsTrigger>
          <TabsTrigger value="safedesk">SafeDesk Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="safeops">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Patch Compliance
                </CardTitle>
                <CardDescription>System patch coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(summary.safeOps.patchCompliance)}`}>
                  {summary.safeOps.patchCompliance}%
                </div>
                <Progress value={summary.safeOps.patchCompliance} className="h-3 mt-4" />
                <p className="text-sm text-muted-foreground mt-2">
                  {summary.safeOps.patchCompliance >= 90 
                    ? "Excellent compliance" 
                    : "Some patches pending"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alerts Resolved
                </CardTitle>
                <CardDescription>Alert resolution rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(summary.safeOps.alertsResolved)}`}>
                  {summary.safeOps.alertsResolved}%
                </div>
                <Progress value={summary.safeOps.alertsResolved} className="h-3 mt-4" />
                <p className="text-sm text-muted-foreground mt-2">
                  {summary.trends.alertReductionRate}% improvement trend
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Device Health
                </CardTitle>
                <CardDescription>Overall system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online</span>
                    <Badge variant="default">{summary.safeOps.onlineRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Patched</span>
                    <Badge variant="outline">{summary.safeOps.patchCompliance}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Alert-free</span>
                    <Badge variant="secondary">{summary.safeOps.alertsResolved}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="safedesk">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Avg Resolution Time
                </CardTitle>
                <CardDescription>Time to resolve tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {summary.safeDesk.avgResolutionTime}
                  <span className="text-lg text-muted-foreground ml-1">min</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {summary.safeDesk.avgResolutionTime < 60 
                    ? "Under 1 hour average" 
                    : `~${Math.round(summary.safeDesk.avgResolutionTime / 60)} hours`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  SLA Compliance
                </CardTitle>
                <CardDescription>Meeting service levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${getScoreColor(summary.safeDesk.slaCompliance)}`}>
                  {summary.safeDesk.slaCompliance}%
                </div>
                <Progress value={summary.safeDesk.slaCompliance} className="h-3 mt-4" />
                <p className="text-sm text-muted-foreground mt-2">
                  {summary.safeDesk.slaCompliance >= 95 
                    ? "Exceeding targets" 
                    : "Room for improvement"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Automation
                </CardTitle>
                <CardDescription>AI-assisted resolutions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-500">
                  {summary.safeDesk.aiResolutionRate}%
                </div>
                <Progress value={summary.safeDesk.aiResolutionRate} className="h-3 mt-4" />
                <p className="text-sm text-muted-foreground mt-2">
                  Tickets analyzed or resolved by SafeDesk AI
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
