import { useState, useEffect } from 'react';
import { X, Zap, TrendingUp, CreditCard, ArrowUpRight, BarChart3, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserCredits } from '@/utils/creditUtils';
import { CREDIT_COSTS } from '@/types/credits';
import { supabase } from '@/integrations/supabase/client';

interface CreditHistoryEntry {
  id: string;
  action: string;
  credits: number;
  timestamp: Date;
}

interface BillingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingPanel({ isOpen, onClose }: BillingPanelProps) {
  const [credits, setCredits] = useState({ used: 0, limit: 0, remaining: 0, resetDate: null as string | null });
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today'>('all');

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const c = await getUserCredits(user.id);
        setCredits(c);
        const { data } = await supabase
          .from('ai_credit_ledger')
          .select('id, usage_type, credits_used, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (data) {
          setHistory(data.map(d => ({
            id: d.id,
            action: d.usage_type,
            credits: d.credits_used,
            timestamp: new Date(d.created_at),
          })));
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const usagePercent = credits.limit > 0 ? Math.min((credits.used / credits.limit) * 100, 100) : 0;
  const isLow = credits.remaining < 50;
  const isCritical = credits.remaining < 10;

  const todayUsage = history.filter(h => {
    const today = new Date();
    return h.timestamp.toDateString() === today.toDateString();
  });
  const todayTotal = todayUsage.reduce((acc, h) => acc + h.credits, 0);

  const filteredHistory = historyFilter === 'today' ? todayUsage : history;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0d0d18] border-l border-white/[0.08] shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-white/[0.06]">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Usage & Billing</h2>
              <p className="text-[10px] text-white/30">Credits & plan details</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-white/20 text-xs">Loading...</div>
        ) : (
          <div className="flex-1 overflow-auto p-5 space-y-5">
            {/* Credit gauge with ring visualization */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Credits remaining</span>
                <span className={cn("text-lg font-bold", isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-white")}>
                  {credits.remaining.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-gradient-to-r from-cyan-500 to-violet-500"
                  )}
                  style={{ width: `${100 - usagePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30">
                <span>{credits.used.toLocaleString()} used</span>
                <span>{credits.limit.toLocaleString()} total</span>
              </div>
              {credits.resetDate && (
                <div className="flex items-center gap-1 text-[10px] text-white/20">
                  <Calendar className="h-2.5 w-2.5" />
                  Resets {new Date(credits.resetDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Today's snapshot */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-[10px] text-white/30 mb-1">Today</div>
                <div className="text-sm font-semibold text-white">{todayTotal}</div>
                <div className="text-[9px] text-white/20">{todayUsage.length} actions</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-[10px] text-white/30 mb-1">Avg / day</div>
                <div className="text-sm font-semibold text-white">{credits.limit > 0 ? Math.round(credits.used / Math.max(1, Math.ceil((Date.now() - (credits.resetDate ? new Date(credits.resetDate).getTime() - 30*86400000 : Date.now() - 30*86400000)) / 86400000))) : 0}</div>
                <div className="text-[9px] text-white/20">credits</div>
              </div>
            </div>

            {/* Cost reference */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/20 uppercase tracking-wider font-medium">
                <BarChart3 className="h-3 w-3" />
                Credit costs
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Chat (Basic)', cost: CREDIT_COSTS.CHAT_MESSAGE_BASIC },
                  { label: 'Chat (Advanced)', cost: CREDIT_COSTS.CHAT_MESSAGE_ADVANCED },
                  { label: 'Image Gen', cost: CREDIT_COSTS.IMAGE_GENERATION },
                  { label: 'Web Search', cost: CREDIT_COSTS.WEB_SEARCH },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-white/50">{item.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage history */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-white/20 uppercase tracking-wider font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Recent usage
                </div>
                <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-md p-0.5">
                  <button onClick={() => setHistoryFilter('all')} className={cn("text-[9px] px-1.5 py-0.5 rounded transition-colors", historyFilter === 'all' ? "bg-white/10 text-white/60" : "text-white/25 hover:text-white/40")}>All</button>
                  <button onClick={() => setHistoryFilter('today')} className={cn("text-[9px] px-1.5 py-0.5 rounded transition-colors", historyFilter === 'today' ? "bg-white/10 text-white/60" : "text-white/25 hover:text-white/40")}>Today</button>
                </div>
              </div>
              {filteredHistory.length === 0 ? (
                <p className="text-[11px] text-white/20 text-center py-4">No usage yet</p>
              ) : (
                <div className="space-y-1">
                  {filteredHistory.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <div>
                        <span className="text-[11px] text-white/60">{entry.action.replace(/_/g, ' ')}</span>
                        <div className="text-[9px] text-white/20 flex items-center gap-1">
                          <Clock className="h-2 w-2" />
                          {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400/80">-{entry.credits}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
            <button
              onClick={() => window.open('/pricing/ai-studio', '_blank')}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all text-xs font-medium"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Upgrade Plan
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact credit pill for the top bar */
export function CreditsPill({ onClick }: { onClick: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const c = await getUserCredits(user.id);
        setRemaining(c.remaining);
      }
    };
    fetchCredits();
    // Poll every 10 seconds for near-real-time updates after credit usage
    const interval = setInterval(fetchCredits, 10000);

    // Also listen to realtime changes on user_credits table
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        channel = supabase
          .channel('credits-pill-sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_credits', filter: `user_id=eq.${user.id}` },
            () => { fetchCredits(); }
          )
          .subscribe();
      }
    })();

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (remaining === null) return null;
  const isLow = remaining < 50;
  const isCritical = remaining < 10;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-medium border transition-colors",
        isCritical
          ? "text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/15 animate-pulse"
          : isLow
          ? "text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15"
          : "text-amber-400/80 border-amber-500/15 bg-amber-500/10 hover:bg-amber-500/15"
      )}
    >
      <Zap className="h-2.5 w-2.5" />
      {remaining.toLocaleString()}
    </button>
  );
}
