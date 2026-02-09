import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Palette, Upload, Eye, Save, FileText, Image, Type, Layout, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BrandingConfig {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  companyName: string;
  companyTagline?: string;
  footerText: string;
  headerLayout: "left" | "center" | "right";
  showPoweredBy: boolean;
  customCss?: string;
  isDefault: boolean;
}

export function WhiteLabelReports() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeConfig, setActiveConfig] = useState("");
  const [configs, setConfigs] = useState<BrandingConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fontOptions = ["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans Pro"];

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (data && data.length > 0) {
      const mapped = data.map((c: any) => ({
        id: c.id, name: c.name, logoUrl: c.logo_url || undefined,
        primaryColor: c.primary_color, secondaryColor: c.secondary_color, accentColor: c.accent_color,
        fontFamily: c.font_family, companyName: c.company_name, companyTagline: c.company_tagline || undefined,
        footerText: c.footer_text || '', headerLayout: c.header_layout as any, showPoweredBy: c.show_powered_by ?? false,
        customCss: c.custom_css || undefined, isDefault: c.is_default ?? false,
      }));
      setConfigs(mapped);
      setActiveConfig(mapped[0].id);
      setEditingConfig(mapped[0]);
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    const { error } = await supabase.from('white_label_configs').update({
      name: editingConfig.name, primary_color: editingConfig.primaryColor,
      secondary_color: editingConfig.secondaryColor, accent_color: editingConfig.accentColor,
      font_family: editingConfig.fontFamily, company_name: editingConfig.companyName,
      company_tagline: editingConfig.companyTagline || null, footer_text: editingConfig.footerText,
      header_layout: editingConfig.headerLayout, show_powered_by: editingConfig.showPoweredBy,
    } as any).eq('id', editingConfig.id);
    if (error) { toast({ title: 'Failed to save', variant: 'destructive' }); return; }
    setConfigs(prev => prev.map(c => c.id === editingConfig.id ? editingConfig : c));
    toast({ title: "Branding Saved", description: "Your branding configuration has been updated" });
  };

  const handleSelectConfig = (id: string) => {
    setActiveConfig(id);
    const config = configs.find(c => c.id === id);
    if (config) setEditingConfig(config);
  };

  const handleCreateConfig = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('white_label_configs').insert({
      user_id: user.id, name: 'New Branding', primary_color: '#06b6d4',
      secondary_color: '#8b5cf6', accent_color: '#10b981', font_family: 'Inter',
      company_name: 'Company Name', footer_text: '© 2026 Company Name. All rights reserved.',
      header_layout: 'left', show_powered_by: true, is_default: false,
    } as any).select().single();
    if (error || !data) { toast({ title: 'Failed to create', variant: 'destructive' }); return; }
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!editingConfig) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-semibold">White-Label Reports</h3><p className="text-sm text-muted-foreground">Customize report branding for each client</p></div>
          <Button size="sm" className="gap-2" onClick={handleCreateConfig}><Palette className="h-4 w-4" />New Branding</Button>
        </div>
        <Card className="bg-card/50"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Palette className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No branding configs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a branding configuration to customize your reports.</p>
          <Button onClick={handleCreateConfig}><Palette className="h-4 w-4 mr-2" />Create First Config</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-lg font-semibold">White-Label Reports</h3><p className="text-sm text-muted-foreground">Customize report branding for each client</p></div>
        <Button size="sm" className="gap-2" onClick={handleCreateConfig}><Palette className="h-4 w-4" />New Branding</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Branding Configs</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {configs.map(config => (
              <button key={config.id} onClick={() => handleSelectConfig(config.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${activeConfig === config.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-muted/50 hover:bg-muted'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-sm">{config.name}</p><p className="text-xs text-muted-foreground">{config.companyName}</p></div>
                  <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: config.primaryColor }} />
                </div>
                {config.isDefault && <Badge className="mt-2" variant="secondary">Default</Badge>}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                <TabsTrigger value="identity" className="text-xs gap-1"><Image className="h-3 w-3" />Identity</TabsTrigger>
                <TabsTrigger value="colors" className="text-xs gap-1"><Palette className="h-3 w-3" />Colors</TabsTrigger>
                <TabsTrigger value="typography" className="text-xs gap-1"><Type className="h-3 w-3" />Typography</TabsTrigger>
                <TabsTrigger value="layout" className="text-xs gap-1"><Layout className="h-3 w-3" />Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="space-y-4">
                <div className="space-y-2"><Label>Company Name</Label><Input value={editingConfig.companyName} onChange={e => setEditingConfig(p => p ? { ...p, companyName: e.target.value } : p)} /></div>
                <div className="space-y-2"><Label>Tagline</Label><Input value={editingConfig.companyTagline || ''} onChange={e => setEditingConfig(p => p ? { ...p, companyTagline: e.target.value } : p)} placeholder="Your company tagline" /></div>
                <div className="space-y-2"><Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                      {editingConfig.logoUrl ? <img src={editingConfig.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div className="space-y-2"><Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" />Upload Logo</Button><p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2MB.</p></div>
                  </div>
                </div>
                <div className="space-y-2"><Label>Footer Text</Label><Textarea value={editingConfig.footerText} onChange={e => setEditingConfig(p => p ? { ...p, footerText: e.target.value } : p)} rows={2} /></div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map(key => (
                    <div key={key} className="space-y-2">
                      <Label>{key.replace('Color', ' Color').replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editingConfig[key]} onChange={e => setEditingConfig(p => p ? { ...p, [key]: e.target.value } : p)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={editingConfig[key]} onChange={e => setEditingConfig(p => p ? { ...p, [key]: e.target.value } : p)} className="font-mono" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex gap-2">
                    <div className="w-16 h-8 rounded" style={{ backgroundColor: editingConfig.primaryColor }} />
                    <div className="w-16 h-8 rounded" style={{ backgroundColor: editingConfig.secondaryColor }} />
                    <div className="w-16 h-8 rounded" style={{ backgroundColor: editingConfig.accentColor }} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                <div className="space-y-2"><Label>Font Family</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {fontOptions.map(font => (
                      <button key={font} onClick={() => setEditingConfig(p => p ? { ...p, fontFamily: font } : p)}
                        className={`p-3 rounded-lg text-left transition-all ${editingConfig.fontFamily === font ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-muted/50 hover:bg-muted'}`}
                        style={{ fontFamily: font }}>
                        <p className="font-medium">{font}</p><p className="text-xs text-muted-foreground">The quick brown fox</p>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="space-y-2"><Label>Header Logo Position</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map(pos => (
                      <button key={pos} onClick={() => setEditingConfig(p => p ? { ...p, headerLayout: pos } : p)}
                        className={`p-3 rounded-lg capitalize transition-all ${editingConfig.headerLayout === pos ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-muted/50 hover:bg-muted'}`}>
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div><p className="font-medium text-sm">Show "Powered by" Badge</p><p className="text-xs text-muted-foreground">Display Vanguard attribution in footer</p></div>
                  <Switch checked={editingConfig.showPoweredBy} onCheckedChange={checked => setEditingConfig(p => p ? { ...p, showPoweredBy: checked } : p)} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" />Preview</Button>
              <Button onClick={handleSaveConfig} className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Report Preview */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Report Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white text-black" style={{ fontFamily: editingConfig.fontFamily }}>
            <div className={`flex items-center mb-6 pb-4 border-b ${editingConfig.headerLayout === 'center' ? 'justify-center' : editingConfig.headerLayout === 'right' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${editingConfig.headerLayout === 'center' ? 'text-center' : ''}`}>
                <h1 className="text-2xl font-bold" style={{ color: editingConfig.primaryColor }}>{editingConfig.companyName}</h1>
                {editingConfig.companyTagline && <p className="text-sm text-gray-500">{editingConfig.companyTagline}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: editingConfig.secondaryColor }}>Monthly IT Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                {['Devices Managed', 'Tickets Resolved', 'Uptime'].map((label, i) => (
                  <div key={label} className="p-3 rounded-lg" style={{ backgroundColor: `${editingConfig.accentColor}15` }}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold" style={{ color: editingConfig.primaryColor }}>{[142, 89, '99.9%'][i]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
              <p>{editingConfig.footerText}</p>
              {editingConfig.showPoweredBy && <p className="mt-1">Powered by Vanguard</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
