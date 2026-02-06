import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, Eye, Globe, Palette, Mail, Phone, Clock, MapPin, Code, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CoManagedBrandingEditorProps {
  organizationId: string;
}

interface BrandingConfig {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  portal_title: string;
  portal_welcome_message: string;
  portal_footer_text: string;
  custom_css: string;
  custom_domain: string;
  email_from_name: string;
  email_signature_html: string;
  support_email_display: string;
  support_email_reply_to: string;
  support_phone_display: string;
  support_hours_display: string;
  physical_address_display: string;
}

const defaultBranding: BrandingConfig = {
  logo_url: "",
  favicon_url: "",
  primary_color: "#0066cc",
  secondary_color: "#004499",
  accent_color: "#00aaff",
  portal_title: "IT Support Portal",
  portal_welcome_message: "Welcome! How can we help you today?",
  portal_footer_text: "© 2026 IT Department. All rights reserved.",
  custom_css: "",
  custom_domain: "",
  email_from_name: "",
  email_signature_html: "",
  support_email_display: "",
  support_email_reply_to: "",
  support_phone_display: "",
  support_hours_display: "",
  physical_address_display: "",
};

export function CoManagedBrandingEditor({ organizationId }: CoManagedBrandingEditorProps) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) loadBranding();
  }, [organizationId]);

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comanaged_branding')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!error && data) {
        setExistingId(data.id);
        setBranding({
          logo_url: data.logo_url || "",
          favicon_url: data.favicon_url || "",
          primary_color: data.primary_color || defaultBranding.primary_color,
          secondary_color: data.secondary_color || defaultBranding.secondary_color,
          accent_color: data.accent_color || defaultBranding.accent_color,
          portal_title: data.portal_title || defaultBranding.portal_title,
          portal_welcome_message: data.portal_welcome_message || defaultBranding.portal_welcome_message,
          portal_footer_text: data.portal_footer_text || defaultBranding.portal_footer_text,
          custom_css: data.custom_css || "",
          custom_domain: data.custom_domain || "",
          email_from_name: data.email_from_name || "",
          email_signature_html: data.email_signature_html || "",
          support_email_display: data.support_email_display || "",
          support_email_reply_to: data.support_email_reply_to || "",
          support_phone_display: data.support_phone_display || "",
          support_hours_display: data.support_hours_display || "",
          physical_address_display: data.physical_address_display || "",
        });
      } else {
        setExistingId(null);
        setBranding(defaultBranding);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setIsSaving(true);
    try {
      const payload = {
        organization_id: organizationId,
        ...branding,
        updated_at: new Date().toISOString(),
      };

      if (existingId) {
        const { error } = await supabase
          .from('comanaged_branding')
          .update(payload)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('comanaged_branding')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setExistingId(data.id);
      }
      toast.success("Portal branding saved successfully");
    } catch (err: any) {
      toast.error("Failed to save branding", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const ext = file.name.split('.').pop();
      const filePath = `comanaged/${organizationId}/${type}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setBranding(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'favicon_url']: publicUrl
      }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded`);
    } catch (err: any) {
      toast.error(`Failed to upload ${type}`, { description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="identity" className="data-[state=active]:bg-cyan-500/20">Identity</TabsTrigger>
          <TabsTrigger value="portal" className="data-[state=active]:bg-cyan-500/20">Portal</TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-cyan-500/20">Contact</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-cyan-500/20">Advanced</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Palette className="h-4 w-4 text-cyan-400" />
                Visual Identity
              </h4>

              <div className="flex items-start gap-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Logo</Label>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'logo')} />
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-cyan-500/30 flex items-center justify-center bg-black/20 hover:bg-cyan-500/10 transition-colors overflow-hidden">
                      {branding.logo_url ? (
                        <img src={branding.logo_url} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Upload className="h-6 w-6 text-white/40" />
                      )}
                    </div>
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-sm">Favicon</Label>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'favicon')} />
                    <div className="h-12 w-12 rounded-lg border-2 border-dashed border-cyan-500/30 flex items-center justify-center bg-black/20 hover:bg-cyan-500/10 transition-colors overflow-hidden">
                      {branding.favicon_url ? (
                        <img src={branding.favicon_url} alt="Favicon" className="h-full w-full object-contain" />
                      ) : (
                        <Upload className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'primary_color' as const, label: 'Primary' },
                  { key: 'secondary_color' as const, label: 'Secondary' },
                  { key: 'accent_color' as const, label: 'Accent' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-white/60 text-xs">{label}</Label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={branding[key]}
                        onChange={(e) => setBranding(prev => ({ ...prev, [key]: e.target.value }))}
                        className="h-8 w-10 rounded cursor-pointer"
                      />
                      <Input
                        value={branding[key]}
                        onChange={(e) => setBranding(prev => ({ ...prev, [key]: e.target.value }))}
                        className="bg-black/40 border-cyan-500/30 text-white text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Color preview */}
              <div className="flex gap-2">
                {[branding.primary_color, branding.secondary_color, branding.accent_color].map((color, i) => (
                  <div key={i} className="h-8 flex-1 rounded" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-medium">Portal Content</h4>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Portal Title</Label>
                <Input
                  value={branding.portal_title}
                  onChange={(e) => setBranding(prev => ({ ...prev, portal_title: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Welcome Message</Label>
                <Textarea
                  value={branding.portal_welcome_message}
                  onChange={(e) => setBranding(prev => ({ ...prev, portal_welcome_message: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 text-sm">Footer Text</Label>
                <Input
                  value={branding.portal_footer_text}
                  onChange={(e) => setBranding(prev => ({ ...prev, portal_footer_text: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Portal Tab - Live Preview */}
        <TabsContent value="portal" className="mt-4">
          <Card className="bg-black/20 border-cyan-500/20 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                Live Portal Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-white rounded-b-lg min-h-[400px]">
                {/* Portal Header */}
                <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: branding.primary_color }}>
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
                  ) : (
                    <div className="h-8 w-8 bg-white/20 rounded" />
                  )}
                  <span className="font-semibold">{branding.portal_title || 'Support Portal'}</span>
                </div>

                {/* Portal Content */}
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {branding.portal_welcome_message || 'Welcome!'}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900">Submit Ticket</h3>
                      <p className="text-sm text-gray-500">Create a new support request</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900">View Tickets</h3>
                      <p className="text-sm text-gray-500">Check your open requests</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900">Knowledge Base</h3>
                      <p className="text-sm text-gray-500">Search our help articles</p>
                    </div>
                    <div className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium text-gray-900">Device Status</h3>
                      <p className="text-sm text-gray-500">View your device health</p>
                    </div>
                  </div>

                  <button
                    className="px-4 py-2 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: branding.accent_color }}
                  >
                    Get Help Now
                  </button>

                  {/* Contact info preview */}
                  {(branding.support_email_display || branding.support_phone_display) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
                      {branding.support_phone_display && (
                        <p>📞 {branding.support_phone_display}</p>
                      )}
                      {branding.support_email_display && (
                        <p>✉️ {branding.support_email_display}</p>
                      )}
                      {branding.support_hours_display && (
                        <p>🕐 {branding.support_hours_display}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Portal Footer */}
                <div className="p-3 border-t text-center text-xs text-gray-400">
                  {branding.portal_footer_text}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  Email Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm">From Name</Label>
                  <Input
                    value={branding.email_from_name}
                    onChange={(e) => setBranding(prev => ({ ...prev, email_from_name: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="IT Support Team"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm">Display Email</Label>
                  <Input
                    value={branding.support_email_display}
                    onChange={(e) => setBranding(prev => ({ ...prev, support_email_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="support@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm">Reply-To Email</Label>
                  <Input
                    value={branding.support_email_reply_to}
                    onChange={(e) => setBranding(prev => ({ ...prev, support_email_reply_to: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="helpdesk@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm">Email Signature (HTML)</Label>
                  <Textarea
                    value={branding.email_signature_html}
                    onChange={(e) => setBranding(prev => ({ ...prev, email_signature_html: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white font-mono text-xs"
                    rows={3}
                    placeholder="<p>Best regards,<br/>IT Support Team</p>"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-cyan-400" />
                  Support Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm">Phone Number</Label>
                  <Input
                    value={branding.support_phone_display}
                    onChange={(e) => setBranding(prev => ({ ...prev, support_phone_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Support Hours
                  </Label>
                  <Input
                    value={branding.support_hours_display}
                    onChange={(e) => setBranding(prev => ({ ...prev, support_hours_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    placeholder="Mon-Fri 8am-6pm EST"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/60 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Physical Address
                  </Label>
                  <Textarea
                    value={branding.physical_address_display}
                    onChange={(e) => setBranding(prev => ({ ...prev, physical_address_display: e.target.value }))}
                    className="bg-black/40 border-cyan-500/30 text-white"
                    rows={2}
                    placeholder="123 Main St, Suite 100&#10;Anytown, ST 12345"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Custom Domain (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={branding.custom_domain}
                onChange={(e) => setBranding(prev => ({ ...prev, custom_domain: e.target.value }))}
                className="bg-black/40 border-cyan-500/30 text-white"
                placeholder="support.clientdomain.com"
              />
              <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 text-white/80">
                Verify DNS
              </Button>
            </div>
            <p className="text-xs text-white/40">Point a CNAME record to: portal.yourmsp.com</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 flex items-center gap-2">
              <Code className="h-4 w-4 text-cyan-400" />
              Custom CSS (Advanced)
            </Label>
            <Textarea
              value={branding.custom_css}
              onChange={(e) => setBranding(prev => ({ ...prev, custom_css: e.target.value }))}
              className="bg-black/40 border-cyan-500/30 text-white font-mono text-sm"
              rows={6}
              placeholder=".portal-header { background: linear-gradient(...) }"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
        <div className="flex items-center gap-2 text-xs text-white/40">
          {existingId && (
            <>
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span>Saved configuration found</span>
            </>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Portal Branding
        </Button>
      </div>
    </div>
  );
}
