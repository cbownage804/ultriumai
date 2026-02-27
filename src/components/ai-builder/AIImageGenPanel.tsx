import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, Wand2, Download, Copy, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, getDataUrlSizeKB } from '@/utils/imageOptimization';

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  timestamp: Date;
  dimensions: { width: number; height: number };
  sizeKB?: number;
  format?: string;
}

interface AIImageGenPanelProps {
  open: boolean;
  onClose: () => void;
  onInsertAsAsset?: (name: string, dataUrl: string) => void;
  onInsertIntoFile?: (filePath: string, dataUrl: string) => void;
}

const PRESETS = [
  { label: 'Hero Banner', prompt: 'A modern, sleek hero banner for a tech startup with abstract gradient shapes, 16:9 aspect ratio', w: 1920, h: 1080 },
  { label: 'App Icon', prompt: 'A minimal flat app icon with rounded corners, single bold color, modern design', w: 512, h: 512 },
  { label: 'Avatar', prompt: 'A professional avatar illustration, minimal flat style, neutral background', w: 512, h: 512 },
  { label: 'Background', prompt: 'A subtle abstract background pattern with soft gradients, dark theme', w: 1920, h: 1080 },
  { label: 'Product Shot', prompt: 'A clean product mockup on white background with soft shadows', w: 1024, h: 1024 },
  { label: 'Illustration', prompt: 'A modern flat vector illustration for a landing page, vibrant colors', w: 1024, h: 768 },
];

const STYLES = ['Photorealistic', 'Flat Vector', 'Watercolor', 'Pixel Art', '3D Render', 'Line Art', 'Isometric', 'Minimalist'];

export function AIImageGenPanel({ open, onClose, onInsertAsAsset }: AIImageGenPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedImage[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    const styleStr = selectedStyle ? ` Style: ${selectedStyle}.` : '';
    const dimStr = width !== height ? ` Aspect ratio approximately ${width}:${height}.` : '';
    const fullPrompt = `${prompt}.${styleStr}${dimStr} Ultra high resolution.`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('image-generation', {
        body: { prompt: fullPrompt, quality },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Image generation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const rawImageUrl = data?.image;
      if (!rawImageUrl) {
        setError('The model did not return an image. Try a different prompt.');
        return;
      }

      // Optimize the image client-side
      const optimized = await optimizeImage(rawImageUrl, {
        maxWidth: Math.max(width, height),
        quality: 0.85,
        tryWebP: true,
      });

      const img: GeneratedImage = {
        id: crypto.randomUUID(),
        prompt: fullPrompt,
        url: optimized.dataUrl,
        timestamp: new Date(),
        dimensions: { width, height },
        sizeKB: optimized.sizeKB,
        format: optimized.format,
      };

      setGenerated(prev => [img, ...prev]);
      setSelectedImage(img);
      toast.success('Image generated!');
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate image';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, width, height, selectedStyle, quality]);

  const handleInsertAsAsset = useCallback((img: GeneratedImage) => {
    const ext = img.format === 'webp' ? 'webp' : img.format === 'png' ? 'png' : 'jpg';
    const name = `ai-gen-${Date.now()}.${ext}`;
    onInsertAsAsset?.(name, img.url);
    toast.success(`Added "${name}" to project assets`);
  }, [onInsertAsAsset]);

  const handleCopyDataUrl = useCallback((img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url);
    toast.success('Copied image data URL');
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-fuchsia-400" />
            AI Image Generation
            <Badge variant="outline" className="text-[9px] ml-1">Powered by Lovable AI</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-[1fr_280px] gap-4">
          {/* Left: Prompt + results */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="space-y-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[80px] bg-white/5 border-white/10 text-sm resize-none"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Math.min(1920, Math.max(256, +e.target.value)))}
                    className="w-20 h-7 text-xs bg-white/5 border-white/10"
                  />
                  <span className="text-white/30 text-xs">×</span>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.min(1920, Math.max(256, +e.target.value)))}
                    className="w-20 h-7 text-xs bg-white/5 border-white/10"
                  />
                </div>

                {/* Quality toggle */}
                <button
                  onClick={() => setQuality(q => q === 'standard' ? 'high' : 'standard')}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-full border transition-colors",
                    quality === 'high'
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                      : "border-white/10 text-white/40 hover:text-white/60"
                  )}
                >
                  {quality === 'high' ? '✨ HD' : 'Standard'}
                </button>

                <div className="flex-1" />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  size="sm"
                  className="bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Style chips */}
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(prev => prev === s ? null : s)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-full border transition-colors",
                    selectedStyle === s
                      ? "border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-300"
                      : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Generated images grid */}
            <div className="flex-1 overflow-y-auto">
              {generated.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                  <Sparkles className="h-8 w-8" />
                  <p className="text-sm">Generated images will appear here</p>
                  <p className="text-[10px] text-white/15">Real AI-generated images via Lovable AI Gateway</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {generated.map(img => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border cursor-pointer group transition-all",
                        selectedImage?.id === img.id
                          ? "border-fuchsia-500/50 ring-1 ring-fuchsia-500/30"
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <img src={img.url} alt={img.prompt} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[10px] text-white/70 line-clamp-2">{img.prompt}</p>
                      </div>
                      {img.sizeKB && (
                        <div className="absolute top-1 left-1">
                          <Badge variant="outline" className="text-[8px] bg-black/50 border-white/10">
                            {img.sizeKB}KB · {img.format}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInsertAsAsset(img); }}
                          className="h-6 w-6 rounded bg-black/60 flex items-center justify-center text-white/70 hover:text-white"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyDataUrl(img); }}
                          className="h-6 w-6 rounded bg-black/60 flex items-center justify-center text-white/70 hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Presets + selected preview */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5 block">Quick Presets</span>
              <div className="space-y-1">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setPrompt(p.prompt); setWidth(p.w); setHeight(p.h); }}
                    className="w-full text-left px-2.5 py-2 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="font-medium text-white/70">{p.label}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{p.w}×{p.h}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedImage && (
              <div className="mt-auto space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Selected</span>
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <img src={selectedImage.url} alt="" className="w-full h-40 object-cover" />
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleInsertAsAsset(selectedImage)}>
                    <Download className="h-3 w-3 mr-1" />
                    Add to Assets
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleCopyDataUrl(selectedImage)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedImage.dimensions.width}×{selectedImage.dimensions.height}
                  </Badge>
                  {selectedImage.sizeKB && (
                    <Badge variant="outline" className="text-[10px]">
                      {selectedImage.sizeKB}KB {selectedImage.format}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
