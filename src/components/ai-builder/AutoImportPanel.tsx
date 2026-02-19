/**
 * Smart Auto-Import Panel — Phase 157
 */
import { X, PackagePlus, Check, FileCode, Boxes, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ImportSuggestion } from '@/hooks/useSmartAutoImport';

interface Props {
  suggestions: ImportSuggestion[];
  onApply: (suggestion: ImportSuggestion) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onClose: () => void;
}

const SOURCE_ICON = { project: FileCode, npm: Boxes, react: Atom };
const SOURCE_COLOR = { project: 'text-blue-400', npm: 'text-amber-400', react: 'text-cyan-400' };

export function AutoImportPanel({ suggestions, onApply, onAnalyze, onClear, onClose }: Props) {
  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/[0.06] flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Auto Import</span>
          {suggestions.length > 0 && <Badge variant="secondary" className="text-[10px]">{suggestions.length}</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="p-3 border-b border-white/[0.06]">
        <Button size="sm" className="w-full h-7 text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300" onClick={onAnalyze}>
          <PackagePlus className="w-3 h-3 mr-1" /> Scan Current File
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {suggestions.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs">No missing imports detected</div>
          )}
          {suggestions.map(s => {
            const Icon = SOURCE_ICON[s.source];
            return (
              <div key={s.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 group hover:bg-white/[0.05]">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${SOURCE_COLOR[s.source]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white font-mono">{s.symbol}</div>
                  <div className="text-[10px] text-white/30 truncate font-mono">{s.importStatement}</div>
                </div>
                <Button size="sm" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300" onClick={() => onApply(s)}>
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
