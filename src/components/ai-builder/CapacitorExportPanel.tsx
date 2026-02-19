import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, X, Download, Apple, Box } from 'lucide-react';
import type { CapacitorPlatformConfig } from '@/hooks/useCapacitorExport';

interface CapacitorExportPanelProps {
  config: CapacitorPlatformConfig;
  exportResult: any;
  availablePermissions: string[];
  onUpdateConfig: (partial: Partial<CapacitorPlatformConfig>) => void;
  onTogglePlatform: (platform: 'ios' | 'android') => void;
  onTogglePermission: (perm: string) => void;
  onGenerate: () => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function CapacitorExportPanel({
  config, exportResult, availablePermissions,
  onUpdateConfig, onTogglePlatform, onTogglePermission,
  onGenerate, onInsertCode, onClose,
}: CapacitorExportPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Capacitor Export</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">App ID</Label>
            <Input value={config.appId} onChange={e => onUpdateConfig({ appId: e.target.value })} placeholder="com.example.app" className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">App Name</Label>
            <Input value={config.appName} onChange={e => onUpdateConfig({ appName: e.target.value })} placeholder="My App" className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Platforms</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={config.platforms.includes('ios') ? 'default' : 'outline'} onClick={() => onTogglePlatform('ios')} className="text-xs gap-1">
                <Apple className="w-3 h-3" /> iOS
              </Button>
              <Button size="sm" variant={config.platforms.includes('android') ? 'default' : 'outline'} onClick={() => onTogglePlatform('android')} className="text-xs gap-1">
                <Box className="w-3 h-3" /> Android
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Splash Color</Label>
            <Input type="color" value={config.splashColor} onChange={e => onUpdateConfig({ splashColor: e.target.value })} className="h-8 w-16" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status Bar</Label>
            <Select value={config.statusBarStyle} onValueChange={v => onUpdateConfig({ statusBarStyle: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Permissions</Label>
            <div className="flex flex-wrap gap-1">
              {availablePermissions.map(p => (
                <Badge key={p} variant={config.permissions.includes(p) ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => onTogglePermission(p)}>
                  {p}
                </Badge>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={onGenerate} className="w-full gap-1">
            <Download className="w-3 h-3" /> Generate Export
          </Button>
          {exportResult && (
            <div className="space-y-2 mt-3">
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onInsertCode(exportResult.capacitorConfig)}>
                Insert capacitor.config.json
              </Button>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onInsertCode(exportResult.packageJsonPatch)}>
                Insert package.json dependencies
              </Button>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onInsertCode(exportResult.appDelegateNotes)}>
                Insert iOS setup notes
              </Button>
              <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onInsertCode(exportResult.androidManifestNotes)}>
                Insert Android setup notes
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
