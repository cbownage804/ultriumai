/**
 * Natural Language to Regex Panel — Phase 155
 */
import { X, Wand2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { RegexEntry } from '@/hooks/useNLToRegex';

interface Props {
  entries: RegexEntry[];
  currentPattern: string;
  currentFlags: string;
  testInput: string;
  commonPatterns: string[];
  onSetPattern: (p: string) => void;
  onSetFlags: (f: string) => void;
  onSetTestInput: (t: string) => void;
  onAddEntry: (desc: string, pattern: string, flags?: string) => void;
  onQuickMatch: (desc: string) => { pattern: string; flags: string } | null;
  onSendToAI: (prompt: string) => void;
  onClose: () => void;
}

export function NLRegexPanel({ entries, currentPattern, currentFlags, testInput, commonPatterns, onSetPattern, onSetFlags, onSetTestInput, onAddEntry, onQuickMatch, onSendToAI, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!description.trim()) return;
    const quick = onQuickMatch(description);
    if (quick) {
      onAddEntry(description, quick.pattern, quick.flags);
    } else {
      onSendToAI(`Convert to regex: "${description}". Return ONLY the pattern and flags.`);
    }
  };

  const copyPattern = () => {
    navigator.clipboard.writeText(`/${currentPattern}/${currentFlags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/[0.06] flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">NL → Regex</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="p-3 space-y-3 border-b border-white/[0.06]">
        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Describe your pattern</label>
          <div className="flex gap-1.5">
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Match email addresses" className="h-8 text-xs bg-white/[0.03] border-white/[0.08]" onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
            <Button size="sm" className="h-8 px-3 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300" onClick={handleGenerate}><Wand2 className="w-3 h-3" /></Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {commonPatterns.slice(0, 6).map(p => (
            <Badge key={p} variant="outline" className="text-[10px] cursor-pointer hover:bg-white/5 border-white/10 text-white/40" onClick={() => { setDescription(p); const q = onQuickMatch(p); if (q) onAddEntry(p, q.pattern, q.flags); }}>
              {p}
            </Badge>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Pattern</label>
          <div className="flex gap-1.5">
            <Input value={currentPattern} onChange={e => onSetPattern(e.target.value)} className="h-8 text-xs font-mono bg-white/[0.03] border-white/[0.08]" />
            <Input value={currentFlags} onChange={e => onSetFlags(e.target.value)} className="h-8 w-12 text-xs font-mono bg-white/[0.03] border-white/[0.08]" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40" onClick={copyPattern}>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-white/40">Test input</label>
          <Textarea value={testInput} onChange={e => onSetTestInput(e.target.value)} className="text-xs font-mono bg-white/[0.03] border-white/[0.08] min-h-[60px]" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {entries.map(e => (
            <div key={e.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60 truncate">{e.description}</span>
                <Badge variant={e.isValid ? 'default' : 'destructive'} className="text-[9px]">{e.matches.length} matches</Badge>
              </div>
              <code className="block text-[10px] text-violet-300 font-mono">/{e.pattern}/{e.flags}</code>
              {e.matches.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {e.matches.slice(0, 8).map((m, i) => (
                    <span key={i} className="text-[9px] bg-violet-500/10 text-violet-300 px-1.5 py-0.5 rounded font-mono">{m.text}</span>
                  ))}
                  {e.matches.length > 8 && <span className="text-[9px] text-white/30">+{e.matches.length - 8} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
