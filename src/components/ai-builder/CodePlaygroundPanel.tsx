import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Code, Play, Plus, Trash2, Copy, Star, X } from 'lucide-react';
import type { Snippet } from '@/hooks/useCodePlayground';

interface CodePlaygroundPanelProps {
  snippets: Snippet[];
  activeSnippetId: string | null;
  setActiveSnippetId: (id: string | null) => void;
  getActiveSnippet: () => Snippet | null;
  SNIPPET_TEMPLATES: string[];
  createSnippet: (templateKey?: string) => Snippet;
  updateSnippet: (id: string, update: Partial<Snippet>) => void;
  removeSnippet: (id: string) => void;
  runSnippet: (id: string) => void;
  duplicateSnippet: (id: string) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function CodePlaygroundPanel({
  snippets, activeSnippetId, setActiveSnippetId, getActiveSnippet,
  SNIPPET_TEMPLATES, createSnippet, updateSnippet, removeSnippet,
  runSnippet, duplicateSnippet, onInsertCode, onClose,
}: CodePlaygroundPanelProps) {
  const active = getActiveSnippet();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Code Playground</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border space-y-2">
        <Button size="sm" className="w-full" onClick={() => createSnippet()}>
          <Plus className="w-3 h-3 mr-1" /> New Snippet
        </Button>
        <div className="flex flex-wrap gap-1">
          {SNIPPET_TEMPLATES.map(t => (
            <Badge key={t} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10" onClick={() => createSnippet(t)}>
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {!active && (
        <ScrollArea className="flex-1 p-3">
          {snippets.map(s => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer mb-1" onClick={() => setActiveSnippetId(s.id)}>
              <div className="flex items-center gap-2">
                {s.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.language}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); removeSnippet(s.id); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
          {snippets.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No snippets yet. Create one above.</p>}
        </ScrollArea>
      )}

      {active && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveSnippetId(null)}>← Back</Button>

            <div className="flex gap-2">
              <div className="flex-1"><Input value={active.name} onChange={e => updateSnippet(active.id, { name: e.target.value })} className="h-8 text-sm" /></div>
              <Select value={active.language} onValueChange={v => updateSnippet(active.id, { language: v as Snippet['language'] })}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Code</Label>
              <textarea
                value={active.code}
                onChange={e => updateSnippet(active.id, { code: e.target.value })}
                className="w-full h-48 bg-muted rounded-md p-2 font-mono text-xs border border-border resize-y"
                spellCheck={false}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs" onClick={() => runSnippet(active.id)}>
                <Play className="w-3 h-3 mr-1" /> Run
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => duplicateSnippet(active.id)}>
                <Copy className="w-3 h-3 mr-1" /> Duplicate
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => updateSnippet(active.id, { isFavorite: !active.isFavorite })}>
                <Star className={`w-3 h-3 ${active.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
            </div>

            {active.output && (
              <div>
                <Label className="text-xs">Output</Label>
                <pre className="bg-muted rounded-md p-2 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-auto border border-border">{active.output}</pre>
              </div>
            )}

            <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => onInsertCode(active.code)}>
              Insert into Editor
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
