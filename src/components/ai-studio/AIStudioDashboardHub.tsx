import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot, Code2, ArrowRight, Sparkles, Clock,
  Activity, ChevronRight, Layers,
  MessageSquare, Database, Globe, FileText,
  Layout, ShoppingCart, BarChart3, FileCode,
  Zap, Plus, Search, Star, Command,
  MoreVertical, Settings, Trash2, Copy,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AIStudioUpgradeModal } from "./AIStudioUpgradeModal";

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
  logo_url?: string | null;
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
  const { dailyRemaining, monthlyRemaining, credits: userCredits, totalRemaining, getTimeUntilDailyReset } = useUserCredits();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentGPTs, setRecentGPTs] = useState<RecentGPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<{ id: string; label: string; detail: string; timestamp: string }[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalGPTs, setTotalGPTs] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ai-studio-pinned') || '[]')); } catch { return new Set(); }
  });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('ai-studio-pinned', JSON.stringify([...next]));
      return next;
    });
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const { error } = await supabase.from('builder_projects').delete().eq('id', id);
    if (error) { toast.error('Failed to delete project'); return; }
    setRecentProjects(prev => prev.filter(p => p.id !== id));
    setTotalProjects(prev => prev - 1);
    toast.success('Project deleted');
  };

  const deleteGPT = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this GPT? This cannot be undone.')) return;
    const { error } = await supabase.from('custom_gpts').delete().eq('id', id);
    if (error) { toast.error('Failed to delete GPT'); return; }
    setRecentGPTs(prev => prev.filter(g => g.id !== id));
    setTotalGPTs(prev => prev - 1);
    toast.success('GPT deleted');
  };

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const [projectsRes, gptsRes, ledgerRes, projectCountRes, gptCountRes, msgsRes] = await Promise.all([
          supabase.from("builder_projects").select("id, name, updated_at, thumbnail_url").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("custom_gpts").select("id, name, updated_at, avatar_url, logo_url").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(4),
          supabase.from("ai_credit_ledger").select("id, usage_type, credits_used, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
          supabase.from("builder_projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("custom_gpts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("messages").select("id, role, conversation_id, created_at").eq("role", "assistant").order("created_at", { ascending: false }).limit(20),
        ]);

        setRecentProjects(projectsRes.data || []);
        setRecentGPTs((gptsRes.data || []) as RecentGPT[]);
        setTotalProjects(projectCountRes.count || 0);
        setTotalGPTs(gptCountRes.count || 0);

        // Build activity from multiple sources
        const activityItems: { id: string; label: string; detail: string; timestamp: string }[] = [];

        // Credit ledger entries
        (ledgerRes.data || []).forEach(l => {
          activityItems.push({
            id: `credit-${l.id}`,
            label: l.description || l.usage_type,
            detail: `${l.credits_used} credits used`,
            timestamp: l.created_at,
          });
        });

        // GPT creations/updates
        (gptsRes.data || []).forEach(g => {
          activityItems.push({
            id: `gpt-${g.id}`,
            label: `GPT created: ${g.name}`,
            detail: 'Custom GPT',
            timestamp: g.updated_at,
          });
        });

        // App builder projects
        (projectsRes.data || []).forEach(p => {
          activityItems.push({
            id: `project-${p.id}`,
            label: `App project: ${p.name || 'Untitled'}`,
            detail: 'App Builder',
            timestamp: p.updated_at,
          });
        });

        // Recent AI messages (assistant responses = build attempts)
        (msgsRes.data || []).slice(0, 10).forEach(m => {
          activityItems.push({
            id: `msg-${m.id}`,
            label: 'AI response generated',
            detail: 'Chat message',
            timestamp: m.created_at,
          });
        });

        // Sort by timestamp descending and take top 15
        activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivity(activityItems.slice(0, 15));
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
      <div className="space-y-10 animate-pulse">
        {/* Stats bar skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-24 bg-muted/30 rounded-full" />
          <div className="h-4 w-16 bg-muted/20 rounded" />
          <div className="h-4 w-16 bg-muted/20 rounded" />
        </div>
        {/* Hero cards skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {[0, 1].map(i => (
            <div key={i} className="rounded-2xl border border-border/30 overflow-hidden">
              <div className="h-40 bg-muted/20" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-muted/30 rounded" />
                <div className="h-3 w-1/2 bg-muted/20 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Recent work skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-32 bg-muted/30 rounded" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border/30 overflow-hidden">
                <div className="aspect-[16/10] bg-muted/15" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-2/3 bg-muted/25 rounded" />
                  <div className="h-3 w-1/3 bg-muted/15 rounded" />
                </div>
              </div>
            ))}
          </div>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-colors text-xs text-muted-foreground"
          >
            <Search className="h-3 w-3" />
            <span>Search</span>
            <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted/30 border border-border/50 font-mono">⌘K</kbd>
          </button>
          <div className="flex items-center gap-1.5">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs px-3 py-1.5 border-border/50 cursor-pointer hover:bg-card/60 transition-colors",
                totalRemaining < 2 && "border-destructive/40 bg-destructive/5 text-destructive animate-pulse"
              )}
              onClick={() => navigate('/credits')}
            >
              <Zap className="h-3 w-3 mr-1.5" />
              {totalRemaining} Credit{totalRemaining !== 1 ? 's' : ''}
            </Badge>
            {userCredits.bonus_credits > 0 && (
              <Badge variant="outline" className="text-[10px] px-2 py-1 border-amber-500/20 bg-amber-500/5 text-amber-400">
                +{userCredits.bonus_credits} bonus
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Credit Balance Card */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">AI Capacity</span>
                    <span className="text-xs text-muted-foreground">
                      {totalRemaining} credit{totalRemaining !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden max-w-xs">
                      <div className="flex h-full">
                        {dailyRemaining > 0 && (
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${(dailyRemaining / Math.max(totalRemaining, 1)) * 100}%` }}
                          />
                        )}
                        {monthlyRemaining > 0 && (
                          <div
                            className="h-full bg-violet-500 transition-all duration-500"
                            style={{ width: `${(monthlyRemaining / Math.max(totalRemaining, 1)) * 100}%` }}
                          />
                        )}
                        {userCredits.bonus_credits > 0 && (
                          <div
                            className="h-full bg-amber-500 transition-all duration-500"
                            style={{ width: `${(userCredits.bonus_credits / Math.max(totalRemaining, 1)) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{dailyRemaining} daily</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500" />{monthlyRemaining} monthly</span>
                      {userCredits.bonus_credits > 0 && (
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{userCredits.bonus_credits} bonus</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
                className="flex-shrink-0"
              >
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="absolute top-2 right-2 h-6 w-6 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
                        <MoreVertical className="h-3.5 w-3.5 text-white/80" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(p.id, e as any); }}>
                        <Star className={cn("h-3.5 w-3.5 mr-2", pinnedIds.has(p.id) ? "text-amber-400 fill-amber-400" : "")} />
                        {pinnedIds.has(p.id) ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/ai-studio/app-builder?project=${p.id}`); }}>
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => deleteProject(p.id, e as any)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  {g.logo_url ? (
                    <img src={g.logo_url} alt={g.name} className="w-full h-full object-cover object-top" loading="lazy" />
                  ) : g.avatar_url ? (
                    <img src={g.avatar_url} alt={g.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <Bot className="h-6 w-6 text-muted-foreground/30" />
                  )}
                  <Badge className="absolute top-2 left-2 text-[10px] bg-primary/80 border-0">GPT</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="absolute top-2 right-2 h-6 w-6 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
                        <MoreVertical className="h-3.5 w-3.5 text-white/80" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePin(g.id, e as any); }}>
                        <Star className={cn("h-3.5 w-3.5 mr-2", pinnedIds.has(g.id) ? "text-amber-400 fill-amber-400" : "")} />
                        {pinnedIds.has(g.id) ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/ai-studio/gpt-builder/${g.id}`); }}>
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => deleteGPT(g.id, e as any)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      <AIStudioUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </motion.div>
  );
};
