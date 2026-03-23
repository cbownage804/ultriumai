import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from './useProjectFileSystem';
import { useStreamingPreview } from './useStreamingPreview';
import { useUserCredits } from './useUserCredits';
import { useContextBudget } from './useContextBudget';
import { detectSupabaseIntents, buildSupabaseContext, buildConversationMemory, buildErrorDiagnosisContext, analyzeConversationComplexity, generateProactiveSuggestions, compressConversationHistory, detectCommunicationStyle, extractUserPreferences, buildPreferencesContext, detectWorkflowIntent, buildEnhancedErrorContext, buildVisualIntelligenceContext, detectWebSearchIntent, buildWebSearchContext, detectURLCloneIntent, buildFileManifest, calculateContextBudget, type ContextBudgetInfo } from '@/components/ai-builder/SupabaseConversational';
import { parseMigrationBlocks, stripMigrationBlocks, type MigrationBlock } from '@/components/ai-builder/MigrationApprovalCard';
import { parseEdgeFunctionBlocks, stripEdgeFunctionBlocks, type EdgeFunctionBlock } from '@/components/ai-builder/EdgeFunctionCard';
// Wave 16 imports
import { useSchemaFromNL } from './useSchemaFromNL';
import { detectEdgeFunctionIntent, buildEdgeFunctionDirective } from '@/components/ai-builder/edgeFunctionScaffolds';
import { parseAuthCommand } from '@/components/ai-builder/authFlowTemplates';
// Wave 17 imports
import { useAIConfidence, buildReasoningDirective } from './useAIConfidence';
// Wave 18 imports
import { useComponentReuseDetection } from './useComponentReuseDetection';
import { useImportGraphContext } from './useImportGraphContext';
import { useRuntimeErrorFix } from './useRuntimeErrorFix';
import { useIncrementalApply } from './useIncrementalApply';
import { usePostGenerationChangelog } from './usePostGenerationChangelog';

// ── Helper: Build branding context from Firecrawl branding response ──
function buildBrandingContext(branding: any): string {
  if (!branding) return '';
  const parts: string[] = ['\n[EXTRACTED BRAND IDENTITY]'];
  if (branding.colorScheme) parts.push(`Color Scheme: ${branding.colorScheme}`);
  if (branding.colors) {
    parts.push('Brand Colors:');
    for (const [key, val] of Object.entries(branding.colors)) {
      if (val) parts.push(`  ${key}: ${val}`);
    }
  }
  if (branding.fonts?.length) {
    parts.push(`Fonts: ${branding.fonts.map((f: any) => f.family || f).join(', ')}`);
  }
  if (branding.typography) {
    const t = branding.typography;
    if (t.fontFamilies) parts.push(`Font Families: primary=${t.fontFamilies.primary || '?'}, heading=${t.fontFamilies.heading || '?'}`);
  }
  if (branding.logo) parts.push(`Logo URL: ${branding.logo}`);
  if (branding.images?.logo) parts.push(`Logo URL: ${branding.images.logo}`);
  if (branding.images?.favicon) parts.push(`Favicon URL: ${branding.images.favicon}`);
  if (branding.images?.ogImage) parts.push(`OG Image: ${branding.images.ogImage}`);
  if (branding.spacing?.borderRadius) parts.push(`Border Radius: ${branding.spacing.borderRadius}`);
  return parts.join('\n');
}

// ── File hash tracking for incremental context (Lovable-grade) ──
const fileHashCache = new Map<string, string>();

// ── Focus-file detection: match user request to likely target files ──
function detectFocusFiles(input: string, files: ProjectFile[]): string[] {
  const lower = input.toLowerCase();
  const matches: string[] = [];

  // 1. Explicit file mentions (e.g., "update App.tsx", "fix the header")
  for (const file of files) {
    const fileName = file.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '').toLowerCase() || '';
    if (lower.includes(fileName) && fileName.length > 2) {
      matches.push(file.path);
    }
  }

  // 2. Component/section keyword mapping
  const KEYWORD_MAP: Record<string, string[]> = {
    'header': ['header', 'navbar', 'nav', 'topbar'],
    'footer': ['footer'],
    'hero': ['hero', 'landing', 'home'],
    'sidebar': ['sidebar', 'sidenav'],
    'logo': ['logo', 'brand', 'header', 'navbar', 'nav'],
    'button': ['button', 'cta'],
    'form': ['form', 'contact', 'input'],
    'card': ['card'],
    'modal': ['modal', 'dialog'],
    'color': ['index.css', 'theme', 'tailwind'],
    'font': ['index.css', 'theme', 'tailwind'],
    'style': ['index.css', 'theme'],
    'navigation': ['nav', 'header', 'sidebar', 'router', 'routes'],
    'route': ['router', 'routes', 'app'],
    'page': [],  // too generic
  };

  for (const [keyword, fileHints] of Object.entries(KEYWORD_MAP)) {
    if (!lower.includes(keyword)) continue;
    for (const file of files) {
      const fileLower = file.path.toLowerCase();
      if (fileHints.some(hint => fileLower.includes(hint)) && !matches.includes(file.path)) {
        matches.push(file.path);
      }
    }
  }

  // 3. Always include App.tsx/main.tsx for routing changes
  if (/\b(page|route|navigation|menu)\b/i.test(input)) {
    const appFile = files.find(f => /\/(App|main)\.(tsx?|jsx?)$/.test(f.path));
    if (appFile && !matches.includes(appFile.path)) matches.push(appFile.path);
  }

  // Cap at 5 focus files to keep the directive useful
  return matches.slice(0, 5);
}

// Health check removed — false positives from CORS preflight errors caused misleading "AI slow" warnings.
// Actual request failures are handled by the smart error classifier below.

// ── Smart error classifier ──
interface ClassifiedError {
  category: 'rate_limit' | 'credits' | 'payload_too_large' | 'timeout' | 'network' | 'server' | 'unknown';
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  retryDelayMs?: number;
}

function classifyError(status: number, errorMsg: string, err?: Error): ClassifiedError {
  if (status === 429) return {
    category: 'rate_limit', retryable: true, retryDelayMs: 30_000,
    userMessage: 'You\'re sending requests too quickly.',
    suggestion: 'Wait 30 seconds, then try again.',
  };
  if (status === 402) return {
    category: 'credits', retryable: false,
    userMessage: 'AI credits exhausted.',
    suggestion: 'Purchase more credits in Settings → Billing to continue.',
  };
  if (status === 400 && /token|too large|exceeds|maximum context/i.test(errorMsg)) return {
    category: 'payload_too_large', retryable: true,
    userMessage: 'Your project context is too large for a single request.',
    suggestion: 'Try a more specific request like "update only the header component" instead of broad changes.',
  };
  if (status === 400 && /provider|upstream|internal|encountered an issue/i.test(errorMsg)) return {
    category: 'server', retryable: true, retryDelayMs: 5000,
    userMessage: 'The AI provider encountered a temporary issue.',
    suggestion: 'This usually resolves quickly. Try again in a few seconds.',
  };
  if (status === 504 || status === 408 || err?.name === 'AbortError' || /timeout/i.test(errorMsg)) return {
    category: 'timeout', retryable: true, retryDelayMs: 2000,
    userMessage: 'The AI took too long to respond.',
    suggestion: 'Try a simpler request, or break your task into smaller steps.',
  };
  if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed to fetch')) return {
    category: 'network', retryable: true, retryDelayMs: 3000,
    userMessage: 'Network connection issue.',
    suggestion: 'Check your internet connection and try again.',
  };
  if (status >= 500) return {
    category: 'server', retryable: true, retryDelayMs: 5000,
    userMessage: 'AI service is temporarily unavailable.',
    suggestion: 'This usually resolves in a few seconds. Try again shortly.',
  };
  // Strip raw JSON from error message before displaying
  let cleanMsg = errorMsg || 'Something went wrong.';
  try {
    const parsed = JSON.parse(cleanMsg);
    if (parsed?.error) cleanMsg = parsed.error;
  } catch {}
  cleanMsg = cleanMsg.replace(/AI builder returned \d+:\s*/i, '').slice(0, 150);
  return {
    category: 'unknown', retryable: false,
    userMessage: cleanMsg,
    suggestion: 'Try rephrasing your request or refreshing the page.',
  };
}

/** Detect if the user wants to generate or redesign an image/logo/icon via AI */
export function detectImageGenerationIntent(input: string): { prompt: string; quality: 'standard' | 'high' } | null {
  const lowerInput = input.toLowerCase().trim();
  const isRepairOrErrorContext = /\b(auto-fix|repair|compile error|compilation error|preview failed|build failed|runtime error|stack trace|diagnosis|diagnostic|truncated|continue from where you left off|validation failed)\b/.test(lowerInput);
  if (isRepairOrErrorContext) return null;

  const hasImageNoun = /\b(logo|image|icon|illustration|graphic|picture|avatar|banner|mascot|badge|emblem)\b/.test(lowerInput);
  if (!hasImageNoun) return null;

  const hasExplicitGenerateVerb = /\b(generate|create|make|draw|produce)\b/.test(lowerInput);
  const hasDesignVerb = /\b(design|redesign)\b/.test(lowerInput);
  const hasModifyVerb = /\b(update|change|modify|refresh|revamp|improve|replace|redo)\b/.test(lowerInput);

  // "keep / reuse / use the current logo" → NOT image generation, just code edit
  const wantsToKeepExisting = /\b(use|keep|reuse)\b.*\b(logo|icon|brand)\b/.test(lowerInput);
  if (wantsToKeepExisting) return null;

  // Any verb that implies creating or changing an image asset triggers generation
  if (!hasExplicitGenerateVerb && !hasDesignVerb && !hasModifyVerb) return null;

  const quality = /\b(high.?quality|detailed|premium|professional|hd|4k)\b/.test(lowerInput) ? 'high' as const : 'standard' as const;
  const prompt = input.replace(/\b(please|can you|could you|i want|i need|for my|for the|website|app|project|page)\b/gi, '').trim();
  return prompt ? { prompt, quality } : null;
}

/** Fast string hash (djb2) for change detection — not cryptographic */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/** Returns only files that changed since the last build */
function getChangedFiles(files: ProjectFile[]): { changed: ProjectFile[]; unchanged: string[] } {
  const changed: ProjectFile[] = [];
  const unchanged: string[] = [];
  for (const f of files) {
    const hash = hashString(f.content);
    if (fileHashCache.get(f.path) !== hash) {
      changed.push(f);
    } else {
      unchanged.push(f.path);
    }
  }
  return { changed, unchanged };
}

/** Update hash cache after a successful build — Phase 6: also prune stale entries */
function updateFileHashes(files: ProjectFile[]) {
  const currentPaths = new Set(files.map(f => f.path));
  // Prune entries for files that no longer exist
  for (const key of fileHashCache.keys()) {
    if (!currentPaths.has(key)) fileHashCache.delete(key);
  }
  for (const f of files) {
    fileHashCache.set(f.path, hashString(f.content));
  }
}

// ── Plan step parser (Lovable-grade) ──
// Parses structured plan steps from AI streaming output for visual task cards
interface PlanStep { step: number; label: string; status: 'pending' | 'active' | 'done' }

function parsePlanSteps(content: string): PlanStep[] | undefined {
  // Detect numbered plan patterns like "1. Create header component" or "Step 1: Build layout"
  const planPatterns = [
    /(?:^|\n)(?:Step\s+)?(\d+)[.):]\s*\*{0,2}(.+?)\*{0,2}(?:\n|$)/gi,
    /(?:^|\n)[-•]\s+\*{0,2}(.+?)\*{0,2}(?:\n|$)/gi,
  ];

  // Only parse if we see plan-like preamble
  const hasPlanHeader = /(?:here'?s (?:my|the) plan|i'?ll|let me|steps?:|plan:|phases?:)/i.test(content.slice(0, 500));
  if (!hasPlanHeader) return undefined;

  const steps: PlanStep[] = [];
  const firstFileIdx = content.indexOf('===FILE:');
  const planSection = firstFileIdx > 0 ? content.slice(0, firstFileIdx) : content.slice(0, 1500);

  const numbered = [...planSection.matchAll(/(?:^|\n)(?:Step\s+)?(\d+)[.):]\s*\*{0,2}([^\n]{5,80})\*{0,2}/gi)];
  if (numbered.length >= 2) {
    for (const m of numbered) {
      const stepNum = parseInt(m[1]);
      const label = m[2].replace(/\*{1,2}/g, '').trim();
      if (label && stepNum <= 10) {
        steps.push({ step: stepNum, label, status: 'pending' });
      }
    }
  }

  if (steps.length < 2) return undefined;

  // Mark steps as done based on what files have been output
  const fileMatches = content.match(/===FILE:\s*.+?===/g) || [];
  const completedCount = Math.min(steps.length, Math.ceil(fileMatches.length / Math.max(1, steps.length / fileMatches.length)));
  for (let i = 0; i < steps.length; i++) {
    if (i < completedCount) steps[i].status = 'done';
    else if (i === completedCount) steps[i].status = 'active';
  }

  return steps;
}

// ── Post-generation syntax validation (Lovable-grade) ──
interface ValidationResult {
  valid: boolean;
  errors: { file: string; message: string }[];
}

function validateGeneratedFiles(files: ProjectFile[]): ValidationResult {
  const errors: { file: string; message: string }[] = [];

  for (const f of files) {
    const ext = f.path.split('.').pop()?.toLowerCase() || '';

    // Phase 25: Skip SVG files from HTML tag-balance checks
    // HTML: check for matching tags, unclosed elements
    if ((ext === 'html' || ext === 'htm')) {
      const openTags = (f.content.match(/<(?!\/|!|br|hr|img|input|meta|link)[a-z][^>]*>/gi) || []).length;
      const closeTags = (f.content.match(/<\/[a-z][^>]*>/gi) || []).length;
      if (Math.abs(openTags - closeTags) > 3) {
        errors.push({ file: f.path, message: `Mismatched HTML tags: ${openTags} open vs ${closeTags} close` });
      }
      // Check for unclosed <script> or <style>
      const scriptOpen = (f.content.match(/<script/gi) || []).length;
      const scriptClose = (f.content.match(/<\/script>/gi) || []).length;
      if (scriptOpen !== scriptClose) {
        errors.push({ file: f.path, message: `Unclosed <script> tag` });
      }
    }

    // JS/TS: check for basic syntax issues
    if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
      // Bracket balance
      const opens = (f.content.match(/[{(\[]/g) || []).length;
      const closes = (f.content.match(/[})\]]/g) || []).length;
      if (Math.abs(opens - closes) > 2) {
        errors.push({ file: f.path, message: `Unbalanced brackets: ${opens} open vs ${closes} close` });
      }
      // Unclosed template literals — downgraded to non-blocking since autoRepairFiles
      // handles this with a proper parser. Naive backtick count has false positives.
      // const backticks = (f.content.match(/`/g) || []).length;
      // if (backticks % 2 !== 0) { ... }
    }

    // CSS: check for unclosed braces
    if (ext === 'css' || ext === 'scss') {
      const openBraces = (f.content.match(/{/g) || []).length;
      const closeBraces = (f.content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({ file: f.path, message: `Unclosed CSS brace: ${openBraces} { vs ${closeBraces} }` });
      }
    }

    // General: check for AI prose that leaked into code
    const lastLines = f.content.split('\n').slice(-5);
    const proseInCode = lastLines.some(l => /^(I've |Here's |This |Let me |I hope |Enjoy|Great|Perfect|Done!)/i.test(l.trim()));
    if (proseInCode) {
      errors.push({ file: f.path, message: `AI commentary detected at end of file` });
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Strip trailing AI prose from validated files */
function sanitizeValidationErrors(files: ProjectFile[], errors: ValidationResult['errors']): ProjectFile[] {
  return files.map(f => {
    const proseError = errors.find(e => e.file === f.path && e.message.includes('commentary'));
    if (!proseError) return f;
    // Strip trailing prose lines
    const lines = f.content.split('\n');
    let cutIdx = lines.length;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      if (/^(I've |Here's |This |Let me |I hope |Enjoy|Great|Perfect|Done!)/i.test(lines[i].trim())) {
        cutIdx = i;
      } else if (lines[i].trim()) break;
    }
    return { ...f, content: lines.slice(0, cutIdx).join('\n').trimEnd() };
  });
}

// ── Import graph analysis for smarter context (Lovable-grade) ──
function buildImportGraph(files: ProjectFile[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const fileNames = new Map<string, string>(); // basename -> full path

  for (const f of files) {
    const base = f.path.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
    fileNames.set(base, f.path);
    if (!graph.has(f.path)) graph.set(f.path, new Set());
  }

  for (const f of files) {
    // Match import/require patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"](.+?)['"]/g,
      /import\s*\(['"](.+?)['"]\)/g,
      /require\s*\(['"](.+?)['"]\)/g,
      /<script\s+src=["'](.+?)["']/gi,
      /<link\s+.*?href=["'](.+?)["']/gi,
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(f.content)) !== null) {
        const ref = match[1];
        // Resolve to a project file
        const refBase = ref.split('/').pop()?.replace(/\.[^.]+$/, '') || ref;
        const resolvedPath = fileNames.get(refBase);
        if (resolvedPath && resolvedPath !== f.path) {
          graph.get(f.path)?.add(resolvedPath);
        }
      }
    }
  }

  return graph;
}

/** Get files that are in the dependency chain of a target file */
function getDependencyChain(graph: Map<string, Set<string>>, targetPath: string, maxDepth = 3): Set<string> {
  const visited = new Set<string>();
  const queue: [string, number][] = [[targetPath, 0]];

  while (queue.length > 0) {
    const [path, depth] = queue.shift()!;
    if (visited.has(path) || depth > maxDepth) continue;
    visited.add(path);

    // Forward deps (files this file imports)
    const deps = graph.get(path);
    if (deps) for (const dep of deps) queue.push([dep, depth + 1]);

    // Reverse deps (files that import this file)
    for (const [filePath, fileDeps] of graph) {
      if (fileDeps.has(path)) queue.push([filePath, depth + 1]);
    }
  }

  return visited;
}

// ── Request deduplication ──
let lastRequestFingerprint = '';
let lastRequestTime = 0;

export interface BuildSummary {
  durationMs: number;
  filesGenerated: number;
  filesDeleted: number;
  tokensUsed: number;
  contextChars: number;
  validationErrors: number;
}

export interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  filesGenerated?: number;
  timestamp: Date;
  suggestions?: string[];
  imageUrl?: string;
  imageUrls?: string[];
  tokenEstimate?: number;
  filesSnapshot?: ProjectFile[];
  /** Parsed plan steps from the AI's planning phase */
  planSteps?: { step: number; label: string; status: 'pending' | 'active' | 'done' }[];
  /** Inline error shown in chat */
  inlineError?: { message: string; source?: string; line?: number };
  /** Whether files are pending user approval */
  pendingApproval?: boolean;
  /** Workflow steps detected from user's multi-step request */
  workflowSteps?: string[];
  /** Classified error info for smart error display */
  classifiedError?: ClassifiedError;
  /** Whether this message has been edited (for conversation branching) */
  isEdited?: boolean;
  /** Original content before edit */
  originalContent?: string;
  /** Build summary stats (Phase 5) */
  buildSummary?: BuildSummary;
  /** Migration blocks parsed from AI output (Phase 14) */
  migrations?: import('@/components/ai-builder/MigrationApprovalCard').MigrationBlock[];
  /** Edge function blocks parsed from AI output (Phase 16) */
  edgeFunctions?: import('@/components/ai-builder/EdgeFunctionCard').EdgeFunctionBlock[];
  /** Whether this message is pinned by the user */
  pinned?: boolean;
  /** Auto-generated commit message for this build */
  commitMessage?: string;
  /** Which mode this message was sent/received in */
  mode?: BuilderMode;
  /** Step 9: Post-generation diff summary */
  diffSummary?: { added: string[]; modified: string[]; deleted: string[]; totalLinesChanged: number };
  /** Duration in ms that the AI took to generate this response */
  generationDurationMs?: number;
}

export type BuilderMode = 'build' | 'discuss';
export type ThinkingPhase = 'analyzing' | 'planning' | 'writing' | null;

export interface VersionSnapshot {
  id: string;
  label: string;
  files: ProjectFile[];
  timestamp: Date;
  messageId: string;
}

const BUILDER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-app-builder`;
// Whitespace-tolerant delimiters — handle leading/trailing spaces, indentation, and Unicode-safe
const FILE_DELIMITER = /^\s*===FILE:\s*(.+?)===\s*$/;
const DELETE_DELIMITER = /^\s*===DELETE:\s*(.+?)===\s*$/;
const EDIT_DELIMITER = /^\s*===EDIT:\s*(.+?)===\s*$/;
const OUTPUT_END_DELIMITER = /^\s*===END===\s*$/;
const HUNK_HEADER = /^@@\s*(\d+)-(\d+)\s*@@$/;
const UNIFIED_HUNK_HEADER = /^@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@/;
// AI model format: @@oldStart,oldCount +newStart,newCount @@ (no leading -)
const AI_HUNK_HEADER = /^@@\s*(\d+),(\d+)\s*\+(\d+),(\d+)\s*@@/;

/** Detect conversational prose that should not be part of a code file */
function isConversationalLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Phase 12: Exclude JSX comments and template literals from prose detection
  if (trimmed.startsWith('{/*') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return false;

  // Quick-exit: lines starting with valid code tokens are NOT conversational
  if (/^[<{\/\[\]()@#.;:=!&|+\-*%?~`\\]/.test(trimmed)) return false;
  if (/^(import |export |const |let |var |function |class |return |if |else |for |while |switch |case |try |catch |throw |new |type |interface |enum |async |await |from |default |module |require|<!DOCTYPE|<\?xml)/.test(trimmed)) return false;
  if (/^(body|html|head|div|span|p|h[1-6]|ul|ol|li|a|img|input|button|form|table|tr|td|th|nav|header|footer|main|section|article|aside|meta|link|script|style|label|select|option|textarea)\b/.test(trimmed)) return false;

  // Common AI conversational markers that shouldn't be in code
  const markers = [
    /^(what'?s (next|changed|new|different|updated)|would you like|let me know|here'?s what|i('?ve| have)|shall i|want me to|feel free|happy to|hope this|this (should|will|creates?|adds?|implements?|includes?|features?|provides?|is a)|i (created|added|built|implemented|updated|fixed|modified|made|changed|replaced|removed|redesigned))/i,
    /^(#{1,4}\s)/,            // Any markdown heading (# ## ### ####)
    /^(🎉|👋|✅|🚀|💡|📝|🔧|⚡|🎨|🔥|💪|👆|👇|📌|🏗|✨|💫|🌟|⭐|🛠|📦|🧩|🔄|🔑|📋|🎯)/,
    /^(Great|Perfect|Done|Now |Next |The app|Your app|I've |Here are|Here is|Let me|I can|This (update|change|version|adds|creates|implements|gives|provides|includes|features|is a|should)|That'?s |These |Those |Note:|Notice|Enjoy|Congrats|Awesome|Excellent|Wonderful|Looks like|As you can see|You'?ll |We'?ve |The (new|updated|modified|redesigned|improved))/,
    /^\*\*[\w\s]+\*\*[.:]/,   // **Bold heading**: or **Bold heading**.
    /^```[\w]*\s*$/,           // Opening/closing code fences (``` or ```markdown)
    /^\d+\.\s+\*\*[A-Z]/,     // Numbered bold list items like "1. **Immersive Background**"
    /^[-•]\s+\*\*[A-Z]/,      // Bullet bold list items
    /^[-•]\s+[A-Z][a-z].*[:.]\s*$/,  // Bullet prose items ending with : or .
    /^(Summary|Overview|Changes|Features|Improvements|Updates|Key (changes|features|updates)|What I (did|changed)|Here'?s (a|the) (summary|breakdown|overview))/i,
    // Phase 77: Additional prose patterns
    /^I\s[a-z]/,              // Lines starting with "I added...", "I created..."
    /^\d+\s+(new|component|file|change)/i, // "2 new components added"
    /^\[.+\]\(.+\)/,          // Markdown links: [text](url)
    /^[A-Z][a-z]+ly,?\s/,     // Adverb-starting sentences: "Additionally, ..."
  ];
  return markers.some(r => r.test(trimmed));
}

/** Apply a single hunk patch to existing file content */
export function applyHunkPatch(
  existingContent: string,
  hunks: { startLine: number; endLine: number; newLines: string[] }[]
): string | null {
  const lines = existingContent.split('\n');
  // Apply hunks from bottom to top so line numbers remain stable
  const sorted = [...hunks].sort((a, b) => b.startLine - a.startLine);
  for (const hunk of sorted) {
    const start = Math.max(0, hunk.startLine - 1); // 1-indexed to 0-indexed
    // Phase 15: Clamp endLine to file length to prevent silent corruption
    const end = Math.min(lines.length, hunk.endLine);
    if (start > lines.length) {
      console.warn(`[Patch] Hunk start ${hunk.startLine} exceeds file length ${lines.length} — skipping`);
      return null; // out of bounds — patch doesn't apply
    }
    if (hunk.endLine > lines.length) {
      console.warn(`[Patch] Hunk endLine ${hunk.endLine} clamped to ${lines.length}`);
    }
    lines.splice(start, end - start, ...hunk.newLines);
  }
  return lines.join('\n');
}

/** Parse ===EDIT: path=== blocks into hunks */
interface EditBlock {
  path: string;
  hunks: { startLine: number; endLine: number; newLines: string[] }[];
  hasDiffArtifacts?: boolean;
}

function parseEditBlocks(raw: string): EditBlock[] {
  const lines = raw.split('\n');
  const edits: EditBlock[] = [];
  let currentPath: string | null = null;
  let currentHunks: EditBlock['hunks'] = [];
  let currentHunkLines: string[] = [];
  let currentHunkStart = 0;
  let currentHunkEnd = 0;
  let inHunk = false;
  let hasDiffMarkers = false;
  /** Whether the current hunk uses unified diff (+/- prefixed lines) */
  let isUnifiedDiffHunk = false;

  const flushHunk = () => {
    if (inHunk && currentHunkStart > 0) {
      let finalLines = currentHunkLines;

      // If this is a unified diff hunk, strip +/- prefixes properly:
      // - Lines starting with '+' (not '+++') → new content (strip '+')
      // - Lines starting with '-' (not '---') → removed content (skip)
      // - Lines starting with ' ' → context (strip leading space)
      // - Other lines → keep as-is (content)
      if (isUnifiedDiffHunk) {
        finalLines = [];
        for (const l of currentHunkLines) {
          if (/^-[^-]/.test(l) || (l === '-')) {
            // Removed line — skip
            continue;
          } else if (/^\+[^+]/.test(l) || (l === '+')) {
            // Added line — strip the '+' prefix
            finalLines.push(l.slice(1));
          } else if (l.startsWith('---') || l.startsWith('+++')) {
            // Diff file headers — skip
            continue;
          } else if (l.startsWith(' ')) {
            // Context line — strip leading space
            finalLines.push(l.slice(1));
          } else {
            // No prefix — keep as-is
            finalLines.push(l);
          }
        }
        // Successfully parsed unified diff — NOT an artifact
      } else {
        // Non-unified hunk: detect diff-style +/- prefixed lines
        const isJsonFile = currentPath?.endsWith('.json');
        if (!isJsonFile) {
          const diffLineCount = finalLines.filter(l => /^[+-]/.test(l) && !/^[+-]{3}\s/.test(l)).length;
          if (diffLineCount > 0 && diffLineCount >= finalLines.length * 0.3) {
            hasDiffMarkers = true;
          }
        }
      }

      currentHunks.push({ startLine: currentHunkStart, endLine: currentHunkEnd, newLines: [...finalLines] });
    }
    currentHunkLines = [];
    inHunk = false;
    isUnifiedDiffHunk = false;
  };

  const flushEdit = () => {
    flushHunk();
    if (currentPath && currentHunks.length > 0) {
      edits.push({ path: currentPath, hunks: [...currentHunks], hasDiffArtifacts: hasDiffMarkers });
    }
    currentHunks = [];
    hasDiffMarkers = false;
  };

  for (const line of lines) {
    const editMatch = line.match(EDIT_DELIMITER);
    if (editMatch) {
      flushEdit();
      currentPath = editMatch[1].trim();
      continue;
    }

    // If we're inside an ===EDIT: block
    if (currentPath) {
      // Check for block delimiters — means this edit block is done
      if (FILE_DELIMITER.test(line) || DELETE_DELIMITER.test(line) || OUTPUT_END_DELIMITER.test(line)) {
        flushEdit();
        currentPath = null;
        if (OUTPUT_END_DELIMITER.test(line)) break;
        continue;
      }

      // Try custom format first: @@ startLine-endLine @@
      const hunkMatch = line.match(HUNK_HEADER);
      if (hunkMatch) {
        flushHunk();
        currentHunkStart = parseInt(hunkMatch[1]);
        currentHunkEnd = parseInt(hunkMatch[2]);
        inHunk = true;
        isUnifiedDiffHunk = false;
        continue;
      }

      // Try AI model format: @@oldStart,oldCount +newStart,newCount @@
      const aiMatch = line.match(AI_HUNK_HEADER);
      if (aiMatch) {
        flushHunk();
        currentHunkStart = parseInt(aiMatch[1]);
        const oldCount = parseInt(aiMatch[2] || '1');
        currentHunkEnd = currentHunkStart + oldCount - 1;
        inHunk = true;
        isUnifiedDiffHunk = true; // AI format uses +/- prefixed lines
        continue;
      }

      // Try unified diff format: @@ -oldStart,oldCount +newStart,newCount @@
      const unifiedMatch = line.match(UNIFIED_HUNK_HEADER);
      if (unifiedMatch) {
        flushHunk();
        currentHunkStart = parseInt(unifiedMatch[1]);
        const oldCount = parseInt(unifiedMatch[2] || '1');
        currentHunkEnd = currentHunkStart + oldCount - 1;
        inHunk = true;
        isUnifiedDiffHunk = true; // Unified diffs use +/- prefixed lines
        continue;
      }

      if (inHunk) {
        // Stop hunk on blank line followed by conversational prose
        if (!line.trim() && currentHunkLines.length > 0) {
          currentHunkLines.push(line);
        } else if (isConversationalLine(line)) {
          flushEdit();
          currentPath = null;
        } else {
          currentHunkLines.push(line);
        }
      }
    }
  }
  flushEdit();
  return edits;
}

/** Parse the ===FILE: path===, ===EDIT: path===, ===DELETE: path===, ===MODE: react===, ===MIGRATION:, and ===EDGE_FUNCTION: blocks */
export function parseMultiFileOutput(raw: string): { files: ProjectFile[]; deletions: string[]; edits: EditBlock[]; isReactMode: boolean; migrations: import('@/components/ai-builder/MigrationApprovalCard').MigrationBlock[]; edgeFunctions: import('@/components/ai-builder/EdgeFunctionCard').EdgeFunctionBlock[]; ignored: string[] } {
  // Phase 3: Normalize line endings (Windows \r\n → \n)
  const normalizedRaw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Parse migration blocks first, then strip them before file parsing
  const migrations = parseMigrationBlocks(normalizedRaw);
  const rawAfterMigrations = migrations.length > 0 ? stripMigrationBlocks(normalizedRaw) : normalizedRaw;

  // Parse edge function blocks, then strip them
  const edgeFunctions = parseEdgeFunctionBlocks(rawAfterMigrations);
  const rawAfterEdgeFns = edgeFunctions.length > 0 ? stripEdgeFunctionBlocks(rawAfterMigrations) : rawAfterMigrations;

  // Detect and strip ===MODE: react=== directive
  const isReactMode = /^\s*===MODE:\s*react===\s*$/m.test(rawAfterEdgeFns);
  const cleanedRaw = rawAfterEdgeFns.replace(/^\s*===MODE:\s*\w+===\s*$/gm, '');
  const edits = parseEditBlocks(cleanedRaw);

  const lines = cleanedRaw.split('\n');
  const files: ProjectFile[] = [];
  const deletions: string[] = [];
  const ignored: string[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let inEditBlock = false;
  let sawEnd = false;

  const END_RE = OUTPUT_END_DELIMITER;

  // Phase 24: Normalize file paths — strip leading ./ and /, collapse //, handle Unicode
  const normalizePath = (p: string): string => p
    .replace(/\\/g, '/') // Windows backslashes
    .replace(/^(\.\.\/)+/g, '') // Parent traversals
    .replace(/^\.\//, '') // Leading ./
    .replace(/^\//, '') // Leading /
    .replace(/\/\//g, '/') // Double slashes
    .replace(/[\x00-\x1f]/g, '') // Control characters
    .trim();

  /** Only strip if a single outer fence wraps the entire file content */
  const stripOuterMarkdownFenceOnly = (content: string): string => {
    const trimmed = content.trim();
    const fenceMatch = trimmed.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/);
    return fenceMatch ? fenceMatch[1].trimEnd() + '\n' : content;
  };

  const flushCurrent = (isIncomplete: boolean) => {
    if (!currentPath) return;
    currentPath = normalizePath(currentPath);
    let content = stripOuterMarkdownFenceOnly(currentLines.join('\n')).trim();
    if (content) {
      const ext = currentPath.split('.').pop()?.toLowerCase() || '';
      const langMap: Record<string, string> = {
        html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less', sass: 'scss',
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        json: 'json', md: 'markdown', mdx: 'markdown', svg: 'xml',
      };
      const file: ProjectFile = { path: currentPath, content, language: langMap[ext] || 'plaintext' };
      if (isIncomplete) file.incomplete = true;
      files.push(file);
    }
    currentPath = null;
    currentLines = [];
  };

  // ── Strict state-machine parser ──
  for (const line of lines) {
    // ===END=== → flush current file (NOT incomplete), stop parsing
    if (END_RE.test(line)) {
      sawEnd = true;
      flushCurrent(false);
      break;
    }

    // ===EDIT: blocks — handled separately by parseEditBlocks
    const editMatch = line.match(EDIT_DELIMITER);
    if (editMatch) {
      flushCurrent(false);
      inEditBlock = true;
      continue;
    }

    // ===DELETE: blocks
    const deleteMatch = line.match(DELETE_DELIMITER);
    if (deleteMatch) {
      flushCurrent(false);
      inEditBlock = false;
      deletions.push(deleteMatch[1].trim());
      continue;
    }

    // ===FILE: path=== — flush previous (NOT incomplete, closed by delimiter), start new
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flushCurrent(false);
      currentPath = match[1].trim();
      currentLines = [];
      inEditBlock = false;
      continue;
    }

    // Inside edit block — skip (already parsed)
    if (inEditBlock) continue;

    // Inside file block — append
    if (currentPath !== null) {
      currentLines.push(line);
      continue;
    }

    // Outside any block — collect as ignored
    if (line.trim()) {
      ignored.push(line);
    }
  }

  // If stream ended while a file was open and no ===END=== was seen, mark incomplete
  if (currentPath !== null) {
    flushCurrent(!sawEnd);
  }

  // Phase 24: Normalize deletion paths
  const normalizedDeletions = deletions.map(normalizePath);

  // HTML fallback for backward compat
  if (files.length === 0 && normalizedDeletions.length === 0 && edits.length === 0) {
    const trimmed = raw.trim();
    const htmlMatch = trimmed.match(/```html\n?([\s\S]*?)```/);
    const html = htmlMatch ? htmlMatch[1] : trimmed;
    if (html.includes('<') && html.includes('>')) {
      files.push({ path: 'index.html', content: html, language: 'html' });
    }
  }

  return { files, deletions: normalizedDeletions, edits, isReactMode, migrations, edgeFunctions, ignored };
}

/** Generate contextual follow-up suggestions based on the response and conversation state */
export function generateSuggestions(content: string, mode: BuilderMode, messages: BuilderMessage[] = [], currentFiles: ProjectFile[] = []): string[] {
  if (mode === 'discuss') {
    const suggestions: string[] = [];
    const lowerContent = content.toLowerCase();
    const planSignals = ['here\'s what i\'d recommend', 'here\'s the plan', 'i\'d suggest', 'let me outline', 'for v1', 'here are the steps', 'the architecture', 'ready to'];
    const hasPlan = planSignals.some(signal => lowerContent.includes(signal));
    
    if (hasPlan) {
      suggestions.push('🚀 Ready to build this →');
      suggestions.push('Can we refine the design?');
      suggestions.push('What about edge cases?');
    } else {
      // Analyze conversation to give smarter suggestions
      const analysis = analyzeConversationComplexity(messages.map(m => ({ role: m.role, content: m.content })));
      if (analysis.shouldSuggestBuild) {
        suggestions.push('🚀 Let\'s start building!');
      }
      suggestions.push('Tell me more about this');
      suggestions.push('What are the alternatives?');
    }
    return suggestions.slice(0, 3);
  }
  
  // Build mode — context-aware suggestions
  const suggestions: string[] = [];
  if (content.includes('===FILE:')) {
    // Use proactive suggestions based on what's been built
    const fileNames = currentFiles.map(f => f.path);
    const intentsUsed = detectSupabaseIntents(content).map(i => i.type);
    const hasAuth = content.toLowerCase().includes('auth') || fileNames.some(f => f.includes('auth'));
    const hasDb = content.toLowerCase().includes('supabase') || content.includes('CREATE TABLE');
    
    const proactive = generateProactiveSuggestions(fileNames, intentsUsed, hasAuth, hasDb);
    if (proactive.length > 0) {
      suggestions.push(...proactive);
    } else {
      suggestions.push('Make it darker & more premium');
      suggestions.push('Add smooth animations');
      suggestions.push('Make it fully responsive');
    }
  }
  return suggestions.slice(0, 4);
}

/** Auto-detect whether a message is a build or discuss intent */
function detectIntent(input: string): BuilderMode | null {
  const lower = input.toLowerCase().trim();
  const buildSignals = [
    /^(build|create|make|generate|code|implement|add|design)\b/,
    /landing page/i, /dashboard/i, /website/i, /web app/i, /clone/i,
    /with (dark|light) (theme|mode)/i, /responsive/i,
  ];
  const discussSignals = [
    /^(what|how|why|should|can|could|would|is it|do you|compare|explain|tell me|help me think|let'?s talk|let'?s discuss)/,
    /\?$/, /pros and cons/i, /tradeoffs?/i, /best (practice|approach|way)/i,
    /what do you think/i, /advice/i, /opinion/i,
  ];
  const buildScore = buildSignals.filter(r => r.test(lower)).length;
  const discussScore = discussSignals.filter(r => r.test(lower)).length;
  if (buildScore > 0 && discussScore === 0) return 'build';
  if (discussScore > 0 && buildScore === 0) return 'discuss';
  return null;
}

/** Phase 9: Token estimate that accounts for images (~1K tokens each) */
function estimateTokens(text: string, imageCount = 0): number {
  return Math.ceil(text.length / 4) + (imageCount * 1000);
}

export function useAIAppBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestFiles, setLatestFiles] = useState<ProjectFile[]>([]);
  // Ref-based streaming: content stored in ref to avoid workspace re-renders
  const streamingContentRef = useRef<string>('');
  
  const [previousFiles, setPreviousFiles] = useState<ProjectFile[]>([]);
  const [mode, setMode] = useState<BuilderMode>('build');
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase>(null);
  const thinkingPhaseSetRef = useRef(false); // Gate: only fire setThinkingPhase('writing') once per stream
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<ProjectFile[] | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [contextBudget, setContextBudget] = useState<ContextBudgetInfo | null>(null);
  const [continuationRound, setContinuationRound] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);
  const continuationCountRef = useRef(0);
  const accumulatedFilesRef = useRef<string[]>([]);
  const fallbackRetryRef = useRef(false);
  const streaming = useStreamingPreview();
  const { deductCredits, totalRemaining } = useUserCredits();
  const { trimForContext } = useContextBudget({ maxChars: 120_000 });
  const schemaFromNL = useSchemaFromNL();
  const aiConfidence = useAIConfidence();
  // Wave 18 hooks
  const { buildReuseContext } = useComponentReuseDetection();
  const { getRelatedFiles } = useImportGraphContext();
  const runtimeErrorFix = useRuntimeErrorFix();
  const incrementalApply = useIncrementalApply();
  const changelog = usePostGenerationChangelog();

  // Issue 27 fix: Use a ref to read messages inside sendMessage without including it in deps
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  isGeneratingRef.current = isGenerating;

  const sendMessage = useCallback(async (
    input: string,
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    imageDataUrls?: string[] | null,
    model?: string,
    knowledgeContext?: string,
    /** When true, skip credit deduction (used for auto-fix / self-correction) */
    isAutoFix?: boolean,
  ) => {
    if (!input.trim()) return;
    if (isGeneratingRef.current && !isAutoFix) {
      console.info('[AI Builder] sendMessage blocked — generation already active');
      return;
    }

    // Phase 52: Cap messages at 200 entries to prevent sluggish re-renders
    const currentMessages = messagesRef.current;
    if (currentMessages.length > 200) {
      const compressed = [...currentMessages.slice(0, 5), ...currentMessages.slice(-50)];
      setMessages(compressed);
    }

    // Reset continuation state for new user-initiated messages (not auto-continuations)
    if (!input.startsWith('[CONTINUE]')) {
      continuationCountRef.current = 0;
      accumulatedFilesRef.current = [];
      setContinuationRound(0);
    }
    // Fix: Hard 3-minute cap across ALL continuation rounds combined
    const totalBuildStart = Date.now();
    const TOTAL_BUILD_MAX_MS = 180_000; // 3 minutes
    // ── Phase 8: Request deduplication (exempt retries/auto-fix) ──
    const fingerprint = hashString(input + (imageDataUrls?.join('') || ''));
    const now = Date.now();
    const skipDedup = isAutoFix || input.startsWith('[CONTINUE]');
    if (!skipDedup && fingerprint === lastRequestFingerprint && now - lastRequestTime < 3000) {
      console.warn('[Dedup] Duplicate request blocked');
      return;
    }
    lastRequestFingerprint = fingerprint;
    lastRequestTime = now;

    // Detect fix/retry requests — these should be free to avoid burning credits on repeated fixes
    const isFixRequest = isAutoFix || /\b(fix|broken|doesn'?t work|not working|still broken|won'?t|can'?t|bug|error|issue|remove.*(button|doesn|broken|work)|delete.*(button|doesn|broken|work))\b/i.test(input);

    // Check credits before sending — AUTO-FIX and fix requests are free
    const creditCost = mode === 'build' ? 3 : 1;
    if (!isFixRequest && totalRemaining < creditCost) {
      const errMsg = `Insufficient credits. You need ${creditCost} but have ${totalRemaining}. Purchase more to continue.`;
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    // Phase 16: Only auto-detect intent on first message; respect user's explicit choice after that
    const isFirstMessage = messagesRef.current.length === 0;
    const detectedMode = isFirstMessage ? detectIntent(input) : null;
    if (detectedMode && detectedMode !== mode) {
      setMode(detectedMode);
    }
    const effectiveMode = detectedMode || mode;

    // Phase 47: In discuss mode, block code output by passing mode to parser
    // (handled in finalizeStream where parseMultiFileOutput is called)

    // ── Discuss mode shortcut: skip all heavy context computation ──
    // When in discuss mode, we don't need file context, version snapshots, or
    // import graph analysis. This prevents main-thread freezing from 100+ hooks.
    if (effectiveMode === 'discuss') {
      // Minimal path: just send the message with conversation history, no file context
      const userMsg: BuilderMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        mode: 'discuss',
      };
      setMessages(prev => [...prev, userMsg]);
      setIsGenerating(true);
      setThinkingPhase('analyzing');

      const chatMessages: { role: string; content: string }[] = [];
      if (knowledgeContext) {
        chatMessages.push({ role: 'system', content: knowledgeContext });
      }
      const recentHistory = messagesRef.current.slice(-20).map(m => ({
        role: m.role,
        content: m.role === 'assistant' ? m.content.slice(0, 500) : m.content.slice(0, 2000),
      }));
      chatMessages.push(...recentHistory);
      chatMessages.push({ role: 'user', content: input });

      try {
        const { data, error } = await supabase.functions.invoke('vanguard-general-chat', {
          body: { messages: chatMessages, stream: false },
        });
        if (error) throw error;
        const responseContent = data?.response || 'I couldn\'t generate a response.';
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: responseContent,
          timestamp: new Date(),
          mode: 'discuss',
        }]);
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: `⚠️ ${err.message || 'Chat error'}`,
          timestamp: new Date(),
          mode: 'discuss',
        }]);
      } finally {
        setIsGenerating(false);
        setThinkingPhase(null);
      }
      return;
    }

    // Save previous files for diff view
    if (currentFiles.length > 0) {
      setPreviousFiles([...currentFiles]);
    }
    if (currentFiles.length > 0) {
      setVersions(prev => [...prev, {
        id: crypto.randomUUID(),
        label: `Before: ${input.slice(0, 40)}...`,
        files: [...currentFiles],
        timestamp: new Date(),
        messageId: '',
      }]);
    }

    const userMsg: BuilderMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      imageUrl: imageDataUrls?.[0] || undefined,
      imageUrls: imageDataUrls?.length ? imageDataUrls : undefined,
      workflowSteps: detectWorkflowIntent(input)?.steps,
      mode: effectiveMode,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Thinking phases — stream-driven, no artificial delays
    setThinkingPhase('analyzing');
    thinkingPhaseSetRef.current = false; // Reset gate for new stream

    // Build conversation context — smart windowing: only last N messages
    const MAX_CONTEXT_MESSAGES = 20;
    const apiMessages: { role: string; content: string | any[] }[] = [];

    // Phase 76: Consolidate all system injections into a SINGLE message to reduce prompt bloat
    const systemParts: string[] = [];

    if (knowledgeContext) systemParts.push(knowledgeContext);

    const detectedIntents = detectSupabaseIntents(input);
    const hasSupabase = !!supabaseConfig;
    const supabaseContextStr = buildSupabaseContext(detectedIntents, hasSupabase);
    if (supabaseContextStr) systemParts.push(supabaseContextStr);

    const memoryContext = buildConversationMemory(
      messagesRef.current.map(m => ({ role: m.role, content: m.content }))
    );
    if (memoryContext) systemParts.push(memoryContext);

    const userTexts = messagesRef.current.filter(m => m.role === 'user').map(m => m.content);
    const { prompt: tonePrompt } = detectCommunicationStyle(userTexts);
    if (tonePrompt) systemParts.push(tonePrompt);

    const prefs = extractUserPreferences(messagesRef.current.map(m => ({ role: m.role, content: m.content })));
    const prefsContext = buildPreferencesContext(prefs);
    if (prefsContext) systemParts.push(prefsContext);

    const workflow = detectWorkflowIntent(input);
    if (workflow) {
      systemParts.push(`[WORKFLOW DETECTED] The user has a multi-step request with ${workflow.steps.length} steps:\n${workflow.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nExecute ALL steps in sequence in a single response. Show progress for each step.`);
    }

    const visualContext = buildVisualIntelligenceContext(!!(imageDataUrls?.length), input);
    if (visualContext) systemParts.push(visualContext);

    // ── Image generation intent detection ──
    // Instead of calling an edge function (risks freezing), instruct the AI to make a targeted edit.
    const imageGenIntent = (imageDataUrls?.length || isAutoFix) ? null : detectImageGenerationIntent(input);
    if (imageGenIntent) {
      systemParts.push(
        `[IMAGE REQUEST — TARGETED EDIT ONLY]\nThe user wants a new ${imageGenIntent.prompt}.\n` +
        `Create a beautiful SVG-based logo/icon using lucide-react icons + styled text, or clean inline SVG paths with gradients.\n` +
        `CRITICAL: This is a SMALL, SURGICAL edit. ONLY change the logo/icon component or the section where it appears.\n` +
        `Do NOT regenerate, restructure, or replace the entire site. Do NOT touch other pages, layouts, hero sections, or unrelated components.\n` +
        `Use ===EDIT: path=== format to replace ONLY the logo portion of the relevant file(s).\n` +
        `Do NOT embed base64 data URLs — they freeze the browser.`
      );
      toast.info('AI will create a vector logo for you.', { duration: 3000 });
    }

    // Use user-attached images only (no generation)
    let effectiveImageDataUrls = imageDataUrls;

    // ── Reference image detection ──
    // Detect when the user is uploading a screenshot/mockup as visual reference
    // (e.g., "fix this", "make it look like this") vs an asset to embed (e.g., "use this as logo").
    const isReferenceImage = effectiveImageDataUrls?.length
      ? /\b(fix|improve|change|update|adjust|tweak|redesign|restyle|looks?\s*(like|bad|wrong|off|broken|ugly|weird))\b/i.test(input)
        || /\b(screenshot|mockup|wireframe|reference|example|inspiration|design|layout|this\s+page|the\s+page|current|preview)\b/i.test(input)
        || /\b(make\s+it\s+look|should\s+look|want\s+it\s+to|style\s+it|match\s+this)\b/i.test(input)
        || /\b(what['']?s\s+wrong|why\s+does|can\s+you\s+see)\b/i.test(input)
      : false;

    if (isReferenceImage && effectiveImageDataUrls?.length) {
      systemParts.push(
        `[IMAGE CONTEXT — VISUAL REFERENCE ONLY]\n` +
        `The user has uploaded ${effectiveImageDataUrls.length} screenshot(s) or mockup(s) as VISUAL REFERENCE.\n` +
        `These images show the current state of the app or a design the user wants to match.\n` +
        `Do NOT embed these images in the code. Do NOT treat them as logos or assets.\n` +
        `Instead, ANALYZE the image(s) to understand:\n` +
        `- Layout issues, styling problems, or visual bugs the user wants fixed\n` +
        `- Design patterns, color schemes, or UI elements to replicate\n` +
        `- The current state of the app that needs improvement\n` +
        `Then make the appropriate code changes based on what you see.`
      );
    }

    // Compress uploaded images before sending to AI — shrink below embed cap
    if (effectiveImageDataUrls?.length) {
      try {
        const { optimizeImage: optimizeImg } = await import('@/utils/imageOptimization');
        const MAX_IMAGE_SIZE = 200_000; // 200KB cap to prevent browser freeze
        const compressed = await Promise.all(
          effectiveImageDataUrls.map(url => optimizeImg(url, { maxWidth: 300, quality: 0.6, tryWebP: true }))
        );
        effectiveImageDataUrls = compressed
          .map(r => r.dataUrl)
          .filter(url => url.length < MAX_IMAGE_SIZE); // drop oversized images
      } catch (compErr) {
        console.warn('Image compression failed, using originals:', compErr);
      }
    }

    // Phase 86: Inject schema context if Supabase is connected and types.ts exists
    if (supabaseConfig && currentFiles.some(f => f.path === 'types.ts' || f.path === 'src/types.ts')) {
      const typesFile = currentFiles.find(f => f.path.endsWith('types.ts'));
      if (typesFile && typesFile.content.length > 50) {
        systemParts.push(`[DATABASE SCHEMA]\nThe following TypeScript types represent the connected Supabase database schema:\n${typesFile.content.slice(0, 5000)}\n\nUse these EXACT table and column names in all queries.`);
      }
    }

    // ── Anti-pattern injection: inject learned error patterns into system prompt ──
    // (Consumer must call getAntiPatternPrompt() from useErrorPatternLearning and pass as knowledgeContext)

    // ── Wave 14: Inject user rules from correction learning ──
    try {
      const memRaw = localStorage.getItem('agent-project-memory');
      if (memRaw) {
        const mem = JSON.parse(memRaw);
        if (mem.userRules?.length > 0) {
          const rules = mem.userRules.map((r: any, i: number) => `${i + 1}. ${r.rule}`).join('\n');
          systemParts.push(`[USER RULES — HARD CONSTRAINTS from previous corrections. ALWAYS obey these.]\n${rules}\n[/USER RULES]`);
        }
      }
    } catch { /* ignore */ }

    // ── Wave 15: Inject dependency map for import-aware generation ──
    if (currentFiles.length > 1 && currentFiles.length <= 50) {
      try {
        const depImports: string[] = [];
        const allPaths = currentFiles.map(f => f.path);
        for (const f of currentFiles) {
          if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;
          const depRegex = /import\s+(?:(?:\{[^}]+\})|(?:\w+)|(?:\*\s+as\s+\w+))\s+from\s+['"]([^'"]+)['"]/g;
          const resolved: string[] = [];
          let dm;
          while ((dm = depRegex.exec(f.content)) !== null) {
            const imp = dm[1];
            if (!imp.startsWith('.') && !imp.startsWith('@/')) continue;
            let res = imp;
            if (res.startsWith('@/')) res = 'src/' + res.slice(2);
            else {
              const dir = f.path.substring(0, f.path.lastIndexOf('/'));
              res = dir + '/' + res.replace(/^\.\//, '');
            }
            const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
            const found = exts.map(e => res + e).find(c => allPaths.includes(c));
            if (found) resolved.push(found);
          }
          if (resolved.length > 0) depImports.push(`${f.path} → ${resolved.join(', ')}`);
        }
        if (depImports.length > 0) {
          systemParts.push(`[DEPENDENCY MAP]\n${depImports.join('\n')}\n[/DEPENDENCY MAP]`);
        }
      } catch { /* ignore */ }
    }

    // ── Wave 16: NL→Schema directive injection ──
    if (schemaFromNL.detectSchemaIntent(input) && supabaseConfig) {
      systemParts.push(schemaFromNL.buildSchemaDirective(input));
    }

    // ── Wave 16: Edge function scaffold directive ──
    const edgeFnIntent = detectEdgeFunctionIntent(input);
    if (edgeFnIntent) {
      systemParts.push(buildEdgeFunctionDirective(edgeFnIntent));
    }

    // ── Wave 16: Auth flow detection ──
    const authTemplate = parseAuthCommand(input);
    if (authTemplate) {
      systemParts.push(`[AUTH SCAFFOLD DIRECTIVE]\nThe user requested auth scaffolding (template: ${authTemplate}). Generate complete auth files:\n- AuthProvider.tsx with useAuth hook\n- ProtectedRoute.tsx\n- LoginPage.tsx with ${authTemplate === 'magic-link' ? 'magic link' : authTemplate === 'oauth' ? 'OAuth' : 'email/password'} authentication\n- SignupPage.tsx\nUse Supabase Auth. Include proper loading states and error handling. Use semantic design tokens from the project's CSS.`);
    }

    // ── Wave 17: Chain-of-thought reasoning for complex requests ──
    const reasoningDirective = buildReasoningDirective(input, currentFiles);
    if (reasoningDirective) {
      systemParts.push(reasoningDirective);
    }

    // ── Wave 18: Component reuse & design token injection ──
    if (currentFiles.length > 0) {
      const reuseCtx = buildReuseContext(currentFiles);
      if (reuseCtx) systemParts.push(reuseCtx);
    }

    // ── Wave 18: Import graph-aware dependency warnings ──
    if (currentFiles.length > 1) {
      const focusFiles = detectFocusFiles(input, currentFiles);
      if (focusFiles.length > 0) {
        const { graphSummary } = getRelatedFiles(focusFiles, currentFiles);
        if (graphSummary) systemParts.push(graphSummary);
      }
    }

    // ── Scope constraint for iterative edits with focus-file detection ──
    const isIterativeEdit = currentFiles.length > 0;
    if (isIterativeEdit) {
      // Detect which files the user's request likely targets
      const focusFiles = detectFocusFiles(input, currentFiles);
      const focusDirective = focusFiles.length > 0
        ? `\n[FOCUS FILES — only modify these unless absolutely necessary]\n${focusFiles.map(f => `  ✏️  ${f}`).join('\n')}\n[DO NOT TOUCH — preserve exactly as-is]\n${currentFiles.filter(f => !focusFiles.includes(f.path)).map(f => `  🔒 ${f.path}`).slice(0, 15).join('\n')}${currentFiles.length - focusFiles.length > 15 ? `\n  ... and ${currentFiles.length - focusFiles.length - 15} more locked files` : ''}`
        : '';

      systemParts.push(`[CHANGE SCOPE — CRITICAL]
You are editing an EXISTING project. ONLY make the changes the user explicitly asked for.
- Do NOT add, remove, or restyle sections, backgrounds, images, or layout elements that the user did NOT mention.
- Do NOT "improve" or "enhance" parts of the site beyond the user's request.
- If the user says "redesign the logo", ONLY change the logo — do NOT touch hero backgrounds, color schemes, or other unrelated elements.
- Preserve all existing code, styles, and structure that are not directly related to the request.
- When in doubt, change LESS rather than MORE.
- NEVER change backgrounds, gradients, or color schemes unless explicitly asked.
- NEVER add new sections, images, or animations unless explicitly asked.${focusDirective}`);
    }

    // ── Step 7: Smarter EDIT vs FILE selection ──
    systemParts.push(`[EDIT vs FILE SELECTION — MANDATORY]
- For changes affecting LESS THAN 20% of a file, use ===EDIT: path=== with unified diff hunks instead of ===FILE: path=== full rewrites.
- EDIT hunks are faster, reduce token usage, and are less error-prone for small changes.
- Use ===FILE: path=== ONLY when creating new files OR rewriting more than 20% of an existing file.
- Example EDIT format:
  ===EDIT: src/App.tsx===
  @@ -10,3 +10,5 @@
   import { Button } from './Button';
  +import { Dialog } from './Dialog';
   
  ===END===`);

    // ── Safe Output Contract ──
    systemParts.push(`[SAFE OUTPUT CONTRACT — MANDATORY]
- NEVER generate inline <svg> markup in JSX/TSX files. Use lucide-react icons instead: import { IconName } from 'lucide-react';
- NEVER create custom SVG icon components with React.SVGProps or SVGProps type annotations. Always use lucide-react.
- If the user asks for icons, use lucide-react by default. Browse https://lucide.dev/icons for available icons.
- NEVER output extremely long single-line JSX. Format JSX with line breaks.
- Always wrap JSX returns in parentheses: return ( <div>...</div> );
- Ensure all JSX tags are properly closed and self-closing where required (<img />, <br />, <input />).
- Do not introduce new npm dependencies unless the user explicitly asks for them.
- All imports must precede variable declarations — no import statements after code.
- TypeScript generics with angle brackets (e.g. useState<Item[]>) must NOT contain JSX-like syntax that esbuild could misparse.
- FILE SIZE LIMIT: Keep EVERY file under 300 lines. Split large components into multiple files (extract data, sub-components, hooks). This prevents output truncation.

[IMPORT COMPLETENESS — ZERO-TOLERANCE]
- EVERY file you output MUST include ALL of its imports. This is the #1 cause of build failures.
- If a file uses useState, useEffect, useCallback, useMemo, useRef — it MUST import them from 'react'.
- If a file uses Link, Route, Routes, BrowserRouter, useNavigate — it MUST import them from 'react-router-dom'.
- If a file uses lucide-react icons — it MUST import EVERY icon used: import { Icon1, Icon2 } from 'lucide-react';
- If a file uses motion — it MUST import: import { motion } from 'framer-motion';
- NEVER assume imports exist from a previous version. Each ===FILE: block must be 100% self-contained.
- When using ===EDIT: blocks, NEVER remove import lines unless you are also removing all usage of those imports.
- Before outputting code, mentally scan: "Does every identifier I use have a corresponding import at the top?"

[REQUIRED PROJECT STRUCTURE — FIRST-ATTEMPT SUCCESS]
- ALWAYS generate a src/main.tsx entry point that imports React, ReactDOM, the root App component, AND src/index.css.
- The src/main.tsx MUST follow this exact pattern:
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App';
  import './index.css';
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
- ALWAYS generate src/index.css with Tailwind directives (@tailwind base; @tailwind components; @tailwind utilities;) plus any custom styles.
- ALWAYS generate src/App.tsx as the root component with a default export.
- Every component file MUST have exactly ONE default export OR named exports — never forget the export.
- Arrow function callbacks: ALWAYS use => syntax. NEVER write "= />" — that is a syntax error.
- NEVER use \`class=\` in JSX — always use \`className=\`.
- NEVER use \`for=\` on labels — always use \`htmlFor=\`.
- Every component that uses useState, useEffect, etc. MUST import them: import { useState, useEffect } from 'react';
- Do NOT use optional chaining on function calls for event handlers (e.g. onClick?.()). Use standard patterns.
- All string literals and template literals MUST be properly closed on the same logical line.
- NEVER leave trailing commas, colons, or operators at the end of a file.
- LOGOS: Never render a company logo as plain unstyled text. Always create a styled logo using a lucide-react icon + styled text, or use the company's actual favicon URL. Example: <div className="flex items-center gap-2"><Building2 className="h-8 w-8" /><span className="text-xl font-bold">Brand</span></div>
- IMAGES: For placeholder/stock images, use Unsplash URLs (https://images.unsplash.com/photo-ID?w=800). Never leave empty or broken img src attributes. Always add loading="lazy" to images below the fold.

[VISUAL QUALITY & POLISH — MANDATORY]
- HERO SECTIONS: Always include a visually compelling hero with a relevant Unsplash background image or gradient. Never leave hero sections as plain colored backgrounds.
- STOCK PHOTOS: Use real Unsplash photo URLs for team photos, service images, and backgrounds. Pick relevant photos by using descriptive Unsplash URLs. Examples:
  - Accounting/finance: https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800
  - Technology: https://images.unsplash.com/photo-1518770660439-4636190af475?w=800
  - Healthcare: https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800
  - Restaurant/food: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800
  - Real estate: https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800
- ANIMATIONS: Add subtle entrance animations to sections. Use CSS transitions for hover effects on buttons and cards. Add transition-all duration-300 to interactive elements.
- FOOTER: ALWAYS generate a proper footer with company info, navigation links, and copyright. Never omit the footer.
- DARK MODE: Include a light/dark color scheme in your CSS variables. Use Tailwind's dark: variants for key elements.

[RESPONSIVE DESIGN — MANDATORY]
- All layouts MUST be mobile-first. Use Tailwind responsive prefixes (sm:, md:, lg:) to scale UP.
- Navigation must collapse to a hamburger menu on mobile (below md: breakpoint).
- Hero text should scale: text-3xl on mobile → text-5xl md: → text-6xl lg:.
- Grid layouts: grid-cols-1 on mobile → grid-cols-2 md: → grid-cols-3 lg:.
- Ensure minimum 44px touch targets for all buttons and links on mobile.
- Test: the site must look good at 375px viewport width.

[SEO & META — MANDATORY]
- In index.html, ALWAYS include: <title>, <meta name="description">, <meta name="viewport">, and Open Graph tags (og:title, og:description, og:type).
- Use semantic HTML: one <h1> per page, proper heading hierarchy, <nav>, <main>, <footer>, <section>.
- Add alt text to ALL images.

[MULTI-PAGE ROUTING]
- When the site has multiple distinct pages (e.g., About, Services, Contact), use react-router-dom with BrowserRouter, Routes, and Route components.
- Wrap pages in React.lazy() and Suspense for code splitting.
- Navigation links should use <Link to="/path"> not <a href="/path">.

[LOADING & ERROR STATES]
- For any component that fetches data, include a loading skeleton and an error state.
- Buttons should show loading spinners during async operations.

[COLOR & FONT EXTRACTION — SITE CLONES]
- When cloning a website, analyze the scraped content to infer the brand's color palette.
- Generate CSS custom properties in index.css for the brand colors: --primary, --secondary, --accent, --background, --foreground.
- Use Google Fonts for typography. Import fonts via @import url('https://fonts.googleapis.com/css2?family=FontName:wght@400;600;700&display=swap') in index.css.
- Choose fonts that match the industry: law/finance → serif (e.g., Playfair Display + Inter), tech → geometric sans (e.g., Space Grotesk + Inter), creative → display fonts (e.g., Outfit + DM Sans).
- Apply the extracted/inferred color palette consistently across ALL components — do not use default Tailwind blue.

[CONTACT FORMS — MANDATORY FOR BUSINESS SITES]
- When generating a business website, ALWAYS include a functional contact form with: name, email, phone (optional), and message fields.
- Use proper form validation: required fields, email format validation, phone format hints.
- On submit, show a success toast/message: "Thank you! We'll be in touch within 24 hours."
- Style the form with proper spacing, labels, and a prominent submit button.
- Include the contact form in a dedicated section or Contact page with the business address/phone/email alongside it.
- Wrap the form in a try/catch with error state handling.

[ACCESSIBILITY — MANDATORY]
- Add a "Skip to main content" link as the first focusable element: <a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>
- Use <main id="main-content"> for the primary content area.
- All interactive elements must have visible focus indicators (focus:ring-2 focus:ring-primary).
- Use aria-label on icon-only buttons and navigation landmarks.
- Ensure color contrast ratio of at least 4.5:1 for text.
- Images must have descriptive alt text (not just "image" or "photo").
- Form inputs must have associated <label> elements.

[404 PAGE — MANDATORY]
- When using react-router-dom, ALWAYS include a catch-all route with a styled 404 page.
- The 404 page should include: a large "404" heading, a friendly message, and a "Go Home" button linking to /.
- Style it consistently with the rest of the site.

[SCROLL & NAVIGATION POLISH — MANDATORY]
- Add scroll-behavior: smooth to the html element in index.css.
- For single-page sites with anchor links (e.g., #about, #services), use smooth scrolling.
- When using react-router-dom, add a ScrollToTop component that scrolls to top on route changes:
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
- Highlight the active navigation link using the current route/hash.
- For sticky/fixed navbars, add a subtle shadow on scroll: use a scroll event listener to toggle a shadow class.`);

    // ── Conversational response directive ──
    systemParts.push(`[CONVERSATIONAL RESPONSE — MANDATORY]
You are a friendly, conversational AI assistant — not a silent code generator.
ALWAYS start your response with a brief, natural-language explanation BEFORE any ===FILE: or ===EDIT: blocks.
- Acknowledge what the user asked for.
- Briefly explain your approach and key design/technical decisions.
- If you made interesting choices (color palette, layout pattern, library usage), mention them conversationally.
- Keep the explanation concise (2-6 sentences) — don't write essays.
- Use markdown formatting (bold, bullet points) for readability.
- After your explanation, output the code blocks (===FILE: / ===EDIT:).
- After the code blocks and ===END===, optionally add 1-2 sentences about what to try next or ask if they want changes.

Example format:
"Great choice! I'm building a modern portfolio with a **dark theme** and smooth scroll animations. I'm using a serif/sans-serif font pairing for that premium editorial feel, and added a sticky nav that blurs on scroll.

===FILE: src/index.css===
...
===END===

The site is live in your preview! Want me to add a contact form or tweak the color scheme?"

NEVER output just raw code blocks with no explanation. Always be conversational.`);


    // Merge into a single system message, capped at 20K chars
    if (systemParts.length > 0) {
      const consolidated = systemParts.join('\n\n---\n\n').slice(0, 20_000);
      apiMessages.push({ role: 'system', content: consolidated });
    }

    // Detect web search intent and inject search guidance
    const searchIntent = detectWebSearchIntent(input);
    if (searchIntent.shouldSearch) {
      apiMessages.push({ role: 'system', content: `[WEB SEARCH INTENT] The user wants current information about: ${searchIntent.queries.join(', ')}. Use your training knowledge to provide the most up-to-date, accurate information. Reference official documentation where possible. Then generate code incorporating that knowledge.` });
    }

    // Detect URL clone intent and pre-scrape the website content
    const urlClone = detectURLCloneIntent(input);
    let scrapedContent: string | null = null;
    if (urlClone.hasURL && urlClone.url) {
      toast.info('Scraping website content...', { duration: 3000 });

      // --- Enhanced scrape: request branding + markdown + links for full brand extraction ---
      let brandingData: any = null;
      let siteLogoUrl: string | null = null;

      try {
        const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
          body: {
            url: urlClone.url,
            options: {
              formats: ['markdown', 'branding', 'links'],
              onlyMainContent: false, // get full page to capture footer/contact info
            },
          },
        });
        if (!error && data?.success !== false) {
          const md = data?.data?.markdown || data?.markdown || '';
          const title = data?.data?.metadata?.title || data?.metadata?.title || '';
          const description = data?.data?.metadata?.description || data?.metadata?.description || '';
          brandingData = data?.data?.branding || data?.branding || null;

          // Extract logo from branding response
          if (brandingData?.logo) {
            siteLogoUrl = brandingData.logo;
          } else if (brandingData?.images?.logo) {
            siteLogoUrl = brandingData.images.logo;
          }
          // Fallback: try favicon from branding or origin
          if (!siteLogoUrl) {
            if (brandingData?.images?.favicon) {
              siteLogoUrl = brandingData.images.favicon;
            } else {
              try {
                const origin = new URL(urlClone.url).origin;
                siteLogoUrl = `${origin}/favicon.ico`;
              } catch {}
            }
          }

          if (md) {
            // Build rich scraped context with branding info
            const brandSection = brandingData ? buildBrandingContext(brandingData) : '';
            scrapedContent = `[SCRAPED WEBSITE CONTENT from ${urlClone.url}]\nTitle: ${title}\nDescription: ${description}\n${brandSection}\n\nFull Page Content (use ALL addresses, phone numbers, emails, and details EXACTLY as shown):\n${md.slice(0, 15000)}`;
            toast.success('Website content & branding loaded!');
          }
        }
      } catch (scrapeErr) {
        console.warn('Pre-scrape failed:', scrapeErr);
        toast.warning('Could not scrape website — AI will use its best knowledge instead.');
      }

      if (scrapedContent) {
        apiMessages.push({ role: 'system', content: scrapedContent });
        apiMessages.push({ role: 'system', content: `[SCRAPE INSTRUCTIONS — CRITICAL ACCURACY RULES]
1. Use the SCRAPED WEBSITE CONTENT above as the SOLE source of truth for ALL factual data.
2. ADDRESSES: Copy every address EXACTLY as shown in the scraped content. Do NOT substitute, abbreviate, or guess addresses.
3. PHONE NUMBERS: Use phone numbers EXACTLY as scraped. Do NOT invent or change phone numbers.
4. EMAILS: Use email addresses EXACTLY as scraped.
5. COMPANY NAME: Use the exact company name, including any "CPAs", "LLC", "Inc" suffixes.
6. SERVICES: List only services mentioned in the scraped content.
7. TEAM/STAFF: Only include names and titles that appear in the scraped content.
8. If information is NOT in the scraped content, OMIT it entirely — do NOT hallucinate or fill in from general knowledge.` });
      } else {
        apiMessages.push({ role: 'system', content: `[URL CLONE] The user wants to clone/replicate the design from: ${urlClone.url}. Analyze the typical design patterns of this website and generate a faithful reproduction. Focus on layout structure, color scheme, typography, and component patterns.` });
      }

      // Logo & branding with extracted colors
      const brandColors = brandingData?.colors;
      apiMessages.push({ role: 'system', content: `[LOGO & BRANDING — MANDATORY]
When cloning a website, NEVER use plain unstyled text as the logo. Instead:
1. If the user uploaded a logo image, use that (see ASSET PRIORITY instructions).
2. If a logo URL was extracted from the site: ${siteLogoUrl ? `USE THIS LOGO: ${siteLogoUrl}` : 'No logo found — create a styled logo component.'}
3. If no logo is available, create a STYLED logo component with:
   - A visually distinct design using CSS (gradient text, icon + text combo, bordered/badged treatment, or a colored shape behind initials)
   - Use a lucide-react icon that matches the business type alongside the company name
4. For hero sections, use placeholder image URLs from https://images.unsplash.com with relevant search terms.
5. NEVER leave an <img> tag with an empty or broken src.

${brandColors ? `[BRAND COLORS — USE THESE EXACT COLORS]
Primary: ${brandColors.primary || 'not found'}
Secondary: ${brandColors.secondary || 'not found'}
Accent: ${brandColors.accent || 'not found'}
Background: ${brandColors.background || 'not found'}
Text Primary: ${brandColors.textPrimary || 'not found'}
Text Secondary: ${brandColors.textSecondary || 'not found'}

Apply these colors throughout the entire design:
- Primary color for buttons, CTAs, links, and key accents
- Secondary for supporting elements and hover states
- Background and text colors for the overall page theme
- Define CSS variables: --primary, --secondary, --accent using these exact hex values
DO NOT use generic blue/purple defaults. The scraped brand colors MUST be applied.` : 'No brand colors were extracted — analyze the site URL domain and industry to choose appropriate professional colors.'}

${brandingData?.fonts?.length ? `[BRAND FONTS]
${brandingData.fonts.map((f: any) => f.family || f).join(', ')}
Import these fonts from Google Fonts if available.` : ''}

${brandingData?.typography ? `[TYPOGRAPHY]
${JSON.stringify(brandingData.typography, null, 2)}` : ''}` });

      // If images are also attached, add explicit priority instructions WITH the actual data URLs
      if (effectiveImageDataUrls?.length) {
        const logoUrls = effectiveImageDataUrls.map((url, i) => `IMAGE_${i + 1}_DATA_URL: ${url}`).join('\n');
        apiMessages.push({ role: 'system', content: `[ASSET PRIORITY — CRITICAL]\nThe user has uploaded ${effectiveImageDataUrls.length} image(s) to use as the logo/branding.\n\nYou MUST embed the uploaded image in the navbar and footer.\nDo NOT use a text placeholder like "Glenn's Body Shop Logo".\nIMPORTANT: Store the data URL in a JS constant, do NOT put it directly in an HTML src attribute:\n  const LOGO_URL = "${effectiveImageDataUrls[0]}";\nThen reference it: <img src={LOGO_URL} alt="Logo" style="height:48px;" />\n\n${logoUrls}\n\nUse the SCRAPED CONTENT for the site's text and data. The uploaded image is ONLY for the logo.` });
      }
    }

    // ASSET PRIORITY for logo intent even without URL clone
    if (!urlClone.hasURL && effectiveImageDataUrls?.length && !isReferenceImage) {
      const isLogoIntentEarly = /\b(logo|icon|favicon|brand|nav\s*bar|header|footer)\b/i.test(input)
        || /\b(use\s*(this|it|that|the\s*attach))/i.test(input);
      if (isLogoIntentEarly) {
        const logoUrls = effectiveImageDataUrls.map((url, i) => `IMAGE_${i + 1}_DATA_URL: ${url}`).join('\n');
        apiMessages.push({ role: 'system', content: `[ASSET PRIORITY — CRITICAL]\nThe user has uploaded ${effectiveImageDataUrls.length} image(s) to use as the logo/branding.\n\nYou MUST embed the uploaded image.\nDo NOT use a text placeholder.\nIMPORTANT: Store the data URL in a JS constant, do NOT put it directly in an HTML src attribute:\n  const LOGO_URL = "${effectiveImageDataUrls[0]}";\nThen reference it: <img src={LOGO_URL} alt="Logo" style="height:48px;" />\n\n${logoUrls}` });
      }
    }

    // Smart conversation compression — keep recent messages intact, compress older ones
    const rawHistory = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
    const compressedHistory = compressConversationHistory(rawHistory, 8, MAX_CONTEXT_MESSAGES);
    
    for (const m of compressedHistory) {
      // Strip file content AND image data URLs from old messages to save tokens
      let content = m.content;
      if (m.role === 'assistant') {
        content = content.replace(/===FILE:[\s\S]*?(?====FILE:|$)/g, '[file content omitted]').slice(0, 500);
      } else {
        // Strip base64 data URLs from old user messages (these are huge)
        content = content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, '[image data omitted]');
        content = content.slice(0, 2000);
      }
      apiMessages.push({ role: m.role, content });
    }

    // ── Payload budget constants ──
    const MAX_PAYLOAD_CHARS = 2_500_000; // Safe limit accounting for ~400K server-side system prompt

    // Build the user message content — send manifest + only relevant files for efficiency
    // Dynamic budget: scale file limits based on how much system context we've already used
    const systemChars = apiMessages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
    const FILE_BUDGET_CHARS = Math.max(200_000, MAX_PAYLOAD_CHARS - systemChars - 200_000); // Reserve 200K for response headroom

    const buildFileContext = (files: ProjectFile[], userInput: string): string => {
      // Fresh project shortcut — skip all context machinery
      if (files.length === 0) return userInput;

      // Phase 75: Use proactive context budget trimming
      const activeFilePath = files[0]?.path || null;
      const trimResult = trimForContext(files, activeFilePath, userInput);
      const contextFiles = trimResult.wasTrimmed
        ? trimResult.files.map(f => files.find(pf => pf.path === f.path) || { path: f.path, content: f.content, language: 'plaintext' as string } as ProjectFile)
        : files;

      // ── Incremental context: only send changed files, with manifest of unchanged ──
      const { changed, unchanged } = getChangedFiles(contextFiles);
      const useIncremental = contextFiles.length > 5 && changed.length < contextFiles.length;

      // Build a compact manifest of all files using the enhanced manifest builder
      const modifiedPaths = new Set(changed.map(f => f.path));
      const manifest = buildFileManifest(files, modifiedPaths);
      const unchangedNote = useIncremental && unchanged.length > 0
        ? `\n\n📋 ${unchanged.length} unchanged files omitted (content same as last build). Their paths are in the manifest above.`
        : '';

      // Extract component/structure summary for multi-turn context awareness
      const structureSummary: string[] = [];
      for (const f of files) {
        if (f.path === 'index.html') {
          const sectionMatches = f.content.match(/<(?:header|nav|main|section|footer|aside|form)[^>]*(?:id|class)=["']([^"']+)["']/gi);
          if (sectionMatches?.length) {
            structureSummary.push(`  HTML sections: ${sectionMatches.slice(0, 8).map(m => m.match(/(?:id|class)=["']([^"']+)/)?.[1]).filter(Boolean).join(', ')}`);
          }
        }
        if (f.path.endsWith('.js') || f.path.endsWith('.ts') || f.path.endsWith('.tsx')) {
          const fnMatches = f.content.match(/(?:function|const|class)\s+(\w+)/g);
          if (fnMatches?.length) {
            structureSummary.push(`  ${f.path}: exports ${fnMatches.slice(0, 5).map(m => m.split(/\s+/).pop()).join(', ')}`);
          }
        }
      }
      const structureNote = structureSummary.length > 0
        ? `\n\nPROJECT STRUCTURE SUMMARY:\n${structureSummary.join('\n')}\n`
        : '';

      // ── Smart file context: score files by relevance ──
      const lowerInput = userInput.toLowerCase();
      const inputWords = lowerInput.split(/\s+/).filter(w => w.length > 2);

      // Hoist import graph out of scoring loop (Change 3) — compute once, not per-file
      const importGraph = buildImportGraph(contextFiles);

      const scored = contextFiles.map(f => {
        let score = 0;
        const lowerPath = f.path.toLowerCase();
        const fileName = f.path.split('/').pop()?.split('.')[0]?.toLowerCase() || '';

        // Always include core files
        if (lowerPath === 'index.html' || lowerPath === 'styles.css' || lowerPath === 'app.tsx') score += 10;

        // Direct path mention in prompt
        if (lowerInput.includes(lowerPath) || lowerInput.includes(fileName)) score += 8;

        // Keyword match: file name words appear in prompt
        const pathWords = lowerPath.replace(/[/._-]/g, ' ').split(/\s+/);
        for (const pw of pathWords) {
          if (pw.length > 2 && inputWords.some(iw => iw.includes(pw) || pw.includes(iw))) score += 3;
        }

        // Content relevance: check if file exports things mentioned in prompt
        const exports = f.content.match(/(?:export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+)(\w+)/g);
        if (exports) {
          for (const exp of exports) {
            const name = exp.split(/\s+/).pop()?.toLowerCase() || '';
            if (name.length > 2 && inputWords.some(iw => iw.includes(name) || name.includes(iw))) score += 5;
          }
        }

        // Import graph: boost files in the dependency chain of mentioned files
        const mentionedPaths = files.filter(other => 
          lowerInput.includes(other.path.toLowerCase()) || 
          lowerInput.includes(other.path.split('/').pop()?.split('.')[0]?.toLowerCase() || '')
        ).map(other => other.path);
        
        for (const mp of mentionedPaths) {
          const depChain = getDependencyChain(importGraph, mp, 2);
          if (depChain.has(f.path)) score += 6;
        }

        // Reverse dep check: files that import this file
        const importedByRelevant = files.some(other => {
          if (other === f) return false;
          const otherScore = lowerInput.includes(other.path.toLowerCase()) ? 8 : 0;
          return otherScore > 5 && other.content.includes(fileName);
        });
        if (importedByRelevant) score += 4;

        // Recently modified files (shorter content = likely newer/WIP)
        if (f.content.length < 200 && f.content.length > 10) score += 1;

        // Small projects: include everything
        if (files.length <= 5) score += 10;
        if (files.length <= 10 && (lowerPath.endsWith('.js') || lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx'))) score += 5;

        return { file: f, score };
      });

      // Dynamic file limits based on remaining budget
      const MAX_FILES = files.length <= 5 ? files.length : Math.min(15, Math.max(5, Math.floor(FILE_BUDGET_CHARS / 20000)));
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_FILES);

      const filesToSend = relevant.length > 0 ? relevant.map(s => s.file) : files.slice(0, MAX_FILES);
      
      // Dynamic per-file cap: distribute budget evenly, minimum 5KB each
      const perFileCap = Math.max(5000, Math.floor(FILE_BUDGET_CHARS / filesToSend.length));
      
      const fileContext = filesToSend.map(f => {
        let content = f.content;
        if (content.length > perFileCap) {
          content = content.slice(0, perFileCap) + '\n/* ... truncated ... */';
        }
        // Add line numbers so the AI can use ===EDIT: with @@ lineStart-endLine @@ markers
        const numberedContent = content.split('\n').map((line, i) => `${i + 1}: ${line}`).join('\n');
        return `===FILE: ${f.path}===\n${numberedContent}`;
      }).join('\n\n');

      const omittedCount = files.length - filesToSend.length;
      const omittedNote = omittedCount > 0
        ? `\n\n(${omittedCount} other files exist but are omitted for brevity. Only output files you need to change.)`
        : '';

      // ── Update context budget for the UI indicator ──
      const budget = calculateContextBudget(
        apiMessages.filter(m => m.role === 'system').map(m => ({ content: typeof m.content === 'string' ? m.content : '' })),
        apiMessages.filter(m => m.role !== 'system').map(m => ({ content: typeof m.content === 'string' ? m.content : '' })),
        fileContext,
        files.length,
        filesToSend.length,
      );
      setContextBudget(budget);

      return `${manifest}${structureNote}${unchangedNote}\n\nFILE CONTENTS (with line numbers for ===EDIT: patches):\n${fileContext}${omittedNote}\n\n⚠️ MANDATORY: You MUST use ===EDIT: path=== with @@ lineStart-endLine @@ hunks for ALL changes to existing files. Do NOT use ===FILE: path=== to rewrite existing files — that causes full regeneration which is slow. Use ===FILE: path=== ONLY for brand new files. Use ===DELETE: path=== to remove files. NEVER re-output unchanged files. Output ONLY the changed lines as diff hunks.\n\nAFTER all code blocks, write a brief 1-2 sentence conversational summary of what you changed and why — be friendly and helpful like a coding assistant.\n\nUser request: ${userInput}`;
    };

    if (effectiveImageDataUrls?.length) {
      // Separate SVG data URLs from raster images.
      // Vision models can't process SVG data URLs — decode them to raw SVG
      // source and inject as a text block so the AI can embed it directly.
      const rasterUrls: string[] = [];
      const svgTextBlocks: string[] = [];

      for (const url of effectiveImageDataUrls) {
        if (url.startsWith('data:image/svg+xml')) {
          try {
            // Decode the SVG from the data URL (base64 or URI-encoded)
            let svgSource: string;
            if (url.includes(';base64,')) {
              svgSource = atob(url.split(';base64,')[1]);
            } else {
              svgSource = decodeURIComponent(url.split(',').slice(1).join(','));
            }
            svgTextBlocks.push(svgSource);
          } catch {
            // Fallback: send as-is if decode fails
            rasterUrls.push(url);
          }
        } else {
          rasterUrls.push(url);
        }
      }

      const userContent: any[] = [
        { type: 'text', text: buildFileContext(currentFiles, input) },
      ];

      // Inject decoded SVGs as text blocks so the AI can use them directly
      if (svgTextBlocks.length > 0) {
        const svgContext = svgTextBlocks.map((svg, i) =>
          `[UPLOADED SVG IMAGE ${i + 1}] — Use this SVG source directly as an <img> src (via data URL) or inline the SVG markup:\n\`\`\`svg\n${svg}\n\`\`\``
        ).join('\n\n');
        userContent.push({ type: 'text', text: svgContext });
      }

      // Send raster images as image_url blocks (these work with vision models)
      for (const url of rasterUrls) {
        userContent.push({ type: 'image_url', image_url: { url } });
      }

      // CRITICAL: Also pass the raw data URLs as text so the AI can embed them in code.
      // Vision models can "see" the image but cannot extract the data URL string from the image_url block.
      // BUT: cap data URL size to prevent token overflow (max ~50KB per image = ~67K chars base64)
      const MAX_DATA_URL_SIZE = 150000;
      const isLogoIntent = !isReferenceImage && (!!imageGenIntent
        || /\b(logo|icon|favicon|brand|nav\s*bar|header|footer)\b/i.test(input)
        || /\b(use\s*(this|it|that|the\s*attach))/i.test(input));
      if (rasterUrls.length > 0 && isLogoIntent) {
        const dataUrlRef = rasterUrls.map((url, i) => {
          if (!isLogoIntent && url.length > MAX_DATA_URL_SIZE) {
            return `[EMBEDDABLE DATA URL FOR IMAGE ${i + 1}] — Image is too large to embed inline (${Math.round(url.length / 1024)}KB). The image is visible in the image_url block above — use a placeholder <img> with a TODO comment to replace with a hosted URL.`;
          }
          return `[EMBEDDABLE DATA URL FOR IMAGE ${i + 1}] — Copy this EXACT string into <img src="...">:\n${url}`;
        }).join('\n\n');
        userContent.push({ type: 'text', text: dataUrlRef });
      }

      apiMessages.push({ role: 'user', content: userContent });
    } else {
      apiMessages.push({ role: 'user', content: buildFileContext(currentFiles, input) });
    }

    // ── Token budget enforcement (Lovable-grade) ──
    // Target: stay well under 1M tokens (≈4M chars). Use 2.5M as safe payload max
    // to account for the ~400K system prompt added server-side.
    const estimateChars = (msg: any): number => {
      if (typeof msg.content === 'string') return msg.content.length;
      if (Array.isArray(msg.content)) {
        return msg.content.reduce((sum: number, block: any) => {
          if (block.type === 'text') return sum + (block.text?.length || 0);
          // Images: count as ~1K tokens regardless of actual size (vision model handles separately)
          if (block.type === 'image_url') return sum + 4000;
          return sum;
        }, 0);
      }
      return 0;
    };
    let totalChars = apiMessages.reduce((sum, m) => sum + estimateChars(m), 0);

    // Phase 1: Drop system context messages (least important first) if over 2M chars
    const PHASE1_LIMIT = 2_000_000;
    if (totalChars > PHASE1_LIMIT) {
      // Remove system messages from end-to-start (later = less important), keep first 2
      for (let i = apiMessages.length - 2; i >= 2; i--) {
        if (totalChars <= PHASE1_LIMIT) break;
        if (apiMessages[i].role === 'system') {
          // Never drop asset priority messages — they contain embeddable data URLs
          const content = typeof apiMessages[i].content === 'string' ? apiMessages[i].content as string : '';
          if (/ASSET PRIORITY/i.test(content)) continue;
          totalChars -= estimateChars(apiMessages[i]);
          apiMessages.splice(i, 1);
        }
      }
    }

    // Phase 2: Remove older history messages (keep system + last user message)
    const PHASE2_LIMIT = 2_500_000;
    while (totalChars > PHASE2_LIMIT && apiMessages.length > 2) {
      const removeIdx = apiMessages.findIndex((m, i) => i > 0 && i < apiMessages.length - 1 && m.role !== 'system');
      if (removeIdx === -1) break;
      totalChars -= estimateChars(apiMessages[removeIdx]);
      apiMessages.splice(removeIdx, 1);
    }

    // Phase 3: Truncate the user message file content if still over budget
    if (totalChars > MAX_PAYLOAD_CHARS) {
      const lastMsg = apiMessages[apiMessages.length - 1];
      if (typeof lastMsg.content === 'string' && lastMsg.content.length > 300000) {
        // Keep manifest + user request, aggressively truncate file contents
        const manifestEnd = lastMsg.content.indexOf('FILE CONTENTS:');
        const userReqStart = lastMsg.content.lastIndexOf('User request:');
        if (manifestEnd > 0 && userReqStart > 0) {
          const manifest = lastMsg.content.slice(0, manifestEnd + 14);
          const userReq = lastMsg.content.slice(userReqStart);
          const fileSection = lastMsg.content.slice(manifestEnd + 14, userReqStart);
          // Keep only first 200K of file content
          const truncatedFiles = fileSection.slice(0, 200000) + '\n\n[... remaining files omitted for token budget ...]\n\n';
          lastMsg.content = manifest + truncatedFiles + userReq;
        } else {
          lastMsg.content = lastMsg.content.slice(0, 300000) + '\n\n[TRUNCATED for token budget. Focus on files mentioned in the user request.]';
        }
      }
      // For multimodal: strip large data URLs from text blocks
      if (Array.isArray(lastMsg.content)) {
        lastMsg.content = lastMsg.content.map((block: any) => {
          if (block.type === 'text' && block.text?.length > 300000) {
            // Never strip data URLs from embeddable asset blocks — the AI needs these exact strings
            const isAssetBlock = /EMBEDDABLE DATA URL|ASSET PRIORITY/i.test(block.text);
            const trimmed = isAssetBlock
              ? block.text
              : block.text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{5000,}/g, '[image data omitted for budget]');
            return { ...block, text: trimmed.slice(0, isAssetBlock ? 500000 : 300000) };
          }
          return block;
        });
      }
    }

    // ── Server-side generation: submit job to background edge function ──
    // The edge function handles streaming, continuation rounds, retries — all server-side.
    // This survives tab close, network drops, and browser crashes.
    
    const effectiveModel = model || undefined;
    const activeServiceIds = serviceKeys?.map(sk => sk.serviceId) || [];

    try {
      // Strip large base64 data URLs from messages before sending to edge function
      // to prevent payload size issues. The AI gateway receives them via the nested
      // ai-app-builder call which re-serializes from the stored job data.
      const isAssetContent = (text: string) => /ASSET PRIORITY|EMBEDDABLE DATA URL/i.test(text);
      const sanitizedApiMessages = apiMessages.map((msg: any) => {
        if (typeof msg.content === 'string') {
          // Never strip asset messages — they carry the data URL the AI must embed
          if (isAssetContent(msg.content)) return msg;
          // Replace inline base64 data URLs >10KB with placeholder
          return { ...msg, content: msg.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{10000,}/g, '[image-data-url-stripped-for-transport]') };
        }
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((block: any) => {
              // Keep image_url blocks but cap at 500KB to prevent oversized payloads
              if (block.type === 'image_url' && block.image_url?.url?.length > 500000) {
                return { ...block, image_url: { ...block.image_url, url: block.image_url.url.slice(0, 500000) } };
              }
              // Never strip text blocks that contain asset markers
              if (block.type === 'text' && isAssetContent(block.text || '')) return block;
              // Strip large data URLs from text blocks (they're duplicated in image_url blocks anyway)
              if (block.type === 'text' && block.text?.length > 10000) {
                return { ...block, text: block.text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{10000,}/g, '[image-visible-in-image_url-block]') };
              }
              return block;
            }),
          };
        }
        return msg;
      });

      // Add timeout to prevent hanging indefinitely on large payloads
      const invokeController = new AbortController();
      const invokeTimeout = setTimeout(() => invokeController.abort(), 30000);

      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: {
          action: 'start',
          messages: sanitizedApiMessages,
          mode: effectiveMode,
          model: effectiveModel,
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          activeServices: activeServiceIds,
        },
      });
      clearTimeout(invokeTimeout);

      if (error) {
        throw new Error(error.message || 'Failed to start build');
      }

      const jobId = data?.jobId;
      if (!jobId) {
        throw new Error('No job ID returned from background service');
      }

      console.info('[AI Builder] Background job submitted:', jobId);

      // IMPORTANT: Register completion listeners BEFORE dispatching bg-job-started
      // to prevent a race condition where the job completes before listeners exist.
      const TOTAL_BUILD_MAX_MS = 3 * 60 * 1000; // 3 minutes
      const buildCompletePromise = new Promise<void>((resolve, reject) => {
        const onComplete = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          console.info('[AI Builder] ⚡ Received bg-job-completed event, detail:', detail, 'waiting for jobId:', jobId);
          if (detail?.jobId === jobId) {
            cleanup();
            console.info('[AI Builder] ✅ Build complete promise resolving for job:', jobId);
            resolve();
          }
        };
        const onFailed = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          console.info('[AI Builder] ❌ Received bg-job-failed event, detail:', detail, 'waiting for jobId:', jobId);
          if (detail?.jobId === jobId) {
            cleanup();
            reject(new Error(detail?.error || 'Build failed'));
          }
        };
        const timer = setTimeout(() => {
          cleanup();
          console.error('[AI Builder] ⏰ Build timed out after 3 minutes for job:', jobId);
          reject(new Error('Build timed out'));
        }, TOTAL_BUILD_MAX_MS);
        const cleanup = () => {
          clearTimeout(timer);
          window.removeEventListener('bg-job-completed', onComplete);
          window.removeEventListener('bg-job-failed', onFailed);
        };
        window.addEventListener('bg-job-completed', onComplete);
        window.addEventListener('bg-job-failed', onFailed);
        console.info('[AI Builder] 🎧 Listeners registered for bg-job-completed/failed, jobId:', jobId);
      });

      // NOW dispatch the start event — listeners are already in place
      console.info('[AI Builder] 📡 Dispatching bg-job-started for jobId:', jobId);
      window.dispatchEvent(new CustomEvent('bg-job-started', { detail: { jobId } }));

      // Deduct credits (only for non-fix requests)
      if (!isFixRequest) {
        await deductCredits(creditCost, `App Builder ${effectiveMode === 'build' ? 'build' : 'chat'}`);
      }

      // Wait for the background job to actually complete before returning.
      console.info('[AI Builder] ⏳ Awaiting buildCompletePromise for job:', jobId);
      await buildCompletePromise;
      console.info('[AI Builder] 🏁 buildCompletePromise resolved, sendMessage returning for job:', jobId);

      // Clear generating/thinking state on SUCCESS (previously only cleared in catch)
      setIsGenerating(false);
      setThinkingPhase(null);
    } catch (err: any) {
      console.error('AI Builder error:', err);
      const classified = classifyError(0, err.message || '', err);

      // Step C: Smart model fallback — retry with alternate model on rate limit / server overload
      const FALLBACK_MODELS: Record<string, string> = {
        'google/gemini-3-flash-preview': 'anthropic/claude-sonnet',
        'anthropic/claude-sonnet': 'google/gemini-3-flash-preview',
        'openai/gpt-4o': 'anthropic/claude-sonnet',
      };
      const currentModel = model || 'google/gemini-3-flash-preview';
      const fallbackModel = FALLBACK_MODELS[currentModel];
      if (classified.retryable && fallbackModel && !fallbackRetryRef.current) {
        fallbackRetryRef.current = true;
        console.info('[AI Builder] Model fallback: %s → %s', currentModel, fallbackModel);
        toast.info(`Primary model busy, retrying with fallback…`, { duration: 3000 });
        setIsGenerating(false);
        setThinkingPhase(null);
        // Retry with fallback model after a short delay
        setTimeout(() => {
          fallbackRetryRef.current = false;
          sendMessage(input, currentFiles, supabaseConfig, stripeConfig, serviceKeys, imageDataUrls, fallbackModel, undefined, isAutoFix);
        }, classified.retryDelayMs || 2000);
        return;
      }
      fallbackRetryRef.current = false;

      toast.error(`${classified.userMessage} ${classified.suggestion}`, { duration: 5000 });
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant' as const,
        content: `⚠️ ${classified.userMessage}\n\n💡 **Suggestion:** ${classified.suggestion}`,
        timestamp: new Date(), classifiedError: classified,
        mode: effectiveMode,
      }]);
      setIsGenerating(false);
      setThinkingPhase(null);
    }
  }, [isGenerating, mode, totalRemaining, deductCredits]); // Issue 27 fix: removed `messages` dep — read via messagesRef

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    isGeneratingRef.current = false;
    setIsGenerating(false);
    setThinkingPhase(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLatestFiles([]);
    setPreviousFiles([]);
    setVersions([]);
    setTotalTokensUsed(0);
    setPendingFiles(null);
    setPendingDeletions([]);
    // Phase 6: Clear file hash cache to prevent stale entries
    fileHashCache.clear();
  }, []);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version && version.files.length > 0) {
      setPreviousFiles([...latestFiles]);
      setLatestFiles([...version.files]);
      // Phase 48: Update file hash cache after version restore
      updateFileHashes(version.files);
      toast.success(`Restored to: ${version.label}`);
    } else {
      toast.error('Version has no files to restore');
    }
  }, [versions, latestFiles]);

  /** Forward a preview error into the chat as an inline error on the last assistant message */
  const forwardErrorToChat = useCallback((error: { message: string; source?: string; line?: number }) => {
    setMessages(prev => {
      // Find the last assistant message
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'assistant') {
          return prev.map((m, idx) => idx === i ? { ...m, inlineError: error } : m);
        }
      }
      return prev;
    });
  }, []);

  /** "Try to Fix" — auto-diagnose and fix a preview error (Phase 1B + Phase 11: include stack trace) */
  const tryToFix = useCallback(async (
    error: { message: string; source?: string; line?: number; stack?: string },
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    model?: string,
  ) => {
    // Find the affected file
    const errorFile = error.source
      ? currentFiles.find(f => error.source?.includes(f.path))
      : null;

    // Build a targeted fix prompt — Phase 11: include stack trace
    const fixPrompt = [
      `Auto-fix error: "${error.message}"`,
      error.source ? `Source: ${error.source}${error.line ? `:${error.line}` : ''}` : '',
      error.stack ? `Stack trace:\n${error.stack}` : '',
      errorFile ? `\nFile content (${errorFile.path}):\n\`\`\`\n${errorFile.content}\n\`\`\`` : '',
      '\nFix this error. Return only the corrected file(s). Do NOT explain — just output the fixed code.',
    ].filter(Boolean).join('\n');

    // Send as auto-fix (no credit cost)
    await sendMessage(fixPrompt, currentFiles, supabaseConfig, stripeConfig, serviceKeys, null, model, undefined, true);
  }, [sendMessage]);

  /** Edit a previous user message and resend from that point (conversation branching) */
  const editAndResend = useCallback(async (
    messageId: string,
    newContent: string,
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    imageDataUrls?: string[] | null,
    model?: string,
  ) => {
    // Find the message index
    const msgIdx = messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    // Phase 49: Reset continuation state on editAndResend
    continuationCountRef.current = 0;
    accumulatedFilesRef.current = [];
    setContinuationRound(0);

    // Branch: truncate conversation from edited message onwards
    const branchedMessages = messages.slice(0, msgIdx);
    const editedMsg: BuilderMessage = {
      ...messages[msgIdx],
      content: newContent,
      isEdited: true,
      originalContent: messages[msgIdx].content,
    };
    setMessages([...branchedMessages, editedMsg]);

    // Restore files to the version snapshot just before this message
    const priorVersion = versions.find(v => {
      const vTime = v.timestamp.getTime();
      return vTime < messages[msgIdx].timestamp.getTime();
    });
    if (priorVersion) {
      setLatestFiles([...priorVersion.files]);
    }

    // Re-send with the edited content
    await sendMessage(newContent, currentFiles, supabaseConfig, stripeConfig, serviceKeys, imageDataUrls, model);
  }, [messages, versions, sendMessage]);

  /** Retry the last failed request */
  const retryLastMessage = useCallback(async (
    currentFiles: ProjectFile[] = [],
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    model?: string,
  ) => {
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the error assistant message
    setMessages(prev => {
      const lastAssistant = prev[prev.length - 1];
      if (lastAssistant?.role === 'assistant' && lastAssistant.classifiedError) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await sendMessage(lastUserMsg.content, currentFiles, supabaseConfig, stripeConfig, serviceKeys, lastUserMsg.imageUrls, model);
  }, [messages, sendMessage]);

  // ── Conversation Forking ──
  const [conversationForks, setConversationForks] = useState<{
    id: string;
    label: string;
    messages: BuilderMessage[];
    filesSnapshot: ProjectFile[];
    createdAt: Date;
  }[]>([]);
  const [activeForkId, setActiveForkId] = useState<string | null>(null);

  const forkConversation = useCallback((label?: string) => {
    const fork = {
      id: crypto.randomUUID(),
      label: label || `Fork ${conversationForks.length + 1}`,
      messages: [...messages],
      filesSnapshot: [...latestFiles],
      createdAt: new Date(),
    };
    setConversationForks(prev => [...prev, fork]);
    toast.success(`Conversation forked: ${fork.label}`);
    return fork.id;
  }, [messages, latestFiles, conversationForks.length]);

  const switchFork = useCallback((forkId: string) => {
    const fork = conversationForks.find(f => f.id === forkId);
    if (!fork) return;
    // Save current state as the "main" branch if not already forked
    if (!activeForkId) {
      const mainFork = {
        id: 'main',
        label: 'Main',
        messages: [...messages],
        filesSnapshot: [...latestFiles],
        createdAt: new Date(),
      };
      setConversationForks(prev => {
        if (prev.some(f => f.id === 'main')) {
          return prev.map(f => f.id === 'main' ? mainFork : f);
        }
        return [mainFork, ...prev];
      });
    } else {
      // Update the current fork's state
      setConversationForks(prev => prev.map(f =>
        f.id === activeForkId ? { ...f, messages: [...messages], filesSnapshot: [...latestFiles] } : f
      ));
    }
    setMessages(fork.messages);
    setLatestFiles(fork.filesSnapshot);
    setActiveForkId(forkId === 'main' ? null : forkId);
    toast.info(`Switched to: ${fork.label}`);
  }, [conversationForks, activeForkId, messages, latestFiles]);

  const deleteFork = useCallback((forkId: string) => {
    if (forkId === 'main') return;
    setConversationForks(prev => prev.filter(f => f.id !== forkId));
    if (activeForkId === forkId) setActiveForkId(null);
  }, [activeForkId]);

  return {
    messages,
    setMessages,
    isGenerating,
    latestFiles,
    previousFiles,
    mode,
    setMode,
    thinkingPhase,
    versions,
    setVersions,
    totalTokensUsed,
    contextBudget,
    continuationRound,
    sendMessage,
    stopGenerating,
    clearChat,
    restoreVersion,
    forwardErrorToChat,
    tryToFix,
    editAndResend,
    retryLastMessage,
    // Conversation forking
    conversationForks,
    activeForkId,
    forkConversation,
    switchFork,
    deleteFork,
    // Streaming preview refs (not state — avoids workspace re-renders)
    partialFilesRef: streaming.partialFilesRef,
    isStreamingPreview: streaming.isStreaming,
    completedFileCountRef: streaming.completedFileCountRef,
    parseIncremental: streaming.parseIncremental,
    // Stream integrity for truncation detection
    getStreamIntegrity: streaming.getIntegrity,
    isStreamStalled: streaming.isStalled,
    // Ref-based streaming for chat panel (avoids workspace re-renders)
    streamingContentRef,
    // Wave 18: Runtime error fix loop
    runtimeErrorFix,
    // Wave 18: Incremental streaming apply
    incrementalApply,
    // Wave 18: Post-generation changelog
    changelog,
  };
}
