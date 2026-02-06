import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, FileText, Loader2, Copy, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const DOC_TEMPLATES = [
  { id: 'new_client_onboarding', label: 'New Client Onboarding', prompt: 'Create a comprehensive new client onboarding documentation template including network assessment, credential collection, software inventory, backup setup, and security baseline.' },
  { id: 'server_setup', label: 'Server Setup SOP', prompt: 'Create a detailed server setup standard operating procedure including hardware specs, OS installation, role configuration, security hardening, monitoring agent setup, and backup configuration.' },
  { id: 'network_documentation', label: 'Network Documentation', prompt: 'Create network documentation covering topology, IP addressing scheme, VLAN configuration, firewall rules, VPN setup, DNS/DHCP, and wireless networks.' },
  { id: 'security_policy', label: 'Security Policy', prompt: 'Create an IT security policy covering password requirements, MFA, endpoint protection, email security, incident response, data backup, and access controls.' },
  { id: 'disaster_recovery', label: 'Disaster Recovery Plan', prompt: 'Create a disaster recovery plan including RTOs/RPOs, backup procedures, failover processes, communication plan, and recovery testing schedule.' },
  { id: 'offboarding', label: 'Employee Offboarding', prompt: 'Create an employee offboarding checklist including account deactivation, device collection, access revocation, email forwarding, and data archival.' },
  { id: 'custom', label: 'Custom...', prompt: '' },
];

export function AtlasAIDocGenerator({ organizationId, onDocCreated }: { organizationId?: string; onDocCreated?: () => void }) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    const template = DOC_TEMPLATES.find(t => t.id === selectedTemplate);
    const prompt = selectedTemplate === 'custom' ? customPrompt : template?.prompt;
    if (!prompt) return;

    setGenerating(true);
    setGeneratedDoc('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: prompt,
          model: 'gpt-4o-mini',
          systemPrompt: `You are an expert MSP/IT documentation writer. Generate professional, thorough IT documentation in markdown format. Include:
- Clear section headers
- Step-by-step procedures where applicable
- Placeholder fields marked with [FILL IN] for client-specific data
- Best practices and notes
- Reference links where helpful
Make it production-ready for an MSP to use with their clients.`,
        },
      });

      if (error) throw error;
      if (data?.response) {
        setGeneratedDoc(data.response);
        setDocTitle(template?.label || 'AI Generated Document');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToAtlas = async () => {
    if (!user || !generatedDoc || !docTitle) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('atlas_documents').insert({
        user_id: user.id,
        organization_id: organizationId || null,
        title: docTitle,
        content: generatedDoc,
        category: 'AI Generated',
        tags: ['ai-generated'],
        is_pinned: false,
      });
      if (error) throw error;
      toast.success('Document saved to Atlas');
      onDocCreated?.();
    } catch (err) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-400" />
          AI Doc Generator
        </h2>
      </div>

      <Card className="border-purple-500/20">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Document Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
              <SelectContent>
                {DOC_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Prompt</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the documentation you need... e.g., 'Create a VPN setup guide for SonicWall firewalls'"
                rows={3}
              />
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !selectedTemplate || (selectedTemplate === 'custom' && !customPrompt.trim())}>
            {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Wand2 className="h-4 w-4 mr-2" />Generate Document</>}
          </Button>
        </CardContent>
      </Card>

      {generatedDoc && (
        <Card className="border-cyan-500/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="max-w-sm font-medium" />
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">AI Generated</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generatedDoc); toast.success('Copied'); }}>
                  <Copy className="h-3.5 w-3.5 mr-1" />Copy
                </Button>
                <Button size="sm" onClick={handleSaveToAtlas} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" />{saving ? 'Saving...' : 'Save to Atlas'}
                </Button>
              </div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none bg-muted/30 rounded-lg p-4 max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm">
              {generatedDoc}
            </div>
          </CardContent>
        </Card>
      )}

      {!generatedDoc && !generating && (
        <div className="text-center py-8 space-y-2">
          <Wand2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Auto-generate professional IT documentation from templates</p>
          <p className="text-sm text-muted-foreground">SOPs, security policies, onboarding guides, disaster recovery plans, and more</p>
        </div>
      )}
    </div>
  );
}
