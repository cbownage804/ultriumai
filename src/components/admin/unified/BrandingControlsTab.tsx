import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Save } from 'lucide-react';
import { toast } from 'sonner';

const BrandingControlsTab = () => {
  const [branding, setBranding] = useState({ company_name: 'UltriumAI', primary_color: '#6366f1', logo_url: '', favicon_url: '', support_email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('feature_flags').select('*').eq('flag_name', 'branding_config').maybeSingle().then(({ data }) => {
      if (data?.metadata) {
        const meta = data.metadata as any;
        setBranding(prev => ({ ...prev, ...meta }));
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from('feature_flags').upsert({
      flag_key: 'branding_config',
      flag_name: 'branding_config',
      is_enabled: true,
      description: 'Platform branding configuration',
      metadata: branding,
    } as any, { onConflict: 'flag_name' }) as any);
    if (error) toast.error('Failed to save');
    else toast.success('Branding saved');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><Palette className="h-6 w-6" /> Branding Controls</h2><p className="text-muted-foreground">Configure platform branding, colors, and white-label settings</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-lg">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Company Name</Label><Input value={branding.company_name} onChange={e => setBranding(b => ({ ...b, company_name: e.target.value }))} /></div>
            <div><Label>Support Email</Label><Input value={branding.support_email} onChange={e => setBranding(b => ({ ...b, support_email: e.target.value }))} placeholder="support@company.com" /></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-lg">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Primary Color</Label><div className="flex gap-2"><Input type="color" value={branding.primary_color} onChange={e => setBranding(b => ({ ...b, primary_color: e.target.value }))} className="w-14 h-10 p-1" /><Input value={branding.primary_color} onChange={e => setBranding(b => ({ ...b, primary_color: e.target.value }))} /></div></div>
            <div><Label>Logo URL</Label><Input value={branding.logo_url} onChange={e => setBranding(b => ({ ...b, logo_url: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>Favicon URL</Label><Input value={branding.favicon_url} onChange={e => setBranding(b => ({ ...b, favicon_url: e.target.value }))} placeholder="https://..." /></div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Branding'}</Button>
    </div>
  );
};

export default BrandingControlsTab;
