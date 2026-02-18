import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Square, Trash2, Sparkles, Loader2, Bot, User, Lightbulb, FileCode, CheckCircle2,
  Zap, MessageCircle, Wand2, ImagePlus, X, Brain, Compass, Code2, History, ChevronRight,
  LayoutGrid, Wrench, AlertTriangle, Copy, RotateCcw, Pencil, GitFork, ChevronDown, Check,
  Crosshair, ClipboardCheck, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BuilderMessage, BuilderMode, ThinkingPhase, VersionSnapshot } from '@/hooks/useAIAppBuilder';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import ReactMarkdown from 'react-markdown';
import { CodeDiffViewer } from './CodeDiffViewer';
import { SUPABASE_SLASH_COMMANDS, detectSupabaseIntents, generateIntentSuggestions, analyzeConversationComplexity, detectCommunicationStyle, detectWebSearchIntent, detectURLCloneIntent } from './SupabaseConversational';
import { StarterTemplatePicker } from './StarterTemplatePicker';
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
  onSend: (message: string, imageDataUrls?: string[] | null) => void;
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
  onSelectStarterTemplate?: (template: import('./AppStarterTemplates').AppStarterTemplate) => void;
  onReview?: () => void;
}


const STARTER_PROMPTS = [
  { label: 'Landing Page', desc: 'Hero, features, testimonials, footer', icon: '🚀', color: 'border-rose-500/15 bg-rose-500/[0.04]', hover: 'hover:border-rose-500/30 hover:bg-rose-500/[0.08] hover:shadow-rose-500/10', iconBg: 'from-rose-500/10 to-orange-500/5 border-rose-500/15' },
  { label: 'Analytics Dashboard', desc: 'Cards, charts, activity feed', icon: '📊', color: 'border-blue-500/15 bg-blue-500/[0.04]', hover: 'hover:border-blue-500/30 hover:bg-blue-500/[0.08] hover:shadow-blue-500/10', iconBg: 'from-blue-500/10 to-cyan-500/5 border-blue-500/15' },
  { label: 'Task Board', desc: 'Kanban columns with drag & drop', icon: '✅', color: 'border-emerald-500/15 bg-emerald-500/[0.04]', hover: 'hover:border-emerald-500/30 hover:bg-emerald-500/[0.08] hover:shadow-emerald-500/10', iconBg: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/15' },
  { label: 'E-commerce Store', desc: 'Product grid, filters, cart', icon: '🛒', color: 'border-amber-500/15 bg-amber-500/[0.04]', hover: 'hover:border-amber-500/30 hover:bg-amber-500/[0.08] hover:shadow-amber-500/10', iconBg: 'from-amber-500/10 to-yellow-500/5 border-amber-500/15' },
  { label: 'SaaS Settings', desc: 'Profile, billing, notifications', icon: '⚙️', color: 'border-violet-500/15 bg-violet-500/[0.04]', hover: 'hover:border-violet-500/30 hover:bg-violet-500/[0.08] hover:shadow-violet-500/10', iconBg: 'from-violet-500/10 to-purple-500/5 border-violet-500/15' },
  { label: 'Chat Interface', desc: 'AI chat with streaming responses', icon: '💬', color: 'border-pink-500/15 bg-pink-500/[0.04]', hover: 'hover:border-pink-500/30 hover:bg-pink-500/[0.08] hover:shadow-pink-500/10', iconBg: 'from-pink-500/10 to-fuchsia-500/5 border-pink-500/15' },
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
    const deleteMatch = line.match(/^===DELETE:\s*(.+?)===$/);
    if (fileMatch) {
      insideFile = true;
      fileNames.push(fileMatch[1].trim());
    } else if (deleteMatch) {
      insideFile = true;
    } else if (insideFile) {
      // Check if we've exited the file block — a blank line followed by conversational text
      // or a new ===FILE: marker means we left the file section
      if (!line.trim()) {
        // Could be end of file — peek ahead by buffering blank lines
        // For simplicity, just skip blank lines inside files
        continue;
      }
      // If this line looks like conversational prose, switch back to text mode
      const trimmed = line.trim();
      const conversationalPatterns = [
        /^(#{1,4}\s)/,                          // Markdown headings
        /^(what'?s|would you|let me|here'?s|i('?ve| have)|shall|want me|feel free|happy to|hope this)/i,
        /^(Great|Perfect|Done|Now |Next |The app|Your app|I've |Here are|Here is|Let me|I can|This )/i,
        /^(🎉|👋|✅|🚀|💡|📝|🔧)/,
        /^\*\*[\w\s]+\*\*[.:]/,                 // **Bold heading**:
        /^\d+\.\s+\*\*[A-Z]/,                   // Numbered bold list
        /^[-•]\s+\*\*[A-Z]/,                     // Bullet bold list
        /^[-•]\s+[A-Z][a-z].*[:.]$/,             // Bullet prose
      ];
      if (conversationalPatterns.some(r => r.test(trimmed))) {
        insideFile = false;
        textLines.push(line);
      }
      // Otherwise still inside file content, skip
    } else {
      textLines.push(line);
    }
  }

  let text = textLines.join('\n').trim();
  // Strip code blocks (html, css, js, etc.)
  text = text.replace(/```[\w]*\n?[\s\S]*?```/g, '').trim();
  // Hide raw JSON planning objects (approach, steps, filesToCreate, etc.)
  if (/^\s*\{/.test(text) && /["'](?:approach|filesToCreate|steps|filesToModify|dependencies)["']\s*:/.test(text)) {
    text = '';
  }
  // Strip noisy AI meta-sections that leak through
  text = text
    // Remove "Strategic Plan:" / "🏗️ Strategic Plan:" sections up to next heading or end
    .replace(/(?:#{1,4}\s*)?(?:🏗️\s*)?Strategic Plan:[\s\S]*?(?=\n#{1,4}\s|\n\*{1,2}✨|$)/gi, '')
    // Remove "Design Decisions I made for you:" sections
    .replace(/(?:#{1,4}\s*)?(?:\*{0,2})?✨?\s*Design Decisions[^:]*:[\s\S]*?(?=\n#{1,4}\s|$)/gi, '')
    // Remove "What's next?" sections
    .replace(/(?:\*{0,2})?What'?s next\??\*{0,2}[\s\S]*$/gi, '')
    // Remove "Note for Scalability" callouts
    .replace(/💡\s*Note for Scalability[^\n]*/gi, '')
    // Remove stray comment markers
    .replace(/^\s*\*\/\s*$/gm, '')
    .replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '')
    // Remove "FIX RULES:" diagnostic blocks
    .replace(/FIX RULES:[\s\S]*$/gi, '')
    // Remove "🔍 Diagnosis:" blocks
    .replace(/(?:\*{0,2})?🔍\s*Diagnosis:?\*{0,2}[\s\S]*?(?=\n===FILE|\n#{1,4}\s[^D]|$)/gi, '')
    // Remove "Symptom:", "Root cause:", "Fix approach:" lines
    .replace(/^[-•*]\s*\*{0,2}(?:Symptom|Root cause|Fix approach|Files affected)\*{0,2}\s*:.*$/gm, '')
    // Remove raw ===FILE: / ===DELETE: markers that weren't caught
    .replace(/^===(?:FILE|DELETE):.*===$/gm, '')
    // Remove "Auto-fix error" lines
    .replace(/^Auto-fix error.*$/gm, '')
    // Remove "This is auto-fix attempt" lines
    .replace(/^This is auto-fix attempt.*$/gm, '')
    // Remove "Return the corrected file" lines
    .replace(/^Return the corrected file.*$/gm, '')
    // Remove "Multi-step workflow" headings
    .replace(/^Multi-step workflow$/gm, '')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text: text, fileNames };
}

/** Strip internal context (file manifests, file trees) from user messages for display */
function getCleanUserContent(content: string): string {
  // Remove "[Project file tree: ...]" blocks (from agent mode)
  let clean = content.replace(/\n*\[Project file tree:\n[\s\S]*?\]\s*$/i, '');
  // Remove "PROJECT FILE MANIFEST ..." and everything after (from buildFileContext)
  clean = clean.replace(/\n*PROJECT FILE MANIFEST[\s\S]*$/i, '');
  return clean.trim();
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
  onToggleVisualEdit, isVisualEditActive, onOpenEditHistory, onSelectStarterTemplate, onReview,
}: BuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
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
    onSend(input.trim(), imagePreviews.length > 0 ? imagePreviews : null);
    setInput('');
    setImagePreviews([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    const isThinkingCollapsed = thinkingCollapsed[msg.id] ?? true;

    // Clean display text — strip plan step duplicates
    const planSteps = msg.planSteps || (text ? extractPlanSteps(text, isStreaming, !!hasFiles) : null);
    const displayText = planSteps && planSteps.length > 0
      ? text.replace(/^\d+\.\s+\*{0,2}.+?\*{0,2}$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
      : text;

    // Calculate elapsed time for "Thought for Xs" display
    const elapsedSeconds = msg.timestamp ? Math.round((Date.now() - msg.timestamp.getTime()) / 1000) : 0;
    const thoughtTime = elapsedSeconds > 0 && elapsedSeconds < 600 ? `${elapsedSeconds}s` : '';

    // Extract first line as intro text (before numbered list or task card)
    const lines = displayText.split('\n').filter(l => l.trim());
    const introLine = lines.length > 0 && !lines[0].match(/^\d+\./) ? lines[0] : '';
    const bodyText = introLine ? displayText.replace(introLine, '').trim() : displayText;

    return (
      <div className="space-y-3">
        {/* "Thought for Xs" — Lovable style collapsible */}
        {(isCompleted || isStreaming) && (
          <button
            onClick={() => setThinkingCollapsed(prev => ({ ...prev, [msg.id]: !isThinkingCollapsed }))}
            className="flex items-center gap-1.5 text-white/30 text-[13px] hover:text-white/50 transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", isThinkingCollapsed && "-rotate-90")} />
            <span>{isStreaming ? 'Thinking...' : `Thought for ${thoughtTime || 'a moment'}`}</span>
          </button>
        )}

        {/* Collapsed thinking content */}
        {!isThinkingCollapsed && introLine && (
          <p className="text-[13px] text-white/50 leading-relaxed">{introLine}</p>
        )}

        {/* Task card — Lovable style bordered card */}
        {(hasFiles || fileNames.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.1] overflow-hidden"
          >
            {/* Card header — clean, no bookmark */}
            <div className="px-4 py-3">
              <span className="text-[13px] font-medium text-white/80">
                {totalFiles > 1 ? `Updated ${totalFiles} files` : fileNames[0]?.split('/').pop() || 'Code changes'}
              </span>
            </div>

            {/* File list inside card */}
            <div className="px-4 pb-2 space-y-1">
              {fileNames.slice(0, 4).map((name, i) => {
                const shortName = name.split('/').pop() || name;
                const isFileDone = !isStreaming || i < fileNames.length - 1 || hasFiles;
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    {isFileDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                    )}
                    <span className="text-[13px] text-white/60 truncate">{shortName}</span>
                  </div>
                );
              })}
              {fileNames.length > 4 && (
                <span className="text-[11px] text-white/30 pl-6">+{fileNames.length - 4} more</span>
              )}
            </div>

            {/* Card footer tabs — Details opens modal */}
            <div className="flex border-t border-white/[0.08]">
              <button
                onClick={() => toggleBuildExpanded(msg.id)}
                className="flex-1 text-center text-[12px] py-2.5 font-medium text-white/40 hover:text-white/60 transition-colors"
              >
                Details
              </button>
              <div className="w-px bg-white/[0.08]" />
              <div className={cn(
                "flex-1 text-center text-[12px] py-2.5 font-medium",
                isStreaming
                  ? "text-cyan-400 bg-cyan-500/[0.06]"
                  : "text-emerald-400/70 bg-emerald-500/[0.04]"
              )}>
                {isStreaming ? 'Loading preview...' : 'Preview ready'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Details modal — full-screen overlay */}
        {isBuildExpanded && (
          <Dialog open={true} onOpenChange={() => toggleBuildExpanded(msg.id)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0c0c10] border-white/[0.1] text-white">
              <DialogHeader>
                <DialogTitle className="text-sm font-medium text-white/80">
                  {totalFiles > 1 ? `Changes — ${totalFiles} files` : fileNames[0] || 'Code changes'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  {fileNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-white/[0.03]">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-[13px] text-white/60 font-mono truncate">{name}</span>
                    </div>
                  ))}
                </div>
                {!isStreaming && hasFiles && previousFiles.length > 0 && (
                  <div className="space-y-3 border-t border-white/[0.08] pt-4">
                    {latestFiles.map(file => {
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
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Main prose content — clean, no border */}
        {displayText && (
          <StreamingText content={isCompleted ? bodyText || displayText : displayText} isStreaming={isStreaming}>
            {(displayedText) => (
              <div className="prose prose-sm prose-invert max-w-none text-[13px] text-white/70 leading-relaxed [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_ol]:space-y-2 [&_ul]:space-y-1 [&_li]:text-white/60 [&_strong]:text-white/90 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ol>li]:pl-1">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const isInline = !className;
                      const codeStr = String(children).replace(/\n$/, '');
                      if (isInline) {
                        return <code className="bg-white/[0.08] rounded px-1.5 py-0.5 text-[12px] font-mono text-cyan-300/80" {...props}>{children}</code>;
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

        {/* Conversational summary after completed builds — when no thinking text */}
        {isCompleted && !text && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[13px] text-white/60 leading-relaxed"
          >
            {totalFiles > 1
              ? `I've updated ${totalFiles} files with the changes you requested. The preview should reflect the updates — let me know if you'd like any tweaks!`
              : fileNames[0]
                ? `I've updated ${fileNames[0].split('/').pop()} with your changes. Check the preview and let me know if anything needs adjusting!`
                : `I've applied your changes to the project. Take a look at the preview and let me know how it looks!`}
          </motion.div>
        )}

        {/* Inline error recovery */}
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

        {/* Bottom action bar — Lovable style */}
        {isCompleted && (
          <div className="flex items-center gap-1 pt-1">
            {onRevertToMessage && msg.filesSnapshot && isLast && (
              <button
                onClick={() => onRevertToMessage(msg.id)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
                title="Undo changes"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(msg.content)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="More"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
            </button>
          </div>
        )}

        {/* Streaming progress */}
        {isStreaming && !hasFiles && fileNames.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
            <span className="text-white/40">Writing {fileNames.length} file{fileNames.length > 1 ? 's' : ''}...</span>
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
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.04] mt-1">
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
                    onSend(suggestion.replace(/^[^\w]*/, ''));
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-cyan-500/30 hover:bg-cyan-500/[0.05] transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        )}

        {/* Backend intent chips */}
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
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[240px] rounded-full bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.04] blur-[80px] pointer-events-none" />
              <div className="absolute bottom-1/3 right-1/4 w-[200px] h-[200px] rounded-full bg-violet-500/[0.03] blur-[60px] pointer-events-none" />
              
              {/* Hero empty state */}
              <div className="text-center space-y-3 relative z-10">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-white/[0.08] mb-3 backdrop-blur-sm shadow-lg shadow-cyan-500/5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400/70" />
                  <span className="text-[11px] text-white/50 font-medium tracking-wide">AI-Powered Builder</span>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="font-bold text-white/90 text-xl tracking-tight"
                >
                  What do you want to build?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-[13px] text-white/30 max-w-[300px] mx-auto leading-relaxed"
                >
                  Describe your app idea and I'll generate production-ready code with live preview.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="w-full max-w-[320px] space-y-1.5 relative z-10"
              >
                {STARTER_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                    onClick={() => onSend(`${prompt.label}: ${prompt.desc}`)}
                    className={cn("w-full text-left px-3.5 py-3 rounded-xl border text-sm transition-all duration-300 group backdrop-blur-sm hover:shadow-lg active:scale-[0.98]", prompt.color, prompt.hover)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("text-base h-9 w-9 rounded-lg bg-gradient-to-br border flex items-center justify-center shrink-0 shadow-sm", prompt.iconBg)}>{prompt.icon}</span>
                      <div>
                        <div className="text-[13px] font-medium text-white/70 group-hover:text-white/95 transition-colors">{prompt.label}</div>
                        <div className="text-[11px] text-white/25 group-hover:text-white/45 transition-colors">{prompt.desc}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {/* Browse templates / Starter templates */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                  className={cn("w-full text-left px-3.5 py-3 rounded-xl border border-dashed text-sm transition-all duration-300 group mt-2", showTemplatePicker ? "border-cyan-500/30 bg-cyan-500/[0.06]" : "border-white/[0.08] hover:border-cyan-500/25 hover:bg-white/[0.02] hover:shadow-lg hover:shadow-violet-500/[0.03]")}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-cyan-500/20 transition-all duration-300 shrink-0">
                      <LayoutGrid className="h-4 w-4 text-white/50 group-hover:text-cyan-400/80 transition-colors" />
                    </span>
                    <div>
                      <div className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors">Start from a Template</div>
                      <div className="text-[11px] text-white/35 group-hover:text-white/55 transition-colors">Pre-tested app foundations the AI extends</div>
                    </div>
                  </div>
                </motion.button>

                {showTemplatePicker && onSelectStarterTemplate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2"
                  >
                    <StarterTemplatePicker onSelect={(t) => { onSelectStarterTemplate(t); setShowTemplatePicker(false); }} />
                  </motion.div>
                )}
              </motion.div>
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
                  'group/msg relative',
                  msg.role === 'user' ? 'flex justify-end' : ''
                )}
              >
                <div className="relative max-w-[90%]">
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
                      msg.role === 'user'
                        ? 'rounded-2xl px-3.5 py-2.5 bg-white/[0.08] text-white/90 text-[13px]'
                        : ''
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      renderAssistantMessage(msg, idx === filteredArr.length - 1)
                    ) : (
                      <div>
                        {(msg.imageUrls || (msg.imageUrl ? [msg.imageUrl] : [])).map((url, i) => (
                          <img key={i} src={url} alt={`Reference ${i + 1}`} className="rounded-lg max-h-32 mb-2 mr-2 border border-white/10 inline-block" />
                        ))}
                        <p className="whitespace-pre-wrap text-[13px]">{getCleanUserContent(msg.content)}</p>
                      </div>
                    )}
                  </div>
                  )}
                  {/* Timestamp — show on hover */}
                  <div className={cn(
                    "text-[9px] text-white/15 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.tokenEstimate && ` · ~${msg.tokenEstimate} tokens`}
                  </div>
                </div>
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

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="px-3 pt-2 shrink-0 flex flex-wrap gap-2">
          {imagePreviews.map((img, i) => (
            <div key={i} className="relative inline-block group">
              <img src={img} alt={`Upload preview ${i + 1}`} className="h-16 rounded-lg border border-white/10" />
              <button
                onClick={() => setImagePreviews(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
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
              { label: 'Build a landing page', icon: '🚀', accent: 'border-rose-500/20 text-rose-300/70 hover:bg-rose-500/10 hover:border-rose-500/30' },
              { label: 'Create a dashboard with charts', icon: '📊', accent: 'border-blue-500/20 text-blue-300/70 hover:bg-blue-500/10 hover:border-blue-500/30' },
              { label: 'Paste a screenshot to clone', icon: '👁️', accent: 'border-violet-500/20 text-violet-300/70 hover:bg-violet-500/10 hover:border-violet-500/30' },
              { label: 'Search for best practices', icon: '🔍', accent: 'border-amber-500/20 text-amber-300/70 hover:bg-amber-500/10 hover:border-amber-500/30' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setInput(s.label)}
                className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all", s.accent)}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Lovable-style input area with integrated mode toggle */}
        <div data-tour="chat-input" className={cn("rounded-xl border bg-white/[0.05] transition-all overflow-hidden shadow-lg focus-within:ring-2 focus-within:ring-offset-0", mode === 'build' ? "border-violet-500/30 shadow-violet-500/5 focus-within:ring-violet-500/40 focus-within:border-violet-500/50" : "border-teal-500/30 shadow-teal-500/5 focus-within:ring-teal-500/40 focus-within:border-teal-500/50")}>
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
              multiple
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
              className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/35 resize-none outline-none focus:outline-none focus:ring-0 border-none min-h-[72px] max-h-[200px] py-0.5"
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
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                  input.trim()
                    ? mode === 'build'
                      ? "bg-gradient-to-br from-violet-500 to-violet-400 text-white hover:opacity-90 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                      : "bg-gradient-to-br from-cyan-500 to-cyan-400 text-black hover:opacity-90 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                    : "bg-white/5 text-white/20"
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* Bottom bar: mode toggle + model selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] bg-white/[0.02]">
            <div data-tour="mode-toggle" className="flex items-center gap-0.5 bg-white/[0.03] rounded-md p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onModeChange('discuss')}
                    className={cn(
                      "flex items-center gap-1 text-[10px] px-2.5 py-1 rounded transition-all font-medium",
                      mode === 'discuss'
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                        : "text-white/40 hover:text-white/60 border border-transparent"
                    )}
                  >
                    <MessageCircle className="h-2.5 w-2.5" />
                    Chat
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[180px]">Discuss ideas, ask questions, and plan your project without generating code</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onModeChange('build')}
                    className={cn(
                      "flex items-center gap-1 text-[10px] px-2.5 py-1 rounded transition-all font-medium",
                      mode === 'build'
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                        : "text-white/40 hover:text-white/60 border border-transparent"
                    )}
                  >
                    <Wand2 className="h-2.5 w-2.5" />
                    Build
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[180px]">Generate and modify code with the AI agent to build your app</TooltipContent>
              </Tooltip>
              {onReview && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onReview}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded transition-all font-medium text-white/40 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/25"
                    >
                      <ClipboardCheck className="h-2.5 w-2.5" />
                      Review
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[180px]">Run a health check to find bugs, accessibility issues, and best-practice violations</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Model selector */}
              {onModelChange && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/70 transition-colors px-1.5 py-1 rounded hover:bg-white/[0.05]">
                      <span>{AI_MODELS.find(m => m.id === selectedModel)?.icon || '⚡'}</span>
                      <span>{AI_MODELS.find(m => m.id === selectedModel)?.label || 'Flash'}</span>
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="end" className="w-[160px] p-1 bg-[#0d0d14] border-white/[0.10] shadow-xl z-50">
                    {AI_MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => onModelChange(m.id)}
                        className={cn(
                          "w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-colors",
                          selectedModel === m.id ? "bg-white/10 text-white/90" : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                        )}
                      >
                        <span>{m.icon}</span>
                        <div className="text-left">
                          <div className="font-medium">{m.label}</div>
                          <div className="text-[8px] text-white/30">{m.desc}</div>
                        </div>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              )}
              {(() => {
                const userMsgCount = messages.filter(m => m.role === 'user' && !isInternalMessage(m.content)).length;
                if (userMsgCount === 0) return <span className="text-[9px] text-white/40 font-mono flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-amber-400/60" />1 credit/msg</span>;
                const analysis = analyzeConversationComplexity(messages.map(m => ({ role: m.role, content: m.content })));
                const userTexts = messages.filter(m => m.role === 'user').map(m => m.content);
                const tone = detectCommunicationStyle(userTexts);
                const toneEmoji = { technical: '🔧', casual: '💬', concise: '⚡', detailed: '📝' }[tone.style];
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[9px] text-white/40 font-mono cursor-default">
                        {toneEmoji} {userMsgCount} msg{userMsgCount > 1 ? 's' : ''} · {analysis.topicCount} topic{analysis.topicCount !== 1 ? 's' : ''}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[220px]">
                      <div className="space-y-1">
                        <div>{analysis.summary}</div>
                        <div className="text-white/40">Tone: {tone.style}</div>
                      </div>
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
