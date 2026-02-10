import { useState, useRef, useEffect, useCallback } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { Bot, Send, Globe, Sparkles, RotateCcw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface GPTBuilderPreviewProps {
  config: GPTConfig;
}

interface PreviewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function GPTBuilderPreview({ config }: GPTBuilderPreviewProps) {
  const [previewInput, setPreviewInput] = useState('');
  const [chatMessages, setChatMessages] = useState<PreviewMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const themeColor = config.theme_color || '#6366f1';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = useCallback(async (text?: string) => {
    const message = text || previewInput.trim();
    if (!message || isResponding) return;
    if (!config.system_prompt) {
      toast.info('Configure a system prompt first via the chat panel');
      return;
    }

    setPreviewInput('');
    const userMsg: PreviewMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setIsResponding(true);

    const assistantId = crypto.randomUUID();
    let assistantContent = '';

    try {
      abortRef.current = new AbortController();
      const allMessages = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gpt-test-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            systemPrompt: config.system_prompt,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) { toast.error('Rate limited. Please wait.'); setIsResponding(false); return; }
        if (response.status === 402) { toast.error('Credits exhausted.'); setIsResponding(false); return; }
        throw new Error('Failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Test chat failed');
      }
    } finally {
      setIsResponding(false);
      abortRef.current = null;
    }
  }, [previewInput, isResponding, config.system_prompt, chatMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setChatMessages([]);
    setIsResponding(false);
  };

  const hasContent = config.welcome_message || config.starter_questions.length > 0 || chatMessages.length > 0;

  const embedStyle = config.embed_style || 'bubble';

  // Frame dimensions based on widget style
  const frameStyles = {
    bubble: {
      container: 'w-full max-w-[380px] h-[660px] rounded-[2rem]',
      label: 'Chat Bubble',
    },
    inline: {
      container: 'w-full max-w-[480px] h-[500px] rounded-2xl',
      label: 'Inline Embed',
    },
    fullpage: {
      container: 'w-full max-w-[700px] h-[580px] rounded-xl',
      label: 'Full Page',
    },
  };

  const frame = frameStyles[embedStyle];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0c]">
      {/* Preview Header */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Live Preview</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/20 ml-1">— {frame.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <span className="text-[10px] text-white/20">{chatMessages.length} messages</span>
          )}
          {chatMessages.length > 0 && (
            <button onClick={resetChat} className="text-white/30 hover:text-white/60 transition-colors" title="Reset test chat">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Frame */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <motion.div
          key={embedStyle}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className={cn(
            frame.container,
            'border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/50 flex flex-col overflow-hidden relative',
            embedStyle === 'bubble' && 'rounded-[2rem]',
          )}
        >
          {/* Phone notch - only for bubble style */}
          {embedStyle === 'bubble' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-10 border-x border-b border-white/[0.04]" />
          )}

          {/* Chat Header */}
          <div
            className={cn(
              "px-5 pb-4 flex items-center gap-3 shrink-0",
              embedStyle === 'bubble' ? 'pt-8' : 'pt-4',
            )}
            style={{ background: `linear-gradient(135deg, ${themeColor}20, transparent)` }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: themeColor }}
            >
              {config.avatar_url ? (
                <img src={config.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn("font-semibold text-white truncate", embedStyle === 'fullpage' ? 'text-base' : 'text-sm')}>
                {config.name || 'Your GPT'}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", isResponding ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                <span className="text-[11px] text-white/40">{isResponding ? 'Typing...' : 'Online'}</span>
                {config.enable_web_search && (
                  <>
                    <span className="text-white/20">·</span>
                    <Globe className="h-3 w-3 text-white/30" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {/* Welcome Message */}
            {config.welcome_message && chatMessages.length === 0 && (
              <div className="flex gap-2.5">
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: themeColor }}
                >
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-xs text-white/70 leading-relaxed">{config.welcome_message}</p>
                </div>
              </div>
            )}

            {/* Starter Questions */}
            {config.starter_questions.length > 0 && chatMessages.length === 0 && (
              <div className={cn("space-y-1.5 pl-8", embedStyle === 'fullpage' && 'grid grid-cols-2 gap-2 space-y-0')}>
                {config.starter_questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={isResponding || !config.system_prompt}
                    className="w-full text-left px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <p className="text-[11px] text-white/50">{q}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            <AnimatePresence mode="popLayout">
              {chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-xs',
                      msg.role === 'user'
                        ? 'rounded-br-md text-white'
                        : 'bg-white/[0.04] border border-white/[0.06] rounded-bl-md text-white/80'
                    )}
                    style={msg.role === 'user' ? { backgroundColor: themeColor } : undefined}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-xs prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-white/40" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isResponding && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                  <Bot className="h-3.5 w-3.5 text-white animate-pulse" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasContent && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 opacity-30"
                  style={{ backgroundColor: themeColor }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs text-white/20 max-w-[200px]">
                  Describe your GPT in the chat panel, then test it here
                </p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 px-3 pb-4 pt-2">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5">
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={config.system_prompt ? (config.placeholder_prompt || 'Ask me anything...') : 'Configure system prompt first...'}
                className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
                disabled={!config.system_prompt || isResponding}
              />
              <button
                onClick={() => handleSend()}
                disabled={!previewInput.trim() || isResponding || !config.system_prompt}
                className="h-7 w-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ backgroundColor: themeColor }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            {config.description && (
              <p className="text-[10px] text-white/20 text-center mt-2 px-4 truncate">
                {config.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
