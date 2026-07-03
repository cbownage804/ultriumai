/**
 * Workplace Embeds — connect the Ray Security Assistant into Microsoft
 * Teams (personal/static tab + optional bot) and Slack.
 *
 * NOTE: this is deliberately NOT a knowledge-base assistant. Ray answers
 * from the user's Wrayth security context and approved organization
 * memory. A real customer-document KB does not exist yet.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Plug, ShieldCheck, Lock, MessageSquare, Trash2, Sparkles, AlertTriangle, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Integration = {
  id: string;
  provider: "microsoft_teams" | "slack";
  status: "not_connected" | "pending" | "connected" | "error" | "disconnected";
  workspace_name: string | null;
  tenant_id: string | null;
  last_error: string | null;
  last_event_at: string | null;
};

type WorkMsg = {
  id: string;
  provider: string;
  direction: "inbound" | "outbound";
  content: string;
  external_user_name: string | null;
  created_at: string;
};

const providerMeta = {
  microsoft_teams: { label: "Microsoft Teams", accent: "from-indigo-500/20 to-blue-500/10" },
  slack: { label: "Slack", accent: "from-fuchsia-500/20 to-purple-500/10" },
} as const;

export default function WorkplaceEmbeds() {
  const subscription = useUserSubscription();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, Integration | null>>({ microsoft_teams: null, slack: null });
  const [busy, setBusy] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState("What is our password rotation policy?");
  const [testAnswer, setTestAnswer] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [msgs, setMsgs] = useState<WorkMsg[]>([]);

  const tier = (subscription.tier || "").toLowerCase();
  const isEntitled = ["business", "enterprise"].includes(tier);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("workplace_integrations")
      .select("*")
      .eq("user_id", user.id);
    const next: Record<string, Integration | null> = { microsoft_teams: null, slack: null };
    (data || []).forEach((r: any) => { next[r.provider] = r; });
    setRows(next);
    const { data: m } = await supabase
      .from("workplace_messages")
      .select("id, provider, direction, content, external_user_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setMsgs((m || []) as WorkMsg[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const call = async (action: string, provider: string, payload?: any) => {
    setBusy(`${action}:${provider}`);
    try {
      const { data, error } = await supabase.functions.invoke("workplace-integration", {
        body: { action, provider, payload },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    } finally { setBusy(null); }
  };

  const connect = async (provider: "microsoft_teams" | "slack") => {
    try {
      const res: any = await call("connect", provider, { workspace_name: orgName, tenant_id: tenantId });
      if (res.oauth_url) {
        toast.info("Slack OAuth requires Wrayth admin credentials — placeholder URL copied to clipboard.");
        try { await navigator.clipboard.writeText(res.oauth_url); } catch {}
      } else {
        toast.success("Install started. Follow the admin instructions below to complete setup.");
      }
      await load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const simulate = async (provider: "microsoft_teams" | "slack") => {
    try {
      await call("mark_connected", provider, { workspace_name: orgName || "My Workspace", tenant_id: tenantId });
      toast.success("Marked as connected (test mode).");
      await load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const disconnect = async (provider: "microsoft_teams" | "slack") => {
    try {
      await call("disconnect", provider);
      toast.success("Disconnected.");
      await load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const testIt = async (provider: "microsoft_teams" | "slack") => {
    try {
      const res: any = await call("test_assistant", provider, { prompt: testPrompt });
      setTestAnswer(res.answer);
      await load();
    } catch (e: any) { toast.error(e.message || "Assistant test failed"); }
  };

  const downloadManifest = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("workplace-teams-manifest", {
        body: { org_name: orgName || "Your Organization" },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wrayth-teams-manifest.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Teams manifest downloaded.");
    } catch (e: any) { toast.error(e.message || "Manifest download failed"); }
  };

  const StatusBadge = ({ s }: { s: Integration["status"] | undefined }) => {
    const map: Record<string, string> = {
      connected: "bg-green-500/15 text-green-300 border-green-500/30",
      pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
      error: "bg-red-500/15 text-red-300 border-red-500/30",
      disconnected: "bg-muted text-muted-foreground border-border",
      not_connected: "bg-muted text-muted-foreground border-border",
    };
    const s0 = s || "not_connected";
    return <Badge variant="outline" className={map[s0]}>{s0.replace("_", " ")}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-semibold">Workplace Embeds</h1>
          <Badge variant="outline" className="border-primary/40 text-primary">Beta</Badge>
          <Badge variant="outline" className="border-amber-500/40 text-amber-300">Business / Enterprise</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Let your team chat with Ray, your approved company knowledge-base assistant, directly inside
          Microsoft Teams and Slack. Ray answers from your approved company knowledge base only. It does
          not expose private vault secrets.
        </p>
      </header>

      {!isEntitled && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Lock className="h-4 w-4" />
          <AlertTitle>Upgrade to Business to unlock Workplace Embeds</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span>Teams and Slack embeds are part of the Business and Enterprise plans.</span>
            <Button asChild size="sm"><Link to="/pricing">Upgrade</Link></Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Organization binding</CardTitle>
          <CardDescription>Used to scope tenants and label the Teams manifest. Wrayth verifies your Teams tenant ID and Slack workspace ID at install time.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Organization name</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" disabled={!isEntitled} />
          </div>
          <div className="space-y-1">
            <Label>Microsoft tenant ID (optional)</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" disabled={!isEntitled} />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {(["microsoft_teams", "slack"] as const).map((p) => {
          const row = rows[p];
          const meta = providerMeta[p];
          const locked = !isEntitled;
          return (
            <Card key={p} className={`bg-gradient-to-br ${meta.accent} relative overflow-hidden`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="h-4 w-4" /> {meta.label}
                  </CardTitle>
                  <CardDescription>
                    {p === "microsoft_teams"
                      ? "Ship a Teams app bound to your tenant. Users @mention Wrayth to query the KB."
                      : "Install a Slack app with a slash command and app mention. Workspace-scoped."}
                  </CardDescription>
                </div>
                <StatusBadge s={row?.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Workspace: <span className="text-foreground">{row?.workspace_name || "—"}</span></div>
                  {p === "microsoft_teams" && <div>Tenant: <span className="text-foreground">{row?.tenant_id || "—"}</span></div>}
                  <div>Last event: <span className="text-foreground">{row?.last_event_at ? new Date(row.last_event_at).toLocaleString() : "—"}</span></div>
                  {row?.last_error && <div className="text-red-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {row.last_error}</div>}
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {row?.status !== "connected" && (
                    <Button size="sm" disabled={locked || busy === `connect:${p}`} onClick={() => connect(p)}>
                      {busy === `connect:${p}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
                      <span className="ml-1">Connect {meta.label}</span>
                    </Button>
                  )}
                  {p === "microsoft_teams" && (
                    <Button size="sm" variant="secondary" disabled={locked} onClick={downloadManifest}>
                      <Download className="h-3 w-3 mr-1" /> Download manifest
                    </Button>
                  )}
                  {row?.status === "pending" && (
                    <Button size="sm" variant="outline" disabled={locked} onClick={() => simulate(p)}>
                      Mark connected (test)
                    </Button>
                  )}
                  {row?.status === "connected" && (
                    <>
                      <Button size="sm" variant="outline" disabled={locked} onClick={() => testIt(p)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> Test assistant
                      </Button>
                      <Button size="sm" variant="destructive" disabled={locked} onClick={() => disconnect(p)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {p === "microsoft_teams" ? (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer text-foreground">Admin install instructions</summary>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Download the manifest above.</li>
                      <li>Zip <code>manifest.json</code> with a 192×192 color icon and 32×32 outline icon.</li>
                      <li>In Teams Admin Center → Teams apps → Manage apps, upload the zip.</li>
                      <li>Approve and pin the Wrayth app for your organization.</li>
                    </ol>
                  </details>
                ) : (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer text-foreground">Admin install instructions</summary>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Click Connect Slack — the OAuth URL is copied to your clipboard.</li>
                      <li>Paste it into a browser signed in as a Slack workspace admin.</li>
                      <li>Approve the requested scopes (chat:write, commands, app_mentions:read).</li>
                      <li>Return here — status will flip to Connected.</li>
                    </ol>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test the assistant</CardTitle>
          <CardDescription>Runs a stubbed KB round-trip and logs it to workplace conversations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} rows={2} disabled={!isEntitled} />
          <div className="flex gap-2">
            <Button size="sm" disabled={!isEntitled || rows.microsoft_teams?.status !== "connected"} onClick={() => testIt("microsoft_teams")}>Test in Teams</Button>
            <Button size="sm" disabled={!isEntitled || rows.slack?.status !== "connected"} onClick={() => testIt("slack")}>Test in Slack</Button>
          </div>
          {testAnswer && (
            <div className="rounded-md border p-3 text-sm bg-muted/30">{testAnswer}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent workplace conversations</CardTitle>
          <CardDescription>Audit log of the last 20 messages routed through Wrayth embeds.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
          ) : msgs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No conversations yet.</div>
          ) : (
            <div className="space-y-2">
              {msgs.map((m) => (
                <div key={m.id} className="text-sm border rounded-md p-2 flex gap-2">
                  <Badge variant="outline" className="shrink-0">{m.provider === "microsoft_teams" ? "Teams" : "Slack"}</Badge>
                  <Badge variant="outline" className={`shrink-0 ${m.direction === "inbound" ? "border-blue-500/30 text-blue-300" : "border-primary/30 text-primary"}`}>
                    {m.direction}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{m.external_user_name || "—"} · {new Date(m.created_at).toLocaleString()}</div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
