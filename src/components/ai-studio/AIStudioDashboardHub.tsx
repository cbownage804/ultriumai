import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Bot, Code2, Zap, ArrowRight, Sparkles, Clock,
  Activity, ChevronRight, Layers, CheckCircle
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RecentProject {
  id: string;
  name: string;
  updated_at: string;
}

interface ToolCount {
  gpts: number;
  agents: number;
  credits: number;
}

export const AIStudioDashboardHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [tools, setTools] = useState<ToolCount>({ gpts: 0, agents: 0, credits: 0 });
  const [loading, setLoading] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<{ id: string; label: string; detail: string; timestamp: string; icon: "gpt" | "agent" | "credit" }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const [projectsRes, gptsRes, agentsRes, creditsRes, ledgerRes] = await Promise.all([
          supabase.from("builder_projects").select("id, name, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(6),
          supabase.from("custom_gpts").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("ai_agents").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("org_credits").select("credits_remaining").eq("user_id", user.id).maybeSingle(),
          supabase.from("ai_credit_ledger").select("id, usage_type, credits_used, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        ]);

        setRecentProjects(projectsRes.data || []);
        setTools({
          gpts: gptsRes.count || 0,
          agents: agentsRes.count || 0,
          credits: creditsRes.data?.credits_remaining || 0,
        });
        setActivity(
          (ledgerRes.data || []).map(l => ({
            id: l.id,
            label: l.description || l.usage_type,
            detail: `${l.credits_used} credits`,
            timestamp: l.created_at,
            icon: "credit" as const,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch AI Studio stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.id]);

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-muted/30 rounded-2xl" />
        <div className="h-28 bg-muted/20 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const latestProject = recentProjects[0];

  return (
    <div className="space-y-8">
      {/* Plan Badge */}
      <div className="flex items-center justify-end gap-2">
        <Badge variant="outline" className="text-xs px-3 py-1 capitalize border-primary/30">
          {subscription.subscription_tier || "Free"} Plan
        </Badge>
        {subscription.subscribed && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs px-2 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )}
      </div>

      {/* ── 1. Hero App Builder CTA ── */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-600/20 via-violet-500/10 to-cyan-500/10 shadow-xl shadow-violet-500/5">
        <CardContent className="p-5 sm:p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6">
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI App Builder
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Build your next app
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
              Describe what you want and let AI generate a production-ready application — complete with code, preview, and one-click deployment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="premium"
                size="xl"
                className="min-h-[44px] w-full sm:w-auto"
                onClick={() => navigate("/ai-studio/app-builder")}
              >
                Start Building
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              {latestProject && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border/50 min-h-[44px] w-full sm:w-auto truncate max-w-full"
                  onClick={() => navigate(`/ai-studio/app-builder?project=${latestProject.id}`)}
                >
                  <span className="truncate">Continue "{latestProject.name}"</span>
                  <ChevronRight className="ml-1 h-4 w-4 flex-shrink-0" />
                </Button>
              )}
            </div>
          </div>

          {/* Decorative element */}
          <div className="hidden md:flex items-center justify-center w-36 h-36 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/5 flex-shrink-0">
            <Code2 className="h-16 w-16 text-violet-400/60" />
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Recent Projects ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Projects</h2>
          {recentProjects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/ai-studio/projects")} className="text-muted-foreground">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No projects yet"
            description="Create your first app with the AI App Builder above."
            size="sm"
            className="border border-dashed border-border/50 rounded-xl"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentProjects.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/ai-studio/app-builder?project=${p.id}`)}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all group min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatTimeAgo(p.updated_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Secondary Tools ── */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Custom GPTs", count: tools.gpts, icon: Bot, route: "/dashboard/gpt/build", color: "text-violet-400", bg: "from-violet-500/10 to-violet-500/5" },
            { label: "AI Agents", count: tools.agents, icon: Zap, route: "/ai-studio/agents/new", color: "text-amber-400", bg: "from-amber-500/10 to-amber-500/5" },
            { label: "Credits", count: tools.credits, icon: Activity, route: "/dashboard/analytics", color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5" },
          ].map(t => (
            <button
              key={t.label}
              onClick={() => navigate(t.route)}
              className={`p-4 rounded-xl border border-border/50 bg-gradient-to-br ${t.bg} hover:border-primary/30 transition-all text-left group min-h-[44px] flex sm:block items-center gap-3`}
            >
              <t.icon className={`h-5 w-5 ${t.color} mb-2`} />
              <div className="text-xl font-bold text-foreground">{typeof t.count === "number" ? t.count.toLocaleString() : t.count}</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Condensed Activity ── */}
      {activity.length > 0 && (
        <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <Activity className="h-4 w-4" />
            Recent Activity
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${activityOpen ? "rotate-90" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-1">
            {activity.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 text-sm">
                <span className="text-foreground truncate">{a.label}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-3">{formatTimeAgo(a.timestamp)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
