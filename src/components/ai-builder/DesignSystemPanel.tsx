import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDesignTokenGenerator, type BrandConfig, type DesignTokens } from '@/hooks/useDesignTokenGenerator';
import { useThemeVariants, type ThemeVariant } from '@/hooks/useThemeVariants';
import { Palette, Copy, Check, Sun, Moon, Contrast, RotateCcw, Sparkles, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface DesignSystemPanelProps {
  onInjectCSS?: (css: string) => void;
  onClose?: () => void;
}

export function DesignSystemPanel({ onInjectCSS, onClose }: DesignSystemPanelProps) {
  const tokenGen = useDesignTokenGenerator();
  const themeVariants = useThemeVariants();

  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    name: '',
    primaryColor: '#6366f1',
    secondaryColor: '',
    accentColor: '',
    mood: 'professional',
    fontPreference: 'sans-serif',
  });

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'colors' | 'typography' | 'variants'>('brand');

  const handleGenerate = useCallback(() => {
    if (!brandConfig.name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    const tokens = tokenGen.generateTokens(brandConfig);
    themeVariants.generateVariants(tokens);
    toast.success(`Design system generated for "${brandConfig.name}"`);
  }, [brandConfig, tokenGen, themeVariants]);

  const handleInject = useCallback(() => {
    if (!tokenGen.tokens) return;
    const lightCSS = tokenGen.exportAsCSS(tokenGen.tokens);
    const darkCSS = tokenGen.exportDarkCSS(tokenGen.tokens);
    const fullCSS = `${lightCSS}\n\n${darkCSS}`;
    onInjectCSS?.(fullCSS);
    toast.success('Design tokens injected into project');
  }, [tokenGen, onInjectCSS]);

  const handleCopyToken = useCallback((name: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedToken(name);
    setTimeout(() => setCopiedToken(null), 1500);
  }, []);

  const handleExportAll = useCallback(() => {
    if (!themeVariants.collection) return;
    const css = themeVariants.exportAllCSS(themeVariants.collection);
    navigator.clipboard.writeText(css);
    toast.success('All theme variants copied to clipboard');
  }, [themeVariants]);

  const tokens = tokenGen.tokens;
  const collection = themeVariants.collection;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Design System</span>
        </div>
        <div className="flex items-center gap-1">
          {tokens && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportAll}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export all variants</TooltipContent>
            </Tooltip>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>✕</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['brand', 'colors', 'typography', 'variants'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* ─── Brand Config Tab ─── */}
          {activeTab === 'brand' && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Brand Name</Label>
                  <Input
                    value={brandConfig.name}
                    onChange={e => setBrandConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Startup"
                    className="h-8 mt-1 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Primary</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="color"
                        value={brandConfig.primaryColor || '#6366f1'}
                        onChange={e => setBrandConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">{brandConfig.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Secondary</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="color"
                        value={brandConfig.secondaryColor || '#8b5cf6'}
                        onChange={e => setBrandConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Accent</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="color"
                        value={brandConfig.accentColor || '#f59e0b'}
                        onChange={e => setBrandConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Mood</Label>
                  <Select
                    value={brandConfig.mood}
                    onValueChange={v => setBrandConfig(prev => ({ ...prev, mood: v as BrandConfig['mood'] }))}
                  >
                    <SelectTrigger className="h-8 mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['professional', 'playful', 'minimal', 'bold', 'elegant', 'tech', 'organic'].map(m => (
                        <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Font Style</Label>
                  <Select
                    value={brandConfig.fontPreference}
                    onValueChange={v => setBrandConfig(prev => ({ ...prev, fontPreference: v as BrandConfig['fontPreference'] }))}
                  >
                    <SelectTrigger className="h-8 mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sans-serif', 'serif', 'monospace', 'display'].map(f => (
                        <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full gap-2" size="sm">
                <Sparkles className="w-3.5 h-3.5" />
                Generate Design System
              </Button>

              {tokens && (
                <Button onClick={handleInject} variant="outline" className="w-full gap-2" size="sm">
                  <Eye className="w-3.5 h-3.5" />
                  Inject into Project
                </Button>
              )}
            </>
          )}

          {/* ─── Colors Tab ─── */}
          {activeTab === 'colors' && tokens && (
            <div className="space-y-2">
              {Object.entries(tokens.colors).map(([key, token]) => (
                <button
                  key={key}
                  onClick={() => handleCopyToken(key, `hsl(${token.hsl})`)}
                  className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors text-left group"
                >
                  <div
                    className="w-8 h-8 rounded-md border border-border shrink-0"
                    style={{ backgroundColor: token.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">--{token.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{token.hsl}</div>
                  </div>
                  {copiedToken === key ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'colors' && !tokens && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Generate a design system first from the Brand tab.
            </div>
          )}

          {/* ─── Typography Tab ─── */}
          {activeTab === 'typography' && tokens && (
            <div className="space-y-4">
              {Object.entries(tokens.typography).map(([key, typo]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{typo.name}</Badge>
                    <span className="text-[10px] text-muted-foreground">{typo.size} / {typo.weight}</span>
                  </div>
                  <p
                    className="text-foreground truncate"
                    style={{
                      fontFamily: typo.fontFamily,
                      fontWeight: typo.weight,
                      fontSize: typo.size,
                      lineHeight: typo.lineHeight,
                      letterSpacing: typo.letterSpacing,
                    }}
                  >
                    The quick brown fox
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{typo.fontFamily.split(',')[0]}</p>
                  <Separator />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'typography' && !tokens && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Generate a design system first from the Brand tab.
            </div>
          )}

          {/* ─── Variants Tab ─── */}
          {activeTab === 'variants' && collection && (
            <div className="space-y-3">
              {collection.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => themeVariants.setActiveVariant(variant.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    collection.activeVariantId === variant.id
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{variant.name}</span>
                    {variant.id === 'light' && <Sun className="w-3 h-3 text-muted-foreground" />}
                    {variant.id === 'dark' && <Moon className="w-3 h-3 text-muted-foreground" />}
                    {variant.id === 'high-contrast' && <Contrast className="w-3 h-3 text-muted-foreground" />}
                    {variant.id === 'complement' && <RotateCcw className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">{variant.description}</p>
                  {/* Swatch row */}
                  <div className="flex gap-1">
                    {Object.entries(variant.preview).map(([key, hex]) => (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <div
                            className="w-6 h-6 rounded-md border border-border/50"
                            style={{ backgroundColor: hex }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">{key}: {hex}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </button>
              ))}

              <Button onClick={handleExportAll} variant="outline" className="w-full gap-2" size="sm">
                <Copy className="w-3.5 h-3.5" />
                Copy All Variants as CSS
              </Button>
            </div>
          )}

          {activeTab === 'variants' && !collection && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Generate a design system first from the Brand tab.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
