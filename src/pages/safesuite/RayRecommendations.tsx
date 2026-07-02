import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, RefreshCw, Sparkles, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Recommendation = {
  id: string;
  category: string | null;
  severity: string;
  title: string;
  body: string | null;
  status: string;
  suggested_actions: Array<{ id: string; label: string; intent: string; target: string }> | null;
  first_seen_at: string;
  last_seen_at: string;
  rule_slug: string | null;
};

const SEVERITY_ICON: Record<string, typeof Info> = {
  danger: ShieldAlert,
  warn: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const SEVERITY_COLOR: Record<string, string> = {
  danger: "text-destructive",
  warn: "text-yellow-500",
  success: "text-green-500",
  info: "text-blue-500",
};

export default function RayRecommendations() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState<"open" | "dismissed" | "resolved">("open");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const statuses =
      tab === "open"
        ? ["new", "reviewed", "snoozed"]
        : tab === "dismissed"
        ? ["dismissed"]
        : ["resolved"];
    const { data } = await supabase
      .from("ray_recommendations")
      .select(
        "id, category, severity, title, body, status, suggested_actions, first_seen_at, last_seen_at, rule_slug",
      )
      .in("status", statuses)
      .order("severity", { ascending: true })
      .order("last_seen_at", { ascending: false })
      .limit(200);
    setRecs((data as Recommendation[]) ?? []);
    setLoading(false);
  }, [tab]);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ray-scan");
      if (error) throw error;
      toast({
        title: "Scan complete",
        description: `${(data as any)?.created ?? 0} new, ${(data as any)?.updated ?? 0} updated`,
      });
      await load();
    } catch (e: any) {
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  }, [load, toast]);

  const setStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "reviewed" || status === "dismissed" || status === "resolved") {
      patch.reviewed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("ray_recommendations")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      await load();
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-7 w-7 text-primary mt-1" />
          <div>
            <h1 className="text-2xl font-semibold">Ray Recommendations</h1>
            <p className="text-sm text-muted-foreground">
              Things Ray noticed without being asked.
            </p>
          </div>
        </div>
        <Button onClick={runScan} disabled={scanning} className="min-h-[44px]">
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Scanning" : "Rescan"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {tab === "open"
                  ? "Nothing to review. Ray will let you know when something changes."
                  : `No ${tab} recommendations.`}
              </CardContent>
            </Card>
          ) : (
            recs.map((r) => {
              const Icon = SEVERITY_ICON[r.severity] ?? Info;
              const color = SEVERITY_COLOR[r.severity] ?? "text-muted-foreground";
              const action = r.suggested_actions?.[0];
              return (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{r.title}</CardTitle>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {r.category ?? "general"}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {r.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.body && (
                      <p className="text-sm text-muted-foreground">{r.body}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {action?.intent === "navigate" && (
                        <Button asChild size="sm" className="min-h-[44px]">
                          <Link to={action.target}>{action.label}</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px]"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('ray:panel-open', {
                              detail: {
                                message: `What should I do about "${r.title}"?`,
                                context: {
                                  kind: 'recommendation',
                                  id: r.id,
                                  title: r.title,
                                  body: r.body ?? undefined,
                                },
                              },
                            }),
                          )
                        }
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Ask Ray
                      </Button>
                      {tab === "open" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                            onClick={() => setStatus(r.id, "resolved")}
                          >
                            Mark resolved
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px]"
                            onClick={() => setStatus(r.id, "dismissed")}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                      {tab !== "open" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px]"
                          onClick={() => setStatus(r.id, "new")}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      First seen {new Date(r.first_seen_at).toLocaleString()} · Last seen{" "}
                      {new Date(r.last_seen_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
