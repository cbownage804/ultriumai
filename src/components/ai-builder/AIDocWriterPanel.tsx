/**
 * AI Documentation Writer Panel — Phase 158
 */
import { X, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { DocResult, VerbosityLevel, DocType } from '@/hooks/useAIDocWriter';

interface Props {
  results: DocResult[];
  verbosity: VerbosityLevel;
  onSetVerbosity: (v: VerbosityLevel) => void;
  onGenerateJSDoc: () => void;
  onGenerateReadme: () => void;
  onGenerateAPIDoc: () => void;
  onGenerateComponentDoc: () => void;
  onClose: () => void;
}

const VERBOSITY_LABELS: Record<VerbosityLevel, string> = { minimal: 'Minimal', standard: 'Standard', detailed: 'Detailed' };
const DOC_LABELS: Record<DocType, string> = { jsdoc: 'JSDoc', readme: 'README', api: 'API', component: 'Component', changelog: 'Changelog' };

export function AIDocWriterPanel({ results, verbosity, onSetVerbosity, onGenerateJSDoc, onGenerateReadme, onGenerateAPIDoc, onGenerateComponentDoc, onClose }: Props) {
  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/[0.06] flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-medium text-white">Doc Writer</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="p-3 space-y-3 border-b border-white/[0.06]">
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Verbosity</label>
          <div className="flex gap-1">
            {(['minimal', 'standard', 'detailed'] as VerbosityLevel[]).map(v => (
              <Button key={v} size="sm" variant={verbosity === v ? 'default' : 'ghost'} className={`h-7 text-[10px] flex-1 ${verbosity === v ? 'bg-teal-500/20 text-teal-300' : 'text-white/40'}`} onClick={() => onSetVerbosity(v)}>
                {VERBOSITY_LABELS[v]}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" className="h-8 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 gap-1" onClick={onGenerateJSDoc}>
            <FileText className="w-3 h-3" /> JSDoc
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 gap-1" onClick={onGenerateReadme}>
            <BookOpen className="w-3 h-3" /> README
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 gap-1" onClick={onGenerateAPIDoc}>
            <Sparkles className="w-3 h-3" /> API Docs
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/60 gap-1" onClick={onGenerateComponentDoc}>
            <FileText className="w-3 h-3" /> Component
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {results.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs">Choose a doc type above to generate documentation</div>
          )}
          {results.map(r => (
            <div key={r.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge className="text-[10px] bg-teal-500/20 text-teal-300">{DOC_LABELS[r.type]}</Badge>
                <span className="text-[10px] text-white/20">{r.verbosity}</span>
              </div>
              <div className="text-[11px] text-white/50 truncate font-mono">{r.filePath}</div>
              <pre className="text-[10px] text-white/30 whitespace-pre-wrap max-h-32 overflow-hidden">{r.content.slice(0, 500)}{r.content.length > 500 ? '...' : ''}</pre>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
