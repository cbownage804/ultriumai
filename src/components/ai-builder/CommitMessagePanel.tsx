/**
 * AI Commit Message Generator Panel — Phase 156
 */
import { X, GitCommit, Copy, Check, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { CommitMessage, FileDiff } from '@/hooks/useAICommitMessages';

interface Props {
  messages: CommitMessage[];
  diffs: FileDiff[];
  typeLabels: Record<string, string>;
  onGenerate: () => void;
  onGenerateAI: (prompt: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  feat: 'bg-emerald-500/20 text-emerald-300',
  fix: 'bg-red-500/20 text-red-300',
  refactor: 'bg-blue-500/20 text-blue-300',
  style: 'bg-pink-500/20 text-pink-300',
  docs: 'bg-cyan-500/20 text-cyan-300',
  test: 'bg-amber-500/20 text-amber-300',
  chore: 'bg-gray-500/20 text-gray-300',
  perf: 'bg-orange-500/20 text-orange-300',
};

export function CommitMessagePanel({ messages, diffs, typeLabels, onGenerate, onGenerateAI, onClear, onClose }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyMessage = (msg: CommitMessage) => {
    const text = `${msg.type}(${msg.scope}): ${msg.subject}${msg.body ? '\n\n' + msg.body : ''}${msg.breaking ? '\n\nBREAKING CHANGE' : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/[0.06] flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">Commit Messages</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>

      <div className="p-3 border-b border-white/[0.06] space-y-2">
        <div className="text-[11px] text-white/40">{diffs.length} file(s) changed</div>
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7 text-[11px] gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex-1" onClick={onGenerate}>
            <RefreshCw className="w-3 h-3" /> Quick Generate
          </Button>
          <Button size="sm" className="h-7 text-[11px] gap-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 flex-1" onClick={() => onGenerateAI('Generate a commit message for the current changes.')}>
            <Sparkles className="w-3 h-3" /> AI Generate
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs">No commit messages yet. Click generate to create one.</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={`text-[10px] ${TYPE_COLORS[msg.type] || ''}`}>{typeLabels[msg.type] || msg.type}</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white" onClick={() => copyMessage(msg)}>
                  {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <code className="block text-xs text-white font-mono">
                {msg.type}({msg.scope}): {msg.subject}
              </code>
              {msg.body && <pre className="text-[10px] text-white/40 whitespace-pre-wrap">{msg.body}</pre>}
              {msg.breaking && <Badge variant="destructive" className="text-[9px]">BREAKING</Badge>}
              <div className="text-[10px] text-white/20">{msg.filesChanged.length} files • {msg.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
