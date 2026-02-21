import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GPTBuilderMessage, GPTConfig } from '@/types/gptConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Send, Square, Bot, User, Sparkles, X, ImagePlus, Pin, Search, ChevronDown, ChevronUp, Copy, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface GPTBuilderChatPanelProps {
  messages: GPTBuilderMessage[];
  isGenerating: boolean;
  onSend: (message: string, imageDataUrls?: string[] | null) => void;
  onStop: () => void;
  config: GPTConfig;
}

const SUGGESTIONS = [
  "Build me a customer support bot that's friendly and professional",
  "Create an AI coding assistant that specializes in React and TypeScript",
  "I need an HR assistant that can answer employee policy questions",
  "Make a creative writing partner that helps with storytelling",
];

const PROMPT_TEMPLATES = [
  { label: 'Add personality and tone', prompt: 'Give this GPT a distinct personality. Make it warm, witty, and conversational while staying professional.' },
  { label: 'Define knowledge boundaries', prompt: 'Set clear knowledge boundaries. The GPT should only answer questions about the topics it was designed for and politely decline off-topic requests.' },
  { label: 'Set up guardrails', prompt: 'Add safety guardrails. The GPT should refuse harmful requests, avoid generating inappropriate content, and stay on-topic.' },
  { label: 'Add conversation starters', prompt: 'Suggest 4 engaging starter questions that users can click to begin a conversation.' },
  { label: 'Configure for customer support', prompt: 'Optimize this GPT for customer support. It should be empathetic, solution-oriented, and escalate to humans when needed.' },
  { label: 'Make it multilingual', prompt: 'Make this GPT respond in whatever language the user writes in, while maintaining consistent quality across languages.' },
];

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 h-6 px-2 rounded bg-white/[0.08] hover:bg-white/[0.15] text-[10px] text-white/50 hover:text-white/80 flex items-center gap-1 transition-colors">
      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? `<mark class="bg-yellow-400/30 text-white rounded px-0.5">${part}</mark>`
      : part
  ).join('');
}

export function GPTBuilderChatPanel({ messages, isGenerating, onSend, onStop, config }: GPTBuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const pinnedMessages = useMemo(() => messages.filter(m => pinnedIds.has(m.id)), [messages, pinnedIds]);

  const searchMatches = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map(m => m.id);
  }, [messages, searchQuery]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreviews(prev => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim(), imagePreviews.length > 0 ? imagePreviews : null);
    setInput('');
    setImagePreviews([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`gpt-msg-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const markdownComponents = useMemo(() => ({
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isBlock = match || (typeof children === 'string' && children.includes('\n'));
      if (isBlock) {
        const codeStr = String(children).replace(/\n$/, '');
        return (
          <div className="relative group">
            <CopyCodeButton code={codeStr} />
            <pre className={className}><code {...props}>{children}</code></pre>
          </div>
        );
      }
      return <code className={className} {...props}>{children}</code>;
    },
  }), []);

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      {/* Search bar */}
      {showSearch && (
        <div className="shrink-0 px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {searchQuery && (
            <span className="text-[10px] text-white/40">{searchMatches.length} match{searchMatches.length !== 1 ? 'es' : ''}</span>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-white/30 hover:text-white/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pinned messages section */}
      {pinnedMessages.length > 0 && (
        <Collapsible open={pinnedOpen} onOpenChange={setPinnedOpen}>
          <CollapsibleTrigger className="w-full shrink-0 px-3 py-1.5 border-b border-white/[0.06] flex items-center gap-1.5 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors">
            <Pin className="h-3 w-3" />
            <span>{pinnedMessages.length} pinned</span>
            {pinnedOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="border-b border-white/[0.06]">
            <div className="px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
              {pinnedMessages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => scrollToMessage(msg.id)}
                  className="w-full text-left px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.04] truncate transition-colors"
                >
                  <span className="text-white/20 mr-1">{msg.role === 'user' ? '👤' : '🤖'}</span>
                  {msg.content.slice(0, 80)}...
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center max-w-md"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Build Your GPT</h2>
              <p className="text-white/50 text-sm mb-8">
                Describe what you want your AI assistant to do, and I'll configure everything — name, personality, instructions, and more.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => onSend(suggestion)}
                    className="text-left px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-sm text-white/60 hover:text-white/80"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  id={`gpt-msg-${msg.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={cn(
                    'flex gap-3 group',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                    searchQuery && searchMatches.includes(msg.id) && 'ring-1 ring-yellow-400/30 rounded-xl'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: config.theme_color || '#6366f1' }}
                    >
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="relative max-w-[85%]">
                    {/* Pin button on hover */}
                    <button
                      onClick={() => togglePin(msg.id)}
                      className={cn(
                        'absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center transition-all z-10',
                        pinnedIds.has(msg.id)
                          ? 'bg-amber-400/20 text-amber-400 opacity-100'
                          : 'bg-white/[0.06] text-white/30 opacity-0 group-hover:opacity-100 hover:text-white/60'
                      )}
                    >
                      <Pin className="h-3 w-3" />
                    </button>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-white/[0.04] text-white/90 border border-white/[0.06] rounded-bl-md'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
                          <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div>
                          {msg.imageUrls?.map((url, i) => (
                            <img key={i} src={url} alt={`Reference ${i + 1}`} className="rounded-lg max-h-32 mb-2 mr-2 border border-white/10 inline-block" />
                          ))}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-white/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: config.theme_color || '#6366f1' }}
                >
                  <Bot className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        {imagePreviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-2 max-w-3xl mx-auto">
            {imagePreviews.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img} alt={`Pasted ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-white/[0.08]" />
                <button
                  onClick={() => setImagePreviews(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <span className="text-xs text-white/40">{imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} attached</span>
          </div>
        )}
        <div className="relative flex items-end gap-2 max-w-3xl mx-auto">
          {/* Image upload + prompt templates + search */}
          <div className="flex items-center gap-0.5 shrink-0 mb-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
              title="Upload reference images"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors" title="Prompt templates">
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-64 bg-[#0d0d14] border-white/[0.08] p-1">
                {PROMPT_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(t.prompt)}
                    className="w-full text-left px-3 py-2 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <button
              onClick={() => setShowSearch(v => !v)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                showSearch ? "text-white/60 bg-white/[0.06]" : "text-white/20 hover:text-white/50 hover:bg-white/5"
              )}
              title="Search messages"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Describe your ideal AI assistant..."
            className="min-h-[44px] max-h-[160px] bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 resize-none rounded-xl pr-12 focus-visible:ring-primary/30"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            {input.trim() && !isGenerating && (
              <span className="text-[10px] text-violet-400/60 font-mono">2 credits</span>
            )}
            {isGenerating ? (
              <Button size="icon" variant="ghost" onClick={onStop} className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSubmit} disabled={!input.trim()} className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
