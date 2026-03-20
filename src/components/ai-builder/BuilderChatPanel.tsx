import { useState, useRef, useEffect, useCallback, useMemo, type MutableRefObject } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Square, Sparkles, Loader2, Bot, FileCode, CheckCircle2,
  X, Brain, Compass, Code2,
  LayoutGrid, Wrench, AlertTriangle, Copy, ChevronDown, Check, Pencil,
  Crosshair, Plus, Camera, Paperclip, AtSign, Rocket,
  Settings, Clock, BookOpen, GitBranch, Eye, Search as SearchIcon, Pin, Star,
  ThumbsUp, ThumbsDown, MoreHorizontal, MessageSquare, Mic, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BuilderMessage, BuilderMode, ThinkingPhase, VersionSnapshot } from '@/hooks/useAIAppBuilder';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import ReactMarkdown from 'react-markdown';
import { CodeDiffViewer } from './CodeDiffViewer';
import { generateErrorSuggestions, type ParsedViteError } from './parseViteErrors';
import { InlineSQLRunner } from './InlineSQLRunner';
import { SUPABASE_SLASH_COMMANDS, type ContextBudgetInfo } from './SupabaseConversational';
import { generateFollowUpSuggestions } from './generateFollowUpSuggestions';
import { searchTemplates, TEMPLATE_CATEGORIES, type PromptTemplate } from './promptTemplates';
import { StarterTemplatePicker } from './StarterTemplatePicker';
import { MigrationApprovalCard, type MigrationBlock } from './MigrationApprovalCard';
import { EdgeFunctionCard, type EdgeFunctionBlock } from './EdgeFunctionCard';
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
  contextBudget?: ContextBudgetInfo | null;
  onModeChange: (mode: BuilderMode) => void;
  onSend: (message: string, imageDataUrls?: string[] | null) => void;
  onStop: () => void;
  onClear: () => void;
  onRestoreVersion: (id: string) => void;
  onOpenTemplates: () => void;
  onFixError: (errorPrompt: string) => void;
  onToggleVisualEdit?: () => void;
  isVisualEditActive?: boolean;
  onSelectStarterTemplate?: (template: import('./AppStarterTemplates').AppStarterTemplate) => void;
  supabaseConfig?: { url: string; anonKey: string } | null;
  onUpdateMessages?: (updater: (prev: BuilderMessage[]) => BuilderMessage[]) => void;
  questionsSlot?: React.ReactNode;
  isPreviewReady?: boolean;
  compileState?: 'idle' | 'compiling' | 'success' | 'error';
  isGoldenProject?: boolean;
  streamingContentRef?: MutableRefObject<string>;
  buildErrors?: ParsedViteError[];
  onNewConversation?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  onShowKnowledge?: () => void;
  onShowGitHub?: () => void;
  conversationForks?: { id: string; label: string; createdAt: Date }[];
  activeForkId?: string | null;
  onForkConversation?: () => void;
  onSwitchFork?: (forkId: string) => void;
  onDeleteFork?: (forkId: string) => void;
  onRevertToMessage?: (messageId: string) => void;
  onForkFromMessage?: (messageId: string) => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  onOpenEditHistory?: () => void;
  onReview?: () => void;
  // Wave 10: @-file mentions
  projectFiles?: ProjectFile[];
  // Wave 10: Component extraction
  componentExtractionCount?: number;
  componentExtractionPrompt?: string | null;
  // Wave 10: Prompt favorites
  onTogglePromptFavorite?: (messageId: string) => void;
  favoritePromptIds?: Set<string>;
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

  let insideEdit = false;

  for (const line of lines) {
    const fileMatch = line.match(/^===FILE:\s*(.+?)===$/);
    const deleteMatch = line.match(/^===DELETE:\s*(.+?)===$/);
    const editMatch = line.match(/^===EDIT:\s*(.+?)===$/);
    if (fileMatch) {
      insideFile = true;
      insideEdit = false;
      fileNames.push(fileMatch[1].trim());
    } else if (deleteMatch) {
      insideFile = true;
      insideEdit = false;
    } else if (editMatch) {
      insideEdit = true;
      insideFile = false;
      fileNames.push(editMatch[1].trim());
    } else if (insideEdit) {
      // Skip all lines inside ===EDIT: blocks (diff hunks, @@ markers, +/- lines)
      // Check if we've exited — conversational prose signals exit
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Diff content: @@ markers, +/- prefixed, or indented code
      if (/^@@\s/.test(trimmed) || /^[+-]\s/.test(trimmed) || /^[+-][a-zA-Z<{]/.test(trimmed)) continue;
      // Still looks like code/CSS/HTML
      if (/^[\s]*[{}<;:.#@/\\]/.test(line) || /:\s*[#\d]/.test(trimmed) || /^\s*\w+[-\w]*\s*[:={]/.test(trimmed)) continue;
      // Conversational exit
      const conversationalPatterns = [
        /^(#{1,4}\s)/,
        /^(what'?s|would you|let me|here'?s|i('?ve| have)|shall|want me|feel free|happy to|hope this)/i,
        /^(Great|Perfect|Done|Now |Next |The app|Your app|I've |Here are|Here is|Let me|I can|This )/i,
        /^(🎉|👋|✅|🚀|💡|📝|🔧)/,
        /^\*\*[\w\s]+\*\*[.:]/,
        /^\d+\.\s+\*\*[A-Z]/,
        /^[-•]\s+\*\*[A-Z]/,
        /^[-•]\s+[A-Z][a-z].*[:.]$/,
      ];
      if (conversationalPatterns.some(r => r.test(trimmed))) {
        insideEdit = false;
        textLines.push(line);
      }
      // Otherwise still inside edit content, skip
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
  // Strip migration blocks from display text
  text = text.replace(/===MIGRATION:\s*.+?===\n[\s\S]*?===END_MIGRATION===/g, '').trim();
  // Strip edge function blocks from display text
  text = text.replace(/===EDGE_FUNCTION:\s*.+?===\n[\s\S]*?===END_EDGE_FUNCTION===/g, '').trim();
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
    // Remove "Key Decisions Made:" sections
    .replace(/(?:#{1,4}\s*)?(?:\*{0,2})?(?:Key|✨)\s*(?:Design\s*)?Decisions?\s*(?:Made|I made)?[^:]*:[\s\S]*?(?=\n#{1,4}\s[^KD]|$)/gi, '')
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
    // Remove raw ===FILE: / ===DELETE: / ===EDIT: markers that weren't caught
    .replace(/^===(?:FILE|DELETE|EDIT):.*===$/gm, '')
    // Remove diff hunk headers (@@ ... @@)
    .replace(/^@@\s.*@@.*$/gm, '')
    // Remove diff +/- prefixed lines
    .replace(/^[+-]\s.*$/gm, '')
    // Remove raw CSS property lines (e.g. "background-color: #050505;")
    .replace(/^\s*[\w-]+\s*:\s*[#\w\d(),.\s%-]+;\s*$/gm, '')
    // Remove raw CSS variable lines (e.g. "--bg-dark: #050505;")
    .replace(/^\s*--[\w-]+\s*:.*$/gm, '')
    // Remove bare CSS/HTML-like lines (selectors, tags, closing braces)
    .replace(/^\s*[{}]\s*$/gm, '')
    // Remove lines that are just a CSS class name or property name
    .replace(/^\s*\.[\w-]+\s*\{?\s*$/gm, '')
    // Remove "className=" leaked fragments
    .replace(/^.*className=["'].*$/gm, '')
    // Remove raw HTML tag lines
    .replace(/^\s*<\/?[\w-]+[^>]*>\s*$/gm, '')
    // Remove "Auto-fix error" lines and everything after
    .replace(/Auto-fix error[\s\S]*$/gi, '')
    // Remove "This is auto-fix attempt" lines
    .replace(/^This is auto-fix attempt.*$/gm, '')
    // Remove "Return the corrected file" lines
    .replace(/^Return the corrected file.*$/gm, '')
    // Remove "Multi-step workflow" headings
    .replace(/^Multi-step workflow$/gm, '')
    // Remove "[ERROR DIAGNOSIS CONTEXT]" blocks that leak into assistant
    .replace(/\[ERROR DIAGNOSIS CONTEXT\][\s\S]*$/gi, '')
    // Remove "[ALL PROJECT FILES]" blocks
    .replace(/\[ALL PROJECT FILES\][\s\S]*$/gi, '')
    // Remove "[LAST AI GENERATION" blocks
    .replace(/\[LAST AI GENERATION[\s\S]*$/gi, '')
    // Remove "I've included:" orphan lines
    .replace(/^I'?ve included:\s*$/gm, '')
    // Remove "Source: about:srcdoc" lines
    .replace(/^Source:\s*about:srcdoc.*$/gm, '')
    // Remove "Design Specs:" sections and everything until next file/heading
    .replace(/(?:\*{0,2})?Design Specs?:?\*{0,2}[\s\S]*?(?=\n===FILE|\n#{1,4}\s|$)/gi, '')
    // Remove "Working on tasks..." progress lines
    .replace(/^Working on tasks\.{0,3}\s*$/gm, '')
    // Remove "Writing N files..." progress lines
    .replace(/^Writing \d+ files?\.{0,3}\s*$/gm, '')
    // Remove bare single-word planning items (Typography, Palette, Components, etc.)
    .replace(/^[-•*]?\s*(?:Typography|Palette|Components|Layout|Spacing|Colors?|Fonts?|Icons?)\s*$/gm, '')
    // Remove "Thinking..." lines
    .replace(/^(?:Thinking\.{0,3})\s*$/gm, '')
    // Remove "Design Tokens:" headings
    .replace(/^\*{0,2}Design Tokens?:?\*{0,2}\s*$/gm, '')
    // Remove bare color/token names (Primary, Background, Accent, etc.)
    .replace(/^[-•*]?\s*(?:Primary|Secondary|Background|Accent|Foreground|Muted|Border|Ring)\s*$/gm, '')
    // Remove "Loading preview..." lines
    .replace(/^Loading preview\.{0,3}\s*$/gm, '')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text: text, fileNames };
}

/** Strip internal context (file manifests, file trees, error diagnosis, auto-fix) from user messages for display */
function getCleanUserContent(content: string): string {
  let clean = content;
  // Remove "[Project file tree: ...]" blocks (from agent mode)
  clean = clean.replace(/\n*\[Project file tree:\n[\s\S]*?\]\s*$/i, '');
  // Remove "PROJECT FILE MANIFEST ..." and everything after
  clean = clean.replace(/\n*PROJECT FILE MANIFEST[\s\S]*$/i, '');
  // Remove "[ERROR DIAGNOSIS CONTEXT]" and everything after
  clean = clean.replace(/\n*\[ERROR DIAGNOSIS CONTEXT\][\s\S]*$/i, '');
  // Remove "[ALL PROJECT FILES]" and everything after
  clean = clean.replace(/\n*\[ALL PROJECT FILES\][\s\S]*$/i, '');
  // Remove "[LAST AI GENERATION ...]" and everything after
  clean = clean.replace(/\n*\[LAST AI GENERATION[\s\S]*$/i, '');
  // Remove "FIX RULES:" and everything after
  clean = clean.replace(/\n*FIX RULES:[\s\S]*$/i, '');
  // Remove "Auto-fix error:" blocks
  clean = clean.replace(/\n*Auto-fix error[:\s][\s\S]*$/i, '');
  // Remove "Return the corrected file(s)." lines
  clean = clean.replace(/\n*Return the corrected file.*$/gim, '');
  // Remove "This is auto-fix attempt" lines
  clean = clean.replace(/\n*This is auto-fix attempt.*$/gim, '');
  // Remove "Source: about:srcdoc" lines
  clean = clean.replace(/\n*Source:\s*about:srcdoc.*$/gim, '');
  // Remove "Multi-step workflow" and numbered steps after it
  clean = clean.replace(/\n*Multi-step workflow\n?(?:\d+.*\n?)*/gi, '');
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

/** Lovable-style AI avatar */
function AIAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("h-7 w-7 rounded-full bg-gradient-to-br from-violet-600/80 to-cyan-500/80 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/10", className)}>
      <Bot className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <AIAvatar />
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-white/20 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/** File Read Card — shown when the AI reads/analyzes a project file */
function FileReadCard({ fileName, description, isExpanded, onToggle }: { fileName: string; description?: string; isExpanded: boolean; onToggle: () => void }) {
  const shortName = fileName.split('/').pop() || fileName;
  const ext = shortName.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02]"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <Eye className="h-3.5 w-3.5 text-cyan-400/70 shrink-0" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-white/60">Read</span>
            <span className="text-[12px] font-mono text-cyan-300/70">{shortName}</span>
          </div>
          {description && (
            <p className="text-[11px] text-white/30 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown className={cn("h-3 w-3 text-white/20 transition-transform", !isExpanded && "-rotate-90")} />
      </button>
      {isExpanded && (
        <div className="px-3.5 pb-3 border-t border-white/[0.06]">
          <div className="mt-2 rounded-lg bg-black/30 border border-white/[0.06] p-3">
            {isImage ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-16 w-16 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                  <FileCode className="h-6 w-6 text-white/20" />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-white/30 font-mono">
                {fileName}
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function BuilderChatPanel({
  messages, isGenerating, fileCount, mode, thinkingPhase, versions,
  totalTokensUsed, previousFiles, latestFiles, contextBudget,
  onModeChange, onSend, onStop, onClear, onRestoreVersion, onOpenTemplates, onFixError,
  onToggleVisualEdit, isVisualEditActive, onSelectStarterTemplate,
  supabaseConfig, onUpdateMessages, questionsSlot, isPreviewReady, compileState, isGoldenProject,
  streamingContentRef, onNewConversation,
  onShowSettings, onShowHistory, onShowKnowledge, onShowGitHub,
  conversationForks, activeForkId, onForkConversation, onSwitchFork, onDeleteFork,
  onRevertToMessage, onForkFromMessage,
  selectedModel, onModelChange, onOpenEditHistory, onReview,
  buildErrors,
  projectFiles,
  componentExtractionCount,
  componentExtractionPrompt,
  onTogglePromptFavorite,
  favoritePromptIds,
}: BuilderChatPanelProps) {
  const [input, setInput] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageResizes, setImageResizes] = useState<Record<number, number>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  // Wave 10: @-file mention autocomplete
  const [showFileMentions, setShowFileMentions] = useState(false);
  const [fileMentionQuery, setFileMentionQuery] = useState('');
  const [mentionedFilePaths, setMentionedFilePaths] = useState<string[]>([]);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  // Wave 10: Context budget expansion
  const [contextExpanded, setContextExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextWarningShown = useRef(false);

  // Wave 10: File mention autocomplete suggestions
  const fileMentionSuggestions = useMemo(() => {
    if (!projectFiles || !showFileMentions) return [];
    const q = fileMentionQuery.toLowerCase();
    return projectFiles
      .map(f => ({ path: f.path, shortName: f.path.split('/').pop() || f.path }))
      .filter(f => !q || f.path.toLowerCase().includes(q) || f.shortName.toLowerCase().includes(q))
      .slice(0, 8);
  }, [projectFiles, showFileMentions, fileMentionQuery]);

  const handleFileMentionSelect = useCallback((path: string) => {
    setMentionedFilePaths(prev => prev.includes(path) ? prev : [...prev, path]);
    setShowFileMentions(false);
    const shortName = path.split('/').pop() || path;
    const beforeCursor = input.slice(0, mentionCursorPos);
    const atIdx = beforeCursor.lastIndexOf('@');
    if (atIdx >= 0) {
      setInput(beforeCursor.slice(0, atIdx) + `@${shortName} ` + input.slice(mentionCursorPos));
    }
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [input, mentionCursorPos]);


  useEffect(() => {
    if (contextBudget && contextBudget.percentUsed >= 80 && !contextWarningShown.current) {
      contextWarningShown.current = true;
      toast.warning('Context window 80% full — consider starting a new conversation', { duration: 6000 });
    }
  }, [contextBudget]);

  // Local state for streaming content — polls ref every 300ms, only THIS component re-renders
  const [localStreamContent, setLocalStreamContent] = useState('');

  useEffect(() => {
    if (!isGenerating || !streamingContentRef) {
      setLocalStreamContent('');
      return;
    }
    // Fast polling (300ms) for smooth token-by-token streaming feel
    const interval = setInterval(() => {
      const current = streamingContentRef.current;
      // For large content, only update periodically to avoid jank
      if (current.length > 50_000) {
        setLocalStreamContent(prev => {
          // Still update file names by extracting them cheaply
          const fileCount = (current.match(/===(?:FILE|EDIT):/g) || []).length;
          const marker = `__files:${fileCount}__`;
          return prev?.includes(marker) ? prev : current.slice(0, 2000) + marker;
        });
        return;
      }
      setLocalStreamContent(prev => current !== prev ? current : prev);
    }, 300);
    return () => clearInterval(interval);
  }, [isGenerating, streamingContentRef]);

  const displayMessages = useMemo(() => {
    if (isGenerating && localStreamContent) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        return messages.map((m, i) =>
          i === messages.length - 1 ? { ...m, content: localStreamContent } : m
        );
      }
      return [...messages, {
        id: '__streaming__',
        role: 'assistant' as const,
        content: localStreamContent,
        timestamp: new Date(),
      }];
    }
    return messages;
  }, [messages, isGenerating, localStreamContent]);

  const filteredMessages = useMemo(() => {
    const visible = displayMessages.filter((msg) => {
      if (isInternalMessage(msg.content)) return false;
      if (msg.role === 'assistant') {
        const { text, fileNames } = getDisplayContent(msg);
        const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;
        if (!text && fileNames.length === 0 && !hasFiles) return false;
      }
      return true;
    });
    // Chat search filter
    if (chatSearch.trim()) {
      const lower = chatSearch.toLowerCase();
      return visible.filter(m => m.content.toLowerCase().includes(lower));
    }
    return visible;
  }, [displayMessages, chatSearch]);

  // Pinned messages
  const pinnedMessages = useMemo(() => {
    return messages.filter(m => m.pinned);
  }, [messages]);

  const togglePin = useCallback((msgId: string) => {
    onUpdateMessages?.(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
  }, [onUpdateMessages]);

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
  }, [displayMessages, thinkingPhase]);

  // Resize an image data URL to a target max width
  const resizeImageDataUrl = useCallback((dataUrl: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        if (img.width <= maxWidth) { resolve(dataUrl); return; }
        const ratio = maxWidth / img.width;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    // Apply any pending resizes before sending
    let finalImages: string[] | null = null;
    if (imagePreviews.length > 0) {
      finalImages = await Promise.all(
        imagePreviews.map((img, i) => {
          const targetWidth = imageResizes[i];
          if (targetWidth && targetWidth < 1200) {
            return resizeImageDataUrl(img, targetWidth);
          }
          return Promise.resolve(img);
        })
      );
    }
    // Step 2: Conversation branching — if editing a message, truncate after it first
    if (editingMessageId) {
      onUpdateMessages?.(prev => {
        const idx = prev.findIndex(m => m.id === editingMessageId);
        return idx >= 0 ? prev.slice(0, idx) : prev;
      });
      setEditingMessageId(null);
    }
    onSend(input.trim(), finalImages);
    setInput('');
    setImagePreviews([]);
    setImageResizes({});
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleBuildModeClick = useCallback(() => {
    if (mode !== 'build') {
      onModeChange('build');
      return;
    }

    if (input.trim() && !isGenerating) {
      void handleSend();
    }
  }, [handleSend, input, isGenerating, mode, onModeChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Phase 106: Cmd/Ctrl+Enter to send, plain Enter for newlines
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Compress an image file to max 1200px to avoid oversized payloads
  // Also enforces a 500KB cap on the output data URL
  const MAX_DATA_URL_SIZE = 500_000; // 500KB — prevents edge function payload errors
  const MAX_IMAGE_COUNT = 5;

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Reject files over 20MB upfront
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 20MB)`));
        return;
      }

      const img = new window.Image();
      const url = URL.createObjectURL(file);

      const cleanup = () => URL.revokeObjectURL(url);

      img.onload = () => {
        cleanup();
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        // Preserve transparency for PNGs by not filling background
        const keepPng = file.type === 'image/png';
        if (!keepPng) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL(keepPng ? 'image/png' : 'image/jpeg', 0.8);

        // If still too large, progressively reduce quality
        if (dataUrl.length > MAX_DATA_URL_SIZE && !keepPng) {
          for (const q of [0.6, 0.4, 0.25]) {
            dataUrl = canvas.toDataURL('image/jpeg', q);
            if (dataUrl.length <= MAX_DATA_URL_SIZE) break;
          }
        }

        // Last resort: scale down further
        if (dataUrl.length > MAX_DATA_URL_SIZE) {
          const scale = 0.5;
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * scale);
          smallCanvas.height = Math.round(height * scale);
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            dataUrl = smallCanvas.toDataURL('image/jpeg', 0.5);
          }
        }

        resolve(dataUrl);
      };

      img.onerror = () => {
        cleanup();
        // Fallback: read raw file as data URL (works for exotic formats)
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          if (result && result.length <= MAX_DATA_URL_SIZE * 2) {
            resolve(result);
          } else {
            reject(new Error('Image too large after processing'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      // Enforce max image count
      setImagePreviews(prev => {
        if (prev.length >= MAX_IMAGE_COUNT) {
          toast.error(`Max ${MAX_IMAGE_COUNT} images allowed`);
          return prev;
        }
        return prev;
      });

      try {
        // Support both images and other file types; SVGs can't be reliably canvas-compressed
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImagePreviews(prev => {
              if (prev.length >= MAX_IMAGE_COUNT) return prev;
              return [...prev, ev.target?.result as string];
            });
          };
          reader.onerror = () => toast.error(`Failed to read ${file.name}`);
          reader.readAsDataURL(file);
          return;
        }
        // Compress raster images to prevent network errors from oversized payloads
        const compressed = await compressImage(file);
        setImagePreviews(prev => {
          if (prev.length >= MAX_IMAGE_COUNT) return prev;
          return [...prev, compressed];
        });
      } catch (err: any) {
        toast.error(err?.message || `Failed to process ${file.name}`);
      }
    });
    e.target.value = '';
  }, [compressImage]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        compressImage(file).then(compressed => {
          setImagePreviews(prev => {
            if (prev.length >= MAX_IMAGE_COUNT) {
              toast.error(`Max ${MAX_IMAGE_COUNT} images allowed`);
              return prev;
            }
            return [...prev, compressed];
          });
        }).catch((err: any) => {
          toast.error(err?.message || 'Failed to paste image');
        });
      }
    }
  }, [compressImage]);

  const [thinkingCollapsed, setThinkingCollapsed] = useState<Record<string, boolean>>({});

  const renderThinkingIndicator = () => {
    if (!thinkingPhase) return null;
    const phase = THINKING_LABELS[thinkingPhase];
    if (!phase) return null;
    const Icon = phase.icon;
    const phases = ['analyzing', 'planning', 'writing'] as const;
    const currentIdx = phases.indexOf(thinkingPhase as any);

    return (
      <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <AIAvatar />
        <div className="flex-1 space-y-3">
          {/* Lovable-style "Generating code" status bar */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 max-w-[320px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
              <span className="text-[13px] font-medium text-white/80">Generating code</span>
              <ElapsedTimer isActive={isGenerating} />
              <button onClick={onStop} className="ml-auto text-[12px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Stop</button>
              <ChevronDown
                onClick={() => setThinkingCollapsed(prev => ({ ...prev, __active__: !prev.__active__ }))}
                className={cn("h-3.5 w-3.5 text-white/30 cursor-pointer hover:text-white/50 transition-all", thinkingCollapsed.__active__ && "-rotate-90")}
              />
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {phases.map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500 flex-1",
                    i <= currentIdx ? 'bg-cyan-400' : 'bg-white/[0.06]'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Expanded thinking steps — Lovable style with WORKING/NEXT labels */}
          {!thinkingCollapsed.__active__ && (
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02] max-w-[320px]">
              <div className="px-4 py-2.5 space-y-1">
                {phases.map((step, i) => {
                  const stepPhase = THINKING_LABELS[step];
                  const isDone = i < currentIdx;
                  const isActive = i === currentIdx;
                  return (
                    <div key={step} className="flex items-center gap-2.5 py-1">
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-white/[0.12] shrink-0" />
                      )}
                      <span className={cn(
                        "text-[13px]",
                        isDone ? "text-white/40" : isActive ? "text-white/80" : "text-white/25"
                      )}>
                        {stepPhase.label.replace('...', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

  /** Extract plan/task steps from numbered lists, bullet lists, or markdown checkboxes */
  const extractPlanSteps = (text: string, isStreaming: boolean, hasFiles: boolean): { step: number; label: string; status: 'pending' | 'active' | 'done' }[] | null => {
    // Try markdown checkboxes first: - [x] Done task / - [ ] Pending task
    const checkboxPattern = /^[-*]\s+\[([ xX])\]\s+(.+)$/gm;
    const checkboxMatches = [...text.matchAll(checkboxPattern)];
    if (checkboxMatches.length >= 2) {
      return checkboxMatches.map((m, i) => ({
        step: i + 1,
        label: m[2].replace(/\*+/g, '').trim(),
        status: m[1].toLowerCase() === 'x' ? 'done' as const : isStreaming && i === checkboxMatches.length - 1 ? 'active' as const : 'pending' as const,
      }));
    }

    // Try numbered list: "1. Create header" or "1. **Create header**"
    const stepPattern = /^\d+\.\s+\*{0,2}(.+?)\*{0,2}$/gm;
    const matches = [...text.matchAll(stepPattern)];
    if (matches.length >= 2) {
      return matches.map((m, i) => ({
        step: i + 1,
        label: m[1].replace(/\*+/g, '').trim(),
        status: hasFiles ? 'done' as const : isStreaming ? (i === matches.length - 1 ? 'active' as const : 'done' as const) : 'pending' as const,
      }));
    }

    // Try bullet list with bold labels: "- **Task name**: description" or "- Task name"
    const bulletPattern = /^[-•]\s+\*{0,2}([^*\n:]+?)\*{0,2}(?:\s*[:—]\s*.+)?$/gm;
    const bulletMatches = [...text.matchAll(bulletPattern)];
    if (bulletMatches.length >= 3) {
      return bulletMatches.map((m, i) => ({
        step: i + 1,
        label: m[1].trim(),
        status: hasFiles ? 'done' as const : isStreaming ? (i === bulletMatches.length - 1 ? 'active' as const : 'done' as const) : 'pending' as const,
      }));
    }

    return null;
  };

  // Plan signal detection for "Approve & Build" button — broadened to catch more plan-like responses
  const PLAN_SIGNALS = ['here\'s what i\'d recommend', 'here\'s the plan', 'i\'d suggest', 'let me outline', 'for v1', 'here are the steps', 'the architecture', 'ready to', 'here\'s my recommendation', 'i recommend', 'plan:', 'approach:', 'implementation plan', 'step 1:', 'step 2:', 'let\'s break', 'let me break', 'here\'s how', 'i\'ll start by', 'first, i\'ll', 'here\'s my approach', 'i\'ll create', 'i\'ll build', 'let\'s start with', 'we can build', 'we\'ll need', 'the plan is'];
  const hasPlanSignals = (content: string) => {
    const lower = content.toLowerCase();
    return PLAN_SIGNALS.some(signal => lower.includes(signal));
  };

  const handleApproveAndBuild = (msg: BuilderMessage) => {
    onModeChange('build');
    // Send a build message with the plan context
    const planSummary = msg.content.slice(0, 2000);
    onSend(`Build everything we just discussed. Here's the plan for reference:\n\n${planSummary}`);
  };

  const [expandedFileReads, setExpandedFileReads] = useState<Set<string>>(new Set());

  const toggleFileReadExpanded = (key: string) => {
    setExpandedFileReads(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  /** Extract file read markers from message content */
  const extractFileReads = (content: string): { fileName: string; description: string }[] => {
    const reads: { fileName: string; description: string }[] = [];
    // Match patterns like "Reading logo.svg" or "Analyzing styles.css" or "[READ] file.tsx"
    const patterns = [
      /(?:Reading|Analyzing|Reviewing|Inspecting|Checking)\s+[`"]?([^\s`"]+\.\w{1,6})[`"]?(?:\s*[-—:]\s*(.+))?/gi,
      /\[READ\]\s*([^\s]+\.\w{1,6})(?:\s*[-—:]\s*(.+))?/gi,
    ];
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        reads.push({ fileName: match[1], description: match[2]?.trim() || '' });
      }
    }
    return reads;
  };

  const renderAssistantMessage = (msg: BuilderMessage, isLast: boolean) => {
    const isStreaming = isGenerating && isLast;

     // During streaming, show conversational text + file progress (Lovable-style)
     if (isStreaming) {
       const fileNames: string[] = [];
       // Only scan first 5KB for file names to avoid CPU spikes on large content
       const scanContent = msg.content.length > 5000 ? msg.content.slice(0, 5000) : msg.content;
        for (const match of scanContent.matchAll(/^===(?:FILE|EDIT):\s*(.+?)===$/gm)) {
          fileNames.push(match[1].trim());
        }
       // Only extract plan steps from first 3KB to avoid regex backtracking on large content
       const planContent = msg.content.length > 3000 ? msg.content.slice(0, 3000) : msg.content;
       const planSteps = msg.planSteps || extractPlanSteps(planContent, true, false);

       // Extract conversational text before the first ===FILE: or ===EDIT: block
       const firstFileIdx = msg.content.search(/^===(?:FILE|EDIT):/m);
       const conversationalText = firstFileIdx > 0 
         ? msg.content.slice(0, firstFileIdx).trim()
         : !msg.content.includes('===FILE:') && !msg.content.includes('===EDIT:') && msg.content.length > 0
           ? msg.content.trim()
           : '';

    return (
      <div className="flex gap-3">
        <AIAvatar className="mt-0.5" />
        <div className="flex-1 space-y-3">
          {/* Conversational text — streams in real-time like Lovable */}
          {conversationalText && (
            <StreamingText content={conversationalText} isStreaming={true} speed={6}>
              {(displayed) => (
                <div className="text-[13px] text-white/70 leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{displayed}</ReactMarkdown>
                  <StreamingCursor visible={displayed.length < conversationalText.length} />
                </div>
              )}
            </StreamingText>
          )}

          {/* Generation status bar */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 max-w-[320px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
              <span className="text-[13px] font-medium text-white/80">
                {fileNames.length > 0 ? `Writing ${fileNames.length} file${fileNames.length !== 1 ? 's' : ''}...` : 'Generating code'}
              </span>
              <ElapsedTimer isActive={isGenerating} />
              <button onClick={onStop} className="ml-auto text-[12px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Stop</button>
            </div>
          </div>

          {planSteps && planSteps.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02] max-w-[320px]">
              {/* Lovable-style Editing header with file pill */}
              {fileNames.length > 0 && (
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-white/90">Editing</span>
                    <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-white/60 border border-white/[0.08]">{fileNames[fileNames.length - 1]?.split('/').pop()}</span>
                    {fileNames.length > 1 && <span className="text-[11px] text-white/30">+{fileNames.length - 1}</span>}
                  </div>
                  <p className="text-[12px] text-white/40 mt-1">{planSteps.find(s => s.status === 'active')?.label || 'Working...'}</p>
                </div>
              )}
              {/* WORKING / NEXT section labels */}
              <div className="px-4 py-2.5 space-y-1">
                {(() => {
                  const workingSteps = planSteps.filter(s => s.status === 'active');
                  const nextSteps = planSteps.filter(s => s.status === 'pending');
                  const doneSteps = planSteps.filter(s => s.status === 'done');
                  return (
                    <>
                      {doneSteps.length > 0 && doneSteps.map((step, i) => (
                        <div key={`d-${i}`} className="flex items-center gap-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
                          <span className="text-[13px] text-white/40">{step.label}</span>
                        </div>
                      ))}
                      {workingSteps.length > 0 && workingSteps.map((step, i) => (
                        <div key={`w-${i}`} className="flex items-center gap-2.5 py-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                          <span className="text-[13px] text-white/80">{step.label}</span>
                        </div>
                      ))}
                      {nextSteps.length > 0 && nextSteps.map((step, i) => (
                        <div key={`n-${i}`} className="flex items-center gap-2.5 py-1.5">
                          <div className="h-3.5 w-3.5 rounded-full border border-white/[0.12] shrink-0" />
                          <span className="text-[13px] text-white/25">{step.label}</span>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
              {/* Bottom progress bar */}
              <div className="px-4 pb-3">
                <div className="flex gap-0.5">
                  {planSteps.map((step, i) => (
                    <div key={i} className={cn("h-1 rounded-full flex-1 transition-all duration-500", step.status === 'done' ? 'bg-emerald-400' : step.status === 'active' ? 'bg-cyan-400 animate-pulse' : 'bg-white/[0.06]')} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {fileNames.length > 0 && (!planSteps || planSteps.length === 0) && (
            <div className="rounded-2xl border border-white/[0.08] px-4 py-3 bg-white/[0.02] max-w-[320px]">
              <div className="space-y-1.5">
                {fileNames.slice(-3).map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i < fileNames.slice(-3).length - 1 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                    )}
                    <span className="text-[12px] text-white/60 font-mono truncate">{name.split('/').pop()}</span>
                  </div>
                ))}
                {fileNames.length > 3 && (
                  <span className="text-[11px] text-white/30 pl-5">+{fileNames.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      );
    }

    const { text, fileNames } = getDisplayContent(msg);
    const hasFiles = msg.filesGenerated && msg.filesGenerated > 0;
    const isBuildExpanded = expandedBuildMessages.has(msg.id);
    const totalFiles = hasFiles ? msg.filesGenerated! : fileNames.length;
    const isCompleted = hasFiles || fileNames.length > 0;
    const isThinkingCollapsed = thinkingCollapsed[msg.id] ?? true;
    const isChatMode = msg.mode === 'discuss';
    // Only show approve button on the LAST assistant message, and only if no user message follows it
    const msgIndex = filteredMessages.indexOf(msg);
    const hasSubsequentUserMessage = msgIndex >= 0 && filteredMessages.slice(msgIndex + 1).some(m => m.role === 'user');
    const isLastAssistantWithPlan = !hasSubsequentUserMessage;
    const showApproveButton = !isStreaming && isChatMode && hasPlanSignals(msg.content) && isLastAssistantWithPlan;

    // Clean display text — strip plan step duplicates (numbered, checkbox, bullet patterns)
    const planSteps = msg.planSteps || (text ? extractPlanSteps(text, isStreaming, !!hasFiles) : null);
    const displayText = planSteps && planSteps.length > 0
      ? text
          .replace(/^\d+\.\s+\*{0,2}.+?\*{0,2}$/gm, '')
          .replace(/^[-*]\s+\[([ xX])\]\s+.+$/gm, '')
          .replace(/^[-•]\s+\*{0,2}[^*\n:]+?\*{0,2}(?:\s*[:—]\s*.+)?$/gm, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      : text;

    // Calculate elapsed time for "Thought for Xs" display — prefer stored duration
    const durationMs = msg.generationDurationMs || (msg.buildSummary?.durationMs);
    const thoughtTime = durationMs ? `${Math.round(durationMs / 1000)}s` : '';

    // Lovable style: show full conversational text, no splitting
    const bodyText = displayText;

    return (
      <div className={cn("flex gap-3", isChatMode && "")}>
        <AIAvatar className="mt-0.5 shrink-0" />
        <div className={cn("flex-1 space-y-3 min-w-0", isChatMode && "border-l-2 border-teal-500/30 pl-3")}>
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

        {/* Intro line removed — full text shown in prose block below */}

        {/* Task breakdown checklist — Lovable style with DONE/WORKING/NEXT labels */}
        {planSteps && planSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]"
          >
            {/* Editing header with file pill — only when files exist */}
            {fileNames.length > 0 && (
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white/90">
                    {isStreaming ? 'Editing' : 'Edited'}
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-white/60 border border-white/[0.08]">
                    {fileNames[0]?.split('/').pop()}
                  </span>
                  {fileNames.length > 1 && <span className="text-[11px] text-white/30">+{fileNames.length - 1}</span>}
                  <ChevronDown className="h-3.5 w-3.5 text-white/25 ml-auto" />
                </div>
                {planSteps.find(s => s.status === 'active') && (
                  <p className="text-[12px] text-white/40 mt-1">{planSteps.find(s => s.status === 'active')?.label}</p>
                )}
              </div>
            )}
            <div className="px-4 py-2.5 space-y-1">
              {(() => {
                const doneSteps = planSteps.filter(s => s.status === 'done');
                const workingSteps = planSteps.filter(s => s.status === 'active');
                const nextSteps = planSteps.filter(s => s.status === 'pending');
                return (
                  <>
                    {doneSteps.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 py-1">
                          <div className="h-px flex-1 bg-white/[0.06]" />
                          <span className="text-[10px] font-bold text-emerald-400/50 tracking-widest uppercase">Done</span>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                        {doneSteps.map((step, i) => (
                          <div key={`d-${i}`} className="flex items-center gap-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
                            <span className="text-[13px] text-white/40">{step.label}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {workingSteps.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 py-1">
                          <div className="h-px flex-1 bg-white/[0.06]" />
                          <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Working</span>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                        {workingSteps.map((step, i) => (
                          <div key={`w-${i}`} className="flex items-center gap-2.5 py-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                            <span className="text-[13px] text-white/80">{step.label}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {nextSteps.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 py-1 mt-1">
                          <div className="h-px flex-1 bg-white/[0.06]" />
                          <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Next</span>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                        {nextSteps.map((step, i) => (
                          <div key={`n-${i}`} className="flex items-center gap-2.5 py-1.5">
                            <div className="h-3.5 w-3.5 rounded-full border border-white/[0.12] shrink-0" />
                            <span className="text-[13px] text-white/25">{step.label}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            {/* Bottom progress bar */}
            <div className="px-4 pb-3">
              <div className="flex gap-0.5">
                {planSteps.map((step, i) => (
                  <div key={i} className={cn("h-1 rounded-full flex-1 transition-all duration-500", step.status === 'done' ? 'bg-emerald-400' : step.status === 'active' ? 'bg-cyan-400 animate-pulse' : 'bg-white/[0.06]')} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Task card — Lovable style bordered card */}
        {(hasFiles || fileNames.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]"
          >
            {/* Lovable-style Editing header with file pill */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white/90">
                  {isStreaming ? 'Editing' : 'Edited'}
                </span>
                {fileNames.length > 0 && (
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-white/60 border border-white/[0.08]">
                    {fileNames[0]?.split('/').pop()}
                  </span>
                )}
                {totalFiles > 1 && <span className="text-[11px] text-white/30">+{totalFiles - 1} more</span>}
                <ChevronDown className="h-3.5 w-3.5 text-white/25 ml-auto" />
              </div>
            </div>

            {/* File list inside card */}
            <div className="px-4 pb-2 space-y-1">
              {fileNames.slice(0, 4).map((name, i) => {
                const shortName = name.split('/').pop() || name;
                const isFileDone = !isStreaming;
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
                  : compileState === 'error'
                    ? "text-red-300/80 bg-red-500/[0.08]"
                    : isPreviewReady
                      ? "text-emerald-400/70 bg-emerald-500/[0.04]"
                      : isGoldenProject && compileState !== 'compiling'
                        ? "text-white/50 bg-white/[0.03]"
                        : "text-amber-400/70 bg-amber-500/[0.04]"
              )}>
                {isStreaming
                  ? 'Loading preview...'
                  : compileState === 'error'
                    ? 'Preview failed'
                    : isPreviewReady
                      ? 'Preview ready'
                      : isGoldenProject && compileState !== 'compiling'
                        ? 'Ready to build'
                        : 'Compiling...'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Prominent "Try to fix" button when preview fails — Lovable style */}
        {compileState === 'error' && !isStreaming && isLast && !msg.inlineError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/[0.06] border border-red-500/20"
          >
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-red-300/90 font-medium">Preview failed to compile</p>
              {buildErrors && buildErrors.length > 0 && (
                <p className="text-[11px] text-red-300/50 font-mono truncate mt-0.5">{buildErrors[0]?.message?.slice(0, 80)}</p>
              )}
            </div>
            <button
              onClick={() => {
                const errorContext = buildErrors?.map(e => `${e.file || ''}:${e.line || ''} ${e.message}`).join('\n') || 'Preview failed to compile';
                onFixError(`The preview is showing errors. Please fix these compile errors:\n${errorContext}`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors font-semibold text-[13px] shrink-0"
            >
              <Wrench className="h-3.5 w-3.5" />
              Try to fix
            </button>
          </motion.div>
        )}

        {/* Step 9: Post-generation diff summary */}
        {msg.diffSummary && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.02]"
          >
            <button
              onClick={() => toggleBuildExpanded(`diff-${msg.id}`)}
              className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-white/[0.02] transition-colors"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="text-[12px] font-medium text-white/60">
                Changes: {msg.diffSummary.modified.length + msg.diffSummary.added.length} file{msg.diffSummary.modified.length + msg.diffSummary.added.length !== 1 ? 's' : ''}
                {msg.diffSummary.deleted.length > 0 && `, ${msg.diffSummary.deleted.length} removed`}
              </span>
              <ChevronDown className={cn("h-3 w-3 text-white/25 ml-auto transition-transform", !expandedBuildMessages.has(`diff-${msg.id}`) && "-rotate-90")} />
            </button>
            {expandedBuildMessages.has(`diff-${msg.id}`) && (
              <div className="px-4 pb-3 space-y-1 border-t border-white/[0.06]">
                {msg.diffSummary.added.map(f => (
                  <div key={f} className="flex items-center gap-2 py-0.5">
                    <Plus className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-white/50 font-mono truncate">{f.split('/').pop()}</span>
                  </div>
                ))}
                {msg.diffSummary.modified.map(f => (
                  <div key={f} className="flex items-center gap-2 py-0.5">
                    <Pencil className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-white/50 font-mono truncate">{f.split('/').pop()}</span>
                  </div>
                ))}
                {msg.diffSummary.deleted.map(f => (
                  <div key={f} className="flex items-center gap-2 py-0.5">
                    <X className="h-3 w-3 text-red-400 shrink-0" />
                    <span className="text-[11px] text-white/50 font-mono truncate">{f.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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

        {/* Main prose content — always show conversational text like Lovable */}
        {(() => {
          // For build messages with files, show only the closing/body text (intro already shown above)
          // For discuss mode or no-file messages, show full text
          const proseContent = isCompleted && (hasFiles || fileNames.length > 0)
            ? (closingLines || bodyText || '').trim()
            : (isCompleted ? bodyText || displayText : displayText);
          if (!proseContent && !isStreaming) return null;
          return (
            <StreamingText content={proseContent || ''} isStreaming={isStreaming}>
              {(displayedText) => {
                if (!displayedText) return null;
                return (
                  <div className="prose prose-sm prose-invert max-w-none text-[13px] text-white/70 leading-relaxed [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_ol]:space-y-2 [&_ul]:space-y-1 [&_li]:text-white/60 [&_strong]:text-white/90 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ol>li]:pl-1">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const isInline = !className;
                          const codeStr = String(children).replace(/\n$/, '');
                          const lang = className?.replace('language-', '') || '';
                          
                          if (!isInline && lang === 'sql' && codeStr.length > 10) {
                            return (
                              <div className="my-2">
                                <div className="relative group/code">
                                  <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-t-lg">
                                    <span className="text-[9px] text-white/25 font-mono">sql</span>
                                    <CopyCodeButton text={codeStr} />
                                  </div>
                                  <pre className="!mt-0 !rounded-t-none border border-t-0 border-white/[0.06] !bg-black/30"><code className={className} {...props}>{children}</code></pre>
                                </div>
                                <InlineSQLRunner sql={codeStr} supabaseUrl={supabaseConfig?.url} supabaseServiceKey={supabaseConfig?.anonKey} />
                              </div>
                            );
                          }
                          
                          if (isInline) {
                            return <code className="bg-white/[0.08] rounded px-1.5 py-0.5 text-[12px] font-mono text-cyan-300/80" {...props}>{children}</code>;
                          }
                          return (
                            <div className="relative group/code my-2">
                              <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-t-lg">
                                <span className="text-[9px] text-white/25 font-mono">{lang || 'code'}</span>
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
                );
              }}
            </StreamingText>
          );
        })()}

        {/* Conversational summary text is now always shown above */}

        {/* Build changes summary — created/modified/deleted */}
        {isCompleted && fileNames.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {(() => {
              const created = fileNames.filter(f => !previousFiles.some(p => p.path === f));
              const modified = fileNames.filter(f => previousFiles.some(p => p.path === f));
              return (
                <>
                  {created.length > 0 && <span className="text-[10px] text-emerald-400/60 flex items-center gap-1"><Plus className="h-2.5 w-2.5" />{created.length} created</span>}
                  {modified.length > 0 && <span className="text-[10px] text-cyan-400/60 flex items-center gap-1"><Pencil className="h-2.5 w-2.5" />{modified.length} modified</span>}
                </>
              );
            })()}
          </div>
        )}

        {/* File Read Cards — shown when AI reads/analyzes project files */}
        {!isStreaming && (() => {
          const fileReads = extractFileReads(msg.content);
          if (fileReads.length === 0) return null;
          return (
            <div className="space-y-1.5">
              {fileReads.map((fr, i) => {
                const key = `${msg.id}-read-${fr.fileName}`;
                return (
                  <FileReadCard
                    key={key}
                    fileName={fr.fileName}
                    description={fr.description}
                    isExpanded={expandedFileReads.has(key)}
                    onToggle={() => toggleFileReadExpanded(key)}
                  />
                );
              })}
            </div>
          );
        })()}

        {/* Inline diffs — collapsible per file */}
        {isCompleted && !isStreaming && previousFiles.length > 0 && fileNames.length > 0 && (
          <div className="space-y-1">
            {fileNames.map(name => {
              const prev = previousFiles.find(p => p.path === name);
              const curr = latestFiles.find(p => p.path === name);
              if (!prev || !curr) return null;
              const diffId = `${msg.id}-${name}`;
              const isExpanded = expandedBuildMessages.has(diffId);
              // Quick line count
              const added = curr.content.split('\n').length - prev.content.split('\n').length;
              return (
                <div key={name} className="rounded-lg border border-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedBuildMessages(s => {
                        const n = new Set(s);
                        if (n.has(diffId)) n.delete(diffId); else n.add(diffId);
                        return n;
                      });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/40 hover:text-white/60 hover:bg-white/[0.02] transition-colors"
                  >
                    <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", !isExpanded && "-rotate-90")} />
                    <FileCode className="h-3 w-3" />
                    <span className="font-mono truncate">{name.split('/').pop()}</span>
                    <span className="ml-auto text-[9px]">
                      {added >= 0 ? <span className="text-emerald-400/50">+{added}</span> : <span className="text-red-400/50">{added}</span>}
                    </span>
                  </button>
                  {isExpanded && (
                    <CodeDiffViewer oldContent={prev.content} newContent={curr.content} fileName={name} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lovable-style Revert button — prominent, standalone */}
        {isCompleted && !isStreaming && msg.filesSnapshot && onRevertToMessage && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onRevertToMessage(msg.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              title="Revert project to the state before this generation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Revert
            </button>
          </div>
        )}

        {msg.inlineError && !isStreaming && (
          <div className="space-y-2">
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
            {/* Smart error follow-up suggestion chips */}
            {buildErrors && buildErrors.length > 0 && (() => {
              const suggestions = generateErrorSuggestions(buildErrors);
              if (suggestions.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => onFixError(s.prompt)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] bg-amber-500/[0.06] border border-amber-500/20 text-amber-300/80 hover:bg-amber-500/[0.12] hover:text-amber-200 transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Migration approval cards (Phase 14) */}
        {msg.migrations && msg.migrations.length > 0 && (
          <div className="space-y-2">
            {msg.migrations.map((migration) => (
              <MigrationApprovalCard
                key={migration.id}
                migration={migration}
                supabaseConfig={supabaseConfig || null}
                onStatusChange={(id, status, result) => {
                  onUpdateMessages?.(prev => prev.map(m => 
                    m.id === msg.id && m.migrations
                      ? { ...m, migrations: m.migrations.map(mig => mig.id === id ? { ...mig, status, ...result } : mig) }
                      : m
                  ));
                }}
              />
            ))}
          </div>
        )}

        {/* Edge function deploy cards (Phase 16) */}
        {msg.edgeFunctions && msg.edgeFunctions.length > 0 && (
          <div className="space-y-2">
            {msg.edgeFunctions.map((ef) => (
              <EdgeFunctionCard
                key={ef.id}
                edgeFunction={ef}
                supabaseConfig={supabaseConfig || null}
                onStatusChange={(id, status, result) => {
                  onUpdateMessages?.(prev => prev.map(m => 
                    m.id === msg.id && m.edgeFunctions
                      ? { ...m, edgeFunctions: m.edgeFunctions.map(fn => fn.id === id ? { ...fn, status, ...result } : fn) }
                      : m
                  ));
                }}
              />
            ))}
          </div>
        )}

        {/* Lovable-style message action buttons — always visible on completed messages */}
        {!isStreaming && (
          <div className="flex items-center gap-0.5 pt-1">
            <button
              onClick={() => toast.success('Thanks for the feedback!')}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toast('We\'ll improve this response', { icon: '📝' })}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Bad response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(displayText || msg.content); toast.success('Copied'); }}
              className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-44 p-1 bg-[#1a1a22] border-white/[0.1] shadow-xl">
                {onRevertToMessage && msg.filesSnapshot && (
                  <button
                    onClick={() => onRevertToMessage(msg.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Revert to here
                  </button>
                )}
                {onForkFromMessage && (
                  <button
                    onClick={() => onForkFromMessage(msg.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    Fork from here
                  </button>
                )}
                <button
                  onClick={() => togglePin(msg.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Pin className="h-3.5 w-3.5" />
                  {msg.pinned ? 'Unpin' : 'Pin message'}
                </button>
              </PopoverContent>
            </Popover>
          </div>
        )}


        {/* Lovable-style plan action bar — Approve, Edit, or Override */}
        {showApproveButton && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="pt-2 space-y-2"
          >
            {/* Primary: Approve & Build */}
            <button
              onClick={() => handleApproveAndBuild(msg)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/15 border border-teal-500/30 text-teal-300 hover:from-teal-500/30 hover:to-cyan-500/25 hover:border-teal-500/50 transition-all text-sm font-medium group/approve"
            >
              <Rocket className="h-4 w-4 group-hover/approve:animate-bounce" />
              Approve & Build
              <span className="text-[10px] text-teal-400/60 ml-1">3cr</span>
            </button>
            {/* Secondary actions row */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const refinementPrompt = `I'd like to adjust the plan. Let me provide more details about what I want:`;
                  setInput(refinementPrompt);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-[12px] font-medium"
              >
                <Pencil className="h-3 w-3" />
                Edit approach
              </button>
              <button
                onClick={() => {
                  setInput('');
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all text-[12px] font-medium"
              >
                <Sparkles className="h-3 w-3" />
                New prompt
              </button>
            </div>
          </motion.div>
        )}


        {/* Step 4: File-by-file streaming status with checkmarks */}
        {isStreaming && fileNames.length > 0 && (
          <div className="space-y-1 mt-1">
            {fileNames.map((name, i) => {
              const isLast = i === fileNames.length - 1;
              const isComplete = !isLast; // All but the last are complete
              return (
                <div key={name} className="flex items-center gap-1.5 text-[11px]">
                  {isComplete ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/70 shrink-0" />
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin text-cyan-400 shrink-0" />
                  )}
                  <span className={cn(
                    "font-mono truncate",
                    isComplete ? "text-white/40" : "text-white/60"
                  )}>
                    {name.split('/').pop()}
                  </span>
                </div>
              );
            })}
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

        </div>
      </div>
    );
  };

  const handleChatDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  }, []);

  const handleChatDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleChatDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(async (file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`Only images can be dropped here`);
        return;
      }
      try {
        if (file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImagePreviews(prev => {
              if (prev.length >= MAX_IMAGE_COUNT) { toast.error(`Max ${MAX_IMAGE_COUNT} images`); return prev; }
              return [...prev, ev.target?.result as string];
            });
          };
          reader.readAsDataURL(file);
          return;
        }
        const compressed = await compressImage(file);
        setImagePreviews(prev => {
          if (prev.length >= MAX_IMAGE_COUNT) { toast.error(`Max ${MAX_IMAGE_COUNT} images`); return prev; }
          return [...prev, compressed];
        });
      } catch (err: any) {
        toast.error(err?.message || `Failed to process ${file.name}`);
      }
    });
  }, [compressImage]);

  return (
    <div
      className={cn("flex flex-col h-full bg-[#0a0a0f] relative", isDragOver && "ring-2 ring-inset ring-cyan-500/40")}
      onDragOver={handleChatDragOver}
      onDragLeave={handleChatDragLeave}
      onDrop={handleChatDrop}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-cyan-500/[0.06] backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-cyan-500/40 bg-[#0a0a0f]/80">
            <Paperclip className="h-8 w-8 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Drop images here</span>
            <span className="text-xs text-white/30">Images will be attached to your message</span>
          </div>
        </div>
      )}
      {/* Lovable-style header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <button className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors">
          <span>ultriumai</span>
          <ChevronDown className="h-3 w-3 text-white/40" />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onShowHistory}
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
            title="History"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
            title="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat search bar */}
      {showChatSearch && (
        <div className="px-3 pt-2 shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <SearchIcon className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <input
              value={chatSearch}
              onChange={e => setChatSearch(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/25 outline-none"
              autoFocus
            />
            {chatSearch && (
              <span className="text-[10px] text-white/30">{filteredMessages.length} results</span>
            )}
            <button onClick={() => { setShowChatSearch(false); setChatSearch(''); }} className="text-white/25 hover:text-white/50">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Pinned messages section */}
      {pinnedMessages.length > 0 && !showChatSearch && (
        <div className="px-3 pt-2 shrink-0">
          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.03] p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/60 font-medium uppercase tracking-wider">
              <Pin className="h-2.5 w-2.5" />
              Pinned ({pinnedMessages.length})
            </div>
            {pinnedMessages.slice(0, 3).map(m => (
              <button
                key={m.id}
                onClick={() => {
                  const el = document.getElementById(`msg-${m.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="w-full text-left text-[11px] text-white/50 hover:text-white/80 truncate px-1 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
              >
                {m.role === 'user' ? '👤 ' : '🤖 '}{getCleanUserContent(m.content).slice(0, 80)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search toggle in top-right corner */}
      {displayMessages.length > 3 && (
        <button
          onClick={() => setShowChatSearch(prev => !prev)}
          className="absolute top-2 right-2 z-10 h-6 w-6 rounded-md flex items-center justify-center text-white/15 hover:text-white/40 hover:bg-white/[0.04] transition-colors"
          title="Search messages (Ctrl+F)"
        >
          <SearchIcon className="h-3 w-3" />
        </button>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {displayMessages.length === 0 ? (
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
            filteredMessages.map((msg, idx) => {
              const isLast = idx === filteredMessages.length - 1;
              const Wrapper = isLast ? motion.div : 'div' as any;
              const wrapperProps = isLast ? {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 30 },
              } : {};
              return (
              <Wrapper
                key={msg.id}
                id={`msg-${msg.id}`}
                {...wrapperProps}
                className={cn(
                  'group/msg relative',
                  msg.role === 'user' ? 'flex justify-end' : '',
                )}
              >
                <div className="relative max-w-[90%]">
                  <div
                    className={cn(
                      msg.role === 'user'
                        ? 'rounded-2xl px-3.5 py-2.5 bg-white/[0.08] text-white/90 text-[13px] relative group/user-msg'
                        : ''
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      renderAssistantMessage(msg, idx === filteredMessages.length - 1)
                    ) : (
                      <div>
                        {(msg.imageUrls || (msg.imageUrl ? [msg.imageUrl] : [])).map((url, i) => (
                          <img key={i} src={url} alt={`Reference ${i + 1}`} className="rounded-lg max-h-32 mb-2 mr-2 border border-white/10 inline-block" />
                        ))}
                        <p className="whitespace-pre-wrap text-[13px]">{getCleanUserContent(msg.content)}</p>
                      </div>
                    )}
                  </div>
                  {/* Timestamp + mode badge + retry — show on hover */}
                  <div className={cn(
                    "flex items-center gap-1.5 text-[9px] text-white/15 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.tokenEstimate && ` · ~${msg.tokenEstimate} tokens`}
                    {msg.mode && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider",
                        msg.mode === 'discuss'
                          ? "bg-teal-500/15 text-teal-400/70"
                          : "bg-violet-500/15 text-violet-400/70"
                      )}>
                        {msg.mode === 'discuss' ? 'Chat' : 'Build'}
                      </span>
                    )}
                    {/* Pin toggle */}
                    {onUpdateMessages && (
                      <button
                        onClick={() => togglePin(msg.id)}
                        className={cn("flex items-center gap-0.5 transition-colors ml-1", msg.pinned ? "text-amber-400/70" : "text-white/25 hover:text-white/60")}
                        title={msg.pinned ? "Unpin" : "Pin message"}
                      >
                        <Pin className="h-2.5 w-2.5" />
                      </button>
                    )}
                    {/* Wave 10: Star prompt as favorite */}
                    {msg.role === 'user' && onTogglePromptFavorite && (
                      <button
                        onClick={() => onTogglePromptFavorite(msg.id)}
                        className={cn("flex items-center gap-0.5 transition-colors ml-1", favoritePromptIds?.has(msg.id) ? "text-amber-400/80" : "text-white/25 hover:text-amber-400/60")}
                        title={favoritePromptIds?.has(msg.id) ? "Unfavorite" : "Save as favorite"}
                      >
                        <Star className={cn("h-2.5 w-2.5", favoritePromptIds?.has(msg.id) && "fill-current")} />
                      </button>
                    )}
                    {msg.role === 'user' && !isGenerating && (
                      <>
                        {/* Edit & Resend — truncates conversation to this point (Step 2: Conversation Branching) */}
                        <button
                          onClick={() => {
                            setInput(msg.content);
                            setEditingMessageId(msg.id);
                            setTimeout(() => textareaRef.current?.focus(), 50);
                          }}
                          className="flex items-center gap-0.5 text-white/25 hover:text-white/60 transition-colors ml-1"
                          title="Edit & resend (replaces subsequent messages)"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => onSend(msg.content, msg.imageUrls || (msg.imageUrl ? [msg.imageUrl] : null))}
                          className="flex items-center gap-0.5 text-white/25 hover:text-white/60 transition-colors ml-1"
                          title="Retry this message"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Wrapper>
              );})
          )}

          {/* Thinking / typing indicator — only show when no content is streaming yet */}
          {isGenerating && thinkingPhase && renderThinkingIndicator()}
          {isGenerating && !thinkingPhase && (() => {
            const lastMsg = displayMessages[displayMessages.length - 1];
            const hasStreamingContent = lastMsg?.role === 'assistant' && lastMsg.content.length > 0;
            return hasStreamingContent ? null : <TypingIndicator />;
          })()}
        </div>
      </ScrollArea>

      {/* Image previews with resize controls */}
      {imagePreviews.length > 0 && (
        <div className="px-3 pt-2 shrink-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((img, i) => (
              <div key={i} className="relative inline-block group">
                <img src={img} alt={`Upload preview ${i + 1}`} className="h-16 rounded-lg border border-white/10" />
                <button
                  onClick={() => {
                    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                    setImageResizes(prev => { const n = { ...prev }; delete n[i]; return n; });
                  }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {/* Resize slider */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-white/30 shrink-0">Resize:</span>
            <input
              type="range"
              min={100}
              max={1200}
              step={50}
              value={imageResizes[0] ?? 1200}
              onChange={(e) => {
                const val = Number(e.target.value);
                const resizes: Record<number, number> = {};
                imagePreviews.forEach((_, i) => { resizes[i] = val; });
                setImageResizes(resizes);
              }}
              className="flex-1 h-1 accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-white/40 font-mono w-12 text-right">{imageResizes[0] ?? 1200}px</span>
          </div>
        </div>
      )}

      {/* Questions slot — rendered right above the input like Lovable */}
      {questionsSlot}



      {/* Wave 2 Step 3: Context window indicator — Wave 10: Expandable */}
      {contextBudget && contextBudget.percentUsed > 30 && (
        <div className="px-3 pt-2 shrink-0">
          <button
            onClick={() => setContextExpanded(prev => !prev)}
            className="w-full"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    contextBudget.percentUsed > 85 ? "bg-red-400" : contextBudget.percentUsed > 60 ? "bg-amber-400" : "bg-emerald-400"
                  )}
                  style={{ width: `${Math.min(contextBudget.percentUsed, 100)}%` }}
                />
              </div>
              <span className={cn(
                "text-[9px] font-mono whitespace-nowrap",
                contextBudget.percentUsed > 85 ? "text-red-400/70" : contextBudget.percentUsed > 60 ? "text-amber-400/60" : "text-white/25"
              )}>
                {Math.round(contextBudget.percentUsed)}% context
              </span>
              <ChevronDown className={cn("h-2.5 w-2.5 text-white/20 transition-transform", !contextExpanded && "-rotate-90")} />
              {contextBudget.percentUsed > 85 && onNewConversation && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNewConversation(); }}
                  className="text-[9px] text-red-400/70 hover:text-red-300 underline"
                >
                  New chat
                </button>
              )}
            </div>
          </button>
          {/* Wave 10: Expanded context breakdown */}
          {contextExpanded && contextBudget.fileBreakdown && (
            <div className="mt-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="text-[9px] text-white/30 font-medium uppercase tracking-wider mb-1">Top files by context usage</div>
              {contextBudget.fileBreakdown.slice(0, 5).map((fb: any, i: number) => (
                <div key={fb.path} className="flex items-center gap-2 text-[10px]">
                  <span className="flex-1 text-white/40 font-mono truncate">{fb.path.split('/').pop()}</span>
                  <span className="text-white/25 font-mono">{Math.round(fb.chars / 4)}t</span>
                  <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400/50" style={{ width: `${Math.min(fb.percent, 100)}%` }} />
                  </div>
                  <span className="text-white/20 w-8 text-right">{Math.round(fb.percent)}%</span>
                </div>
              ))}
              {contextBudget.percentUsed > 90 && (
                <p className="text-[9px] text-amber-400/60 mt-1.5 pt-1.5 border-t border-white/[0.06]">
                  💡 Start a fresh conversation to free up context space
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wave 2 Step 6: Token cost display */}
      {isGenerating && totalTokensUsed > 0 && (
        <div className="px-3 pt-1 shrink-0">
          <span className="text-[9px] text-white/20 font-mono">~{(totalTokensUsed / 1000).toFixed(1)}k tokens</span>
        </div>
      )}

      {/* Input area */}
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


        {/* Lovable-style input area */}
        <div data-tour="chat-input" className="rounded-2xl border border-white/[0.12] bg-white/[0.04] transition-all overflow-hidden focus-within:border-white/[0.2]">
          <div className="px-3 py-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const cursorPos = e.target.selectionStart || 0;
                const beforeCursor = e.target.value.slice(0, cursorPos);
                const atIdx = beforeCursor.lastIndexOf('@');
                if (atIdx >= 0 && projectFiles) {
                  const afterAt = beforeCursor.slice(atIdx + 1);
                  if (!afterAt.includes(' ') && afterAt.length < 60) {
                    setShowFileMentions(true);
                    setFileMentionQuery(afterAt);
                    setMentionCursorPos(cursorPos);
                  } else {
                    setShowFileMentions(false);
                  }
                } else {
                  setShowFileMentions(false);
                }
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Tell UltriumAI what to do..."
              rows={2}
              className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none outline-none focus:outline-none focus:ring-0 border-none min-h-[48px] max-h-[200px]"
            />
          </div>

          {/* Mentioned file chips */}
          {mentionedFilePaths.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 pb-1.5">
              {mentionedFilePaths.map(p => (
                <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 font-mono">
                  @{p.split('/').pop()}
                  <button onClick={() => setMentionedFilePaths(prev => prev.filter(x => x !== p))} className="text-cyan-400/50 hover:text-cyan-300">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* @-file mention autocomplete */}
          {showFileMentions && fileMentionSuggestions.length > 0 && (
            <div className="mx-2 mb-1 bg-[#1a1a22] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-white/[0.06]">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Mention a file</span>
              </div>
              {fileMentionSuggestions.map(f => (
                <button key={f.path} onClick={() => handleFileMentionSelect(f.path)} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors text-left">
                  <FileCode className="h-3.5 w-3.5 text-white/30 shrink-0" />
                  <span className="font-mono truncate">{f.shortName}</span>
                  <span className="text-[10px] text-white/20 ml-auto truncate">{f.path}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom toolbar — Lovable style: + Visual edits 💬 🎤 ⬆️ */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-t border-white/[0.06]">
            <Popover open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
              <PopoverTrigger asChild>
                <button className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors shrink-0">
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-56 p-1 bg-[#1a1a22] border-white/[0.1] shadow-xl">
                <button onClick={() => { setPlusMenuOpen(false); onShowSettings?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Settings className="h-4 w-4 text-white/40" /> Project settings
                </button>
                <button onClick={() => { setPlusMenuOpen(false); onShowHistory?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Clock className="h-4 w-4 text-white/40" /> History
                </button>
                <button onClick={() => { setPlusMenuOpen(false); onShowKnowledge?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <BookOpen className="h-4 w-4 text-white/40" /> Knowledge
                </button>
                <button onClick={() => { setPlusMenuOpen(false); onShowGitHub?.(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <GitBranch className="h-4 w-4 text-white/40" /> GitHub
                </button>
                <div className="border-t border-white/[0.06] my-1" />
                <button onClick={async () => { setPlusMenuOpen(false); try { const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement | null; if (!iframe) { toast.error('No preview'); return; } const html2canvas = (await import('html2canvas')).default; const canvas = await html2canvas(iframe.contentDocument?.body || iframe, { width: iframe.clientWidth, height: iframe.clientHeight, scale: 0.5, useCORS: true, allowTaint: true, backgroundColor: '#0a0a0a', logging: false }); setImagePreviews(prev => [...prev, canvas.toDataURL('image/png', 0.8)]); toast.success('Screenshot captured'); } catch { toast.error('Could not capture screenshot'); } }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Camera className="h-4 w-4 text-white/40" /> Screenshot
                </button>
                <button onClick={() => { setPlusMenuOpen(false); fileInputRef.current?.click(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Paperclip className="h-4 w-4 text-white/40" /> Attach
                </button>
              </PopoverContent>
            </Popover>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md,.json,.csv,.html,.css,.js,.ts,.tsx,.jsx" multiple onChange={handleImageUpload} className="hidden" />

            {/* Visual Edits button */}
            {onToggleVisualEdit && fileCount > 0 && (
              <button onClick={onToggleVisualEdit} className={cn("flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium transition-all shrink-0", isVisualEditActive ? "text-cyan-400 bg-cyan-500/10" : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]")}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Visual edits</span>
              </button>
            )}

            {editingMessageId && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-1 rounded-md">
                <Pencil className="h-2.5 w-2.5" /><span>Editing</span>
                <button onClick={() => { setEditingMessageId(null); setInput(''); }} className="text-white/30 hover:text-white/60 ml-1"><X className="h-3 w-3" /></button>
              </div>
            )}

            <div className="flex-1" />

            {/* Chat/Build toggle */}
            <button onClick={() => onModeChange(mode === 'discuss' ? 'build' : 'discuss')} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors shrink-0" title={mode === 'discuss' ? 'Build mode' : 'Chat mode'}>
              <MessageSquare className="h-4 w-4" />
            </button>

            {/* Mic */}
            <button className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors shrink-0" onClick={() => toast('Voice input coming soon', { icon: '🎤' })}>
              <Mic className="h-4 w-4" />
            </button>

            {/* Send / Stop */}
            {isGenerating ? (
              <button onClick={onStop} className="h-8 w-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-white/15 transition-colors shrink-0">
                <Square className="h-3 w-3" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()} className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all shrink-0", input.trim() ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.08] text-white/20")}>
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Model picker + mode badge */}
        {selectedModel && onModelChange && (
          <div className="flex items-center justify-between">
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", mode === 'discuss' ? "bg-teal-500/15 text-teal-400" : "bg-violet-500/15 text-violet-400")}>
              {mode === 'discuss' ? 'Chat · 1cr' : 'Build · 3cr'}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]">
                  <span>{AI_MODELS.find(m => m.id === selectedModel)?.icon || '🤖'}</span>
                  <span className="font-medium">{AI_MODELS.find(m => m.id === selectedModel)?.label || 'Model'}</span>
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-52 p-1 bg-[#1a1a22] border-white/[0.1]">
                <div className="px-2 py-1.5 text-[9px] text-white/25 uppercase tracking-wider font-medium">AI Model</div>
                {AI_MODELS.map(model => (
                  <button key={model.id} onClick={() => onModelChange(model.id)} className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12px] transition-colors", selectedModel === model.id ? "bg-white/[0.08] text-white/90" : "text-white/60 hover:text-white hover:bg-white/[0.06]")}>
                    <span className="text-sm">{model.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{model.label}</div>
                      <div className="text-[10px] text-white/30">{model.desc}</div>
                    </div>
                    {selectedModel === model.id && <Check className="h-3 w-3 text-cyan-400" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
