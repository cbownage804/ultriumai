import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Upload, Eye, Save, Loader2, Globe, Type, Image as ImageIcon } from 'lucide-react';
import { useResellerPartner, useResellerThemes } from '@/hooks/useResellerData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function WhiteLabelSettings() {
  const { partner } = useResellerPartner();
  const { themes, upsertTheme } = useResellerThemes(partner?.id);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const activeTheme = themes.find(t => t.is_active) || null;
  const canWhiteLabel = partner?.tier === 'gold' || partner?.tier === 'platinum';
  const canFullWhiteLabel = partner?.tier === 'platinum';

  const [form, setForm] = useState({
    primary_color: activeTheme?.primary_color || '#06b6d4',
    secondary_color: activeTheme?.secondary_color || '#8b5cf6',
    accent_color: activeTheme?.accent_color || '#f59e0b',
    background_color: activeTheme?.background_color || '#050a0a',
    company_name_override: activeTheme?.company_name_override || '',
    tagline: activeTheme?.tagline || '',
    custom_domain: activeTheme?.custom_domain || '',
    hide_ultrium_branding: activeTheme?.hide_ultrium_branding || false,
    powered_by_text: activeTheme?.powered_by_text || 'Powered by UltriumAI',
    logo_url: activeTheme?.logo_url || '',
  });

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!partner) return;
    try {
      await upsertTheme.mutateAsync({
        ...(activeTheme?.id ? { id: activeTheme.id } : {}),
        partner_id: partner.id,
        ...form,
        is_active: true,
      });
      toast({ title: 'Theme Saved', description: 'Your white-label theme has been updated.' });
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partner) return;
    setUploading(true);
    try {
      const fileName = `reseller-logos/${partner.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('social-media-images')
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('social-media-images').getPublicUrl(fileName);
      updateField('logo_url', urlData.publicUrl);
      toast({ title: 'Logo Uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        <p>Join the Partner Program first to access white-label settings.</p>
      </div>
    );
  }

  if (!canWhiteLabel) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Palette className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">White-Label Available on Gold+</h2>
        <p className="text-white/50 mb-4">Upgrade to Gold or Platinum to customize branding for your clients.</p>
        <Badge className="bg-amber-500/20 text-amber-400 border-0">Your tier: {partner.tier}</Badge>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-cyan-400" />
            White-Label Theming
          </h1>
          <p className="text-white/50 text-sm">Customize the look and feel for your clients</p>
        </div>
        <Button onClick={handleSave} disabled={upsertTheme.isPending} className="bg-gradient-to-r from-cyan-500 to-purple-600">
          {upsertTheme.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Theme
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Identity */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Type className="h-4 w-4" /> Brand Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white/70">Company Name</Label>
              <Input value={form.company_name_override} onChange={(e) => updateField('company_name_override', e.target.value)} placeholder="Your Company Name" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Tagline</Label>
              <Input value={form.tagline} onChange={(e) => updateField('tagline', e.target.value)} placeholder="Your security partner" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/70">Logo</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-contain bg-white/10" />}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-white/20 text-white">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  {form.logo_url ? 'Change' : 'Upload'}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            {canFullWhiteLabel && (
              <div>
                <Label className="text-white/70">Custom Domain</Label>
                <Input value={form.custom_domain} onChange={(e) => updateField('custom_domain', e.target.value)} placeholder="security.yourcompany.com" className="bg-white/5 border-white/10 text-white" />
                <p className="text-xs text-white/30 mt-1">Platinum only. Contact support for DNS setup.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Palette className="h-4 w-4" /> Color Scheme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Primary Color', key: 'primary_color' },
              { label: 'Secondary Color', key: 'secondary_color' },
              { label: 'Accent Color', key: 'accent_color' },
              { label: 'Background Color', key: 'background_color' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={(form as any)[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="h-8 w-8 rounded border border-white/20 cursor-pointer"
                />
                <div className="flex-1">
                  <Label className="text-white/70 text-sm">{label}</Label>
                  <Input value={(form as any)[key]} onChange={(e) => updateField(key, e.target.value)} className="bg-white/5 border-white/10 text-white text-xs h-7 mt-0.5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Branding Controls */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Globe className="h-4 w-4" /> Branding Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white/70">Hide UltriumAI Branding</Label>
                <p className="text-xs text-white/30">{canFullWhiteLabel ? 'Full white-label enabled' : 'Platinum required'}</p>
              </div>
              <Switch
                checked={form.hide_ultrium_branding}
                onCheckedChange={(v) => updateField('hide_ultrium_branding', v)}
                disabled={!canFullWhiteLabel}
              />
            </div>
            {!form.hide_ultrium_branding && (
              <div>
                <Label className="text-white/70">"Powered by" Text</Label>
                <Input value={form.powered_by_text} onChange={(e) => updateField('powered_by_text', e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Eye className="h-4 w-4" /> Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-white/10" style={{ backgroundColor: form.background_color }}>
              <div className="p-4 border-b border-white/10 flex items-center gap-3" style={{ borderColor: `${form.primary_color}33` }}>
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-6 w-6 rounded object-contain" />
                ) : (
                  <div className="h-6 w-6 rounded" style={{ backgroundColor: form.primary_color }} />
                )}
                <span className="text-sm font-bold" style={{ color: form.primary_color }}>
                  {form.company_name_override || 'Your Company'}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-2 rounded" style={{ backgroundColor: form.primary_color, width: '60%' }} />
                <div className="h-2 rounded" style={{ backgroundColor: form.secondary_color, width: '40%' }} />
                <div className="h-2 rounded" style={{ backgroundColor: form.accent_color, width: '50%' }} />
                <p className="text-xs mt-3" style={{ color: `${form.primary_color}99` }}>
                  {form.tagline || 'Your security tagline here'}
                </p>
                {!form.hide_ultrium_branding && (
                  <p className="text-[10px] mt-2" style={{ color: `${form.primary_color}44` }}>
                    {form.powered_by_text}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
