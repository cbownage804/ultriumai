import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot, Code2, ArrowRight, Sparkles, Clock,
  Activity, ChevronRight, Layers,
  MessageSquare, Database, Globe, FileText,
  Layout, ShoppingCart, BarChart3, FileCode,
  Zap, Plus,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RecentProject {
  id: string;
  name: string;
  updated_at: string;
  thumbnail_url?: string | null;
}

interface RecentGPT {
  id: string;
  name: string;
  updated_at: string;
  avatar_url?: string | null;
}

const GPT_TEMPLATES = [
  { id: "support", icon: MessageSquare, label: "Customer Support Bot", desc: "AI trained on your KB to handle tier-1 tickets", color: "from-blue-500/20 to-blue-600/10" },
  { id: "knowledge", icon: Database, label: "Knowledge Base Q&A", desc: "Query internal docs in natural language", color: "from-emerald-500/20 to-emerald-600/10" },
  { id: "lead", icon: Globe, label: "Website Lead Bot", desc: "Qualify visitors and capture leads 24/7", color: "from-amber-500/20 to-amber-600/10" },
  { id: "docs", icon: FileText, label: "Doc Analyzer", desc: "Upload and analyze contracts and proposals", color: "from-violet-500/20 to-violet-600/10" },
];

const APP_TEMPLATES = [
  { id: "landing", icon: Layout, label: "Landing Page", desc: "Modern hero, features, pricing, and footer", color: "from-cyan-500/20 to-cyan-600/10" },
  { id: "dashboard", icon: BarChart3, label: "Analytics Dashboard", desc: "Charts, KPIs, data tables with filters", color: "from-violet-500/20 to-violet-600/10" },
  { id: "saas", icon: ShoppingCart, label: "SaaS Starter", desc: "Auth, billing, settings, and user management", color: "from-pink-500/20 to-pink-600/10" },
  { id: "portfolio", icon: FileCode, label: "Portfolio Site", desc: "Project showcase with contact form and blog", color: "from-orange-500/20 to-orange-600/10" },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 24, stiffness: 260 } },
} as const;

export const AIStudioDashboardHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentGPTs, setRecentGPTs] = useState<RecentGPT[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<{ id: string; label: string; detail: string; timestamp: string }[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalGPTs, setTotalGPTs] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const [projectsRes, gptsRes, creditsRes, ledgerRes, projectCountRes, gptCountRes] = await Promise.all([
          supabase.from("builder_projects").select("id, name, updated_at, thumbnail_url").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("custom_gpts").select("id, name, updated_at, avatar_url").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("org_credits").select("credits_remaining").eq("user_id", user.id).maybeSingle(),
          supabase.from("ai_credit_ledger").select("id, usage_type, credits_used, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("builder_projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("custom_gpts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        setRecentProjects(projectsRes.data || []);
        setRecentGPTs((gptsRes.data || []) as RecentGPT[]);
        setCredits(creditsRes.data?.credits_remaining || 0);
        setTotalProjects(projectCountRes.count || 0);
        setTotalGPTs(gptCountRes.count || 0);
        setActivity(
          (ledgerRes.data || []).map(l => ({
            id: l.id,
            label: l.description || l.usage_type,
            detail: `${l.credits_used} credits`,
            timestamp: l.created_at,
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
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/30 rounded-2xl" />
          <div className="h-64 bg-muted/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  const latestProject = recentProjects[0];
  const latestGPT = recentGPTs[0];
  const hasRecentWork = recentProjects.length > 0 || recentGPTs.length > 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Stats Bar */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1.5 capitalize border-primary/30 bg-primary/5">
            {subscription.subscription_tier || "Free"} Plan
          </Badge>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-medium text-foreground">{totalProjects}</span> Apps
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-foreground">{totalGPTs}</span> GPTs
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1.5 border-border/50">
          <Activity className="h-3 w-3 mr-1.5" />
          {credits.toLocaleString()} Credits
        </Badge>
      </motion.div>

      {/* ── Two Hero Cards ── */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">
        {/* App Builder Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-600/20 via-violet-500/10 to-cyan-500/10 shadow-xl shadow-violet-500/5 group hover:shadow-violet-500/15 transition-all duration-300 hover:-translate-y-0.5">
          <CardContent className="p-6 sm:p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 6, scale: 1.05 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 flex items-center justify-center border border-violet-500/20"
              >
                <Code2 className="h-6 w-6 text-violet-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">App Builder</h2>
                <p className="text-xs text-muted-foreground">AI-powered full-stack apps</p>
              </div>
              {totalProjects > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">
                  {totalProjects} project{totalProjects !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Describe what you want and let AI generate a production-ready application — complete with code, preview, and one-click deployment.
            </p>
            <div className="space-y-3">
              <Button
                variant="premium"
                size="lg"
                className="w-full min-h-[44px]"
                onClick={() => navigate("/ai-studio/app-builder?new=true")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New App
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              {latestProject && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/50 truncate"
                  onClick={() => navigate(`/ai-studio/app-builder?project=${latestProject.id}`)}
                >
                  <span className="truncate">Continue "{latestProject.name}"</span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GPT Builder Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 shadow-xl shadow-primary/5 group hover:shadow-primary/15 transition-all duration-300 hover:-translate-y-0.5">
          <CardContent className="p-6 sm:p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: -6, scale: 1.05 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-emerald-500/20 flex items-center justify-center border border-primary/20"
              >
                <Bot className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">GPT Builder</h2>
                <p className="text-xs text-muted-foreground">Custom AI assistants</p>
              </div>
              {totalGPTs > 0 && (
                <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
                  {totalGPTs} GPT{totalGPTs !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Build custom AI chatbots trained on your data — configure personality, knowledge sources, actions, and deploy with an embed code.
            </p>
            <div className="space-y-3">
              <Button
                variant="premium"
                size="lg"
                className="w-full min-h-[44px]"
                onClick={() => navigate("/ai-studio/gpt-builder")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New GPT
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              {latestGPT && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/50 truncate"
                  onClick={() => navigate(`/ai-studio/gpt-builder/${latestGPT.id}`)}
                >
                  <span className="truncate">Continue "{latestGPT.name}"</span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent Projects ── */}
      {hasRecentWork ? (
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Work</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/ai-studio/projects")} className="text-muted-foreground">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentProjects.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/ai-studio/app-builder?project=${p.id}`)}
                className="text-left rounded-xl border border-border/50 bg-card/60 hover:border-violet-500/30 hover:bg-card/80 transition-all group overflow-hidden"
              >
                <div className="w-full aspect-[16/10] bg-muted/20 relative overflow-hidden">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-muted/10">
                      <Code2 className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 text-[10px] bg-violet-500/80 border-0">App</Badge>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1"><Clock className="inline h-3 w-3 mr-1" />{formatTimeAgo(p.updated_at)}</p>
                </div>
              </motion.button>
            ))}
            {recentGPTs.map((g, i) => (
              <motion.button
                key={g.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (recentProjects.length + i) * 0.05 }}
                onClick={() => navigate(`/ai-studio/gpt-builder/${g.id}`)}
                className="text-left rounded-xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all group overflow-hidden"
              >
                <div className="w-full aspect-[16/10] bg-muted/20 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted/10">
                  {g.avatar_url ? (
                    <img src={g.avatar_url} alt={g.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <Bot className="h-6 w-6 text-muted-foreground/30" />
                  )}
                  <Badge className="absolute top-2 left-2 text-[10px] bg-primary/80 border-0">GPT</Badge>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground mt-1"><Clock className="inline h-3 w-3 mr-1" />{formatTimeAgo(g.updated_at)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      ) : (
        <motion.section variants={fadeUp}>
          <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-8 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Layers className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">No projects yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Create your first app or GPT to get started</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/ai-studio/app-builder?new=true")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New App
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/ai-studio/gpt-builder")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New GPT
              </Button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Templates ── */}
      <motion.section variants={fadeUp}>
        <h2 className="text-lg font-semibold text-foreground mb-1">Start from a Template</h2>
        <p className="text-sm text-muted-foreground mb-5">Pre-configured starting points — customize with AI or edit manually</p>

        {/* App Templates */}
        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
            <Code2 className="h-3 w-3 text-violet-400" /> App Templates
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {APP_TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                onClick={() => navigate(`/ai-studio/app-builder?new=true&template=${t.id}`)}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/60 hover:border-violet-500/30 hover:bg-card/80 transition-all group"
              >
                <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 border border-white/[0.04]", t.color)}>
                  <t.icon className="h-4 w-4 text-violet-400" />
                </div>
                <p className="font-medium text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* GPT Templates */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
            <Bot className="h-3 w-3 text-primary" /> GPT Templates
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {GPT_TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                onClick={() => navigate(`/ai-studio/gpt-builder?template=${t.id}`)}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all group"
              >
                <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 border border-white/[0.04]", t.color)}>
                  <t.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="font-medium text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Activity ── */}
      {activity.length > 0 && (
        <motion.div variants={fadeUp}>
          <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
              <Activity className="h-4 w-4" />
              Recent Activity
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", activityOpen && "rotate-90")} />
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
        </motion.div>
      )}
    </motion.div>
  );
};
