import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Bot, 
  CheckCircle, 
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { format, subDays } from "date-fns";

export function AIPerformanceAnalytics() {
  const { user } = useAuth();

  // Fetch AI ticket stats
  const { data: ticketStats } = useQuery({
    queryKey: ['ai-ticket-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: tickets, error } = await supabase
        .from('vanguard_service_tickets')
        .select('id, ai_processing_status, ai_confidence_score, auto_resolved, created_at, status')
        .eq('user_id', user.id);
      
      if (error) throw error;

      const total = tickets.length;
      const aiProcessed = tickets.filter(t => t.ai_processing_status === 'completed').length;
      const autoResolved = tickets.filter(t => t.auto_resolved).length;
      const highConfidence = tickets.filter(t => (t.ai_confidence_score || 0) >= 85).length;
      const avgConfidence = tickets.reduce((acc, t) => acc + (t.ai_confidence_score || 0), 0) / (aiProcessed || 1);

      return {
        total,
        aiProcessed,
        autoResolved,
        highConfidence,
        avgConfidence: Math.round(avgConfidence),
        autoResolveRate: total > 0 ? Math.round((autoResolved / total) * 100) : 0,
        aiProcessRate: total > 0 ? Math.round((aiProcessed / total) * 100) : 0
      };
    },
    enabled: !!user,
  });

  // Fetch AI feedback stats
  const { data: feedbackStats } = useQuery({
    queryKey: ['ai-feedback-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: feedback, error } = await supabase
        .from('vanguard_ai_feedback')
        .select('ai_solution_used, user_confirmed_resolved, created_at');
      
      if (error) throw error;

      const total = feedback.length;
      const positive = feedback.filter(f => f.ai_solution_used && f.user_confirmed_resolved).length;
      const negative = feedback.filter(f => !f.ai_solution_used || !f.user_confirmed_resolved).length;
      
      return {
        total,
        positive,
        negative,
        satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0
      };
    },
    enabled: !!user,
  });

  // Fetch daily trends
  const { data: dailyTrends } = useQuery({
    queryKey: ['ai-daily-trends', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: tickets, error } = await supabase
        .from('vanguard_service_tickets')
        .select('created_at, ai_processing_status, auto_resolved, ai_confidence_score')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;

      // Group by day
      const dailyMap = new Map<string, { total: number; aiResolved: number; avgConfidence: number; confidenceSum: number }>();
      
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), 29 - i), 'MMM dd');
        dailyMap.set(date, { total: 0, aiResolved: 0, avgConfidence: 0, confidenceSum: 0 });
      }

      tickets.forEach(ticket => {
        const date = format(new Date(ticket.created_at), 'MMM dd');
        const day = dailyMap.get(date);
        if (day) {
          day.total++;
          if (ticket.auto_resolved) day.aiResolved++;
          if (ticket.ai_confidence_score) {
            day.confidenceSum += ticket.ai_confidence_score;
          }
        }
      });

      return Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        total: stats.total,
        aiResolved: stats.aiResolved,
        avgConfidence: stats.total > 0 ? Math.round(stats.confidenceSum / stats.total) : 0
      }));
    },
    enabled: !!user,
  });

  // Category breakdown
  const { data: categoryStats } = useQuery({
    queryKey: ['ai-category-stats', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: tickets, error } = await supabase
        .from('vanguard_service_tickets')
        .select('category, ai_confidence_score, auto_resolved')
        .eq('user_id', user.id)
        .eq('ai_processing_status', 'completed');
      
      if (error) throw error;

      const categoryMap = new Map<string, { count: number; autoResolved: number; confidenceSum: number }>();
      
      tickets.forEach(ticket => {
        const cat = ticket.category || 'general';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { count: 0, autoResolved: 0, confidenceSum: 0 });
        }
        const stats = categoryMap.get(cat)!;
        stats.count++;
        if (ticket.auto_resolved) stats.autoResolved++;
        if (ticket.ai_confidence_score) stats.confidenceSum += ticket.ai_confidence_score;
      });

      return Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category: category.replace('_', ' '),
        count: stats.count,
        autoResolveRate: Math.round((stats.autoResolved / stats.count) * 100),
        avgConfidence: Math.round(stats.confidenceSum / stats.count)
      }));
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">AI Processing Rate</p>
                <p className="text-3xl font-bold text-cyan-400">{ticketStats?.aiProcessRate || 0}%</p>
              </div>
              <Bot className="h-10 w-10 text-cyan-400/20" />
            </div>
            <Progress value={ticketStats?.aiProcessRate || 0} className="mt-3 h-2 bg-white/10 [&>div]:bg-cyan-500" />
            <p className="text-xs text-white/60 mt-2">
              {ticketStats?.aiProcessed || 0} of {ticketStats?.total || 0} tickets processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Auto-Resolution Rate</p>
                <p className="text-3xl font-bold text-emerald-400">{ticketStats?.autoResolveRate || 0}%</p>
              </div>
              <Zap className="h-10 w-10 text-emerald-400/20" />
            </div>
            <Progress value={ticketStats?.autoResolveRate || 0} className="mt-3 h-2 bg-white/10 [&>div]:bg-emerald-500" />
            <p className="text-xs text-white/60 mt-2">
              {ticketStats?.autoResolved || 0} tickets auto-resolved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Confidence Score</p>
                <p className="text-3xl font-bold text-white">{ticketStats?.avgConfidence || 0}%</p>
              </div>
              <Target className="h-10 w-10 text-white/20" />
            </div>
            <Progress value={ticketStats?.avgConfidence || 0} className="mt-3 h-2 bg-white/10 [&>div]:bg-cyan-500" />
            <p className="text-xs text-white/60 mt-2">
              {ticketStats?.highConfidence || 0} high-confidence solutions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">User Satisfaction</p>
                <p className="text-3xl font-bold text-cyan-400">{feedbackStats?.satisfactionRate || 0}%</p>
              </div>
              <ThumbsUp className="h-10 w-10 text-cyan-400/20" />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-sm text-emerald-400">
                <ThumbsUp className="h-4 w-4" />
                {feedbackStats?.positive || 0}
              </div>
              <div className="flex items-center gap-1 text-sm text-red-400">
                <ThumbsDown className="h-4 w-4" />
                {feedbackStats?.negative || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Line */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              30-Day Trend
            </CardTitle>
            <CardDescription className="text-white/60">
              Ticket volume and AI resolution over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }} 
                    stroke="rgba(255,255,255,0.2)"
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }} 
                    stroke="rgba(255,255,255,0.2)"
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(34,211,238,0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="rgba(255,255,255,0.4)" 
                    strokeWidth={2}
                    name="Total Tickets"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aiResolved" 
                    stroke="#22d3ee" 
                    strokeWidth={2}
                    name="AI Resolved"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Performance by Category
            </CardTitle>
            <CardDescription className="text-white/60">
              AI effectiveness across ticket categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }} 
                    stroke="rgba(255,255,255,0.2)"
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }} 
                    stroke="rgba(255,255,255,0.2)"
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(34,211,238,0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar 
                    dataKey="avgConfidence" 
                    fill="#22d3ee" 
                    name="Avg Confidence %"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Strengths</span>
              </div>
              <ul className="space-y-1 text-sm text-white/60">
                {ticketStats?.avgConfidence && ticketStats.avgConfidence >= 70 && (
                  <li>• High confidence in AI solutions</li>
                )}
                {ticketStats?.autoResolveRate && ticketStats.autoResolveRate >= 20 && (
                  <li>• Good auto-resolution rate</li>
                )}
                {feedbackStats?.satisfactionRate && feedbackStats.satisfactionRate >= 80 && (
                  <li>• Excellent user satisfaction</li>
                )}
                {(!ticketStats?.avgConfidence || ticketStats.avgConfidence < 70) && 
                 (!ticketStats?.autoResolveRate || ticketStats.autoResolveRate < 20) && (
                  <li>• Building AI learning baseline</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <span className="font-medium text-amber-400">Opportunities</span>
              </div>
              <ul className="space-y-1 text-sm text-white/60">
                {categoryStats?.some(c => c.avgConfidence < 60) && (
                  <li>• Improve training for low-confidence categories</li>
                )}
                {ticketStats?.autoResolveRate && ticketStats.autoResolveRate < 30 && (
                  <li>• Increase auto-resolution thresholds</li>
                )}
                <li>• Add more KB articles for common issues</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                <span className="font-medium text-cyan-400">Recommendations</span>
              </div>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Generate KB articles from resolved tickets</li>
                <li>• Review negative feedback patterns</li>
                <li>• Enable autopilot for routine categories</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
