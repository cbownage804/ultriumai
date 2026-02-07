import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send, Square, Trash2, Sparkles, Loader2, Bot, User, Lightbulb, FileCode, CheckCircle2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuilderMessage } from '@/hooks/useAIAppBuilder';

interface BuilderChatPanelProps {
  messages: BuilderMessage[];
  isGenerating: boolean;
  fileCount: number;
  onSend: (message: string) => void;
  onStop: () => void;
  onClear: () => void;
}

const STARTER_PROMPTS = [
  { label: 'Landing Page', desc: 'Hero, features, testimonials, footer', icon: '🚀' },
  { label: 'Analytics Dashboard', desc: 'Cards, charts, activity feed', icon: '📊' },
  { label: 'Task Board', desc: 'Kanban columns with drag & drop', icon: '✅' },
  { label: 'E-commerce Store', desc: 'Product grid, filters, cart', icon: '🛒' },
  { label: 'SaaS Settings', desc: 'Profile, billing, notifications', icon: '⚙️' },
  { label: 'Chat Interface', desc: 'AI chat with streaming responses', icon: '💬' },
];

function getDisplayContent(msg: BuilderMessage): { text: string; fileNames: string[] } {
  if (msg.role === 'user') return { text: msg.content, fileNames: [] };

  const lines = msg.content.split('\n');
  const textLines: string[] = [];
  const fileNames: string[] = [];
  let insideFile = false;

  for (const line of lines) {
    const fileMatch = line.match(/^===FILE:\s*(.+?)===$/);
    if (fileMatch) {
      insideFile = true;
      fileNames.push(fileMatch[1].trim());
    } else if (insideFile) {
      continue;
    } else {
      textLines.push(line);
    }
  }

  const text = textLines.join('\n').trim();
  const cleaned = text.replace(/```html\n?[\s\S]*?```/g, '').trim();
  return { text: cleaned, fileNames };
}

export function BuilderChatPanel({
  messages, isGenerating, fileCount, onSend, onStop, onClear,
}: BuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderAssistantMessage = (msg: BuilderMessage) => {
    const { text, fileNames } = getDisplayContent(msg);
    const isStreaming = isGenerating && msg === messages[messages.length - 1];
    const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;

    return (
      <div className="space-y-2">
        {hasFiles && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-white/70">
              Generated {msg.filesGenerated} file{msg.filesGenerated! > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {fileNames.length > 0 && !hasFiles && (
          <div className="flex flex-wrap gap-1">
            {fileNames.slice(0, 5).map((name, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-cyan-400/80 bg-cyan-500/10 rounded px-1.5 py-0.5 font-mono">
                <FileCode className="h-2.5 w-2.5" />
                {name}
              </span>
            ))}
            {fileNames.length > 5 && (
              <span className="text-[10px] text-white/30">+{fileNames.length - 5} more</span>
            )}
          </div>
        )}
        {text && <p className="whitespace-pre-wrap text-[13px] text-white/80 leading-relaxed">{text}</p>}
        {isStreaming && !hasFiles && fileNames.length === 0 && !text && (
          <div className="flex items-center gap-2 text-white/50">
            <div className="flex gap-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.4s]" />
            </div>
            <span className="text-xs">Building your app...</span>
          </div>
        )}
        {isStreaming && fileNames.length > 0 && !hasFiles && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
            <span>Writing {fileNames.length} file{fileNames.length > 1 ? 's' : ''}...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-r border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Builder</h2>
            <p className="text-[10px] text-white/30">
              {fileCount > 0 ? `${fileCount} files` : 'Describe what to build'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-6 pt-6">
              <div className="text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/[0.06] flex items-center justify-center mx-auto">
                  <Sparkles className="h-7 w-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">What do you want to build?</h3>
                  <p className="text-xs text-white/30 mt-1 max-w-[260px] mx-auto">
                    Describe any web app and I'll generate a multi-file project with live preview.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/20 px-1 uppercase tracking-wider font-medium">
                  <Lightbulb className="h-3 w-3" />
                  Quick start
                </div>
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(`${prompt.label}: ${prompt.desc}`)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-white/[0.06] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] text-sm transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{prompt.icon}</span>
                      <div>
                        <div className="text-xs font-medium text-white/70 group-hover:text-white/90">{prompt.label}</div>
                        <div className="text-[10px] text-white/25 group-hover:text-white/40">{prompt.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.06]">
                    <Bot className="h-3 w-3 text-cyan-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2.5 max-w-[88%]',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600/80 to-cyan-500/80 text-white text-[13px]'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    renderAssistantMessage(msg)
                  ) : (
                    <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-6 w-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.06]">
                    <User className="h-3 w-3 text-white/50" />
                  </div>
                )}
              </div>
            ))
          )}
          {isGenerating && !messages.some(m => m.role === 'assistant') && (
            <div className="flex gap-2.5">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
                <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-[13px] text-white/40">
                <div className="flex gap-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.2s]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <div className="flex gap-2 items-end bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-cyan-500/30 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.length === 0 ? 'Describe the app you want to build...' : 'Describe changes...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 resize-none outline-none min-h-[24px] max-h-[120px] py-0.5"
          />
          {isGenerating ? (
            <button
              onClick={onStop}
              className="h-7 w-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors shrink-0"
            >
              <Square className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-all shrink-0",
                input.trim()
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:opacity-90"
                  : "bg-white/5 text-white/20"
              )}
            >
              <Send className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
