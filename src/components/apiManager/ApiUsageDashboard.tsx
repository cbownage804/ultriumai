import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Activity, TrendingUp, Clock, AlertTriangle } from "lucide-react";

export const ApiUsageDashboard = () => {
  const { apiKeys } = useApiKeys();

  const totalRequests = apiKeys.reduce((sum, key) => sum + key.usage_count, 0);
  const activeKeys = apiKeys.filter(key => key.is_active);
  const recentlyUsed = apiKeys.filter(key => {
    if (!key.last_used_at) return false;
    const lastUsed = new Date(key.last_used_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastUsed > oneDayAgo;
  });

  // Mock data for the chart - in real implementation, this would come from api_usage_logs
  const usageData = [
    { date: "2024-01-01", requests: 120 },
    { date: "2024-01-02", requests: 150 },
    { date: "2024-01-03", requests: 180 },
    { date: "2024-01-04", requests: 200 },
    { date: "2024-01-05", requests: 165 },
    { date: "2024-01-06", requests: 190 },
    { date: "2024-01-07", requests: 210 },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentlyUsed.length}</div>
            <p className="text-xs text-muted-foreground">Keys used in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Request Volume</CardTitle>
          <CardDescription>API requests over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {usageData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-primary rounded-t w-full transition-all duration-300 hover:bg-primary/80"
                  style={{ height: `${(data.requests / 250) * 100}%`, minHeight: '4px' }}
                  title={`${data.requests} requests`}
                />
                <span className="text-xs text-muted-foreground mt-2">
                  {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Top API Keys by Usage</CardTitle>
          <CardDescription>Most active API keys in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys
              .sort((a, b) => b.usage_count - a.usage_count)
              .slice(0, 5)
              .map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{apiKey.name}</p>
                      <p className="text-sm text-muted-foreground">{apiKey.key_prefix}••••••••</p>
                    </div>
                    <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                      {apiKey.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{apiKey.usage_count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">requests</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Activity</CardTitle>
          <CardDescription>Latest API requests and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent activity data */}
            {[
              { time: "2 minutes ago", endpoint: "/chat-completion", status: 200, key: "Production API" },
              { time: "5 minutes ago", endpoint: "/chat-completion", status: 200, key: "Development API" },
              { time: "8 minutes ago", endpoint: "/analytics", status: 200, key: "Analytics API" },
              { time: "12 minutes ago", endpoint: "/chat-completion", status: 429, key: "Production API" },
              { time: "15 minutes ago", endpoint: "/chat-completion", status: 200, key: "Mobile App API" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={activity.status === 200 ? "default" : activity.status === 429 ? "destructive" : "secondary"}
                    className="w-12 justify-center"
                  >
                    {activity.status}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{activity.endpoint}</p>
                    <p className="text-xs text-muted-foreground">{activity.key}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};