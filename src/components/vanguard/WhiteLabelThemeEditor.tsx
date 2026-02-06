import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, Sun, Moon, Monitor, Upload, Eye, Save, 
  RotateCcw, Sparkles, Type, Image, Layout
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: 'sm' | 'base' | 'lg';
  companyName: string;
  companyLogo: string;
  favicon: string;
  customCSS: string;
  hidePoweredBy: boolean;
}

const defaultTheme: ThemeConfig = {
  mode: 'dark',
  primaryColor: '#06b6d4',
  secondaryColor: '#a855f7',
  accentColor: '#3b82f6',
  backgroundColor: '#0a0a0a',
  surfaceColor: '#1a1a2e',
  textColor: '#e2e8f0',
  borderRadius: 8,
  fontSize: 'base',
  companyName: 'Vanguard',
  companyLogo: '',
  favicon: '',
  customCSS: '',
  hidePoweredBy: false,
};

const presetThemes = [
  { name: 'Cyber Neon', primary: '#06b6d4', secondary: '#a855f7', accent: '#22d3ee', bg: '#050a0a' },
  { name: 'Ocean Depths', primary: '#0ea5e9', secondary: '#6366f1', accent: '#14b8a6', bg: '#0c1929' },
  { name: 'Forest Night', primary: '#22c55e', secondary: '#84cc16', accent: '#10b981', bg: '#0d1117' },
  { name: 'Sunset Fire', primary: '#f97316', secondary: '#ef4444', accent: '#f59e0b', bg: '#1a0a0a' },
  { name: 'Royal Purple', primary: '#8b5cf6', secondary: '#d946ef', accent: '#a78bfa', bg: '#1a0d24' },
  { name: 'Clean Light', primary: '#3b82f6', secondary: '#6366f1', accent: '#0ea5e9', bg: '#ffffff' },
];

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-slate-600 cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm bg-slate-800 border-slate-700"
        />
      </div>
    </div>
  );
}

export function WhiteLabelThemeEditor() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    updateTheme({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      backgroundColor: preset.bg,
    });
    toast({
      title: 'Theme Applied',
      description: `"${preset.name}" theme has been applied.`,
    });
  };

  const saveTheme = () => {
    localStorage.setItem('vanguard_theme', JSON.stringify(theme));
    toast({
      title: 'Theme Saved',
      description: 'Your custom theme has been saved successfully.',
    });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    toast({
      title: 'Theme Reset',
      description: 'Theme has been reset to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-400" />
            White-Label Theme Editor
          </h2>
          <p className="text-slate-400 mt-1">Customize the look and feel of your Vanguard instance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveTheme} className="bg-cyan-500 hover:bg-cyan-600">
            <Save className="h-4 w-4 mr-2" />
            Save Theme
          </Button>
        </div>
      </div>

      {/* Preset Themes */}
      <Card className="bg-black/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Quick Presets
          </CardTitle>
          <CardDescription>Choose a preset theme as a starting point</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {presetThemes.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-3 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondary }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }} />
                </div>
                <span className="text-sm text-slate-300 group-hover:text-cyan-300">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Editor */}
      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Image className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <Card className="bg-black/40 border-slate-700/50">
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Customize your brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Mode */}
              <div className="flex items-center gap-4">
                <Label>Theme Mode</Label>
                <div className="flex gap-2">
                  {[
                    { mode: 'light', icon: Sun },
                    { mode: 'dark', icon: Moon },
                    { mode: 'system', icon: Monitor },
                  ].map(({ mode, icon: Icon }) => (
                    <Button
                      key={mode}
                      variant={theme.mode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTheme({ mode: mode as ThemeConfig['mode'] })}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <ColorPicker 
                  label="Primary Color" 
                  value={theme.primaryColor} 
                  onChange={(v) => updateTheme({ primaryColor: v })} 
                />
                <ColorPicker 
                  label="Secondary Color" 
                  value={theme.secondaryColor} 
                  onChange={(v) => updateTheme({ secondaryColor: v })} 
                />
                <ColorPicker 
                  label="Accent Color" 
                  value={theme.accentColor} 
                  onChange={(v) => updateTheme({ accentColor: v })} 
                />
                <ColorPicker 
                  label="Background Color" 
                  value={theme.backgroundColor} 
                  onChange={(v) => updateTheme({ backgroundColor: v })} 
                />
                <ColorPicker 
                  label="Surface Color" 
                  value={theme.surfaceColor} 
                  onChange={(v) => updateTheme({ surfaceColor: v })} 
                />
                <ColorPicker 
                  label="Text Color" 
                  value={theme.textColor} 
                  onChange={(v) => updateTheme({ textColor: v })} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography">
          <Card className="bg-black/40 border-slate-700/50">
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>Configure fonts and text styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Base Font Size</Label>
                <div className="flex gap-2">
                  {(['sm', 'base', 'lg'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={theme.fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTheme({ fontSize: size })}
                    >
                      {size === 'sm' ? 'Small' : size === 'base' ? 'Medium' : 'Large'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Border Radius: {theme.borderRadius}px</Label>
                <Slider
                  value={[theme.borderRadius]}
                  onValueChange={([v]) => updateTheme({ borderRadius: v })}
                  min={0}
                  max={24}
                  step={2}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="bg-black/40 border-slate-700/50">
            <CardHeader>
              <CardTitle>Branding Assets</CardTitle>
              <CardDescription>Upload your company logo and customize branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input 
                  value={theme.companyName}
                  onChange={(e) => updateTheme({ companyName: e.target.value })}
                  placeholder="Your Company Name"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Company Logo URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={theme.companyLogo}
                    onChange={(e) => updateTheme({ companyLogo: e.target.value })}
                    placeholder="https://your-logo.png"
                    className="bg-slate-800 border-slate-700"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={theme.favicon}
                    onChange={(e) => updateTheme({ favicon: e.target.value })}
                    placeholder="https://your-favicon.ico"
                    className="bg-slate-800 border-slate-700"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <Label>Hide "Powered by Vanguard" Badge</Label>
                  <p className="text-xs text-slate-400">Remove the Vanguard branding from footer</p>
                </div>
                <Switch 
                  checked={theme.hidePoweredBy}
                  onCheckedChange={(v) => updateTheme({ hidePoweredBy: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card className="bg-black/40 border-slate-700/50">
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom CSS to further customize the appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea 
                value={theme.customCSS}
                onChange={(e) => updateTheme({ customCSS: e.target.value })}
                placeholder={`/* Custom CSS */\n.custom-class {\n  color: #fff;\n}`}
                className="w-full h-48 p-4 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      {previewMode && (
        <Card 
          className="border-cyan-500/50 overflow-hidden"
          style={{ 
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
          }}
        >
          <CardHeader 
            className="border-b"
            style={{ borderColor: `${theme.primaryColor}33` }}
          >
            <CardTitle style={{ color: theme.primaryColor }}>
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  style={{ 
                    backgroundColor: theme.primaryColor,
                    borderRadius: `${theme.borderRadius}px`,
                  }}
                >
                  Primary Button
                </Button>
                <Button 
                  variant="outline"
                  style={{ 
                    borderColor: theme.secondaryColor,
                    color: theme.secondaryColor,
                    borderRadius: `${theme.borderRadius}px`,
                  }}
                >
                  Secondary
                </Button>
              </div>
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: theme.surfaceColor,
                  borderRadius: `${theme.borderRadius}px`,
                }}
              >
                <p>This is how your content will look with the selected theme.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
