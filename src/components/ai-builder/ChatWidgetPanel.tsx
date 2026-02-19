import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MessageCircle, Plus, Trash2, Download, Copy } from 'lucide-react';
import type { ChatWidgetConfig } from '@/hooks/useChatWidgetBuilder';

interface ChatWidgetPanelProps {
  config: ChatWidgetConfig;
  updateConfig: (updates: Partial<ChatWidgetConfig>) => void;
  addAutoReply: (trigger: string, response: string) => void;
  removeAutoReply: (index: number) => void;
  generateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function ChatWidgetPanel({ config, updateConfig, addAutoReply, removeAutoReply, generateCode, onInsertCode, onClose }: ChatWidgetPanelProps) {
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-foreground">Chat Widget Builder</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Brand Name</Label>
            <Input value={config.brandName} onChange={e => updateConfig({ brandName: e.target.value })} className="text-xs h-8" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Primary Color</Label>
              <div className="flex gap-1.5 items-center">
                <input type="color" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="h-7 w-7 rounded border-none bg-transparent cursor-pointer" />
                <Input value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="text-xs h-7 flex-1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Position</Label>
              <select value={config.position} onChange={e => updateConfig({ position: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Greeting</Label>
            <Input value={config.greeting} onChange={e => updateConfig({ greeting: e.target.value })} className="text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Placeholder</Label>
            <Input value={config.placeholder} onChange={e => updateConfig({ placeholder: e.target.value })} className="text-xs h-8" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">File Upload</Label>
            <Switch checked={config.enableFileUpload} onCheckedChange={v => updateConfig({ enableFileUpload: v })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Auto-Replies</Label>
            {config.autoReplies.map((r, i) => (
              <div key={i} className="bg-muted/30 rounded px-2 py-1.5 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-[10px] text-primary">{r.trigger}</code>
                  <button onClick={() => removeAutoReply(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
                <p className="text-[10px] text-muted-foreground">{r.response}</p>
              </div>
            ))}
            <div className="space-y-1">
              <Input value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="Trigger keyword" className="text-xs h-7" />
              <div className="flex gap-1">
                <Input value={newResponse} onChange={e => setNewResponse(e.target.value)} placeholder="Response" className="text-xs h-7 flex-1" />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { if (newTrigger && newResponse) { addAutoReply(newTrigger, newResponse); setNewTrigger(''); setNewResponse(''); } }}><Plus className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Generated Component</Label>
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(generateCode())}><Copy className="w-3 h-3" /></Button>
            </div>
            <pre className="bg-background rounded p-2 text-[10px] text-muted-foreground font-mono overflow-auto max-h-48 whitespace-pre-wrap">{generateCode().slice(0, 500)}...</pre>
          </div>
          <Button size="sm" className="w-full text-xs gap-1" onClick={() => onInsertCode(generateCode())}><Download className="w-3 h-3" /> Insert Code</Button>
        </div>
      </ScrollArea>
    </div>
  );
}
