import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Square, Trash2, Sparkles, Loader2, Bot, User, Lightbulb, FileCode, CheckCircle2,
  Zap, MessageCircle, Wand2, ImagePlus, X, Brain, Compass, Code2, History, ChevronRight,
  LayoutGrid, Wrench, AlertTriangle, Copy, RotateCcw, Pencil, GitFork, ChevronDown, Check,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BuilderMessage, BuilderMode, ThinkingPhase, VersionSnapshot } from '@/hooks/useAIAppBuilder';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import ReactMarkdown from 'react-markdown';
import { CodeDiffViewer } from './CodeDiffViewer';
import { SUPABASE_SLASH_COMMANDS, detectSupabaseIntents, generateIntentSuggestions, analyzeConversationComplexity } from './SupabaseConversational';
import { StreamingText, StreamingCursor, ElapsedTimer } from './StreamingText';

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
  onForkFromMessage?: (messageId: string) => void;
  onRevertToMessage?: (messageId: string) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onToggleVisualEdit?: () => void;
  isVisualEditActive?: boolean;
  onOpenEditHistory?: () => void;
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

  let text = textLines.join('\n').trim();
  // Strip HTML code blocks
  text = text.replace(/```html\n?[\s\S]*?```/g, '').trim();
  // Hide raw JSON planning objects (approach, steps, filesToCreate, etc.)
  // Check if content looks like a planning JSON (even if incomplete/streaming)
  if (/^\s*\{/.test(text) && /["'](?:approach|filesToCreate|steps|filesToModify|dependencies)["']\s*:/.test(text)) {
    text = '';
  }
  return { text: text, fileNames };
}

function isInternalMessage(content: string): boolean {
  return content.includes('PLANNING MODE') || 
    content.includes('Return ONLY valid JSON') || 
    content.includes('return a structured plan as JSON') ||
    content.includes('filesToCreate') ||
    content.includes('filesToModify') ||
    (content.includes('"approach"') && content.includes('"steps"'));
}

const AI_MODELS = [
  { id: 'google/gemini-3-flash-preview', label: 'Flash', desc: 'Fast & efficient', icon: '⚡' },
  { id: 'google/gemini-3-pro-preview', label: 'Pro', desc: 'Higher quality', icon: '💎' },
  { id: 'openai/gpt-5', label: 'GPT-5', desc: 'Most capable', icon: '🧠' },
];

function CopyCodeButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
        <Bot className="h-3 w-3 text-cyan-400" />
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-3">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function BuilderChatPanel({
  messages, isGenerating, fileCount, mode, thinkingPhase, versions,
  totalTokensUsed, previousFiles, latestFiles,
  onModeChange, onSend, onStop, onClear, onRestoreVersion, onOpenTemplates, onFixError,
  onForkFromMessage, onRevertToMessage, selectedModel, onModelChange,
  onToggleVisualEdit, isVisualEditActive, onOpenEditHistory,
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
    // ScrollArea's actual scrollable element is the Viewport child
    const el = scrollRef.current;
    if (el) {
      const viewport = el.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      const target = viewport || el;
      requestAnimationFrame(() => {
        target.scrollTop = target.scrollHeight;
      });
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
          setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const [thinkingCollapsed, setThinkingCollapsed] = useState<Record<string, boolean>>({});

  const renderThinkingIndicator = () => {
    if (!thinkingPhase) return null;
    const phase = THINKING_LABELS[thinkingPhase];
    if (!phase) return null;
    const Icon = phase.icon;
    const phases = ['analyzing', 'planning', 'writing'] as const;
    const currentIdx = phases.indexOf(thinkingPhase as any);

    return (
      <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
          <Loader2 className="h-3 w-3 text-cyan-400 animate-spin" />
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 w-full max-w-[280px]">
          {/* Collapsible thinking header */}
          <button
            onClick={() => setThinkingCollapsed(prev => ({ ...prev, __active__: !prev.__active__ }))}
            className="flex items-center gap-2 w-full"
          >
            <ChevronDown className={cn("h-2.5 w-2.5 text-white/20 transition-transform", thinkingCollapsed.__active__ && "-rotate-90")} />
            <Icon className={cn("h-3.5 w-3.5 animate-pulse", phase.color)} />
            <span className={cn("text-xs font-medium", phase.color)}>{phase.label}</span>
            <ElapsedTimer isActive={isGenerating} />
          </button>

          {/* Expanded thinking steps */}
          {!thinkingCollapsed.__active__ && (
            <div className="mt-2 space-y-1 pl-1">
              {phases.map((step, i) => {
                const stepPhase = THINKING_LABELS[step];
                const StepIcon = stepPhase.icon;
                const isDone = i < currentIdx;
                const isActive = i === currentIdx;
                return (
                  <div key={step} className="flex items-center gap-2 py-0.5">
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400/60 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 animate-spin text-cyan-400 shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-white/10 shrink-0" />
                    )}
                    <span className={cn(
                      "text-[11px]",
                      isDone ? "text-white/30 line-through" : isActive ? "text-white/70" : "text-white/15"
                    )}>
                      {stepPhase.label.replace('...', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress bar */}
          <div className="flex gap-1 mt-2">
            {phases.map((step, i) => (
              <div
                key={step}
                className={cn(
                  "h-1 rounded-full transition-all duration-500 flex-1",
                  i <= currentIdx ? 'bg-cyan-400' : 'bg-white/5'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const [expandedBuildMessages, setExpandedBuildMessages] = useState<Set<string>>(new Set());

  const toggleBuildExpanded = (msgId: string) => {
    setExpandedBuildMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  /** Extract plan steps from numbered list patterns in text */
  const extractPlanSteps = (text: string, isStreaming: boolean, hasFiles: boolean): { step: number; label: string; status: 'pending' | 'active' | 'done' }[] | null => {
    // Match patterns like "1. Create header" or "1. **Create header**"
    const stepPattern = /^\d+\.\s+\*{0,2}(.+?)\*{0,2}$/gm;
    const matches = [...text.matchAll(stepPattern)];
    if (matches.length < 2) return null; // Need at least 2 steps to show as a plan
    return matches.map((m, i) => ({
      step: i + 1,
      label: m[1].replace(/\*+/g, '').trim(),
      status: hasFiles ? 'done' as const : isStreaming ? (i === matches.length - 1 ? 'active' as const : 'done' as const) : 'pending' as const,
    }));
  };

  const renderAssistantMessage = (msg: BuilderMessage, isLast: boolean) => {
    const { text, fileNames } = getDisplayContent(msg);
    const isStreaming = isGenerating && isLast;
    const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;
    const isBuildExpanded = expandedBuildMessages.has(msg.id);
    const totalFiles = hasFiles ? msg.filesGenerated! : fileNames.length;
    const isCompleted = !isStreaming && (hasFiles || fileNames.length > 0);
    const planSteps = msg.planSteps || (text ? extractPlanSteps(text, isStreaming, !!hasFiles) : null);

    return (
      <div className="space-y-2.5">
        {/* "Finished thinking" header for completed builds */}
        {isCompleted && (
          <div className="flex items-center gap-1.5 text-white/25 text-[11px]">
            <Brain className="h-3 w-3" />
            <span>Finished thinking</span>
          </div>
        )}

        {/* Conversational text — shown before file cards like Lovable */}
        {text && (
          <StreamingText content={text} isStreaming={isStreaming}>
            {(displayedText) => (
              <div className="prose prose-sm prose-invert max-w-none text-[13px] text-white/80 leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:text-white/70 [&_strong]:text-white/95 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const isInline = !className;
                      const codeStr = String(children).replace(/\n$/, '');
                      if (isInline) {
                        return <code className="bg-white/[0.08] rounded px-1 py-0.5 text-[12px] font-mono text-cyan-300/90" {...props}>{children}</code>;
                      }
                      return (
                        <div className="relative group/code my-2">
                          <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-t-lg">
                            <span className="text-[9px] text-white/25 font-mono">{className?.replace('language-', '') || 'code'}</span>
                            <CopyCodeButton text={codeStr} />
                          </div>
                          <pre className="!mt-0 !rounded-t-none border border-t-0 border-white/[0.06] !bg-black/30"><code className={className} {...props}>{children}</code></pre>
                        </div>
                      );
                    },
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
                <StreamingCursor visible={isStreaming && !!displayedText} />
              </div>
            )}
          </StreamingText>
        )}

        {/* Step-by-step plan display */}
        {planSteps && planSteps.length > 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-cyan-400/60" />
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Plan</span>
            </div>
            <div className="p-2 space-y-0.5">
              {planSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs">
                  {step.status === 'done' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : step.status === 'active' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-white/10 shrink-0" />
                  )}
                  <span className={cn(
                    "text-[12px]",
                    step.status === 'done' ? 'text-white/50' :
                    step.status === 'active' ? 'text-white/80 font-medium' :
                    'text-white/30'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline file edit cards — Lovable style with progressive streaming */}
        {(hasFiles || fileNames.length > 0) && (
          <div className="space-y-1">
            {fileNames.map((name, i) => {
              const shortName = name.split('/').pop() || name;
              const isFileDone = !isStreaming || i < fileNames.length - 1 || hasFiles;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: isStreaming ? i * 0.08 : 0, type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => toggleBuildExpanded(msg.id)}
                  className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isFileDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      </motion.div>
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                    )}
                    <span className="text-white/50">Editing</span>
                    <span className="font-mono text-[11px] text-white/70 bg-white/[0.04] rounded px-1.5 py-0.5 truncate">{shortName}</span>
                  </div>
                  {isStreaming && !isFileDone && (
                    <div className="flex gap-0.5 shrink-0">
                      <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                      <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
                    </div>
                  )}
                  <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/40 shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Expandable diff details */}
        {isBuildExpanded && !isStreaming && hasFiles && previousFiles.length > 0 && (
          <div className="space-y-1.5 pl-2 border-l border-white/[0.06]">
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

        {/* Task progress indicators */}
        {(isStreaming || isCompleted) && fileNames.length > 0 && (
          <div className="space-y-1 pt-1">
            {isStreaming && !hasFiles && (
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                <span className="text-white/50">Writing {fileNames.length} file{fileNames.length > 1 ? 's' : ''}...</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-white/40">Generated {totalFiles} file{totalFiles > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Inline error recovery — show runtime errors with Fix button */}
        {msg.inlineError && !isStreaming && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-red-300/80 flex-1 truncate font-mono text-[11px]">{msg.inlineError.message}</span>
            <button
              onClick={() => onFixError(`Fix this runtime error in my app: "${msg.inlineError!.message}"${msg.inlineError!.source ? ` (in ${msg.inlineError!.source}${msg.inlineError!.line ? `:${msg.inlineError!.line}` : ''})` : ''}`)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors shrink-0 font-medium"
            >
              <Wrench className="h-3 w-3" />
              Fix this
            </button>
          </div>
        )}

        {/* Revert action for completed builds */}
        {isCompleted && isLast && onRevertToMessage && msg.filesSnapshot && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onRevertToMessage(msg.id)}
              className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-amber-400 transition-colors px-2 py-1 rounded-md hover:bg-amber-500/[0.05]"
            >
              <RotateCcw className="h-3 w-3" />
              Undo changes
            </button>
          </div>
        )}

        {/* Empty streaming state */}
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

        {/* Follow-up suggestion chips */}
        {!isStreaming && isLast && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04] mt-3">
            {msg.suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => {
                  if (suggestion.includes('→')) {
                    onModeChange('build');
                  } else {
                    onSend(suggestion.replace(/^[^\w]*/, '')); // Strip leading emoji
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-cyan-500/30 hover:bg-cyan-500/[0.05] transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        )}

        {/* Detected backend intent chips — show when AI detects database/auth/storage needs */}
        {!isStreaming && isLast && (() => {
          const intents = detectSupabaseIntents(text);
          const intentSuggestions = generateIntentSuggestions(intents);
          if (intents.length === 0 || intentSuggestions.length === 0) return null;
          return (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {intents.map((intent, i) => {
                const Icon = intent.icon;
                return (
                  <motion.div
                    key={intent.type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px]"
                  >
                    <Icon className={cn("h-2.5 w-2.5", intent.color)} />
                    <span className="text-white/40">{intent.description}</span>
                    {intent.confidence > 0.8 && <span className="text-emerald-400/50">●</span>}
                  </motion.div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Minimal header — Lovable style */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.06] bg-gradient-to-r from-[#0a0a0f] to-[#0d0a14] shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
            <Sparkles className="h-2.5 w-2.5 text-cyan-400/70" />
          </div>
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">Chat</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.filter(m => m.role === 'user' && !isInternalMessage(m.content)).length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
              <Zap className="h-2.5 w-2.5 text-white/25" />
              <span className="text-[9px] text-white/30 font-mono">
                {messages.filter(m => m.role === 'user' && !isInternalMessage(m.content)).length} msg{messages.filter(m => m.role === 'user' && !isInternalMessage(m.content)).length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {versions.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onOpenEditHistory ? onOpenEditHistory() : setShowHistory(!showHistory)}
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
                    showHistory ? "text-cyan-400 bg-cyan-500/10" : "text-white/25 hover:text-white/50 hover:bg-white/5"
                  )}
                >
                  <History className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Edit History</TooltipContent>
            </Tooltip>
          )}
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClear}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Clear chat</TooltipContent>
            </Tooltip>
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
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-8 relative">
              {/* Ambient glow */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-gradient-to-br from-cyan-500/[0.04] to-violet-500/[0.03] blur-3xl pointer-events-none" />
              
              {/* Hero empty state */}
              <div className="text-center space-y-2.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-white/[0.06] mb-3">
                  <Sparkles className="h-3 w-3 text-cyan-400/60" />
                  <span className="text-[10px] text-white/40 font-medium">AI-Powered Builder</span>
                </div>
                <h3 className="font-semibold text-white/90 text-lg tracking-tight">What do you want to build?</h3>
                <p className="text-xs text-white/30 max-w-[280px] mx-auto leading-relaxed">
                  Describe your app idea and I'll generate production-ready code with live preview.
                </p>
              </div>

              <div className="w-full max-w-[320px] space-y-1.5 relative z-10">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(`${prompt.label}: ${prompt.desc}`)}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-cyan-500/20 bg-white/[0.01] hover:bg-gradient-to-r hover:from-cyan-500/[0.04] hover:to-violet-500/[0.03] text-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center group-hover:border-white/[0.08] group-hover:bg-white/[0.05] transition-all shrink-0">{prompt.icon}</span>
                      <div>
                        <div className="text-[12px] font-medium text-white/70 group-hover:text-white/95 transition-colors">{prompt.label}</div>
                        <div className="text-[10px] text-white/25 group-hover:text-white/40 transition-colors">{prompt.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Browse templates */}
                <button
                  onClick={onOpenTemplates}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-dashed border-white/[0.08] hover:border-cyan-500/20 hover:bg-white/[0.02] text-sm transition-all duration-200 group mt-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center group-hover:border-white/[0.08] transition-all shrink-0">
                      <LayoutGrid className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                    </span>
                    <div>
                      <div className="text-[12px] font-medium text-white/40 group-hover:text-white/65 transition-colors">Browse Templates</div>
                      <div className="text-[10px] text-white/15 group-hover:text-white/30 transition-colors">Start from a pre-built template</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            messages.filter((msg) => {
              // Hide any message containing internal planning/system prompts
              if (isInternalMessage(msg.content)) return false;
              // Hide assistant messages that are only internal planning JSON
              if (msg.role === 'assistant') {
                const { text, fileNames } = getDisplayContent(msg);
                const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;
                if (!text && fileNames.length === 0 && !hasFiles) return false;
              }
              return true;
            }).map((msg, idx, filteredArr) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx === filteredArr.length - 1 ? 0.05 : 0 }}
                className={cn(
                  'flex gap-2.5 group/msg relative',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.08] shadow-sm shadow-cyan-500/5">
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                )}
                <div className="relative max-w-[88%]">
                  {/* Hover actions */}
                  <div className={cn(
                    "absolute -top-6 flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10 bg-[#0d0d14]/90 backdrop-blur-sm rounded-md border border-white/[0.06] px-0.5 py-0.5",
                    msg.role === 'user' ? 'right-0' : 'left-0'
                  )}>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                      title="Copy"
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    {msg.role === 'assistant' && onForkFromMessage && (
                      <button
                        onClick={() => onForkFromMessage(msg.id)}
                        className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
                        title="Fork from here"
                      >
                        <GitFork className="h-2.5 w-2.5" />
                      </button>
                    )}
                    {msg.role === 'assistant' && onRevertToMessage && msg.filesSnapshot && (
                      <button
                        onClick={() => onRevertToMessage(msg.id)}
                        className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Revert to here"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                      </button>
                    )}
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
                      'rounded-2xl px-3.5 py-2.5',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-600/80 to-cyan-500/70 text-white text-[13px] shadow-sm shadow-cyan-500/10'
                        : 'bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      renderAssistantMessage(msg, idx === filteredArr.length - 1)
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
                  {/* Timestamp */}
                  <div className={cn(
                    "text-[9px] text-white/15 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.tokenEstimate && ` · ~${msg.tokenEstimate} tokens`}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.08]">
                    <User className="h-3.5 w-3.5 text-white/50" />
                  </div>
                )}
              </motion.div>
            ))
          )}

          {/* Thinking / typing indicator — only show when no content is streaming yet */}
          {isGenerating && thinkingPhase && renderThinkingIndicator()}
          {isGenerating && !thinkingPhase && (() => {
            const lastMsg = messages[messages.length - 1];
            const hasStreamingContent = lastMsg?.role === 'assistant' && lastMsg.content.length > 0;
            return hasStreamingContent ? null : <TypingIndicator />;
          })()}
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

      {/* Quick Actions + Context Indicator + Mode Toggle + Input */}
      <div className="p-3 border-t border-white/[0.06] shrink-0 space-y-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
        {/* Slash command suggestions */}
        {input.startsWith('/') && !isGenerating && (
          <div className="flex flex-wrap gap-1">
            {[
              { cmd: '/landing', desc: 'Generate a landing page', icon: '🚀' },
              { cmd: '/dashboard', desc: 'Create a dashboard', icon: '📊' },
              { cmd: '/fix', desc: 'Fix the current error', icon: '🔧' },
              { cmd: '/refactor', desc: 'Refactor the codebase', icon: '♻️' },
              { cmd: '/responsive', desc: 'Make it responsive', icon: '📱' },
              { cmd: '/dark-mode', desc: 'Add dark mode', icon: '🌙' },
              ...SUPABASE_SLASH_COMMANDS,
            ].filter(s => s.cmd.startsWith(input.toLowerCase()) || input === '/').map(s => (
              <button
                key={s.cmd}
                onClick={() => { setInput('prompt' in s ? (s as any).prompt : s.desc); setTimeout(() => textareaRef.current?.focus(), 50); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-colors"
              >
                <span>{s.icon}</span>
                <span className="font-mono text-white/30">{s.cmd}</span>
                <span className="text-white/40">·</span>
                <span>{s.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Prompt suggestions for empty state */}
        {messages.length === 0 && !input && (
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Build a landing page', icon: '🚀' },
              { label: 'Create a dashboard with charts', icon: '📊' },
              { label: 'Design a pricing page', icon: '💰' },
              { label: 'Make a contact form', icon: '📝' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setInput(s.label)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Lovable-style input area with integrated mode toggle */}
        <div data-tour="chat-input" className="rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-cyan-500/30 transition-colors overflow-hidden">
          <div className="flex items-end gap-2 px-3 py-2.5">
            {/* Image upload button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors shrink-0"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Upload reference image</TooltipContent>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Visual Edit toggle — Lovable style */}
            {onToggleVisualEdit && fileCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleVisualEdit}
                    className={cn(
                      "h-7 px-2 rounded-lg flex items-center gap-1.5 text-[11px] transition-all shrink-0 border",
                      isVisualEditActive
                        ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
                        : "text-white/20 hover:text-white/50 hover:bg-white/5 border-transparent"
                    )}
                  >
                    <Crosshair className="h-3 w-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Visual Edit Mode</TooltipContent>
              </Tooltip>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                mode === 'discuss'
                  ? "Ask a question..."
                  : messages.length === 0 ? 'Describe the app you want to build...' : 'Describe changes...'
              }
              rows={3}
              className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 resize-none outline-none min-h-[72px] max-h-[200px] py-0.5"
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
          {/* Bottom bar: mode toggle + model selector */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.04] bg-white/[0.01]">
            <div data-tour="mode-toggle" className="flex items-center gap-0.5 bg-white/[0.03] rounded-md p-0.5">
              <button
                onClick={() => onModeChange('discuss')}
                className={cn(
                  "flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all font-medium",
                  mode === 'discuss'
                    ? "bg-white/10 text-white/80"
                    : "text-white/30 hover:text-white/50"
                )}
              >
                <MessageCircle className="h-2.5 w-2.5" />
                Chat
              </button>
              <button
                onClick={() => onModeChange('build')}
                className={cn(
                  "flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all font-medium",
                  mode === 'build'
                    ? "bg-white/10 text-white/80"
                    : "text-white/30 hover:text-white/50"
                )}
              >
                <Wand2 className="h-2.5 w-2.5" />
                Build
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Model selector */}
              {onModelChange && (
                <div className="relative group/model">
                  <button className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.03]">
                    <span>{AI_MODELS.find(m => m.id === selectedModel)?.icon || '⚡'}</span>
                    <span>{AI_MODELS.find(m => m.id === selectedModel)?.label || 'Flash'}</span>
                    <ChevronDown className="h-2.5 w-2.5" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover/model:block z-20">
                    <div className="bg-[#0d0d14] border border-white/[0.08] rounded-lg p-1 shadow-xl min-w-[120px]">
                      {AI_MODELS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => onModelChange(m.id)}
                          className={cn(
                            "w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-colors",
                            selectedModel === m.id ? "bg-white/10 text-white/80" : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                          )}
                        >
                          <span>{m.icon}</span>
                          <div className="text-left">
                            <div className="font-medium">{m.label}</div>
                            <div className="text-[8px] text-white/20">{m.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {(() => {
                const userMsgCount = messages.filter(m => m.role === 'user' && !isInternalMessage(m.content)).length;
                if (userMsgCount === 0) return <span className="text-[9px] text-white/15 font-mono">1 credit/msg</span>;
                const analysis = analyzeConversationComplexity(messages.map(m => ({ role: m.role, content: m.content })));
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[9px] text-white/15 font-mono cursor-default">
                        {userMsgCount} msg{userMsgCount > 1 ? 's' : ''} · {analysis.topicCount} topic{analysis.topicCount !== 1 ? 's' : ''}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px]">
                      {analysis.summary}
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
