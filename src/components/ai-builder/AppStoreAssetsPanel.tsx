import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Store, X, Plus, Trash2, Download, FileText } from 'lucide-react';
import type { AppStoreMetadata, ScreenshotConfig } from '@/hooks/useAppStoreAssets';

interface AppStoreAssetsPanelProps {
  metadata: AppStoreMetadata;
  screenshots: ScreenshotConfig[];
  devicePresets: { device: string; width: number; height: number }[];
  appCategories: string[];
  onUpdateMetadata: (partial: Partial<AppStoreMetadata>) => void;
  onAddKeyword: (kw: string) => void;
  onRemoveKeyword: (kw: string) => void;
  onAddScreenshot: (device: string) => void;
  onUpdateScreenshot: (id: string, partial: Partial<ScreenshotConfig>) => void;
  onRemoveScreenshot: (id: string) => void;
  onGenerateFastlane: () => string;
  onGenerateStoreListing: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function AppStoreAssetsPanel({
  metadata, screenshots, devicePresets, appCategories,
  onUpdateMetadata, onAddKeyword, onRemoveKeyword,
  onAddScreenshot, onUpdateScreenshot, onRemoveScreenshot,
  onGenerateFastlane, onGenerateStoreListing, onInsertCode, onClose,
}: AppStoreAssetsPanelProps) {
  const [kwInput, setKwInput] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">App Store Assets</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">App Name</Label>
            <Input value={metadata.appName} onChange={e => onUpdateMetadata({ appName: e.target.value })} className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Subtitle</Label>
            <Input value={metadata.subtitle} onChange={e => onUpdateMetadata({ subtitle: e.target.value })} className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={metadata.description} onChange={e => onUpdateMetadata({ description: e.target.value })} className="text-xs min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select value={metadata.category} onValueChange={v => onUpdateMetadata({ category: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {appCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Keywords</Label>
            <div className="flex flex-wrap gap-1">
              {metadata.keywords.map(k => (
                <Badge key={k} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => onRemoveKeyword(k)}>
                  {k} <X className="w-2 h-2" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={kwInput} onChange={e => setKwInput(e.target.value)} placeholder="Add keyword" className="h-8 text-xs"
                onKeyDown={e => { if (e.key === 'Enter' && kwInput.trim()) { onAddKeyword(kwInput.trim()); setKwInput(''); } }} />
              <Button size="sm" variant="outline" onClick={() => { if (kwInput.trim()) { onAddKeyword(kwInput.trim()); setKwInput(''); } }}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">URLs</Label>
            <Input value={metadata.privacyUrl} onChange={e => onUpdateMetadata({ privacyUrl: e.target.value })} placeholder="Privacy URL" className="h-8 text-xs" />
            <Input value={metadata.supportUrl} onChange={e => onUpdateMetadata({ supportUrl: e.target.value })} placeholder="Support URL" className="h-8 text-xs" />
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Screenshots ({screenshots.length})</Label>
              <Select onValueChange={onAddScreenshot}>
                <SelectTrigger className="h-7 text-[10px] w-[160px]"><SelectValue placeholder="Add device..." /></SelectTrigger>
                <SelectContent>
                  {devicePresets.map(d => <SelectItem key={d.device} value={d.device}>{d.device}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {screenshots.map(s => (
              <div key={s.id} className="p-2 rounded border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-foreground">{s.device}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{s.dimensions.width}×{s.dimensions.height}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveScreenshot(s.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateFastlane())}>
              <FileText className="w-3 h-3" /> Generate Fastlane Metadata
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateStoreListing())}>
              <Download className="w-3 h-3" /> Generate Store Listing HTML
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
