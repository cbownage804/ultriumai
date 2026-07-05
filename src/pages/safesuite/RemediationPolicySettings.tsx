/**
 * RemediationPolicySettings — Ray's autonomy dial. Per-user org policy.
 */
import { useEffect, useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchPolicy,
  savePolicy,
  AUTO_FIX_MODE_LABELS,
  DEFAULT_POLICY,
  type RemediationPolicy,
} from '@/lib/ray/remediations/policy';
import { CATEGORY_LABELS } from '@/lib/ray/remediations/types';
import type { AutoFixMode, RemediationCategory } from '@/lib/ray/remediations/types';

const CATEGORIES: RemediationCategory[] = [
  'encryption', 'defender', 'firewall', 'remote_access', 'accounts',
  'updates', 'session', 'browser', 'identity', 'mail', 'session_cloud',
];

export default function RemediationPolicySettings() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<RemediationPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setPolicy(await fetchPolicy(user.id));
      setLoading(false);
    })();
  }, [user?.id]);

  const toggleCategory = (list: 'always_auto' | 'never_auto', cat: RemediationCategory) => {
    setPolicy((p) => {
      const cur = new Set(p[list]);
      if (cur.has(cat)) cur.delete(cat);
      else cur.add(cat);
      // ensure exclusivity between always/never
      const other = list === 'always_auto' ? 'never_auto' : 'always_auto';
      const otherSet = new Set(p[other]);
      otherSet.delete(cat);
      return { ...p, [list]: Array.from(cur), [other]: Array.from(otherSet) };
    });
  };

  async function onSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      await savePolicy(user.id, policy);
      toast.success('Ray autonomy policy saved.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading policy…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-start gap-3">
        <ShieldCheck className="h-7 w-7 text-violet-300 mt-1" />
        <div>
          <h1 className="text-2xl font-semibold">Ray autonomy policy</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Decide how much Ray can fix on its own. Every automatic fix still
            writes to the Remediation Timeline with a one-click Undo — nothing
            is silent.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Automatic remediation</CardTitle>
          <CardDescription>
            The default (Suggest only) means Ray never runs anything on its own.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={policy.auto_fix_mode}
            onValueChange={(v) => setPolicy((p) => ({ ...p, auto_fix_mode: v as AutoFixMode }))}
            className="gap-3"
          >
            {(Object.keys(AUTO_FIX_MODE_LABELS) as AutoFixMode[]).map((mode) => {
              const meta = AUTO_FIX_MODE_LABELS[mode];
              return (
                <label
                  key={mode}
                  htmlFor={`mode-${mode}`}
                  className={cn(
                    'flex gap-3 items-start rounded-md border p-3 cursor-pointer transition-colors',
                    policy.auto_fix_mode === mode
                      ? 'border-violet-400/60 bg-violet-500/5'
                      : 'border-border hover:border-violet-400/40',
                  )}
                >
                  <RadioGroupItem value={mode} id={`mode-${mode}`} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{meta.label}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{meta.description}</div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category overrides</CardTitle>
          <CardDescription>
            Force always-auto or never-auto per category, regardless of the mode above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-300 mb-2">Always auto-fix</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={`a-${c}`}
                  type="button"
                  onClick={() => toggleCategory('always_auto', c)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
                    policy.always_auto.includes(c)
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                      : 'border-border text-muted-foreground hover:border-emerald-500/40',
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-red-300 mb-2">Never auto-fix</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={`n-${c}`}
                  type="button"
                  onClick={() => toggleCategory('never_auto', c)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
                    policy.never_auto.includes(c)
                      ? 'border-red-500/60 bg-red-500/10 text-red-100'
                      : 'border-border text-muted-foreground hover:border-red-500/40',
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Notify me when Ray finishes a remediation</Label>
            <p className="text-[12px] text-muted-foreground">
              In-app notifications only for now. Email / Teams / Slack coming later.
            </p>
          </div>
          <Switch
            checked={policy.notify_on_complete}
            onCheckedChange={(v) => setPolicy((p) => ({ ...p, notify_on_complete: v }))}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Badge variant="outline" className="text-[11px]">
          Current: {AUTO_FIX_MODE_LABELS[policy.auto_fix_mode].label}
        </Badge>
        <Button onClick={onSave} disabled={saving} className="min-h-[44px]">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save policy
        </Button>
      </div>
    </div>
  );
}
