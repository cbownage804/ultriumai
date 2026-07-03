/**
 * RayTeamsEmbed — minimal, chrome-less Ray Assistant surface for the
 * Microsoft Teams personal/static tab.
 *
 * Renders WITHOUT the main WraythLayout (no top nav, no sidebar) so it
 * looks native inside Teams. Loads the Microsoft Teams JS SDK when
 * running inside Teams and resolves the Wrayth organization context in
 * this order:
 *
 *   1. explicit ?orgId= query param
 *   2. linked Teams tenant mapping (workplace_teams_org_links)
 *   3. the user's active Wrayth org (useActiveOrg)
 *   4. org picker fallback (when the user belongs to multiple orgs)
 *
 * IMPORTANT: this is deliberately NOT a knowledge-base assistant. It
 * exposes Ray's existing chat / skills surface (memory + skills over
 * scan-derived security context). We do NOT ingest or retrieve
 * customer documents here — that feature does not exist yet.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import RaySkillsPanel from '@/components/ray/RaySkillsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const ACTIVE_ORG_STORAGE_KEY = 'ray.activeOrgId';

type ResolvedOrg = {
  id: string;
  name: string;
  source: 'query' | 'tenant_link' | 'active' | 'picked';
};

type TeamsContextShape = {
  tenantId?: string;
  channelName?: string;
  teamName?: string;
};

async function loadTeamsContext(): Promise<TeamsContextShape | null> {
  // Only attempt when actually framed by Teams (rough sniff avoids
  // the SDK error toast when opened directly in a browser tab).
  const framed = typeof window !== 'undefined' && window.parent !== window;
  if (!framed) return null;
  try {
    const teamsJs = await import('@microsoft/teams-js');
    await teamsJs.app.initialize();
    const ctx = await teamsJs.app.getContext();
    return {
      tenantId: ctx.user?.tenant?.id,
      channelName: ctx.channel?.displayName,
      teamName: ctx.team?.displayName,
    };
  } catch {
    return null;
  }
}

async function logTabOpened(input: {
  userId: string;
  userEmail: string | null;
  tenantId?: string;
  orgId?: string;
  source: ResolvedOrg['source'];
}) {
  try {
    await supabase.from('integration_events').insert({
      user_id: input.userId,
      provider: 'microsoft_teams',
      event_type: 'tab_opened',
      actor: input.userEmail || 'user',
      detail: {
        tenant_id: input.tenantId ?? null,
        organization_id: input.orgId ?? null,
        resolution: input.source,
      },
    });
  } catch {
    /* non-fatal — telemetry only */
  }
}

export type ResolutionInputs = {
  explicitOrgId: string | null;
  tenantLinkedOrg: { id: string; name: string } | null;
  activeOrg: { id: string; name: string } | null;
  orgs: Array<{ id: string; name: string }>;
};

/**
 * Pure resolver used by both the component and tests.
 * Order: explicit ?orgId= (only if the caller belongs to it) →
 * linked Teams tenant (only if the caller belongs to it) → active org →
 * null (picker or solo user).
 */
export function resolveEmbedOrg(input: ResolutionInputs): ResolvedOrg | null {
  const { explicitOrgId, tenantLinkedOrg, activeOrg, orgs } = input;
  if (explicitOrgId) {
    const match = orgs.find((o) => o.id === explicitOrgId);
    if (match) return { id: match.id, name: match.name, source: 'query' };
  }
  if (tenantLinkedOrg && orgs.some((o) => o.id === tenantLinkedOrg.id)) {
    return { id: tenantLinkedOrg.id, name: tenantLinkedOrg.name, source: 'tenant_link' };
  }
  if (activeOrg) return { id: activeOrg.id, name: activeOrg.name, source: 'active' };
  return null;
}

export default function RayTeamsEmbed() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { orgs, activeOrg, switchOrg, loading: orgsLoading } = useActiveOrg();

  const explicitOrgId = searchParams.get('orgId');

  const [teamsCtx, setTeamsCtx] = useState<TeamsContextShape | null>(null);
  const [tenantLinkedOrg, setTenantLinkedOrg] = useState<{ id: string; name: string } | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolved, setResolved] = useState<ResolvedOrg | null>(null);
  // Ref, not state — survives StrictMode double-invocation and cannot
  // cause a re-render loop that re-fires the log.
  const loggedRef = useRef(false);

  // 1. Boot the Teams SDK and capture tenant context.
  useEffect(() => {
    let alive = true;
    loadTeamsContext().then((c) => {
      if (alive) setTeamsCtx(c);
    });
    return () => { alive = false; };
  }, []);

  // 2. If Teams gave us a tenant, look up the linked Wrayth org.
  useEffect(() => {
    let alive = true;
    (async () => {
      const tid = teamsCtx?.tenantId;
      if (!tid || !user) {
        setTenantLinkedOrg(null);
        return;
      }
      const { data } = await supabase.rpc('resolve_teams_tenant_org', { _tenant_id: tid });
      const row = Array.isArray(data) ? data[0] : null;
      if (!alive) return;
      setTenantLinkedOrg(row ? { id: row.organization_id, name: row.organization_name } : null);
    })();
    return () => { alive = false; };
  }, [teamsCtx?.tenantId, user]);

  // 3. Combine sources to decide the effective org.
  useEffect(() => {
    if (authLoading || orgsLoading) return;
    // Explicit query param wins (if the user actually belongs to it).
    if (explicitOrgId) {
      const match = orgs.find((o) => o.id === explicitOrgId);
      if (match) {
        setResolved({ id: match.id, name: match.name, source: 'query' });
        setResolving(false);
        return;
      }
    }
    if (tenantLinkedOrg && orgs.some((o) => o.id === tenantLinkedOrg.id)) {
      setResolved({ id: tenantLinkedOrg.id, name: tenantLinkedOrg.name, source: 'tenant_link' });
      setResolving(false);
      return;
    }
    if (activeOrg) {
      setResolved({ id: activeOrg.id, name: activeOrg.name, source: 'active' });
      setResolving(false);
      return;
    }
    // No org at all — solo user or picker required.
    setResolved(null);
    setResolving(false);
  }, [authLoading, orgsLoading, explicitOrgId, tenantLinkedOrg, activeOrg, orgs]);

  // 4. Pin the resolved org so useActiveOrg-consuming children see it.
  useEffect(() => {
    if (!resolved) return;
    try {
      const current = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
      if (current !== resolved.id) {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, resolved.id);
        // Nudge useActiveOrg consumers via its own switch API so React state updates.
        switchOrg(resolved.id);
      }
    } catch {
      /* storage disabled — resolution still works within this tree */
    }
  }, [resolved, switchOrg]);

  // 5. Fire tab_opened once per mount, after resolution.
  useEffect(() => {
    if (logged || resolving || !user) return;
    void logTabOpened({
      userId: user.id,
      userEmail: user.email ?? null,
      tenantId: teamsCtx?.tenantId,
      orgId: resolved?.id,
      source: resolved?.source ?? 'active',
    });
    setLogged(true);
  }, [logged, resolving, user, teamsCtx?.tenantId, resolved]);

  const showPicker = !resolving && !resolved && orgs.length > 0;
  const soloUser = !resolving && !resolved && orgs.length === 0;

  const contextChips = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    if (resolved) chips.push({ label: 'Org', value: resolved.name });
    if (teamsCtx?.teamName) chips.push({ label: 'Team', value: teamsCtx.teamName });
    if (teamsCtx?.channelName) chips.push({ label: 'Channel', value: teamsCtx.channelName });
    return chips;
  }, [resolved, teamsCtx]);

  if (authLoading || resolving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Preparing Ray Assistant…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact embed header — deliberately no app nav / sidebar. */}
      <header className="border-b px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <h1 className="text-sm font-semibold">Ray Security Assistant</h1>
          <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">Teams</Badge>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {contextChips.map((c) => (
            <Badge
              key={`${c.label}:${c.value}`}
              variant="outline"
              className="text-[10px] font-normal"
              title={`${c.label}: ${c.value}`}
            >
              <span className="text-muted-foreground mr-1">{c.label}</span>
              <span className="truncate max-w-[10rem]">{c.value}</span>
            </Badge>
          ))}
        </div>
      </header>

      <div className="px-4 pt-3">
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
          Ray answers from your Wrayth security context and approved organization memory.
          Vault secrets are never exposed.
        </p>
      </div>

      {showPicker && (
        <div className="p-4">
          <Alert>
            <AlertTitle>Pick the organization to use</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Your Teams tenant isn&apos;t linked to a Wrayth organization yet. Choose one
                for this session — an admin can link the tenant later so it&apos;s automatic.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {orgs.map((o) => (
                  <Button
                    key={o.id}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      switchOrg(o.id);
                      setResolved({ id: o.id, name: o.name, source: 'picked' });
                    }}
                  >
                    {o.name}
                  </Button>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {soloUser && (
        <div className="p-4">
          <Alert>
            <AlertTitle>Personal Wrayth account</AlertTitle>
            <AlertDescription className="text-xs">
              You&apos;re signed in without an organization. Ray will use your personal
              security context in this session.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="flex-1 min-h-0 p-3">
        <RaySkillsPanel />
      </main>
    </div>
  );
}
