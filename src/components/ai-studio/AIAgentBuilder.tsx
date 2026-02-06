import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Save, Loader2 } from 'lucide-react';

const TARGET_TABLES = [
  { value: 'tickets', label: 'Tickets' },
  { value: 'atlas_contacts', label: 'Contacts' },
  { value: 'atlas_documents', label: 'Documents' },
  { value: 'atlas_organizations', label: 'Organizations' },
  { value: 'atlas_passwords', label: 'Passwords' },
  { value: 'assets', label: 'Assets' },
  { value: 'vanguard_agents', label: 'Devices' },
  { value: 'realtime_alerts', label: 'Security Alerts' },
  { value: 'compliance_frameworks', label: 'Compliance' },
  { value: 'knowledge_sources', label: 'Knowledge Sources' },
];

const MODELS = [
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini Flash Lite (Fastest)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini Flash (Balanced)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini Pro (Most Accurate)' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (Fast)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (Balanced)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Most Powerful)' },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual — Run on demand' },
  { value: 'on_create', label: 'On Create — When new records are added' },
  { value: 'on_update', label: 'On Update — When records are modified' },
  { value: 'schedule', label: 'Scheduled — Run on a recurring basis' },
];

export function AIAgentBuilder() {
  const { agentId } = useParams<{ agentId: string }>();
  const isEditing = agentId && agentId !== 'new';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!isEditing);

  const [form, setForm] = useState({
    name: '',
    description: '',
    target_table: 'tickets',
    trigger_type: 'manual',
    model: 'google/gemini-2.5-flash',
    system_prompt: '',
    credit_budget: 100,
    is_enabled: false,
    conditions: '{}',
    output_mapping: '{}',
  });

  useEffect(() => {
    if (isEditing) loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents' as any)
        .select('*')
        .eq('id', agentId)
        .single();
      if (error) throw error;
      const agent = data as any;
      setForm({
        name: agent.name || '',
        description: agent.description || '',
        target_table: agent.target_table || 'tickets',
        trigger_type: agent.trigger_type || 'manual',
        model: agent.model || 'google/gemini-2.5-flash',
        system_prompt: agent.system_prompt || '',
        credit_budget: agent.credit_budget || 100,
        is_enabled: agent.is_enabled || false,
        conditions: JSON.stringify(agent.conditions || {}, null, 2),
        output_mapping: JSON.stringify(agent.output_mapping || {}, null, 2),
      });
    } catch (err) {
      toast({ title: 'Error loading agent', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);

    try {
      let conditions = {};
      let outputMapping = {};
      try { conditions = JSON.parse(form.conditions); } catch {}
      try { outputMapping = JSON.parse(form.output_mapping); } catch {}

      const payload = {
        user_id: user.id,
        name: form.name,
        description: form.description || null,
        target_table: form.target_table,
        trigger_type: form.trigger_type,
        model: form.model,
        system_prompt: form.system_prompt || null,
        credit_budget: form.credit_budget,
        is_enabled: form.is_enabled,
        conditions,
        output_mapping: outputMapping,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('ai_agents' as any)
          .update(payload)
          .eq('id', agentId);
        if (error) throw error;
        toast({ title: 'Agent updated' });
      } else {
        const { error } = await supabase
          .from('ai_agents' as any)
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Agent created' });
      }
      navigate('/ai-studio/agents');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/ai-studio/agents')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agents
      </Button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          {isEditing ? 'Edit Agent' : 'Create AI Agent'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure an autonomous AI agent to process your data
        </p>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Agent Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Ticket Auto-Tagger"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this agent do?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Target Table</Label>
              <Select value={form.target_table} onValueChange={(v) => setForm(f => ({ ...f, target_table: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TARGET_TABLES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trigger Type</Label>
              <Select value={form.trigger_type} onValueChange={(v) => setForm(f => ({ ...f, trigger_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>AI Model</Label>
            <Select value={form.model} onValueChange={(v) => setForm(f => ({ ...f, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={form.system_prompt}
              onChange={(e) => setForm(f => ({ ...f, system_prompt: e.target.value }))}
              placeholder="Instructions for the AI agent..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Credit Budget: {form.credit_budget}</Label>
            <Slider
              value={[form.credit_budget]}
              onValueChange={([v]) => setForm(f => ({ ...f, credit_budget: v }))}
              min={10}
              max={1000}
              step={10}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Agent stops running when this budget is exhausted
            </p>
          </div>

          <div>
            <Label>Conditions (JSON)</Label>
            <Textarea
              value={form.conditions}
              onChange={(e) => setForm(f => ({ ...f, conditions: e.target.value }))}
              rows={3}
              className="font-mono text-xs"
              placeholder='{"status": "open"}'
            />
          </div>

          <div>
            <Label>Output Mapping (JSON)</Label>
            <Textarea
              value={form.output_mapping}
              onChange={(e) => setForm(f => ({ ...f, output_mapping: e.target.value }))}
              rows={3}
              className="font-mono text-xs"
              placeholder='{"category": "category", "priority": "priority"}'
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Agent</Label>
              <p className="text-xs text-muted-foreground">Activate this agent for automatic execution</p>
            </div>
            <Switch
              checked={form.is_enabled}
              onCheckedChange={(checked) => setForm(f => ({ ...f, is_enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/ai-studio/agents')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isEditing ? 'Update Agent' : 'Create Agent'}
        </Button>
      </div>
    </div>
  );
}
