import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { X, Mail, Plus, Trash2, Download, Copy } from 'lucide-react';
import type { EmailSequence, EmailStep } from '@/hooks/useEmailSequenceBuilder';

interface EmailSequencePanelProps {
  sequences: EmailSequence[];
  activeSequenceId: string | null;
  setActiveSequenceId: (id: string | null) => void;
  getActiveSequence: () => EmailSequence | null;
  createSequence: (name: string, trigger: string) => void;
  removeSequence: (id: string) => void;
  toggleSequence: (id: string) => void;
  addStep: (seqId: string, type: EmailStep['type'], name: string) => void;
  removeStep: (seqId: string, stepId: string) => void;
  updateStep: (seqId: string, stepId: string, updates: Partial<EmailStep>) => void;
  generateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function EmailSequencePanel({ sequences, activeSequenceId, setActiveSequenceId, getActiveSequence, createSequence, removeSequence, toggleSequence, addStep, removeStep, updateStep, generateCode, onInsertCode, onClose }: EmailSequencePanelProps) {
  const [newName, setNewName] = useState('');
  const active = getActiveSequence();

  return (
    <div className="fixed inset-y-0 right-0 w-[440px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-foreground">Email Sequence Builder</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sequences ({sequences.length})</Label>
            {sequences.map(s => (
              <div key={s.id} className={`bg-muted/30 rounded p-2 cursor-pointer border ${s.id === activeSequenceId ? 'border-primary/50' : 'border-transparent'}`} onClick={() => setActiveSequenceId(s.id)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{s.name}</span>
                  <div className="flex items-center gap-1">
                    <Switch checked={s.isActive} onCheckedChange={() => toggleSequence(s.id)} />
                    <button onClick={e => { e.stopPropagation(); removeSequence(s.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Trigger: {s.trigger} · {s.steps.length} steps</p>
              </div>
            ))}
            <div className="flex gap-1">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Sequence name" className="text-xs h-7 flex-1" />
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { if (newName.trim()) { createSequence(newName.trim(), 'user.signup'); setNewName(''); } }}><Plus className="w-3 h-3" /></Button>
            </div>
          </div>
          {active && (
            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground">Steps for "{active.name}"</Label>
              {active.steps.map((step, i) => (
                <div key={step.id} className="bg-muted/20 rounded p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{step.type}</Badge>
                      <span className="text-xs text-foreground">{step.name}</span>
                    </div>
                    <button onClick={() => removeStep(active.id, step.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  {step.type === 'email' && (
                    <>
                      <Input value={step.subject || ''} onChange={e => updateStep(active.id, step.id, { subject: e.target.value })} placeholder="Subject" className="text-xs h-7" />
                      <Textarea value={step.body || ''} onChange={e => updateStep(active.id, step.id, { body: e.target.value })} placeholder="Body (supports {{vars}})" className="text-xs min-h-[60px]" />
                    </>
                  )}
                  {step.type === 'delay' && (
                    <Input type="number" value={step.delayDays || 1} onChange={e => updateStep(active.id, step.id, { delayDays: parseInt(e.target.value) || 1 })} className="text-xs h-7 w-24" />
                  )}
                </div>
              ))}
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => addStep(active.id, 'email', `Email ${active.steps.length + 1}`)}>+ Email</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => addStep(active.id, 'delay', `Delay`)}>+ Delay</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => addStep(active.id, 'condition', `Condition`)}>+ If</Button>
              </div>
            </div>
          )}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Edge Function Code</Label>
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => navigator.clipboard.writeText(generateCode())}><Copy className="w-3 h-3" /></Button>
            </div>
            <pre className="bg-background rounded p-2 text-[10px] text-muted-foreground font-mono overflow-auto max-h-48 whitespace-pre-wrap">{generateCode()}</pre>
          </div>
          <Button size="sm" className="w-full text-xs gap-1" onClick={() => onInsertCode(generateCode())}><Download className="w-3 h-3" /> Insert Code</Button>
        </div>
      </ScrollArea>
    </div>
  );
}
