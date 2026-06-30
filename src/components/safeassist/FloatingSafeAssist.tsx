/**
 * Ray — the omnipresent intelligence of Wrayth.
 * Persistent across every Wrayth page. Violet accent only when Ray is active.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSafeAssist } from '@/hooks/useSafeAssist';
import { useFloatingSafeAssist } from '@/contexts/FloatingSafeAssistContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, Maximize2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function FloatingSafeAssist() {
  const { isOpen, isOnAssistPage, openAssistant, closeAssistant } = useFloatingSafeAssist();
  const { messages, isTyping, credits, sendMessage } = useSafeAssist();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  // Hide on marketing/auth surfaces — Ray lives inside the Wrayth product.
  const path = location.pathname;
  const inProduct =
    path.startsWith('/app') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/pass') ||
    path.startsWith('/scan') ||
    path.startsWith('/web') ||
    path.startsWith('/settings') ||
    path.startsWith('/billing');
  if (!inProduct || isOnAssistPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping || credits.remaining <= 0) return;
    setInput('');
    await sendMessage(text);
  };

  const active = isOpen || isTyping;

  return (
    <>
      {/* Trigger — Ray's eye. Monochrome by default, violet only when Ray is active. */}
      {!isOpen && (
        <button
          type="button"
          onClick={openAssistant}
          className={cn(
            'fixed bottom-6 right-6 z-40 h-12 w-12 flex items-center justify-center transition-all',
            'bg-[#181818] text-[#F3F3F3] border border-[#3A3A3A] hover:border-primary/60',
            'wrayth-chamfer-sm',
            isTyping && 'border-primary text-primary wrayth-thinking'
          )}
          aria-label="Ask Ray"
          title="Ask Ray"
        >
          <Eye className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)]',
            'flex flex-col border bg-[#181818] text-[#F3F3F3] shadow-2xl overflow-hidden',
            'wrayth-chamfer',
            active ? 'border-primary/50' : 'border-[#3A3A3A]'
          )}
        >
          <header className="flex items-center justify-between px-3 py-2 border-b border-[#3A3A3A]">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  isTyping ? 'bg-primary wrayth-thinking' : 'bg-[#3A3A3A]'
                )}
              />
              <div className="text-sm font-medium tracking-tight">Ray</div>
              <span className="text-[11px] text-muted-foreground">
                {isTyping ? 'thinking' : 'ready'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Expand">
                <Link to="/app/assist"><Maximize2 className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeAssistant} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] bg-[#242424] border border-[#3A3A3A] text-[#F3F3F3] px-3 py-2 text-sm whitespace-pre-wrap wrayth-chamfer-sm">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] text-sm text-[#F3F3F3] prose prose-sm prose-invert prose-p:my-1.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-primary wrayth-thinking">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#3A3A3A] p-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={credits.remaining > 0 ? 'Ask Ray…' : 'Out of credits'}
              disabled={credits.remaining <= 0}
              className="h-9 bg-[#0F0F0F] border-[#3A3A3A] focus-visible:ring-primary/40"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 wrayth-chamfer-sm"
              disabled={!input.trim() || isTyping || credits.remaining <= 0}
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

export default FloatingSafeAssist;
