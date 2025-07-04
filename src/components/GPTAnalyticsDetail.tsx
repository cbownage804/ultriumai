import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { 
  Activity, Clock, Users, MessageSquare, TrendingUp, 
  Star, Download, FileText, Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface GPTAnalyticsDetailProps {
  gptId: string;
  gptName?: string;
}

interface DetailedAnalytics {
  totalMessages: number;
  totalSessions: number;
  averageResponseTime: number;
  averageSatisfaction: number;
  totalTokens: number;
  interactionBreakdown: Array<{ type: string; count: number; color: string }>;
  dailyMetrics: Array<{ 
    date: string; 
    messages: number; 
    sessions: number; 
    avgResponseTime: number;
    satisfaction: number;
  }>;
  topPerformanceMetrics: {
    fastestResponse: number;
    longestSession: number;
    peakUsageDay: string;
    satisfactionTrend: number;
  };
}

const GPTAnalyticsDetail = ({ gptId, gptName = "Custom GPT" }: GPTAnalyticsDetailProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetailedAnalytics();
  }, [timeRange, gptId, user]);

  const loadDetailedAnalytics = async () => {
    if (!user || !gptId) return;

    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case "24h":
          startDate.setHours(startDate.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Fetch detailed analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('gpt_id', gptId)
        .gte('created_at', startDate.toISOString());

      if (analyticsError) throw analyticsError;

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('gpt_id', gptId)
        .gte('session_start', startDate.toISOString());

      if (sessionsError) throw sessionsError;

      // Fetch daily aggregated data
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('gpt_id', gptId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (dailyError) throw dailyError;

      // Process interaction breakdown
      const interactionTypes = ['message', 'file_upload', 'export', 'share', 'rating'];
      const interactionBreakdown = interactionTypes.map((type, index) => ({
        type: type.replace('_', ' ').toUpperCase(),
        count: analyticsData?.filter(a => a.interaction_type === type).length || 0,
        color: `hsl(${index * 72}, 70%, 50%)`
      }));

      // Process daily metrics
      const days = timeRange === "24h" ? 1 : parseInt(timeRange.replace(/\D/g, ''));
      const dailyMetrics = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = dailyData?.find(d => d.date === dateStr);
        const dayAnalytics = analyticsData?.filter(a => 
          a.created_at.startsWith(dateStr)
        ) || [];
        
        const dayMessages = dayAnalytics.filter(a => a.interaction_type === 'message');
        const daySessions = sessions?.filter(s => 
          s.session_start.startsWith(dateStr)
        ) || [];

        dailyMetrics.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          messages: dayData?.total_messages || dayMessages.length,
          sessions: daySessions.length,
          avgResponseTime: dayMessages.length > 0 
            ? dayMessages.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / dayMessages.length / 1000
            : 0,
          satisfaction: dayData?.average_satisfaction || 0
        });
      }

      // Calculate performance metrics
      const responseTimesMs = analyticsData?.map(a => a.response_time_ms).filter(Boolean) || [];
      const fastestResponse = responseTimesMs.length > 0 ? Math.min(...responseTimesMs) / 1000 : 0;
      
      const sessionDurations = sessions?.map(s => {
        const start = new Date(s.session_start);
        const end = s.session_end ? new Date(s.session_end) : new Date();
        return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
      }) || [];
      const longestSession = sessionDurations.length > 0 ? Math.max(...sessionDurations) : 0;

      const peakDay = dailyMetrics.reduce((max, day) => 
        day.messages > max.messages ? day : max, 
        dailyMetrics[0] || { date: 'N/A', messages: 0 }
      );

      const satisfactionRatings = analyticsData?.map(a => a.satisfaction_rating).filter(Boolean) || [];
      const avgSatisfaction = satisfactionRatings.length > 0
        ? satisfactionRatings.reduce((sum, r) => sum + r, 0) / satisfactionRatings.length
        : 0;

      setAnalytics({
        totalMessages: analyticsData?.filter(a => a.interaction_type === 'message').length || 0,
        totalSessions: sessions?.length || 0,
        averageResponseTime: responseTimesMs.length > 0 
          ? responseTimesMs.reduce((sum, t) => sum + t, 0) / responseTimesMs.length / 1000
          : 0,
        averageSatisfaction: avgSatisfaction,
        totalTokens: analyticsData?.reduce((sum, a) => sum + (a.tokens_used || 0), 0) || 0,
        interactionBreakdown,
        dailyMetrics,
        topPerformanceMetrics: {
          fastestResponse,
          longestSession,
          peakUsageDay: peakDay.date,
          satisfactionTrend: avgSatisfaction >= 4 ? 1 : avgSatisfaction >= 3 ? 0 : -1
        }
      });

    } catch (error) {
      console.error('Error loading detailed analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportDetailedReport = async () => {
    if (!analytics) return;

    const reportData = {
      gpt_name: gptName,
      gpt_id: gptId,
      period: timeRange,
      generated_at: new Date().toISOString(),
      summary: {
        total_messages: analytics.totalMessages,
        total_sessions: analytics.totalSessions,
        average_response_time: analytics.averageResponseTime,
        average_satisfaction: analytics.averageSatisfaction,
        total_tokens: analytics.totalTokens
      },
      performance_metrics: analytics.topPerformanceMetrics,
      daily_breakdown: analytics.dailyMetrics,
      interaction_breakdown: analytics.interactionBreakdown
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${gptName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-analytics-${timeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Detailed analytics report downloaded successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading detailed analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{gptName} Analytics</h2>
          <p className="text-muted-foreground">Detailed performance metrics and usage statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportDetailedReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Interactions processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">User sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Response speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageSatisfaction.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">User rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Messages and sessions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Messages"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interaction Types</CardTitle>
            <CardDescription>Breakdown of user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.interactionBreakdown.filter(i => i.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ type, percent }) => percent > 5 ? `${type} (${(percent * 100).toFixed(0)}%)` : ''}
                >
                  {analytics.interactionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key performance indicators and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Fastest Response</span>
              </div>
              <div className="text-2xl font-bold">{analytics.topPerformanceMetrics.fastestResponse.toFixed(1)}s</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Longest Session</span>
              </div>
              <div className="text-2xl font-bold">{analytics.topPerformanceMetrics.longestSession.toFixed(0)}min</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Peak Usage Day</span>
              </div>
              <div className="text-lg font-bold">{analytics.topPerformanceMetrics.peakUsageDay}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Satisfaction Trend</span>
              </div>
              <div className="flex items-center gap-2">
                {analytics.topPerformanceMetrics.satisfactionTrend > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Positive
                  </Badge>
                )}
                {analytics.topPerformanceMetrics.satisfactionTrend === 0 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Stable
                  </Badge>
                )}
                {analytics.topPerformanceMetrics.satisfactionTrend < 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Declining
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTAnalyticsDetail;