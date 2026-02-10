import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, BarChart3, MessageSquare, Bot, Zap, Clock, TrendingUp,
  Cpu, FileText, Activity, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageStats {
  totalGPTs: number;
  totalConversations: number;
  totalMessages: number;
  totalProjects: number;
  creditBalance: number;
  creditsUsedToday: number;
  creditsUsedThisMonth: number;
  dailyUsage: { date: string; messages: number; credits: number }[];
  topGPTs: { name: string; conversations: number; messages: number }[];
  isLoading: boolean;
}

export default function AIStudioUsageAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats>({
    totalGPTs: 0, totalConversations: 0, totalMessages: 0, totalProjects: 0,
    creditBalance: 0, creditsUsedToday: 0, creditsUsedThisMonth: 0,
    dailyUsage: [], topGPTs: [], isLoading: true,
  });

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
      // Load GPT count
      const { count: gptCount } = await supabase
        .from('custom_gpts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Load conversations
      const { data: convs } = await supabase
        .from('gpt_conversations')
        .select('id, gpt_id, created_at')
        .eq('user_id', user.id);

      // Load messages count
      const convIds = convs?.map(c => c.id) || [];
      let totalMessages = 0;
      if (convIds.length > 0) {
        const { count } = await supabase
          .from('gpt_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds);
        totalMessages = count || 0;
      }

      // Load credit usage
      const { data: credits } = await supabase
        .from('ai_credit_ledger')
        .select('credits_used, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      
      const creditsUsedToday = credits?.filter(c => c.created_at.slice(0, 10) === today)
        .reduce((sum, c) => sum + c.credits_used, 0) || 0;
      const creditsUsedThisMonth = credits?.filter(c => c.created_at.slice(0, 10) >= monthStart)
        .reduce((sum, c) => sum + c.credits_used, 0) || 0;

      // Build daily usage (last 14 days)
      const dailyMap = new Map<string, { messages: number; credits: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(key, { messages: 0, credits: 0 });
      }
      convs?.forEach(c => {
        const key = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = dailyMap.get(key);
        if (entry) entry.messages++;
      });
      credits?.forEach(c => {
        const key = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = dailyMap.get(key);
        if (entry) entry.credits += c.credits_used;
      });

      // Top GPTs by conversations
      const gptConvCounts = new Map<string, number>();
      convs?.forEach(c => {
        gptConvCounts.set(c.gpt_id, (gptConvCounts.get(c.gpt_id) || 0) + 1);
      });
      const topGptIds = Array.from(gptConvCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let topGPTs: { name: string; conversations: number; messages: number }[] = [];
      if (topGptIds.length > 0) {
        const { data: gpts } = await supabase
          .from('custom_gpts')
          .select('id, name')
          .in('id', topGptIds.map(g => g[0]));
        topGPTs = topGptIds.map(([id, count]) => ({
          name: gpts?.find(g => g.id === id)?.name || 'Unknown',
          conversations: count,
          messages: 0,
        }));
      }

      setStats({
        totalGPTs: gptCount || 0,
        totalConversations: convs?.length || 0,
        totalMessages,
        totalProjects: 0, // App builder projects tracked separately
        creditBalance: 0,
        creditsUsedToday,
        creditsUsedThisMonth,
        dailyUsage: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
        topGPTs,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const kpiCards = [
    { label: 'Custom GPTs', value: stats.totalGPTs, icon: Bot, color: 'text-violet-400', bg: 'from-violet-500/10 to-violet-500/5' },
    { label: 'Conversations', value: stats.totalConversations, icon: MessageSquare, color: 'text-cyan-400', bg: 'from-cyan-500/10 to-cyan-500/5' },
    { label: 'Total Messages', value: stats.totalMessages, icon: Activity, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5' },
    { label: 'Credits Today', value: stats.creditsUsedToday.toFixed(1), icon: Zap, color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5' },
    { label: 'Credits This Month', value: stats.creditsUsedThisMonth.toFixed(1), icon: Calendar, color: 'text-pink-400', bg: 'from-pink-500/10 to-pink-500/5' },
  ];

  const maxDaily = Math.max(...stats.dailyUsage.map(d => d.messages + d.credits), 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ai-studio')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold">Usage Analytics</h1>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-56px)]">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpiCards.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border border-border/50 bg-gradient-to-br',
                  kpi.bg
                )}
              >
                <kpi.icon className={cn('h-5 w-5 mb-2', kpi.color)} />
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Activity Chart */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Activity (Last 14 Days)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {stats.dailyUsage.map((day, i) => {
                const total = day.messages + day.credits;
                const height = (total / maxDaily) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {total > 0 ? total : ''}
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 2)}%` }}
                      transition={{ delay: i * 0.03, type: 'spring', damping: 15 }}
                      className="w-full rounded-sm bg-primary/30 hover:bg-primary/50 transition-colors min-h-[2px]"
                    />
                    <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                      {day.date.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top GPTs */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Top GPTs by Usage
              </h3>
              {stats.topGPTs.length > 0 ? (
                <div className="space-y-2">
                  {stats.topGPTs.map((gpt, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{gpt.name}</p>
                        <p className="text-[10px] text-muted-foreground">{gpt.conversations} conversations</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No GPT usage data yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate('/ai-studio/app-builder')}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Open App Builder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate('/ai-studio/gpt-builder')}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Create New GPT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => navigate('/ai-studio/projects')}
                >
                  <Activity className="h-3.5 w-3.5" />
                  View Projects
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
