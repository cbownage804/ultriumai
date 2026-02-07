import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot, Code2, Zap, BarChart3, ArrowRight, Plus,
  Clock, TrendingUp, Activity, Sparkles, Rocket
} from "lucide-react";

interface DashboardStats {
  totalGpts: number;
  totalApps: number;
  totalAgents: number;
  creditsRemaining: number;
  creditsUsed: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: "gpt" | "app" | "agent" | "credit";
  label: string;
  detail: string;
  timestamp: string;
}

export const AIStudioDashboardHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalGpts: 0, totalApps: 0, totalAgents: 0,
    creditsRemaining: 0, creditsUsed: 0, recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = async () => {
      try {
        const [gptsRes, agentsRes, creditsRes, ledgerRes] = await Promise.all([
          supabase.from("custom_gpts").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
          supabase.from("ai_agents").select("id, name, updated_at", { count: "exact" }).eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
          supabase.from("org_credits").select("credits_remaining, credits_used_this_period").eq("user_id", user.id).single(),
          supabase.from("ai_credit_ledger").select("id, usage_type, credits_used, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
        ]);

        const activity: ActivityItem[] = [];
        gptsRes.data?.forEach(g => activity.push({ id: g.id, type: "gpt", label: g.name, detail: "GPT updated", timestamp: g.updated_at }));
        agentsRes.data?.forEach(a => activity.push({ id: a.id, type: "agent", label: a.name, detail: "Agent updated", timestamp: a.updated_at }));
        ledgerRes.data?.forEach(l => activity.push({ id: l.id, type: "credit", label: l.description || l.usage_type, detail: `${l.credits_used} credits`, timestamp: l.created_at }));
        activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setStats({
          totalGpts: gptsRes.count || 0,
          totalApps: 0, // App builder projects are localStorage-based
          totalAgents: agentsRes.count || 0,
          creditsRemaining: creditsRes.data?.credits_remaining || 0,
          creditsUsed: creditsRes.data?.credits_used_this_period || 0,
          recentActivity: activity.slice(0, 8),
        });
      } catch (err) {
        console.error("Failed to fetch AI Studio stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  const quickActions = [
    { label: "New GPT", icon: Bot, color: "text-violet-400", bg: "bg-violet-500/10", route: "/dashboard/gpt/build" },
    { label: "App Builder", icon: Code2, color: "text-cyan-400", bg: "bg-cyan-500/10", route: "/ai-studio/app-builder" },
    { label: "New Agent", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", route: "/ai-studio/agents/builder" },
    { label: "Analytics", icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10", route: "/dashboard/analytics" },
  ];

  const statCards = [
    { label: "Custom GPTs", value: stats.totalGpts, icon: Bot, color: "text-violet-400" },
    { label: "AI Agents", value: stats.totalAgents, icon: Zap, color: "text-amber-400" },
    { label: "Credits Used", value: stats.creditsUsed.toLocaleString(), icon: TrendingUp, color: "text-cyan-400" },
    { label: "Credits Left", value: stats.creditsRemaining.toLocaleString(), icon: Activity, color: "text-emerald-400" },
  ];

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "gpt": return <Bot className="h-3.5 w-3.5 text-violet-400" />;
      case "agent": return <Zap className="h-3.5 w-3.5 text-amber-400" />;
      case "credit": return <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />;
      default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-32 bg-muted/50 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome + Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-400" />
            AI Studio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Build, deploy, and manage your AI tools</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(a => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              className="gap-2 border-border/50 hover:border-primary/40"
              onClick={() => navigate(a.route)}
            >
              <a.icon className={`h-4 w-4 ${a.color}`} />
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Rocket className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No activity yet. Create your first GPT or agent!</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/dashboard/gpt/build")}>
                  <Plus className="h-4 w-4 mr-1" /> Get Started
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentActivity.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {typeIcon(item.type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border-violet-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Build a GPT", desc: "Create an AI assistant", icon: Bot, route: "/dashboard/gpt/build" },
              { label: "Build an App", desc: "Full-stack AI IDE", icon: Code2, route: "/ai-studio/app-builder" },
              { label: "Create Agent", desc: "Automate workflows", icon: Zap, route: "/ai-studio/agents/builder" },
              { label: "View Docs", desc: "Guides & tutorials", icon: ArrowRight, route: "/docs/ai-studio" },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all text-left group"
              >
                <item.icon className="h-5 w-5 text-violet-400 group-hover:text-primary transition-colors" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
