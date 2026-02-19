import { X, SmilePlus, MessageSquare, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeReaction, InlineAnnotation } from '@/hooks/useCodeReactions';
import { useState } from 'react';

interface CodeReactionsPanel_Props {
  reactions: CodeReaction[];
  annotations: InlineAnnotation[];
  availableEmojis: string[];
  onAddReaction: (filePath: string, line: number, emoji: string) => void;
  onAddAnnotation: (filePath: string, lineStart: number, lineEnd: number, text: string) => void;
  onResolveAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  activeFilePath?: string;
  onClose: () => void;
}

export function CodeReactionsPanel({
  reactions, annotations, availableEmojis,
  onAddReaction, onAddAnnotation, onResolveAnnotation, onDeleteAnnotation,
  activeFilePath, onClose,
}: CodeReactionsPanel_Props) {
  const [newLine, setNewLine] = useState('1');
  const [newText, setNewText] = useState('');
  const fileReactions = activeFilePath ? reactions.filter(r => r.filePath === activeFilePath) : reactions;
  const fileAnnotations = activeFilePath ? annotations.filter(a => a.filePath === activeFilePath) : annotations;
  const pendingAnnotations = fileAnnotations.filter(a => !a.resolved);

  // Group reactions by line
  const reactionsByLine = new Map<number, CodeReaction[]>();
  for (const r of fileReactions) {
    const arr = reactionsByLine.get(r.line) || [];
    arr.push(r);
    reactionsByLine.set(r.line, arr);
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-l border-white/[0.06]">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <SmilePlus className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/80">Reactions & Annotations</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Quick React */}
        {activeFilePath && (
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="text-[10px] text-white/40 mb-1.5">Quick React (line {newLine})</div>
            <input
              value={newLine}
              onChange={e => setNewLine(e.target.value)}
              type="number"
              min="1"
              className="w-16 text-[10px] bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-white/60 mb-1.5 outline-none"
            />
            <div className="flex gap-1 flex-wrap">
              {availableEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onAddReaction(activeFilePath, parseInt(newLine) || 1, emoji)}
                  className="h-6 w-6 rounded hover:bg-white/[0.06] flex items-center justify-center text-sm transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reactions by Line */}
        {reactionsByLine.size > 0 && (
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Reactions</div>
            {Array.from(reactionsByLine.entries()).sort((a, b) => a[0] - b[0]).map(([line, rxns]) => (
              <div key={line} className="flex items-center gap-2 mb-1 p-1.5 rounded bg-white/[0.02]">
                <span className="text-[9px] text-white/30 font-mono w-8">L{line}</span>
                <div className="flex gap-0.5 flex-wrap">
                  {rxns.map(r => (
                    <span key={r.id} className="text-sm" title={r.email}>{r.emoji}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Annotation */}
        {activeFilePath && (
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-white/40">Add Annotation</span>
            </div>
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Leave a note on this line..."
              rows={2}
              className="w-full text-[10px] bg-white/[0.03] border border-white/[0.06] rounded p-1.5 text-white/60 placeholder:text-white/20 outline-none resize-none"
            />
            <button
              onClick={() => {
                if (newText.trim() && activeFilePath) {
                  onAddAnnotation(activeFilePath, parseInt(newLine) || 1, parseInt(newLine) || 1, newText.trim());
                  setNewText('');
                }
              }}
              className="mt-1 text-[9px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
            >
              Add Note
            </button>
          </div>
        )}

        {/* Pending Annotations */}
        {pendingAnnotations.length > 0 && (
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
              Annotations ({pendingAnnotations.length})
            </div>
            {pendingAnnotations.map(a => (
              <div key={a.id} className="p-2 rounded-lg bg-white/[0.02] border-l-2 mb-1.5" style={{ borderColor: a.color }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] text-white/40 font-mono">L{a.lineStart} — {a.email}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => onResolveAnnotation(a.id)} className="text-emerald-400 hover:text-emerald-300">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => onDeleteAnnotation(a.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
