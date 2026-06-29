/**
 * SafeAssist — full-page AI security assistant
 * Uses the existing useSafeAssist hook + safeassist-ai edge function.
 */

import { useEffect, useRef, useState } from 'react';
import { useSafeAssist } from '@/hooks/useSafeAssist';
import { useFloatingSafeAssist } from '@/contexts/FloatingSafeAssistContext';
import { VoiceButton } from '@/components/safeassist/VoiceButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Plus, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

import ReactMarkdown from 'react-markdown';

export default function WraythAssist() {
  const {
    messages,
    conversations,
    currentConversationId,
    isTyping,
    credits,
    limits,
    sendMessage,
    selectConversation,
    createNewConversation,
    deleteConversation,
  } = useSafeAssist();

  const { setOnVoiceTranscript } = useFloatingSafeAssist();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentConversationId]);

  useEffect(() => {
    setOnVoiceTranscript((text) => {
      if (text.trim()) void sendMessage(text);
    });
    return () => setOnVoiceTranscript(undefined);
  }, [setOnVoiceTranscript, sendMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const canSend = input.trim().length > 0 && !isTyping && credits.remaining > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Sidebar */}
      {limits.canSaveHistory && (
        <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card/40">
          <div className="p-4 border-b border-border">
            <Button onClick={createNewConversation} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" /> New conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">No saved chats yet.</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent',
                    currentConversationId === c.id && 'bg-accent'
                  )}
                  onClick={() => selectConversation(c.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteConversation(c.id);
                    }}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* Main chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                isTyping ? 'bg-primary wrayth-thinking' : 'bg-muted-foreground/40'
              )}
            />
            <div className="leading-tight">
              <div className="text-sm font-medium tracking-tight">Ray</div>
              <div className="text-[11px] text-muted-foreground">
                {isTyping ? 'thinking' : 'the intelligence of Wrayth'}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {credits.remaining} / {credits.total} questions today
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[80%] bg-[#242424] border border-[#3A3A3A] text-[#F3F3F3] px-4 py-2.5 whitespace-pre-wrap wrayth-chamfer-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] text-foreground prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-primary wrayth-thinking">
                <Loader2 className="h-4 w-4 animate-spin" /> Ray is thinking
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-background/80 backdrop-blur p-4"
        >
          <Card className="mx-auto max-w-3xl flex items-center gap-2 p-2">
            <VoiceButton onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))} />
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                credits.remaining > 0
                  ? 'Ask Ray anything — a suspicious email, a weak password, what to do next…'
                  : 'No questions left today. Upgrade for more.'
              }
              disabled={credits.remaining <= 0}
              className="border-0 focus-visible:ring-0 shadow-none"
            />
            <Button type="submit" size="icon" disabled={!canSend}>
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </Card>
        </form>
      </main>
    </div>
  );
}
