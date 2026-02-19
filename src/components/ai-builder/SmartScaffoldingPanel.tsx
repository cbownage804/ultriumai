import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Blocks, X, Plus, FileCode } from 'lucide-react';
import type { ScaffoldTemplate } from '@/hooks/useSmartScaffolding';

interface SmartScaffoldingPanelProps {
  templates: ScaffoldTemplate[];
  selectedTemplate: string;
  entityName: string;
  onSetSelectedTemplate: (id: string) => void;
  onSetEntityName: (name: string) => void;
  onScaffold: (templateId: string, name: string) => { path: string; content: string }[];
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function SmartScaffoldingPanel({
  templates, selectedTemplate, entityName,
  onSetSelectedTemplate, onSetEntityName, onScaffold, onInsertCode, onClose,
}: SmartScaffoldingPanelProps) {
  const selected = templates.find(t => t.id === selectedTemplate);

  const handleScaffold = () => {
    if (!entityName.trim()) return;
    const files = onScaffold(selectedTemplate, entityName);
    files.forEach(f => onInsertCode(`// === ${f.path} ===\n${f.content}`));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Blocks className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Smart Scaffolding</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Template</Label>
            <Select value={selectedTemplate} onValueChange={onSetSelectedTemplate}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="bg-muted/30 rounded p-2">
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              <Badge variant="outline" className="text-[10px] mt-1">{selected.category}</Badge>
              <div className="mt-2 space-y-1">
                {selected.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FileCode className="w-3 h-3" /> {f.path}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Entity Name</Label>
            <Input value={entityName} onChange={e => onSetEntityName(e.target.value)} placeholder="e.g. UserProfile" className="h-8 text-xs" />
          </div>
          <Button size="sm" onClick={handleScaffold} className="w-full gap-1" disabled={!entityName.trim()}>
            <Plus className="w-3 h-3" /> Generate Files
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
