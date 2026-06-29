/**
 * FloatingSafeAssist — floating chat bubble shown across SafeSuite pages.
 * Hidden on the full /safesuite/assist page. Uses useSafeAssist hook.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSafeAssist } from '@/hooks/useSafeAssist';
import { useFloatingSafeAssist } from '@/contexts/FloatingSafeAssistContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import safeassistIcon from '@/assets/safeassist-icon.png';
import ReactMarkdown from 'react-markdown';

export function FloatingSafeAssist() {
  const { isOpen, isOnAssistPage, openAssistant, closeAssistant } = useFloatingSafeAssist();
  const { messages, isTyping, credits, sendMessage } = useSafeAssist();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  if (isOnAssistPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping || credits.remaining <= 0) return;
    setInput('');
    await sendMessage(text);
  };

  return (
    <>
      {/* Bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={openAssistant}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition"
          aria-label="Open SafeAssist"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)]',
            'flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden'
          )}
        >
          <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/80">
            <div className="flex items-center gap-2">
              <img src={safeassistIcon} alt="" className="h-6 w-6" />
              <div className="text-sm font-semibold">SafeAssist</div>
              <span className="text-xs text-muted-foreground">{credits.remaining}/{credits.total}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Open full page">
                <Link to="/safesuite/assist"><Maximize2 className="h-4 w-4" /></Link>
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
                    <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] text-sm text-foreground prose prose-sm dark:prose-invert prose-p:my-1.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-2 bg-background/80">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={credits.remaining > 0 ? 'Ask SafeAssist...' : 'Out of credits'}
              disabled={credits.remaining <= 0}
              className="h-9"
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={!input.trim() || isTyping || credits.remaining <= 0}>
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}

      <VoiceCreditPurchaseDialog />
    </>
  );
}

export default FloatingSafeAssist;
