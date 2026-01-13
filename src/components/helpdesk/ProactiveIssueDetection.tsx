import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Shield,
  Bell
} from "lucide-react";
import { toast } from "sonner";

interface Pattern {
  name: string;
  description: string;
  affected_category: string;
  ticket_count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommended_action: string;
}

interface Alert {
  title: string;
  message: string;
  severity: string;
}

export function ProactiveIssueDetection() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const { data: recentTickets } = useQuery({
    queryKey: ['recent-tickets-patterns', timeRange],
    queryFn: async () => {
      const hoursAgo = timeRange === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
      
      const { data } = await supabase
        .from('vanguard_service_tickets')
        .select('id, title, ai_detected_category, created_at')
        .gte('created_at', since);
      return data || [];
    }
  });

  const analyzePatterns = async () => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('helpdesk-ai-features', {
        body: { action: 'detect_patterns', timeRange }
      });

      if (response.error) throw response.error;

      setPatterns(response.data.patterns || []);
      setAlerts(response.data.alerts || []);
      toast.success('Pattern analysis complete');
    } catch (error) {
      console.error('Pattern detection error:', error);
      toast.error('Failed to analyze patterns');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-green-500/10 text-green-500 border-green-500/30';
    }
  };

  // Calculate category distribution
  const categoryDistribution = recentTickets?.reduce((acc, ticket) => {
    const cat = ticket.ai_detected_category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topCategories = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Proactive Issue Detection</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={analyzePatterns} disabled={isAnalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Analyze Patterns
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Tickets</p>
            <p className="text-3xl font-bold">{recentTickets?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">in last {timeRange}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Patterns Detected</p>
            <p className="text-3xl font-bold">{patterns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Alerts</p>
            <p className="text-3xl font-bold text-orange-500">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-3xl font-bold">{Object.keys(categoryDistribution).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Issue Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ticket data available</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(count / (recentTickets?.length || 1)) * 100}%` 
                          }} 
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              AI-Detected Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No alerts detected. Click "Analyze Patterns" to scan for issues.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detected Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.map((pattern, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-lg border flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{pattern.name}</h4>
                      <Badge className={getSeverityColor(pattern.severity)}>
                        {pattern.severity}
                      </Badge>
                      <Badge variant="outline">{pattern.affected_category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {pattern.description}
                    </p>
                    <p className="text-xs text-primary">
                      💡 {pattern.recommended_action}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{pattern.ticket_count}</p>
                    <p className="text-xs text-muted-foreground">tickets</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
