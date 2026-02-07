import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Square, Trash2, Sparkles, Loader2, Bot, User, Lightbulb, FileCode, CheckCircle2,
  Zap, MessageCircle, Hammer, ImagePlus, X, Brain, Compass, Code2, History, ChevronRight,
  LayoutGrid, Wrench, AlertTriangle, Copy, RotateCcw, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BuilderMessage, BuilderMode, ThinkingPhase, VersionSnapshot } from '@/hooks/useAIAppBuilder';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import ReactMarkdown from 'react-markdown';
import { CodeDiffViewer } from './CodeDiffViewer';
import { TokenUsageIndicator } from './TokenUsageIndicator';

interface BuilderChatPanelProps {
  messages: BuilderMessage[];
  isGenerating: boolean;
  fileCount: number;
  mode: BuilderMode;
  thinkingPhase: ThinkingPhase;
  versions: VersionSnapshot[];
  totalTokensUsed: number;
  previousFiles: ProjectFile[];
  latestFiles: ProjectFile[];
  onModeChange: (mode: BuilderMode) => void;
  onSend: (message: string, imageDataUrl?: string | null) => void;
  onStop: () => void;
  onClear: () => void;
  onRestoreVersion: (id: string) => void;
  onOpenTemplates: () => void;
  onFixError: (errorPrompt: string) => void;
}

const STARTER_PROMPTS = [
  { label: 'Landing Page', desc: 'Hero, features, testimonials, footer', icon: '🚀' },
  { label: 'Analytics Dashboard', desc: 'Cards, charts, activity feed', icon: '📊' },
  { label: 'Task Board', desc: 'Kanban columns with drag & drop', icon: '✅' },
  { label: 'E-commerce Store', desc: 'Product grid, filters, cart', icon: '🛒' },
  { label: 'SaaS Settings', desc: 'Profile, billing, notifications', icon: '⚙️' },
  { label: 'Chat Interface', desc: 'AI chat with streaming responses', icon: '💬' },
];

const THINKING_LABELS: Record<string, { icon: typeof Brain; label: string; color: string }> = {
  analyzing: { icon: Brain, label: 'Analyzing your request...', color: 'text-violet-400' },
  planning: { icon: Compass, label: 'Planning architecture...', color: 'text-cyan-400' },
  writing: { icon: Code2, label: 'Writing code...', color: 'text-emerald-400' },
};

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
  messages, isGenerating, fileCount, mode, thinkingPhase, versions,
  totalTokensUsed, previousFiles, latestFiles,
  onModeChange, onSend, onStop, onClear, onRestoreVersion, onOpenTemplates, onFixError,
}: BuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingPhase]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim(), imagePreview);
    setInput('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const renderThinkingIndicator = () => {
    if (!thinkingPhase) return null;
    const phase = THINKING_LABELS[thinkingPhase];
    if (!phase) return null;
    const Icon = phase.icon;

    return (
      <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
          <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-3.5 w-3.5 animate-pulse", phase.color)} />
            <span className={cn("text-xs font-medium", phase.color)}>{phase.label}</span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {['analyzing', 'planning', 'writing'].map((step, i) => (
              <div
                key={step}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step === thinkingPhase ? 'w-8 bg-cyan-400' :
                  ['analyzing', 'planning', 'writing'].indexOf(step) < ['analyzing', 'planning', 'writing'].indexOf(thinkingPhase)
                    ? 'w-8 bg-cyan-400/30' : 'w-8 bg-white/5'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAssistantMessage = (msg: BuilderMessage, isLast: boolean) => {
    const { text, fileNames } = getDisplayContent(msg);
    const isStreaming = isGenerating && isLast;
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
        {text && (
          <div className="prose prose-sm prose-invert max-w-none text-[13px] text-white/80 leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:text-white/70 [&_strong]:text-white/95 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
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

        {/* Code diff viewer for changed files */}
        {!isStreaming && isLast && hasFiles && previousFiles.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {latestFiles.slice(0, 3).map(file => {
              const prev = previousFiles.find(p => p.path === file.path);
              if (!prev) return null;
              return (
                <CodeDiffViewer
                  key={file.path}
                  oldContent={prev.content}
                  newContent={file.content}
                  fileName={file.path}
                />
              );
            })}
          </div>
        )}

        {/* Follow-up suggestion chips */}
        {!isStreaming && isLast && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04] mt-3">
            {msg.suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => {
                  if (suggestion.includes('→')) {
                    onModeChange('build');
                  } else {
                    onSend(suggestion);
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-cyan-500/30 hover:bg-cyan-500/[0.05] transition-all"
              >
                {suggestion}
              </button>
            ))}
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
        <div className="flex items-center gap-1.5">
          {totalTokensUsed > 0 && (
            <TokenUsageIndicator
              tokensUsed={totalTokensUsed}
              maxTokens={200000}
              messageCount={messages.filter(m => m.role === 'user').length}
            />
          )}
          {versions.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                showHistory ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
              )}
            >
              <History className="h-3.5 w-3.5" />
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={onClear}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Version History Drawer */}
      {showHistory && versions.length > 0 && (
        <div className="border-b border-white/[0.06] bg-white/[0.02] max-h-40 overflow-auto">
          <div className="px-3 py-2">
            <div className="text-[10px] text-white/20 uppercase tracking-wider font-medium mb-1.5">Version History</div>
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => { onRestoreVersion(v.id); setShowHistory(false); }}
                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors group flex items-center gap-2"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-white/60 group-hover:text-white/80 truncate">{v.label}</div>
                  <div className="text-[9px] text-white/20">{v.files.length} files · {v.timestamp.toLocaleTimeString()}</div>
                </div>
                <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/40 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

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

                {/* Browse templates button */}
                <button
                  onClick={onOpenTemplates}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] text-sm transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-white/20 group-hover:text-cyan-400/60" />
                    <div>
                      <div className="text-xs font-medium text-white/50 group-hover:text-white/70">Browse All Templates</div>
                      <div className="text-[10px] text-white/20 group-hover:text-white/35">12 starter templates across 4 categories</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5 group/msg relative',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.06]">
                    <Bot className="h-3 w-3 text-cyan-400" />
                  </div>
                )}
                <div className="relative max-w-[88%]">
                  {/* Hover actions */}
                  <div className={cn(
                    "absolute -top-5 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10",
                    msg.role === 'user' ? 'right-0' : 'left-0'
                  )}>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                      title="Copy"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    {msg.role === 'user' && (
                      <>
                        <button
                          onClick={() => onSend(msg.content)}
                          className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                          title="Retry"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => { setEditingMsgId(msg.id); setEditInput(msg.content); }}
                          className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {editingMsgId === msg.id ? (
                    <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 space-y-2">
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="w-full bg-transparent text-sm text-white/90 resize-none outline-none min-h-[40px]"
                        autoFocus
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setEditingMsgId(null)} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded">Cancel</button>
                        <button
                          onClick={() => { onSend(editInput); setEditingMsgId(null); }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-cyan-500/10"
                        >
                          Re-send
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div
                    className={cn(
                      'rounded-xl px-3.5 py-2.5',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600/80 to-cyan-500/80 text-white text-[13px]'
                        : 'bg-white/[0.03] border border-white/[0.06]'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      renderAssistantMessage(msg, idx === messages.length - 1)
                    ) : (
                      <div>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="Reference" className="rounded-lg max-h-32 mb-2 border border-white/10" />
                        )}
                        <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                      </div>
                    )}
                  </div>
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

          {/* Thinking indicator */}
          {isGenerating && thinkingPhase && renderThinkingIndicator()}
        </div>
      </ScrollArea>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-3 pt-2 shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Upload preview" className="h-16 rounded-lg border border-white/10" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Mode Toggle + Input */}
      <div className="p-3 border-t border-white/[0.06] shrink-0 space-y-2">
        {/* Build / Discuss toggle */}
        <div data-tour="mode-toggle" className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
          <button
            onClick={() => onModeChange('discuss')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all font-medium",
              mode === 'discuss'
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-white/30 hover:text-white/50"
            )}
          >
            <MessageCircle className="h-3 w-3" />
            Discuss
          </button>
          <button
            onClick={() => onModeChange('build')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-all font-medium",
              mode === 'build'
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-white/30 hover:text-white/50"
            )}
          >
            <Hammer className="h-3 w-3" />
            Build
          </button>
        </div>

        <div data-tour="chat-input" className="flex gap-2 items-end bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-cyan-500/30 transition-colors">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors shrink-0"
            title="Upload reference image"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'discuss'
                ? "Let's talk about what you want to build..."
                : messages.length === 0 ? 'Describe the app you want to build...' : 'Describe changes...'
            }
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
                  ? mode === 'discuss'
                    ? "bg-gradient-to-r from-violet-500 to-violet-400 text-white hover:opacity-90"
                    : "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:opacity-90"
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
