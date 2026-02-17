import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { GPTConfig, DEFAULT_WIDGET_THEME } from '@/types/gptConfig';
import { Bot, Send, Globe, Sparkles, RotateCcw, User, MessageCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useUserCredits } from '@/hooks/useUserCredits';

export interface GPTBuilderPreviewHandle {
  getPreviewElement: () => HTMLElement | null;
}

interface GPTBuilderPreviewProps {
  config: GPTConfig;
}

interface PreviewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const GPTBuilderPreview = forwardRef<GPTBuilderPreviewHandle, GPTBuilderPreviewProps>(function GPTBuilderPreview({ config }, ref) {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getPreviewElement: () => previewContainerRef.current,
  }), []);
  const [previewInput, setPreviewInput] = useState('');
  const [chatMessages, setChatMessages] = useState<PreviewMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [showAllStarters, setShowAllStarters] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { deductCredits, totalRemaining } = useUserCredits();
  const themeColor = config.theme_color || '#6366f1';
  const wt = useMemo(() => ({ ...DEFAULT_WIDGET_THEME, ...(config.widget_theme || {}) }), [config.widget_theme]);
  const userBubble = wt.user_bubble || themeColor;
  const starterBg = wt.starter_background || themeColor;

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
    if (totalRemaining < 1) {
      toast.error('Insufficient credits. Purchase more to continue.');
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
            enableWebSearch: !!config.enable_web_search,
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

    // Deduct 1 credit for test chat
    await deductCredits(1, 'GPT test chat');
  }, [previewInput, isResponding, config.system_prompt, chatMessages, totalRemaining, deductCredits]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setChatMessages([]);
    setIsResponding(false);
    setShowAllStarters(false);
  };

  const hasContent = config.welcome_message || config.starter_questions.length > 0 || chatMessages.length > 0;
  const embedStyle = config.embed_style || 'bubble';

  const frameStyles = {
    bubble: { container: 'w-full max-w-[380px] h-[660px] rounded-[2rem]', label: 'Chat Bubble' },
    inline: { container: 'w-full max-w-[480px] h-[500px] rounded-2xl', label: 'Inline Embed' },
    fullpage: { container: 'w-full max-w-[700px] h-[580px] rounded-xl', label: 'Full Page' },
  };
  const frame = frameStyles[embedStyle];

  const visibleStarters = showAllStarters ? config.starter_questions : config.starter_questions.slice(0, 3);

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

      {/* Frame — White themed chat widget */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <motion.div
          ref={previewContainerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className={cn(
            frame.container,
            'shadow-2xl shadow-black/30 flex flex-col overflow-hidden relative',
            embedStyle === 'bubble' && 'rounded-[2rem]',
          )}
          style={{ backgroundColor: wt.background, color: wt.text_color, borderWidth: 1, borderColor: wt.input_border }}
        >
          {/* Phone notch - only for bubble style */}
          {embedStyle === 'bubble' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-10" />
          )}

          {/* Chat Body — scrollable area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 min-h-0">
            {/* Welcome / Landing state */}
            {chatMessages.length === 0 && (
              <div className={cn("flex flex-col items-center", embedStyle === 'bubble' ? 'pt-10 pb-4' : 'pt-8 pb-4')}>
                {/* Avatar */}
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center shadow-md mb-5"
                  style={{ backgroundColor: themeColor }}
                >
                  {config.avatar_url ? (
                    <img src={config.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {config.name ? config.name.substring(0, 5).toUpperCase() : 'GPT'}
                    </span>
                  )}
                </div>

                {/* Welcome message */}
                {config.welcome_message && (
                  <div className="w-full max-w-md rounded-xl p-4 mb-4" style={{ borderWidth: 1, borderColor: wt.input_border }}>
                    <div className="flex gap-2.5 items-start">
                      <MessageCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: wt.text_color + '66' }} />
                      <p className="text-sm leading-relaxed" style={{ color: wt.text_color }}>{config.welcome_message}</p>
                    </div>
                  </div>
                )}

                {/* Starter Questions — full-width branded buttons */}
                {config.starter_questions.length > 0 && (
                  <div className="w-full max-w-md space-y-2">
                    {visibleStarters.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        disabled={isResponding || !config.system_prompt}
                        className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: starterBg, color: wt.starter_text }}
                      >
                        "{q}"
                      </button>
                    ))}
                    {config.starter_questions.length > 3 && !showAllStarters && (
                      <button
                        onClick={() => setShowAllStarters(true)}
                        className="w-full text-center text-sm flex items-center justify-center gap-1 py-1"
                        style={{ color: wt.text_color + '88' }}
                      >
                        View More <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {!hasContent && (
                  <div className="flex flex-col items-center justify-center text-center px-6 mt-8">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 opacity-30"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-xs max-w-[200px]" style={{ color: wt.text_color + '66' }}>
                      Describe your GPT in the chat panel, then test it here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            <div className={cn("space-y-3", chatMessages.length > 0 ? 'py-4' : '')}>
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
                        className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
                        msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                      )}
                      style={
                        msg.role === 'user'
                          ? { backgroundColor: userBubble, color: wt.user_bubble_text }
                          : { backgroundColor: wt.assistant_bubble, color: wt.assistant_bubble_text }
                      }
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose prose-sm max-w-none
                            [&>p]:mb-2.5 [&>p:last-child]:mb-0
                            [&>h1]:text-base [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-3
                            [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:mt-3
                            [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1.5 [&>h3]:mt-2.5
                            [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2.5 [&>ul]:space-y-1
                            [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2.5 [&>ol]:space-y-1
                            [&_li]:text-sm [&_li>p]:mb-0
                            [&>blockquote]:border-l-2 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:opacity-80
                            [&>pre]:rounded-md [&>pre]:p-2.5 [&>pre]:text-xs [&>pre]:overflow-x-auto
                            [&_code]:text-xs [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                            [&>hr]:my-3 [&>hr]:opacity-20
                            [&_strong]:font-semibold
                            [&_a]:underline [&_a]:underline-offset-2"
                          style={{
                            color: wt.assistant_bubble_text,
                            '--tw-prose-headings': wt.assistant_bubble_text,
                            '--tw-prose-bold': wt.assistant_bubble_text,
                            '--tw-prose-bullets': wt.assistant_bubble_text + 'aa',
                            '--tw-prose-counters': wt.assistant_bubble_text + 'aa',
                            '--tw-prose-code': wt.assistant_bubble_text,
                            '--tw-prose-quotes': wt.assistant_bubble_text + 'cc',
                            '--tw-prose-links': wt.assistant_bubble_text,
                          } as React.CSSProperties}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: wt.assistant_bubble }}>
                        <User className="h-3.5 w-3.5" style={{ color: wt.assistant_bubble_text + '88' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isResponding && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                    <Bot className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5" style={{ backgroundColor: wt.assistant_bubble }}>
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: wt.assistant_bubble_text + '55', animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: wt.assistant_bubble_text + '55', animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ backgroundColor: wt.assistant_bubble_text + '55', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="shrink-0 px-4 pb-4 pt-2" style={{ borderTopWidth: 1, borderColor: wt.input_border }}>
            <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ backgroundColor: wt.input_background, borderWidth: 1, borderColor: wt.input_border }}>
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={config.system_prompt ? (config.placeholder_prompt || 'How can I help you today?') : 'Configure system prompt first...'}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: wt.input_text }}
                disabled={!config.system_prompt || isResponding}
              />
              <button
                onClick={() => handleSend()}
                disabled={!previewInput.trim() || isResponding || !config.system_prompt}
                className="h-8 w-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ backgroundColor: themeColor }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            {config.description && (
              <p className="text-[10px] text-center mt-2 px-4 truncate" style={{ color: wt.text_color + '66' }}>
                {config.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
});
