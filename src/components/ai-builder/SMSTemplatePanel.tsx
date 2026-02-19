import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { X, Smartphone, Plus, Trash2, Download, Copy } from 'lucide-react';
import type { SMSTemplate } from '@/hooks/useSMSTemplateManager';

interface SMSTemplatePanelProps {
  templates: SMSTemplate[];
  activeTemplateId: string;
  setActiveTemplateId: (id: string) => void;
  getActiveTemplate: () => SMSTemplate | null;
  previewVars: Record<string, string>;
  setPreviewVars: (vars: Record<string, string>) => void;
  createTemplate: (name: string) => void;
  updateTemplate: (id: string, body: string) => void;
  removeTemplate: (id: string) => void;
  getPreview: (template: SMSTemplate) => string;
  generateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function SMSTemplatePanel({ templates, activeTemplateId, setActiveTemplateId, getActiveTemplate, previewVars, setPreviewVars, createTemplate, updateTemplate, removeTemplate, getPreview, generateCode, onInsertCode, onClose }: SMSTemplatePanelProps) {
  const active = getActiveTemplate();

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-foreground">SMS Template Manager</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {templates.map(t => (
              <Badge key={t.id} variant={t.id === activeTemplateId ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setActiveTemplateId(t.id)}>
                {t.name}
              </Badge>
            ))}
            <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px]" onClick={() => createTemplate('New Template')}><Plus className="w-3 h-3" /></Button>
          </div>
          {active && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Template Body (use {'{{var}}'} for variables)</Label>
                <Textarea value={active.body} onChange={e => updateTemplate(active.id, e.target.value)} className="text-xs min-h-[80px] font-mono" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{active.charCount} chars ({active.charCount <= 160 ? '1 SMS' : `${Math.ceil(active.charCount / 153)} SMS`})</span>
                  <span className={active.charCount > 160 ? 'text-amber-400' : 'text-green-400'}>{active.charCount <= 160 ? '✓' : '⚠ Multi-segment'}</span>
                </div>
              </div>
              {active.variables.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variables</Label>
                  {active.variables.map(v => (
                    <div key={v} className="flex items-center gap-2">
                      <code className="text-[10px] text-primary w-16">{`{{${v}}}`}</code>
                      <Input value={previewVars[v] || ''} onChange={e => setPreviewVars({ ...previewVars, [v]: e.target.value })} placeholder={`Test value for ${v}`} className="text-xs h-7 flex-1" />
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Preview</Label>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-xs text-foreground">{getPreview(active)}</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">Edge Function Code</Label>
                  <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(generateCode())}><Copy className="w-3 h-3" /></Button>
                </div>
                <pre className="bg-background rounded p-2 text-[10px] text-muted-foreground font-mono overflow-auto max-h-48 whitespace-pre-wrap">{generateCode()}</pre>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => onInsertCode(generateCode())}><Download className="w-3 h-3" /> Insert Code</Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={() => removeTemplate(active.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
