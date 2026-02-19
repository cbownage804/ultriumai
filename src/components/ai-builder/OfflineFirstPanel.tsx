import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WifiOff, X, Plus, Trash2, Download } from 'lucide-react';
import type { OfflineConfig } from '@/hooks/useOfflineFirst';

interface OfflineFirstPanelProps {
  config: OfflineConfig;
  isOnline: boolean;
  onUpdateConfig: (partial: Partial<OfflineConfig>) => void;
  onAddTable: (table: string) => void;
  onRemoveTable: (table: string) => void;
  onToggleOnline: () => void;
  onGenerateSW: () => string;
  onGenerateSyncHook: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function OfflineFirstPanel({
  config, isOnline, onUpdateConfig, onAddTable, onRemoveTable,
  onToggleOnline, onGenerateSW, onGenerateSyncHook, onInsertCode, onClose,
}: OfflineFirstPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Offline-First Mode</span>
          <Badge variant={isOnline ? 'default' : 'destructive'} className="text-[10px]">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Service Worker</Label>
            <Switch checked={config.enableServiceWorker} onCheckedChange={v => onUpdateConfig({ enableServiceWorker: v })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cache TTL (seconds)</Label>
            <Input type="number" value={config.cacheTTL} onChange={e => onUpdateConfig({ cacheTTL: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sync Interval (seconds)</Label>
            <Input type="number" value={config.syncInterval} onChange={e => onUpdateConfig({ syncInterval: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Conflict Resolution</Label>
            <Select value={config.conflictResolution} onValueChange={v => onUpdateConfig({ conflictResolution: v as any })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client-wins">Client Wins</SelectItem>
                <SelectItem value="server-wins">Server Wins</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Offline Tables</Label>
            <div className="flex flex-wrap gap-1">
              {config.offlineTables.map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => onRemoveTable(t)}>
                  {t} <Trash2 className="w-2 h-2" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Input placeholder="Table name" className="h-8 text-xs" id="offline-table-input" onKeyDown={e => {
                if (e.key === 'Enter') {
                  onAddTable((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Simulate Offline</Label>
            <Switch checked={!isOnline} onCheckedChange={onToggleOnline} />
          </div>
          <div className="space-y-2 pt-2">
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateSW())}>
              <Download className="w-3 h-3" /> Generate Service Worker
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateSyncHook())}>
              <Download className="w-3 h-3" /> Generate Sync Hook
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
