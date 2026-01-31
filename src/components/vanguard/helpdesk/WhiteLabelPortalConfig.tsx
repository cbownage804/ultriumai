import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Globe, Mail, Phone, Image, Code, Eye, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WhiteLabelPortalConfig() {
  const [config, setConfig] = useState({
    company_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#22c55e',
    custom_css: '',
    custom_domain: '',
    footer_text: '',
    support_email: '',
    support_phone: '',
    welcome_message: '',
    is_active: true
  });
  const [showPreview, setShowPreview] = useState(false);

  const queryClient = useQueryClient();

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['portal-branding'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('portal_branding')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        company_name: existingConfig.company_name || '',
        logo_url: existingConfig.logo_url || '',
        favicon_url: existingConfig.favicon_url || '',
        primary_color: existingConfig.primary_color || '#6366f1',
        secondary_color: existingConfig.secondary_color || '#8b5cf6',
        accent_color: existingConfig.accent_color || '#22c55e',
        custom_css: existingConfig.custom_css || '',
        custom_domain: existingConfig.custom_domain || '',
        footer_text: existingConfig.footer_text || '',
        support_email: existingConfig.support_email || '',
        support_phone: existingConfig.support_phone || '',
        welcome_message: existingConfig.welcome_message || '',
        is_active: existingConfig.is_active ?? true
      });
    }
  }, [existingConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (existingConfig) {
        const { error } = await supabase
          .from('portal_branding')
          .update({
            ...config,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portal_branding')
          .insert({
            user_id: user.id,
            ...config
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-branding'] });
      toast.success('Portal branding saved');
    },
    onError: () => toast.error('Failed to save branding')
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">White-Label Portal Configuration</h2>
          <p className="text-sm text-muted-foreground">Customize your customer portal branding</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!config.company_name}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Configuration */}
        <div>
          <Tabs defaultValue="branding" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Brand Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={config.company_name}
                      onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={config.logo_url}
                      onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      value={config.favicon_url}
                      onChange={(e) => setConfig({ ...config, favicon_url: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={config.welcome_message}
                      onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                      placeholder="Welcome to our support portal..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Input
                      value={config.footer_text}
                      onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                      placeholder="© 2024 Your Company. All rights reserved."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.primary_color}
                          onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                          className="h-10 w-14"
                        />
                        <Input
                          value={config.primary_color}
                          onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.secondary_color}
                          onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                          className="h-10 w-14"
                        />
                        <Input
                          value={config.secondary_color}
                          onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={config.accent_color}
                          onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                          className="h-10 w-14"
                        />
                        <Input
                          value={config.accent_color}
                          onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Color Preview */}
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-3">Color Preview</p>
                    <div className="flex gap-3">
                      <div
                        className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        Primary
                      </div>
                      <div
                        className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: config.secondary_color }}
                      >
                        Secondary
                      </div>
                      <div
                        className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: config.accent_color }}
                      >
                        Accent
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={config.support_email}
                      onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input
                      value={config.support_phone}
                      onChange={(e) => setConfig({ ...config, support_phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Custom Domain
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custom Domain</Label>
                    <Input
                      value={config.custom_domain}
                      onChange={(e) => setConfig({ ...config, custom_domain: e.target.value })}
                      placeholder="support.yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Point your CNAME record to portal.vanguard.app
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Custom CSS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.custom_css}
                    onChange={(e) => setConfig({ ...config, custom_css: e.target.value })}
                    placeholder=".portal-header { background: linear-gradient(...); }"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Portal Active</Label>
                      <p className="text-sm text-muted-foreground">Enable or disable the customer portal</p>
                    </div>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(v) => setConfig({ ...config, is_active: v })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {showPreview && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portal Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="min-h-[600px] bg-background"
                style={{
                  '--portal-primary': config.primary_color,
                  '--portal-secondary': config.secondary_color,
                  '--portal-accent': config.accent_color
                } as React.CSSProperties}
              >
                {/* Header */}
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <div className="flex items-center gap-3">
                    {config.logo_url ? (
                      <img src={config.logo_url} alt="Logo" className="h-8" />
                    ) : (
                      <div className="h-8 w-8 bg-white/20 rounded" />
                    )}
                    <span className="font-semibold">{config.company_name || 'Your Company'}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {config.welcome_message || 'Welcome to our support portal'}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium">Submit Ticket</h3>
                      <p className="text-sm text-muted-foreground">Create a new support request</p>
                    </Card>
                    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium">View Tickets</h3>
                      <p className="text-sm text-muted-foreground">Check existing tickets</p>
                    </Card>
                  </div>

                  <Button style={{ backgroundColor: config.primary_color }}>
                    Get Help
                  </Button>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
                  {config.footer_text || '© 2024 Your Company. All rights reserved.'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
