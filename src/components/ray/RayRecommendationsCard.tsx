import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Sparkles, RefreshCw, MessageSquare } from "lucide-react";

type Recommendation = {
  id: string;
  category: string | null;
  severity: string;
  title: string;
  body: string | null;
  status: string;
  suggested_actions: Array<{ id: string; label: string; intent: string; target: string }> | null;
  last_seen_at: string;
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

export function RayRecommendationsCard({
  greeting,
  showViewAll = true,
  limit = 3,
}: {
  greeting?: string;
  showViewAll?: boolean;
  limit?: number;
}) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [totalOpen, setTotalOpen] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("ray_recommendations")
      .select("id, category, severity, title, body, status, suggested_actions, last_seen_at", {
        count: "exact",
      })
      .in("status", ["new", "reviewed"])
      .order("severity", { ascending: true })
      .order("last_seen_at", { ascending: false })
      .limit(limit);
    setRecs((data as Recommendation[]) ?? []);
    setTotalOpen(count ?? 0);
    setLoading(false);
  }, [limit]);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      await supabase.functions.invoke("ray-scan");
      await load();
    } finally {
      setScanning(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {greeting ?? "Ray noticed"}
          </CardTitle>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={runScan}
          disabled={scanning}
          className="min-h-[44px]"
          aria-label="Refresh recommendations"
        >
          <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : recs.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No open findings. Ray will let you know when something changes.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              I found {totalOpen} thing{totalOpen === 1 ? "" : "s"} worth your attention.
            </p>
            <ul className="space-y-2">
              {recs.map((r) => {
                const Icon = SEVERITY_ICON[r.severity] ?? Info;
                const color = SEVERITY_COLOR[r.severity] ?? "text-muted-foreground";
                const action = r.suggested_actions?.[0];
                return (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{r.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {r.category ?? "general"}
                        </Badge>
                      </div>
                      {r.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {r.body}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {action?.intent === "navigate" && (
                        <Button
                          asChild
                          size="sm"
                          variant="secondary"
                          className="min-h-[36px]"
                        >
                          <Link to={action.target}>{action.label}</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[36px] text-xs text-violet-300 hover:text-violet-200"
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
                        <MessageSquare className="h-3.5 w-3.5 mr-1" /> Ask Ray
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {showViewAll && totalOpen > recs.length && (
              <div className="pt-1">
                <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                  <Link to="/app/ray/recommendations">Review all {totalOpen}</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default RayRecommendationsCard;
