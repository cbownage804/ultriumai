import { useState } from 'react';
import { X, Palette, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WhiteLabelConfig } from '@/hooks/useWhiteLabelExport';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface WhiteLabelPanelProps {
  config: WhiteLabelConfig;
  setConfig: (c: WhiteLabelConfig) => void;
  files: ProjectFile[];
  onApply: (files: ProjectFile[]) => ProjectFile[];
  onPreview: (files: ProjectFile[]) => { path: string; changes: string[] }[];
  onGenerateCSS: () => string;
  onClose: () => void;
}

export function WhiteLabelPanel({ config, setConfig, files, onApply, onPreview, onGenerateCSS, onClose }: WhiteLabelPanelProps) {
  const [preview, setPreview] = useState<{ path: string; changes: string[] }[]>([]);

  const update = (key: keyof WhiteLabelConfig, value: any) => setConfig({ ...config, [key]: value });

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0f] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-pink-400" />
          <span className="text-sm font-medium text-white">White-Label Export</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <Field label="Brand Name" value={config.brandName} onChange={v => update('brandName', v)} />
        <Field label="Logo URL" value={config.logoUrl} onChange={v => update('logoUrl', v)} />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-white/60 text-[10px]">Primary Color</Label>
            <div className="flex gap-1.5 items-center">
              <input type="color" value={config.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="h-7 w-7 rounded border-none bg-transparent cursor-pointer" />
              <Input value={config.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-7 flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-white/60 text-[10px]">Secondary</Label>
            <div className="flex gap-1.5 items-center">
              <input type="color" value={config.secondaryColor} onChange={e => update('secondaryColor', e.target.value)} className="h-7 w-7 rounded border-none bg-transparent cursor-pointer" />
              <Input value={config.secondaryColor} onChange={e => update('secondaryColor', e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-7 flex-1" />
            </div>
          </div>
        </div>
        <Field label="Favicon URL" value={config.favicon} onChange={v => update('favicon', v)} />
        <Field label="Custom Domain" value={config.customDomain} onChange={v => update('customDomain', v)} />
        <Field label="Meta Title" value={config.metaTitle} onChange={v => update('metaTitle', v)} />
        <Field label="Custom Footer" value={config.customFooter} onChange={v => update('customFooter', v)} />
        <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
          <input type="checkbox" checked={config.removeBranding} onChange={e => update('removeBranding', e.target.checked)} className="rounded border-white/20" />
          Remove all Ultrium branding
        </label>

        <Button onClick={() => setPreview(onPreview(files))} variant="ghost" className="w-full h-8 text-xs text-white/50 border border-white/[0.08]">
          <Eye className="h-3 w-3 mr-1.5" /> Preview Changes
        </Button>
        {preview.length > 0 && (
          <div className="space-y-1 bg-white/[0.03] rounded-lg p-2">
            {preview.map(p => (
              <div key={p.path} className="text-[10px]">
                <span className="text-cyan-400 font-mono">{p.path}</span>
                {p.changes.map((c, i) => <p key={i} className="text-white/30 ml-2">• {c}</p>)}
              </div>
            ))}
          </div>
        )}
        <Button className="w-full h-8 bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 border border-pink-500/20 text-xs">
          <Download className="h-3 w-3 mr-1.5" /> Export White-Labeled Build
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-white/60 text-[10px]">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8" />
    </div>
  );
}
