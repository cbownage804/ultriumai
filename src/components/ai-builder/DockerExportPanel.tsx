import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Container, Plus, Trash2, Code, X } from 'lucide-react';
import type { DockerConfig, ComposeService } from '@/hooks/useDockerExport';

interface DockerExportPanelProps {
  config: DockerConfig;
  setConfig: (c: DockerConfig) => void;
  services: ComposeService[];
  addEnvVar: (key: string, value: string, isSecret?: boolean) => void;
  removeEnvVar: (key: string) => void;
  addService: (name: string, type: ComposeService['type']) => void;
  removeService: (id: string) => void;
  generateDockerfile: () => string;
  generateDockerCompose: () => string;
  generateNginxConf: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function DockerExportPanel({
  config, setConfig, services,
  addEnvVar, removeEnvVar, addService, removeService,
  generateDockerfile, generateDockerCompose, generateNginxConf,
  onInsertCode, onClose,
}: DockerExportPanelProps) {
  const [tab, setTab] = React.useState<'config' | 'services' | 'output'>('config');

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Container className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Docker Export</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex border-b border-border">
        {(['config', 'services', 'output'] as const).map(t => (
          <button key={t} className={`flex-1 py-2 text-xs font-medium capitalize ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'config' && (
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            <div><Label className="text-xs">Base Image</Label>
              <Select value={config.baseImage} onValueChange={v => setConfig({ ...config, baseImage: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="node:20-alpine">Node 20 Alpine</SelectItem>
                  <SelectItem value="node:18-alpine">Node 18 Alpine</SelectItem>
                  <SelectItem value="node:20-slim">Node 20 Slim</SelectItem>
                  <SelectItem value="oven/bun:latest">Bun Latest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Port</Label><Input type="number" value={config.port} onChange={e => setConfig({ ...config, port: parseInt(e.target.value) || 3000 })} className="h-7 text-xs" /></div>
              <div><Label className="text-xs">Build Cmd</Label><Input value={config.buildCommand} onChange={e => setConfig({ ...config, buildCommand: e.target.value })} className="h-7 text-xs" /></div>
            </div>
            <div><Label className="text-xs">Start Cmd</Label><Input value={config.startCommand} onChange={e => setConfig({ ...config, startCommand: e.target.value })} className="h-7 text-xs" /></div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1 text-xs"><Switch checked={config.enableNginx} onCheckedChange={v => setConfig({ ...config, enableNginx: v })} />Nginx</label>
              <label className="flex items-center gap-1 text-xs"><Switch checked={config.enableSSL} onCheckedChange={v => setConfig({ ...config, enableSSL: v })} />SSL</label>
              <label className="flex items-center gap-1 text-xs"><Switch checked={config.enableHealthCheck} onCheckedChange={v => setConfig({ ...config, enableHealthCheck: v })} />Health Check</label>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Env Variables ({config.envVars.length})</Label>
                <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addEnvVar('NEW_VAR', 'value')}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {config.envVars.map(e => (
                <div key={e.key} className="flex items-center gap-1 mt-1">
                  <Input value={e.key} className="h-6 text-xs flex-1 font-mono" readOnly />
                  <Input value={e.isSecret ? '••••' : e.value} className="h-6 text-xs flex-1" readOnly />
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeEnvVar(e.key)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      {tab === 'services' && (
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(['database', 'cache', 'proxy', 'worker'] as const).map(type => (
                <Badge key={type} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10 capitalize" onClick={() => addService(type, type)}>
                  <Plus className="w-2 h-2 mr-1" /> {type}
                </Badge>
              ))}
            </div>
            {services.map(s => (
              <div key={s.id} className="border border-border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{s.type}</Badge>
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeService(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{s.image}</p>
                {s.ports.length > 0 && <p className="text-[10px] text-muted-foreground">Ports: {s.ports.join(', ')}</p>}
              </div>
            ))}
            {services.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Add services for docker-compose.</p>}
          </div>
        </ScrollArea>
      )}

      {tab === 'output' && (
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Dockerfile</Label>
              <pre className="bg-muted rounded-md p-2 text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-auto border border-border mt-1">{generateDockerfile()}</pre>
              <Button size="sm" variant="outline" className="w-full text-xs mt-1" onClick={() => onInsertCode(generateDockerfile())}>
                <Code className="w-3 h-3 mr-1" /> Insert Dockerfile
              </Button>
            </div>

            {services.length > 0 && (
              <div>
                <Label className="text-xs font-semibold">docker-compose.yml</Label>
                <pre className="bg-muted rounded-md p-2 text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-auto border border-border mt-1">{generateDockerCompose()}</pre>
                <Button size="sm" variant="outline" className="w-full text-xs mt-1" onClick={() => onInsertCode(generateDockerCompose())}>
                  <Code className="w-3 h-3 mr-1" /> Insert Compose
                </Button>
              </div>
            )}

            {config.enableNginx && (
              <div>
                <Label className="text-xs font-semibold">nginx.conf</Label>
                <pre className="bg-muted rounded-md p-2 text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-auto border border-border mt-1">{generateNginxConf()}</pre>
                <Button size="sm" variant="outline" className="w-full text-xs mt-1" onClick={() => onInsertCode(generateNginxConf())}>
                  <Code className="w-3 h-3 mr-1" /> Insert Nginx
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
