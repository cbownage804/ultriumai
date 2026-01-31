import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Upload, Eye, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WhiteLabelConfig {
  branding: {
    company_name: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  email?: {
    from_name: string;
    from_email: string;
    reply_to?: string;
    footer_text?: string;
  };
  portal?: {
    welcome_message?: string;
    support_phone?: string;
    support_email?: string;
    enable_chat?: boolean;
  };
  features?: {
    hide_powered_by: boolean;
    custom_css?: string;
  };
}

interface WhiteLabelSettingsProps {
  organizations: { id: string; name: string }[];
}

const defaultConfig: WhiteLabelConfig = {
  branding: {
    company_name: 'Vanguard',
    primary_color: '#0891b2',
    secondary_color: '#7c3aed',
    accent_color: '#10b981'
  },
  email: {
    from_name: 'Support Team',
    from_email: 'support@example.com'
  },
  portal: {
    welcome_message: 'Welcome to your support portal',
    enable_chat: true
  },
  features: {
    hide_powered_by: false
  }
};

export const WhiteLabelSettings = ({ organizations }: WhiteLabelSettingsProps) => {
  const { user } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    if (selectedOrg) {
      loadConfig(selectedOrg);
    }
  }, [selectedOrg]);

  const loadConfig = async (orgId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('white-label-config', {
        body: { action: 'get_config', org_id: orgId, user_id: user?.id }
      });

      if (!error && data?.config) {
        setConfig(data.config);
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!selectedOrg) {
      toast.error('Select an organization first');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('white-label-config', {
        body: { 
          action: 'save_config', 
          org_id: selectedOrg, 
          user_id: user?.id,
          config 
        }
      });

      if (error) throw error;
      toast.success('White label configuration saved');
    } catch (err: any) {
      toast.error('Failed to save configuration', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreview = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('white-label-config', {
        body: { action: 'preview_portal', config }
      });

      if (!error && data?.preview_html) {
        setPreviewHtml(data.preview_html);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const logoType = file.type.split('/')[1];

      try {
        const { data, error } = await supabase.functions.invoke('white-label-config', {
          body: { 
            action: 'upload_logo', 
            org_id: selectedOrg, 
            user_id: user?.id,
            logo_base64: base64,
            logo_type: logoType
          }
        });

        if (!error && data?.logo_url) {
          setConfig(prev => ({
            ...prev,
            branding: { ...prev.branding, logo_url: data.logo_url }
          }));
          toast.success('Logo uploaded');
        }
      } catch (err: any) {
        toast.error('Failed to upload logo', { description: err.message });
      }
    };
    reader.readAsDataURL(file);
  };

  const updateBranding = (key: keyof WhiteLabelConfig['branding'], value: string) => {
    setConfig(prev => ({
      ...prev,
      branding: { ...prev.branding, [key]: value }
    }));
  };

  const updateEmail = (key: keyof NonNullable<WhiteLabelConfig['email']>, value: string) => {
    setConfig(prev => ({
      ...prev,
      email: { ...prev.email!, [key]: value }
    }));
  };

  const updatePortal = (key: keyof NonNullable<WhiteLabelConfig['portal']>, value: any) => {
    setConfig(prev => ({
      ...prev,
      portal: { ...prev.portal!, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label className="text-white/80 mb-2 block">Select Organization</Label>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
              <SelectValue placeholder="Choose organization to configure" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-cyan-500/30">
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id} className="text-white/80">
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedOrg && (
        <>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-cyan-400" />
              <p className="text-white/60 mt-2">Loading configuration...</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Branding Section */}
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-cyan-400" />
                    Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Company Name</Label>
                    <Input
                      value={config.branding.company_name}
                      onChange={(e) => updateBranding('company_name', e.target.value)}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Logo</Label>
                    <div className="flex items-center gap-4">
                      {config.branding.logo_url ? (
                        <img 
                          src={config.branding.logo_url} 
                          alt="Logo" 
                          className="h-12 w-auto rounded border border-cyan-500/20"
                        />
                      ) : (
                        <div className="h-12 w-24 rounded border border-dashed border-cyan-500/30 flex items-center justify-center text-white/40 text-xs">
                          No logo
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <Button variant="outline" size="sm" className="border-cyan-500/30 text-white/80" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-white/80">Primary</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.branding.primary_color}
                          onChange={(e) => updateBranding('primary_color', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={config.branding.primary_color}
                          onChange={(e) => updateBranding('primary_color', e.target.value)}
                          className="bg-black/40 border-cyan-500/20 text-white text-xs flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Secondary</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.branding.secondary_color}
                          onChange={(e) => updateBranding('secondary_color', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={config.branding.secondary_color}
                          onChange={(e) => updateBranding('secondary_color', e.target.value)}
                          className="bg-black/40 border-cyan-500/20 text-white text-xs flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">Accent</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.branding.accent_color}
                          onChange={(e) => updateBranding('accent_color', e.target.value)}
                          className="h-10 w-10 rounded cursor-pointer"
                        />
                        <Input
                          value={config.branding.accent_color}
                          onChange={(e) => updateBranding('accent_color', e.target.value)}
                          className="bg-black/40 border-cyan-500/20 text-white text-xs flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email & Portal Settings */}
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Email & Portal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white/80">From Name</Label>
                      <Input
                        value={config.email?.from_name || ''}
                        onChange={(e) => updateEmail('from_name', e.target.value)}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/80">From Email</Label>
                      <Input
                        value={config.email?.from_email || ''}
                        onChange={(e) => updateEmail('from_email', e.target.value)}
                        className="bg-black/40 border-cyan-500/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">Welcome Message</Label>
                    <Textarea
                      value={config.portal?.welcome_message || ''}
                      onChange={(e) => updatePortal('welcome_message', e.target.value)}
                      className="bg-black/40 border-cyan-500/20 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Enable Chat Widget</p>
                      <p className="text-white/50 text-sm">Show chat support on client portal</p>
                    </div>
                    <Switch
                      checked={config.portal?.enable_chat || false}
                      onCheckedChange={(checked) => updatePortal('enable_chat', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Hide "Powered By"</p>
                      <p className="text-white/50 text-sm">Remove Vanguard branding</p>
                    </div>
                    <Switch
                      checked={config.features?.hide_powered_by || false}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        features: { ...prev.features!, hide_powered_by: checked }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={saveConfig} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
            <Button onClick={generatePreview} variant="outline" className="border-cyan-500/30 text-white/80">
              <Eye className="h-4 w-4 mr-2" />
              Preview Portal
            </Button>
          </div>

          {previewHtml && (
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Portal Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-64 rounded-lg border border-cyan-500/20"
                  title="Portal Preview"
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedOrg && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
          <p className="text-white/60">Select an organization to configure white label settings</p>
        </div>
      )}
    </div>
  );
};
