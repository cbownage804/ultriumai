import { useState, useEffect } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, BarChart3, MessageSquare, Clock, Zap, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface GPTBuilderAnalyticsPanelProps {
  config: GPTConfig;
  gptId?: string;
  onClose: () => void;
}

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  avgMessagesPerConversation: number;
  topQuestions: string[];
  dailyUsage: { date: string; count: number }[];
  isLoading: boolean;
}

export function GPTBuilderAnalyticsPanel({ config, gptId, onClose }: GPTBuilderAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    totalMessages: 0,
    avgResponseTime: 0,
    avgMessagesPerConversation: 0,
    topQuestions: [],
    dailyUsage: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!gptId) {
      setAnalytics(prev => ({ ...prev, isLoading: false }));
      return;
    }
    loadAnalytics();
  }, [gptId]);

  const loadAnalytics = async () => {
    if (!gptId) return;
    try {
      // Load conversations count
      const { data: convs, error: convError } = await supabase
        .from('gpt_conversations')
        .select('id, created_at')
        .eq('gpt_id', gptId);

      if (convError) throw convError;

      const conversationIds = convs?.map(c => c.id) || [];
      let totalMessages = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      const userMessages: string[] = [];

      if (conversationIds.length > 0) {
        const { data: msgs, error: msgError } = await supabase
          .from('gpt_messages')
          .select('role, content, response_time_ms, created_at')
          .in('conversation_id', conversationIds);

        if (!msgError && msgs) {
          totalMessages = msgs.length;
          msgs.forEach(m => {
            if (m.role === 'assistant' && m.response_time_ms) {
              totalResponseTime += m.response_time_ms;
              responseCount++;
            }
            if (m.role === 'user') {
              userMessages.push(m.content);
            }
          });
        }
      }

      // Build daily usage from conversations
      const dailyMap = new Map<string, number>();
      convs?.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });
      const dailyUsage = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .slice(-7);

      // Get top questions (most common starting words)
      const topQuestions = userMessages.slice(0, 5);

      setAnalytics({
        totalConversations: convs?.length || 0,
        totalMessages,
        avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0,
        avgMessagesPerConversation: conversationIds.length > 0 ? Math.round(totalMessages / conversationIds.length) : 0,
        topQuestions,
        dailyUsage,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics(prev => ({ ...prev, isLoading: false }));
    }
  };

  const stats = [
    { label: 'Total Conversations', value: analytics.totalConversations, icon: Users, color: 'text-blue-400' },
    { label: 'Total Messages', value: analytics.totalMessages, icon: MessageSquare, color: 'text-emerald-400' },
    { label: 'Avg Response Time', value: analytics.avgResponseTime ? `${analytics.avgResponseTime}ms` : 'N/A', icon: Clock, color: 'text-amber-400' },
    { label: 'Msgs/Conversation', value: analytics.avgMessagesPerConversation, icon: TrendingUp, color: 'text-purple-400' },
  ];

  const maxDailyCount = Math.max(...analytics.dailyUsage.map(d => d.count), 1);

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/50 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Analytics
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {!gptId && (
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-[11px] text-amber-400/70">
                Save your GPT first to see analytics. Data will appear once users start chatting.
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <stat.icon className={cn('h-4 w-4 mb-1.5', stat.color)} />
                <p className="text-lg font-semibold text-white/80">{stat.value}</p>
                <p className="text-[10px] text-white/30">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Daily Usage Chart */}
          {analytics.dailyUsage.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Daily Usage (Last 7 Days)</h4>
              <div className="flex items-end gap-1 h-24 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {analytics.dailyUsage.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.count / maxDailyCount) * 60}px` }}
                      transition={{ delay: i * 0.05, type: 'spring', damping: 15 }}
                      className="w-full rounded-sm bg-primary/40 min-h-[2px]"
                    />
                    <span className="text-[8px] text-white/20 truncate w-full text-center">{day.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Questions */}
          {analytics.topQuestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Recent User Questions</h4>
              <div className="space-y-1.5">
                {analytics.topQuestions.map((q, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <p className="text-[11px] text-white/50 truncate">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.totalConversations === 0 && gptId && !analytics.isLoading && (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-[11px] text-white/20">No conversations yet</p>
              <p className="text-[10px] text-white/15">Share your GPT to start collecting data</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
