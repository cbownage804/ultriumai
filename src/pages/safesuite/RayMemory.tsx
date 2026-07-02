import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Plus, Trash2, ShieldCheck, Sparkles, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MemoryRow = {
  id: string;
  key: string;
  value: string;
  category: string;
  confidence: number;
  source: string;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = ["general", "identity", "endpoint", "network", "vendor", "policy", "contact"];

export default function RayMemory() {
  const { activeOrg, loading: orgLoading, hasOrg } = useActiveOrg();
  const { toast } = useToast();
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    key: "",
    value: "",
    category: "general",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!activeOrg?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("ray_org_memory")
      .select("id, key, value, category, confidence, source, verified_at, notes, created_at, updated_at")
      .eq("org_id", activeOrg.id)
      .order("category", { ascending: true })
      .order("key", { ascending: true });
    if (error) {
      toast({ title: "Failed to load memory", description: error.message, variant: "destructive" });
    }
    setRows((data as MemoryRow[]) ?? []);
    setLoading(false);
  }, [activeOrg?.id, toast]);

  useEffect(() => { load(); }, [load]);

  const addFact = async () => {
    if (!activeOrg?.id) return;
    if (!form.key.trim() || !form.value.trim()) {
      toast({ title: "Key and value are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("ray_org_memory").upsert(
      {
        org_id: activeOrg.id,
        key: form.key.trim(),
        value: form.value.trim(),
        category: form.category,
        notes: form.notes.trim() || null,
        source: "admin",
        confidence: 1.0,
        verified_by: userData.user?.id ?? null,
        verified_at: new Date().toISOString(),
        created_by: userData.user?.id ?? null,
      },
      { onConflict: "org_id,key" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Memory saved" });
    setForm({ key: "", value: "", category: "general", notes: "" });
    load();
  };

  const removeRow = async (id: string) => {
    const { error } = await supabase.from("ray_org_memory").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const verifyRow = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("ray_org_memory")
      .update({
        confidence: 1.0,
        verified_by: userData.user?.id ?? null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Verify failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  if (orgLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!hasOrg) {
    return (
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" /> Organization Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Organization Memory is available once you belong to an organization. Create or join
            one from Settings → Organization to start teaching Ray about your environment.
          </CardContent>
        </Card>
      </div>
    );
  }

  const grouped = rows.reduce<Record<string, MemoryRow[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Organization Memory
        </h1>
        <p className="text-muted-foreground mt-1">
          Facts Ray uses when reasoning about <span className="font-medium">{activeOrg?.name}</span>.
          Only organization admins can view or edit these.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add a fact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              placeholder="e.g. mfa_provider"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              placeholder="e.g. Duo Security"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={addFact} disabled={saving}>
              <Sparkles className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Save fact"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-muted-foreground">Loading memory…</div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No facts yet. Add the first thing Ray should know about {activeOrg?.name}.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 border rounded-md p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm">{r.key}</span>
                      <Badge variant="outline" className="text-xs">{r.source}</Badge>
                      {r.verified_at && (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                          verified
                        </Badge>
                      )}
                      {r.confidence < 1 && (
                        <Badge variant="secondary" className="text-xs">
                          conf {(r.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm mt-1 break-words">{r.value}</div>
                    {r.notes && (
                      <div className="text-xs text-muted-foreground mt-1">{r.notes}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!r.verified_at && (
                      <Button size="sm" variant="ghost" onClick={() => verifyRow(r.id)}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeRow(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
