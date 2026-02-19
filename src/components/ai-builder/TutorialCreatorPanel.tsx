import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Trash2, GripVertical, Play, Code, X } from 'lucide-react';
import type { Tutorial, TutorialStep } from '@/hooks/useTutorialCreator';

interface TutorialCreatorPanelProps {
  tutorials: Tutorial[];
  activeTutorialId: string | null;
  setActiveTutorialId: (id: string | null) => void;
  getActiveTutorial: () => Tutorial | null;
  previewStepIndex: number;
  setPreviewStepIndex: (i: number) => void;
  createTutorial: (name: string) => Tutorial;
  updateTutorial: (id: string, update: Partial<Tutorial>) => void;
  removeTutorial: (id: string) => void;
  addStep: (tutorialId: string) => void;
  updateStep: (tutorialId: string, stepId: string, update: Partial<TutorialStep>) => void;
  removeStep: (tutorialId: string, stepId: string) => void;
  generateTutorialCode: (tutorialId: string) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function TutorialCreatorPanel({
  tutorials, activeTutorialId, setActiveTutorialId, getActiveTutorial,
  previewStepIndex, setPreviewStepIndex,
  createTutorial, updateTutorial, removeTutorial,
  addStep, updateStep, removeStep, generateTutorialCode, onInsertCode, onClose,
}: TutorialCreatorPanelProps) {
  const active = getActiveTutorial();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Tutorial Creator</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border">
        <Button size="sm" className="w-full" onClick={() => createTutorial('New Tutorial')}>
          <Plus className="w-3 h-3 mr-1" /> New Tutorial
        </Button>
      </div>

      {tutorials.length > 0 && !active && (
        <ScrollArea className="flex-1 p-3">
          {tutorials.map(t => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer mb-1" onClick={() => setActiveTutorialId(t.id)}>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.steps.length} steps</p>
              </div>
              <div className="flex gap-1">
                <Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]">{t.triggerType}</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); removeTutorial(t.id); }}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}

      {active && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveTutorialId(null)}>← Back</Button>

            <div><Label className="text-xs">Name</Label><Input value={active.name} onChange={e => updateTutorial(active.id, { name: e.target.value })} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={active.description} onChange={e => updateTutorial(active.id, { description: e.target.value })} className="text-sm min-h-[60px]" /></div>

            <div className="flex gap-2">
              <div className="flex-1"><Label className="text-xs">Trigger</Label>
                <Select value={active.triggerType} onValueChange={v => updateTutorial(active.id, { triggerType: v as Tutorial['triggerType'] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="auto">Auto Start</SelectItem><SelectItem value="button">Button</SelectItem><SelectItem value="firstVisit">First Visit</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-1 pb-0.5">
                <Switch checked={active.isActive} onCheckedChange={v => updateTutorial(active.id, { isActive: v })} />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Steps ({active.steps.length})</Label>
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => addStep(active.id)}>
                <Plus className="w-3 h-3 mr-1" /> Add Step
              </Button>
            </div>

            {active.steps.map((step, i) => (
              <div key={step.id} className="border border-border rounded-lg p-2 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeStep(active.id, step.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <Input value={step.title} onChange={e => updateStep(active.id, step.id, { title: e.target.value })} placeholder="Step title" className="h-7 text-xs" />
                <Textarea value={step.description} onChange={e => updateStep(active.id, step.id, { description: e.target.value })} placeholder="Description" className="text-xs min-h-[40px]" />
                <Input value={step.targetSelector} onChange={e => updateStep(active.id, step.id, { targetSelector: e.target.value })} placeholder="CSS selector (e.g. #btn-save)" className="h-7 text-xs" />
                <div className="flex gap-2">
                  <Select value={step.highlightType} onValueChange={v => updateStep(active.id, step.id, { highlightType: v as TutorialStep['highlightType'] })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="spotlight">Spotlight</SelectItem><SelectItem value="overlay">Overlay</SelectItem><SelectItem value="border">Border</SelectItem></SelectContent>
                  </Select>
                  <Select value={step.position} onValueChange={v => updateStep(active.id, step.id, { position: v as TutorialStep['position'] })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="top">Top</SelectItem><SelectItem value="bottom">Bottom</SelectItem><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setPreviewStepIndex(0); }}>
                <Play className="w-3 h-3 mr-1" /> Preview
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={() => onInsertCode(generateTutorialCode(active.id))}>
                <Code className="w-3 h-3 mr-1" /> Generate
              </Button>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
