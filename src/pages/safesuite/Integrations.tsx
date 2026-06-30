/**
 * Integrations — connect Ray to external tenants (Microsoft 365 today,
 * Google Workspace next). Surfaces connection state + live signal summary.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Plug, Check, AlertTriangle, ShieldCheck } from "lucide-react";

type Integration = {
  id: string;
  provider: string;
  status: string;
  account_email: string | null;
  provider_tenant_id: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  metadata: any;
};

type Signal = {
  key: string;
  label: string;
  status: "ok" | "warn" | "risk" | "unknown";
  value?: string | number | null;
  detail?: string;
};

const statusTone: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  risk: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export default function Integrations() {
  const [loading, setLoading] = useState(true);
  const [m365, setM365] = useState<Integration | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("ray_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "microsoft_365")
      .maybeSingle();
    setM365(data as any);
    const meta = (data as any)?.metadata || {};
    if (Array.isArray(meta.last_signals_payload)) setSignals(meta.last_signals_payload);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // If we just came back from OAuth, immediately kick a sync.
    const url = new URL(window.location.href);
    if (url.searchParams.get("connected") === "microsoft_365") {
      toast.success("Microsoft 365 connected. Ray is pulling your tenant signals…");
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => sync(), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ms-graph-oauth-start", {
        body: { redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No authorization URL returned");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Couldn't start Microsoft 365 connection");
      setConnecting(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ms-graph-sync", { body: {} });
      if (error) throw error;
      const out = (data?.signals ?? []) as Signal[];
      setSignals(out);
      toast.success(`Ray synced ${out.length} signal${out.length === 1 ? "" : "s"} from Microsoft 365.`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = m365?.status === "connected";

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your environments so Ray can read live posture instead of guessing.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Microsoft 365
              </CardTitle>
              <CardDescription className="mt-1">
                Ray reads tenant security defaults, Conditional Access, MFA coverage, admin counts, and Secure Score.
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
            ) : m365?.status === "error" ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" /> Needs attention
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</div>
          ) : isConnected ? (
            <>
              <div className="text-sm text-muted-foreground">
                Connected as <span className="text-foreground">{m365?.account_email || "your account"}</span>
                {m365?.provider_tenant_id ? <> · Tenant <code className="text-xs">{m365.provider_tenant_id}</code></> : null}
                {m365?.last_sync_at ? <> · Last sync {new Date(m365.last_sync_at).toLocaleString()}</> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={sync} disabled={syncing} variant="default">
                  {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Sync now
                </Button>
                <Button onClick={connect} variant="outline">Reconnect</Button>
              </div>

              {signals.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3 pt-3">
                  {signals.map((s) => (
                    <div key={s.key} className={`rounded-lg border p-3 ${statusTone[s.status]}`}>
                      <div className="text-xs uppercase tracking-wide opacity-80">{s.label}</div>
                      <div className="text-lg font-semibold mt-1">{s.value ?? "—"}</div>
                      {s.detail && <div className="text-xs mt-1 opacity-90">{s.detail}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You'll be sent to Microsoft to sign in and approve read-only access. Ray never changes anything in your tenant — only reads posture.
              </p>
              <Button onClick={connect} disabled={connecting}>
                {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
                Connect Microsoft 365
              </Button>
              {m365?.last_error && (
                <p className="text-xs text-rose-400">Last error: {m365.last_error}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-dashed border-border/60">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Google Workspace · coming next</CardTitle>
          <CardDescription>2-Step coverage, admin count, sharing posture. Tell Ray you want it and we'll line it up.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
