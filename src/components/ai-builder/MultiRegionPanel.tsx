import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Globe, Plus, Trash2, RefreshCw, Star, Code, X } from 'lucide-react';
import type { DeployRegion, RegionConfig } from '@/hooks/useMultiRegionDeploy';

interface MultiRegionPanelProps {
  regions: DeployRegion[];
  config: RegionConfig;
  setConfig: (c: RegionConfig) => void;
  AVAILABLE_REGIONS: { name: string; code: string; location: string }[];
  addRegion: (code: string) => void;
  removeRegion: (id: string) => void;
  setPrimary: (id: string) => void;
  toggleRegion: (id: string) => void;
  simulateHealthCheck: () => void;
  generateNginxConfig: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

const statusColors = { healthy: 'bg-green-500', degraded: 'bg-yellow-500', down: 'bg-red-500' };

export function MultiRegionPanel({
  regions, config, setConfig, AVAILABLE_REGIONS,
  addRegion, removeRegion, setPrimary, toggleRegion,
  simulateHealthCheck, generateNginxConfig, onInsertCode, onClose,
}: MultiRegionPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Multi-Region Deploy</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Routing Strategy</Label>
            <Select value={config.routingStrategy} onValueChange={v => setConfig({ ...config, routingStrategy: v as RegionConfig['routingStrategy'] })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latency">Latency-based</SelectItem>
                <SelectItem value="geo">Geographic</SelectItem>
                <SelectItem value="round-robin">Round Robin</SelectItem>
                <SelectItem value="failover">Failover</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={simulateHealthCheck}>
              <RefreshCw className="w-3 h-3 mr-1" /> Check
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><Label className="text-xs">Health Path</Label><Input value={config.healthCheckPath} onChange={e => setConfig({ ...config, healthCheckPath: e.target.value })} className="h-7 text-xs" /></div>
          <div className="flex items-end gap-1 pb-0.5"><Switch checked={config.enableCDN} onCheckedChange={v => setConfig({ ...config, enableCDN: v })} /><span className="text-xs text-muted-foreground">CDN</span></div>
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <Label className="text-xs font-semibold">Add Region</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {AVAILABLE_REGIONS.filter(r => !regions.some(er => er.code === r.code)).map(r => (
            <Badge key={r.code} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10" onClick={() => addRegion(r.code)}>
              <Plus className="w-2 h-2 mr-1" /> {r.name}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {regions.map(r => (
          <div key={r.id} className="border border-border rounded-lg p-2 mb-2 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[r.healthStatus]}`} />
                <span className="text-sm font-medium">{r.name}</span>
                {r.isPrimary && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={r.isActive} onCheckedChange={() => toggleRegion(r.id)} />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRegion(r.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{r.location}</span>
              <span>{r.latencyMs}ms</span>
            </div>
            {!r.isPrimary && (
              <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => setPrimary(r.id)}>Set Primary</Button>
            )}
          </div>
        ))}
        {regions.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Add regions to configure multi-region deployment.</p>}
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button size="sm" className="w-full text-xs" onClick={() => onInsertCode(generateNginxConfig())}>
          <Code className="w-3 h-3 mr-1" /> Generate Nginx Config
        </Button>
      </div>
    </div>
  );
}
