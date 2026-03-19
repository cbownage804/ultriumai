/**
 * Wave 9 Step 4: Inline Chat Widget for Code Editor
 * Floating input that appears on Cmd+I for inline AI editing.
 */

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineChatWidgetProps {
  isOpen: boolean;
  position: { top: number; left: number };
  selectedCode: string;
  filePath: string;
  isLoading: boolean;
  suggestion: string | null;
  onSubmit: (prompt: string) => void;
  onAccept: () => void;
  onDismiss: () => void;
}

export function InlineChatWidget({
  isOpen, position, selectedCode, filePath, isLoading, suggestion,
  onSubmit, onAccept, onDismiss,
}: InlineChatWidgetProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[100] animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ top: Math.max(position.top, 40), left: Math.max(position.left, 20) }}
    >
      <div className="flex flex-col gap-1.5 w-80 p-2 rounded-xl bg-[#12121a] border border-white/[0.1] shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="h-3 w-3 text-violet-400" />
          <span className="text-[10px] text-white/40 font-medium">Inline AI Edit</span>
          <span className="text-[9px] text-white/20 ml-auto font-mono">{filePath.split('/').pop()}</span>
        </div>

        {/* Input */}
        {!suggestion && (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && prompt.trim()) {
                  e.preventDefault();
                  onSubmit(prompt.trim());
                }
              }}
              placeholder="Describe the change..."
              className="flex-1 h-7 px-2.5 text-[12px] bg-white/[0.06] border border-white/[0.08] rounded-lg text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/40 transition-colors"
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
              </div>
            ) : (
              <button
                onClick={() => prompt.trim() && onSubmit(prompt.trim())}
                disabled={!prompt.trim()}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                  prompt.trim()
                    ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                    : "bg-white/[0.04] text-white/15"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Suggestion preview */}
        {suggestion && (
          <div className="flex flex-col gap-1.5">
            <div className="max-h-32 overflow-auto rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
              <pre className="text-[11px] text-emerald-300/70 font-mono whitespace-pre-wrap leading-4">
                {suggestion.slice(0, 500)}{suggestion.length > 500 ? '...' : ''}
              </pre>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onAccept}
                className="flex-1 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="h-3 w-3" /> Accept
              </button>
              <button
                onClick={onDismiss}
                className="h-7 px-3 rounded-lg bg-white/[0.06] text-white/40 text-[11px] font-medium hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-1"
              >
                <X className="h-3 w-3" /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
