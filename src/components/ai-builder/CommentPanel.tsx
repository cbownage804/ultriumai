/**
 * Phase 114: Code Comment Panel
 */
import { useState } from 'react';
import { X, MessageCircle, Check, Reply, Trash2, Plus } from 'lucide-react';
import type { CodeComment } from '@/hooks/useCommentSystem';

interface CommentPanelProps {
  open: boolean;
  onClose: () => void;
  comments: CodeComment[];
  activeFile?: string;
  onAdd: (filePath: string, line: number, content: string, author?: string, parentId?: string | null) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (filePath: string, line: number) => void;
  unresolvedCount: number;
}

export function CommentPanel({
  open, onClose, comments, activeFile,
  onAdd, onResolve, onDelete, onNavigate, unresolvedCount,
}: CommentPanelProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newLine, setNewLine] = useState(1);
  const [showResolved, setShowResolved] = useState(false);

  if (!open) return null;

  const fileComments = activeFile
    ? comments.filter(c => c.filePath === activeFile)
    : comments;

  const displayed = showResolved ? fileComments : fileComments.filter(c => !c.resolved);
  const rootComments = displayed.filter(c => !c.parentId);

  return (
    <div className="fixed inset-y-0 right-0 w-72 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-amber-400/60" />
          <h3 className="text-sm font-medium text-white/80">Comments</h3>
          {unresolvedCount > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">{unresolvedCount}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-[10px] text-white/30 hover:text-white/50"
        >
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      </div>

      {/* Add new comment */}
      {activeFile && (
        <div className="px-3 py-2 border-b border-white/[0.06] space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="number"
              value={newLine}
              onChange={e => setNewLine(parseInt(e.target.value) || 1)}
              className="w-14 bg-white/[0.04] rounded px-1.5 py-1 text-[10px] text-white/50 outline-none font-mono"
              placeholder="Line"
              min={1}
            />
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/[0.04] rounded px-2 py-1 text-xs text-white/60 outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && newComment.trim()) {
                  onAdd(activeFile, newLine, newComment.trim());
                  setNewComment('');
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {rootComments.map(comment => (
          <div key={comment.id} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full bg-cyan-500/30 flex items-center justify-center">
                  <span className="text-[8px] text-cyan-300">{comment.author[0]}</span>
                </div>
                <span className="text-[10px] text-white/50">{comment.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onNavigate(comment.filePath, comment.line)} className="text-[9px] text-white/20 hover:text-cyan-400 font-mono">
                  L{comment.line}
                </button>
                <button onClick={() => onResolve(comment.id)} className="p-0.5 text-white/20 hover:text-emerald-400"><Check className="h-2.5 w-2.5" /></button>
                <button onClick={() => onDelete(comment.id)} className="p-0.5 text-white/20 hover:text-red-400"><Trash2 className="h-2.5 w-2.5" /></button>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">{comment.content}</p>
            <div className="text-[9px] text-white/15 mt-1 flex items-center justify-between">
              <span className="font-mono truncate max-w-[120px]">{comment.filePath}</span>
              <button onClick={() => setReplyTo(comment.id)} className="flex items-center gap-0.5 text-white/25 hover:text-white/50">
                <Reply className="h-2.5 w-2.5" /> Reply
              </button>
            </div>

            {/* Replies */}
            {displayed.filter(c => c.parentId === comment.id).map(reply => (
              <div key={reply.id} className="mt-1.5 pl-3 border-l border-white/[0.06]">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] text-white/40">{reply.author}</span>
                </div>
                <p className="text-[10px] text-white/50">{reply.content}</p>
              </div>
            ))}

            {replyTo === comment.id && (
              <div className="mt-1.5 flex gap-1">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Reply..."
                  className="flex-1 bg-white/[0.04] rounded px-1.5 py-0.5 text-[10px] text-white/60 outline-none"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && replyText.trim()) {
                      onAdd(comment.filePath, comment.line, replyText.trim(), 'You', comment.id);
                      setReplyText('');
                      setReplyTo(null);
                    }
                    if (e.key === 'Escape') setReplyTo(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
        {rootComments.length === 0 && (
          <div className="text-center text-[11px] text-white/20 py-8">No comments yet</div>
        )}
      </div>
    </div>
  );
}
