import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Languages, X, Play, Download, Trash2 } from 'lucide-react';

interface CodeTranslatorPanelProps {
  sourceLanguage: string;
  targetLanguage: string;
  sourceCode: string;
  supportedLanguages: string[];
  jobs: { id: string; sourceLanguage: string; targetLanguage: string; translatedCode: string; status: string; createdAt: string }[];
  onSetSourceLanguage: (lang: string) => void;
  onSetTargetLanguage: (lang: string) => void;
  onSetSourceCode: (code: string) => void;
  onTranslate: () => void;
  onRemoveJob: (id: string) => void;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function CodeTranslatorPanel({
  sourceLanguage, targetLanguage, sourceCode, supportedLanguages, jobs,
  onSetSourceLanguage, onSetTargetLanguage, onSetSourceCode,
  onTranslate, onRemoveJob, onInsertCode, onClose,
}: CodeTranslatorPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Code Translator</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Select value={sourceLanguage} onValueChange={onSetSourceLanguage}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{supportedLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Select value={targetLanguage} onValueChange={onSetTargetLanguage}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{supportedLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Source Code</Label>
            <Textarea value={sourceCode} onChange={e => onSetSourceCode(e.target.value)} placeholder="Paste code to translate..." className="text-xs font-mono min-h-[120px]" />
          </div>
          <Button size="sm" onClick={onTranslate} className="w-full gap-1" disabled={!sourceCode.trim()}>
            <Play className="w-3 h-3" /> Translate
          </Button>
          {jobs.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs text-muted-foreground">History</Label>
              {jobs.map(j => (
                <div key={j.id} className="bg-muted/30 rounded p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{j.sourceLanguage} → {j.targetLanguage}</Badge>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onInsertCode(j.translatedCode)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onRemoveJob(j.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <pre className="text-[10px] text-muted-foreground max-h-20 overflow-auto">{j.translatedCode.slice(0, 200)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
