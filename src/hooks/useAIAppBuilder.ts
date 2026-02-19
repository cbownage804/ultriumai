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

// ── File hash tracking for incremental context (Lovable-grade) ──
const fileHashCache = new Map<string, string>();

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
  return {
    category: 'unknown', retryable: false,
    userMessage: errorMsg || 'Something went wrong.',
    suggestion: 'Try rephrasing your request or refreshing the page.',
  };
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

/** Update hash cache after a successful build */
function updateFileHashes(files: ProjectFile[]) {
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

    // HTML: check for matching tags, unclosed elements
    if (ext === 'html' || ext === 'htm') {
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
      const opens = (f.content.match(/[{([\]]/g) || []).length;
      const closes = (f.content.match(/[})\]]/g) || []).length;
      if (Math.abs(opens - closes) > 2) {
        errors.push({ file: f.path, message: `Unbalanced brackets: ${opens} open vs ${closes} close` });
      }
      // Unclosed template literals
      const backticks = (f.content.match(/`/g) || []).length;
      if (backticks % 2 !== 0) {
        errors.push({ file: f.path, message: `Odd number of backticks (unclosed template literal)` });
      }
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
const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;
const DELETE_DELIMITER = /^===DELETE:\s*(.+?)===$/;
const EDIT_DELIMITER = /^===EDIT:\s*(.+?)===$/;
const HUNK_HEADER = /^@@\s*(\d+)-(\d+)\s*@@$/;

/** Detect conversational prose that should not be part of a code file */
function isConversationalLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Quick-exit: lines starting with valid code tokens are NOT conversational
  if (/^[<{\/\[\]()@#.;:=!&|+\-*%?~`\\]/.test(trimmed)) return false;
  if (/^(import |export |const |let |var |function |class |return |if |else |for |while |switch |case |try |catch |throw |new |type |interface |enum |async |await |from |default |module |require|<!DOCTYPE|<\?xml)/.test(trimmed)) return false;
  if (/^(body|html|head|div|span|p|h[1-6]|ul|ol|li|a|img|input|button|form|table|tr|td|th|nav|header|footer|main|section|article|aside|meta|link|script|style|label|select|option|textarea)\b/.test(trimmed)) return false;

  // Common AI conversational markers that shouldn't be in code
  const markers = [
    /^(what'?s (next|changed|new|different|updated)|would you like|let me know|here'?s what|i('?ve| have)|shall i|want me to|feel free|happy to|hope this|this (should|will|creates?|adds?|implements?|includes?|features?|is a)|i (created|added|built|implemented|updated|fixed|modified|made|changed|replaced|removed|redesigned))/i,
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
function applyHunkPatch(
  existingContent: string,
  hunks: { startLine: number; endLine: number; newLines: string[] }[]
): string | null {
  const lines = existingContent.split('\n');
  // Apply hunks from bottom to top so line numbers remain stable
  const sorted = [...hunks].sort((a, b) => b.startLine - a.startLine);
  for (const hunk of sorted) {
    const start = Math.max(0, hunk.startLine - 1); // 1-indexed to 0-indexed
    const end = Math.min(lines.length, hunk.endLine);
    if (start > lines.length) return null; // out of bounds — patch doesn't apply
    lines.splice(start, end - start, ...hunk.newLines);
  }
  return lines.join('\n');
}

/** Parse ===EDIT: path=== blocks into hunks */
interface EditBlock {
  path: string;
  hunks: { startLine: number; endLine: number; newLines: string[] }[];
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

  const flushHunk = () => {
    if (inHunk && currentHunkStart > 0) {
      currentHunks.push({ startLine: currentHunkStart, endLine: currentHunkEnd, newLines: [...currentHunkLines] });
    }
    currentHunkLines = [];
    inHunk = false;
  };

  const flushEdit = () => {
    flushHunk();
    if (currentPath && currentHunks.length > 0) {
      edits.push({ path: currentPath, hunks: [...currentHunks] });
    }
    currentHunks = [];
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
      // Check for new file/delete/edit delimiter — means this edit block is done
      if (FILE_DELIMITER.test(line) || DELETE_DELIMITER.test(line)) {
        flushEdit();
        currentPath = null;
        continue;
      }

      const hunkMatch = line.match(HUNK_HEADER);
      if (hunkMatch) {
        flushHunk();
        currentHunkStart = parseInt(hunkMatch[1]);
        currentHunkEnd = parseInt(hunkMatch[2]);
        inHunk = true;
        continue;
      }

      if (inHunk) {
        // Stop hunk on blank line followed by conversational prose
        if (!line.trim() && currentHunkLines.length > 0) {
          // peek ahead handled by the next iteration
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
export function parseMultiFileOutput(raw: string): { files: ProjectFile[]; deletions: string[]; edits: EditBlock[]; isReactMode: boolean; migrations: import('@/components/ai-builder/MigrationApprovalCard').MigrationBlock[]; edgeFunctions: import('@/components/ai-builder/EdgeFunctionCard').EdgeFunctionBlock[] } {
  // Parse migration blocks first, then strip them before file parsing
  const migrations = parseMigrationBlocks(raw);
  const rawAfterMigrations = migrations.length > 0 ? stripMigrationBlocks(raw) : raw;

  // Parse edge function blocks, then strip them
  const edgeFunctions = parseEdgeFunctionBlocks(rawAfterMigrations);
  const rawAfterEdgeFns = edgeFunctions.length > 0 ? stripEdgeFunctionBlocks(rawAfterMigrations) : rawAfterMigrations;

  // Detect and strip ===MODE: react=== directive
  const isReactMode = /^===MODE:\s*react===$/m.test(rawAfterEdgeFns);
  const cleanedRaw = rawAfterEdgeFns.replace(/^===MODE:\s*\w+===\s*$/gm, '');
  const edits = parseEditBlocks(cleanedRaw);

  const lines = cleanedRaw.split('\n');
  const files: ProjectFile[] = [];
  const deletions: string[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let blankLineStreak = 0;
  let inEditBlock = false;

  const flush = () => {
    if (currentPath) {
      const content = currentLines.join('\n').trim();
      if (content) {
        const ext = currentPath.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
          html: 'html', htm: 'html', css: 'css', scss: 'scss',
          js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
          json: 'json', md: 'markdown', svg: 'xml',
        };
        files.push({ path: currentPath, content, language: langMap[ext] || 'plaintext' });
      }
    }
  };

  for (const line of lines) {
    // Skip ===EDIT: blocks — they're handled separately by parseEditBlocks
    const editMatch = line.match(EDIT_DELIMITER);
    if (editMatch) {
      flush();
      currentPath = null;
      currentLines = [];
      blankLineStreak = 0;
      inEditBlock = true;
      continue;
    }

    const deleteMatch = line.match(DELETE_DELIMITER);
    if (deleteMatch) {
      flush();
      currentPath = null;
      currentLines = [];
      blankLineStreak = 0;
      inEditBlock = false;
      deletions.push(deleteMatch[1].trim());
      continue;
    }
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flush();
      currentPath = match[1].trim();
      currentLines = [];
      blankLineStreak = 0;
      inEditBlock = false;
    } else if (inEditBlock) {
      // Skip lines inside edit blocks — already parsed
      continue;
    } else if (currentPath !== null) {
      // Phase 77: Track blank lines — require 2+ blank lines before checking for prose
      // (1 blank line is common in CSS/JSX and shouldn't trigger cutoff)
      if (!line.trim()) {
        blankLineStreak++;
        currentLines.push(line);
      } else if (blankLineStreak >= 2 && isConversationalLine(line)) {
        // End of file content — AI started talking after 2+ blank lines
        flush();
        currentPath = null;
        currentLines = [];
        blankLineStreak = 0;
      } else {
        blankLineStreak = 0;
        currentLines.push(line);
      }
    }
  }
  flush();

  // Post-process: strip trailing conversational prose from the last file
  for (const file of files) {
    const fileLines = file.content.split('\n');
    let cutIndex = fileLines.length;
    for (let i = fileLines.length - 1; i >= 0; i--) {
      const line = fileLines[i].trim();
      if (!line) { cutIndex = i; continue; }
      if (isConversationalLine(fileLines[i])) {
        cutIndex = i;
      } else {
        break;
      }
    }
    if (cutIndex < fileLines.length) {
      file.content = fileLines.slice(0, cutIndex).join('\n').trim();
    }
  }

  if (files.length === 0 && deletions.length === 0 && edits.length === 0) {
    const trimmed = raw.trim();
    const htmlMatch = trimmed.match(/```html\n?([\s\S]*?)```/);
    const html = htmlMatch ? htmlMatch[1] : trimmed;
    if (html.includes('<') && html.includes('>')) {
      files.push({ path: 'index.html', content: html, language: 'html' });
    }
  }

  return { files, deletions, edits, isReactMode, migrations, edgeFunctions };
}

/** Generate contextual follow-up suggestions based on the response and conversation state */
function generateSuggestions(content: string, mode: BuilderMode, messages: BuilderMessage[] = [], currentFiles: ProjectFile[] = []): string[] {
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

/** Rough token estimate (~4 chars per token) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function useAIAppBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestFiles, setLatestFiles] = useState<ProjectFile[]>([]);
  const [previousFiles, setPreviousFiles] = useState<ProjectFile[]>([]);
  const [mode, setMode] = useState<BuilderMode>('build');
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<ProjectFile[] | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [contextBudget, setContextBudget] = useState<ContextBudgetInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streaming = useStreamingPreview();
  const { deductCredits, totalRemaining } = useUserCredits();
  const { trimForContext } = useContextBudget({ maxChars: 120_000 });

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
    if (!input.trim() || isGenerating) return;

    // ── Request deduplication: prevent double-sends ──
    const fingerprint = hashString(input + (imageDataUrls?.join('') || ''));
    const now = Date.now();
    if (fingerprint === lastRequestFingerprint && now - lastRequestTime < 3000) {
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

    // Auto-detect intent and switch mode
    const detectedMode = detectIntent(input);
    if (detectedMode && detectedMode !== mode) {
      setMode(detectedMode);
    }
    const effectiveMode = detectedMode || mode;

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
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    // Thinking phases
    setThinkingPhase('analyzing');
    const phaseTimer1 = setTimeout(() => setThinkingPhase('planning'), 1500);
    const phaseTimer2 = setTimeout(() => setThinkingPhase('writing'), 3500);

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
      messages.map(m => ({ role: m.role, content: m.content }))
    );
    if (memoryContext) systemParts.push(memoryContext);

    const userTexts = messages.filter(m => m.role === 'user').map(m => m.content);
    const { prompt: tonePrompt } = detectCommunicationStyle(userTexts);
    if (tonePrompt) systemParts.push(tonePrompt);

    const prefs = extractUserPreferences(messages.map(m => ({ role: m.role, content: m.content })));
    const prefsContext = buildPreferencesContext(prefs);
    if (prefsContext) systemParts.push(prefsContext);

    const workflow = detectWorkflowIntent(input);
    if (workflow) {
      systemParts.push(`[WORKFLOW DETECTED] The user has a multi-step request with ${workflow.steps.length} steps:\n${workflow.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nExecute ALL steps in sequence in a single response. Show progress for each step.`);
    }

    const visualContext = buildVisualIntelligenceContext(!!(imageDataUrls?.length), input);
    if (visualContext) systemParts.push(visualContext);

    // Phase 86: Inject schema context if Supabase is connected and types.ts exists
    if (supabaseConfig && currentFiles.some(f => f.path === 'types.ts' || f.path === 'src/types.ts')) {
      const typesFile = currentFiles.find(f => f.path.endsWith('types.ts'));
      if (typesFile && typesFile.content.length > 50) {
        systemParts.push(`[DATABASE SCHEMA]\nThe following TypeScript types represent the connected Supabase database schema:\n${typesFile.content.slice(0, 5000)}\n\nUse these EXACT table and column names in all queries.`);
      }
    }

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
      try {
        const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
          body: {
            url: urlClone.url,
            options: { formats: ['markdown'], onlyMainContent: true },
          },
        });
        if (!error && data?.success !== false) {
          const md = data?.data?.markdown || data?.markdown || '';
          const title = data?.data?.metadata?.title || data?.metadata?.title || '';
          const description = data?.data?.metadata?.description || data?.metadata?.description || '';
          if (md) {
            scrapedContent = `[SCRAPED WEBSITE CONTENT from ${urlClone.url}]\nTitle: ${title}\nDescription: ${description}\n\nContent:\n${md.slice(0, 12000)}`;
            toast.success('Website content loaded!');
          }
        }
      } catch (scrapeErr) {
        console.warn('Pre-scrape failed:', scrapeErr);
        toast.warning('Could not scrape website — AI will use its best knowledge instead.');
      }

      if (scrapedContent) {
        apiMessages.push({ role: 'system', content: scrapedContent });
        apiMessages.push({ role: 'system', content: `[SCRAPE INSTRUCTIONS] Use the SCRAPED WEBSITE CONTENT above as the real data for this website. Reproduce the site structure, text, and content faithfully. Do NOT hallucinate or guess the site content — it is provided above.` });
      } else {
        apiMessages.push({ role: 'system', content: `[URL CLONE] The user wants to clone/replicate the design from: ${urlClone.url}. Analyze the typical design patterns of this website and generate a faithful reproduction. Focus on layout structure, color scheme, typography, and component patterns.` });
      }

      // If images are also attached, add explicit priority instructions WITH the actual data URLs
      if (imageDataUrls?.length) {
        const logoUrls = imageDataUrls.map((url, i) => `IMAGE_${i + 1}_DATA_URL: ${url}`).join('\n');
        apiMessages.push({ role: 'system', content: `[ASSET PRIORITY — CRITICAL]\nThe user has uploaded ${imageDataUrls.length} image(s) to use as the logo/branding.\n\nYou MUST embed the uploaded image in the navbar and footer using the exact data URL below.\nDo NOT use a text placeholder like "Glenn's Body Shop Logo" — use an <img> tag with this src:\n\n${logoUrls}\n\nExample usage:\n<img src="${imageDataUrls[0]}" alt="Logo" style="height:48px;" />\n\nUse the SCRAPED CONTENT for the site's text and data. The uploaded image is ONLY for the logo.` });
      }
    }

    // Smart conversation compression — keep recent messages intact, compress older ones
    const rawHistory = messages.map(m => ({ role: m.role, content: m.content }));
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
        const importGraph = buildImportGraph(files);
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

      return `${manifest}${structureNote}${unchangedNote}\n\nFILE CONTENTS (with line numbers for ===EDIT: patches):\n${fileContext}${omittedNote}\n\nIMPORTANT: For small changes, use ===EDIT: path=== with @@ lineStart-endLine @@ hunks instead of rewriting entire files. Use ===FILE: path=== only for new files or major rewrites. To delete a file, use ===DELETE: path===. Do NOT re-output unchanged files.\n\nAFTER all code blocks, write a brief 1-2 sentence conversational summary of what you changed and why — be friendly and helpful like a coding assistant.\n\nUser request: ${userInput}`;
    };

    if (imageDataUrls?.length) {
      // Separate SVG data URLs from raster images.
      // Vision models can't process SVG data URLs — decode them to raw SVG
      // source and inject as a text block so the AI can embed it directly.
      const rasterUrls: string[] = [];
      const svgTextBlocks: string[] = [];

      for (const url of imageDataUrls) {
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
      const MAX_DATA_URL_SIZE = 50000;
      const isLogoIntent = /\b(logo|icon|favicon|brand|nav\s*bar|header|footer)\b/i.test(input)
        || /\b(use\s*(this|it|that|the\s*attach))/i.test(input);
      if (rasterUrls.length > 0 && isLogoIntent) {
        const dataUrlRef = rasterUrls.map((url, i) => {
          if (url.length > MAX_DATA_URL_SIZE) {
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
            return { ...block, text: block.text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{5000,}/g, '[image data omitted for budget]').slice(0, 300000) };
          }
          return block;
        });
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let fullContent = '';

    // ── Shared streaming reader with interruption recovery (DRY) ──
    let lastChunkTime = 0;
    const STREAM_STALL_MS = 30_000; // 30s stall = stream dead
    
    const readStream = async (body: ReadableStream<Uint8Array>) => {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      lastChunkTime = Date.now();

      const upsertAssistant = (content: string) => {
        fullContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { id: crypto.randomUUID(), role: 'assistant' as const, content, timestamp: new Date() }];
        });
      };

      // Stall detector — if no chunk in 30s, consider stream dead
      const stallChecker = setInterval(() => {
        if (Date.now() - lastChunkTime > STREAM_STALL_MS && !streamDone) {
          console.warn('[Stream] Stall detected — closing reader');
          reader.cancel().catch(() => {});
          streamDone = true;
        }
      }, 5000);

      try {
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          lastChunkTime = Date.now();
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                upsertAssistant(fullContent + delta);
                streaming.parseIncremental(fullContent);
                // Live plan step parsing — update every ~2KB of new content
                if (fullContent.length % 2000 < 100) {
                  const liveSteps = parsePlanSteps(fullContent);
                  if (liveSteps) {
                    setMessages(prev => {
                      const last = prev[prev.length - 1];
                      if (last?.role === 'assistant') {
                        return prev.map((m, i) => i === prev.length - 1 ? { ...m, planSteps: liveSteps } : m);
                      }
                      return prev;
                    });
                  }
                }
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Flush remaining buffer
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) upsertAssistant(fullContent + delta);
            } catch { /* ignore */ }
          }
        }
      } finally {
        clearInterval(stallChecker);
      }

      // ── Graceful partial output handling ──
      // If stream died mid-way but we got some complete files, still use them
      if (!streamDone && (fullContent.includes('===FILE:') || fullContent.includes('===EDIT:'))) {
        console.warn('[Stream] Interrupted but partial output has files/edits — using what we got');
        toast.warning('Stream interrupted — using partially generated files.', { duration: 5000 });
      }
    };

    // ── Fetch with timeout helper ──
    const FETCH_TIMEOUT_MS = 90_000; // 90 seconds
    const fetchWithTimeout = (url: string, init: RequestInit): Promise<Response> => {
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      return fetch(url, init).finally(() => clearTimeout(timeoutId));
    };

    // ── Build request payload ──
    const buildPayload = (msgs: typeof apiMessages) => JSON.stringify({
      messages: msgs,
      stream: true,
      mode: effectiveMode,
      model: model || undefined,
      supabaseConfig: supabaseConfig || undefined,
      stripeConfig: stripeConfig || undefined,
      activeServices: serviceKeys?.map(sk => sk.serviceId) || [],
    });

    const fetchHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    };

    // ── Post-stream finalization (shared between main and retry paths) ──
    const buildWallStart = Date.now();
    streaming.startStreaming();

    const finalizeStream = async () => {
      const buildStartTime = performance.now();
      const { files: parsedFiles, deletions, edits, migrations: parsedMigrations, edgeFunctions: parsedEdgeFunctions } = parseMultiFileOutput(fullContent);

      // ── Apply ===EDIT: patches to existing files (Phase 2) ──
      let patchedFiles: ProjectFile[] = [];
      if (edits.length > 0) {
        for (const edit of edits) {
          const existing = currentFiles.find(f => f.path === edit.path);
          if (existing) {
            const patched = applyHunkPatch(existing.content, edit.hunks);
            if (patched !== null) {
              const ext = edit.path.split('.').pop()?.toLowerCase() || '';
              const langMap: Record<string, string> = {
                html: 'html', htm: 'html', css: 'css', scss: 'scss',
                js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
                json: 'json', md: 'markdown', svg: 'xml',
              };
              patchedFiles.push({ path: edit.path, content: patched, language: langMap[ext] || 'plaintext' });
              console.info(`[Patch] Applied ${edit.hunks.length} hunk(s) to ${edit.path}`);
            } else {
              console.warn(`[Patch] Failed to apply patch to ${edit.path} — hunks out of bounds`);
              toast.warning(`Patch failed for ${edit.path} — file may have changed.`);
            }
          } else {
            console.warn(`[Patch] Target file ${edit.path} not found — skipping edit`);
          }
        }
      }

      // ── Post-gen validation (Lovable-grade) ──
      let filesToApply = parsedFiles;
      if (parsedFiles.length > 0) {
        const validation = validateGeneratedFiles(parsedFiles);
        if (!validation.valid) {
          console.warn('[Validation] Issues found:', validation.errors);
          filesToApply = sanitizeValidationErrors(parsedFiles, validation.errors);
          const recheck = validateGeneratedFiles(filesToApply);
          const criticalErrors = recheck.errors.filter(e => !e.message.includes('commentary'));
          if (criticalErrors.length > 0) {
            toast.warning(`Code quality issues detected in ${criticalErrors.length} file(s). Preview may have errors.`, { duration: 5000 });
          }
        }
      }

      // Merge: full file replacements + patched edits
      const allNewFiles = [...filesToApply, ...patchedFiles];

      if (allNewFiles.length > 0 || deletions.length > 0) {
        let mergedFiles = [...currentFiles];
        if (deletions.length > 0) mergedFiles = mergedFiles.filter(f => !deletions.includes(f.path));
        for (const newFile of allNewFiles) {
          const existingIdx = mergedFiles.findIndex(f => f.path === newFile.path);
          if (existingIdx >= 0) mergedFiles[existingIdx] = newFile;
          else mergedFiles.push(newFile);
        }
        // Update file hash cache for incremental tracking
        updateFileHashes(mergedFiles);
        setLatestFiles(mergedFiles);
        setVersions(prev => [...prev, {
          id: crypto.randomUUID(),
          label: `AI: ${input.slice(0, 40)}${input.length > 40 ? '...' : ''}`,
          files: [...mergedFiles],
          timestamp: new Date(),
          messageId: '',
        }]);

        // ── Auto-rollback listener (Lovable-grade) ──
        // Listen for preview errors within 5s of applying new files; revert if critical
        const rollbackTimeout = setTimeout(() => {
          window.removeEventListener('message', rollbackListener);
        }, 5000);
        const rollbackListener = (event: MessageEvent) => {
          if (event.data?.type === 'preview-error' && event.data?.critical) {
            console.warn('[Auto-Rollback] Preview error detected after build, reverting to previous version');
            toast.error('New code caused errors — automatically reverted to previous version.', { duration: 6000 });
            setLatestFiles([...currentFiles]);
            clearTimeout(rollbackTimeout);
            window.removeEventListener('message', rollbackListener);
          }
        };
        window.addEventListener('message', rollbackListener);
      }
      streaming.stopStreaming();

      // ── Build analytics (Lovable-grade) ──
      const buildTimeMs = Math.round(performance.now() - buildStartTime);
      const { changed } = getChangedFiles(currentFiles);
      console.info(`[Build Analytics] ${filesToApply.length} files generated, ${patchedFiles.length} patched, ${deletions.length} deleted, ${changed.length} context files sent, build: ${buildTimeMs}ms`);

      const msgTokens = estimateTokens(input + fullContent);
      setTotalTokensUsed(prev => prev + msgTokens);
      if (!isFixRequest) await deductCredits(creditCost, `App Builder ${effectiveMode === 'build' ? 'build' : 'chat'}`);
      
      // Parse plan steps from AI output for visual task cards
      const planSteps = parsePlanSteps(fullContent);
      const suggestions = generateSuggestions(fullContent, effectiveMode, messages, currentFiles);
      const totalChanges = (allNewFiles?.length || 0) + (deletions?.length || 0);
      const snapshot = totalChanges > 0 ? [...currentFiles, ...allNewFiles.filter(pf => !currentFiles.some(cf => cf.path === pf.path))] : [...currentFiles];

      // Build summary (Phase 5)
      const buildDurationMs = Date.now() - buildWallStart;
      const validation = validateGeneratedFiles(allNewFiles);
      const buildSummary: BuildSummary = {
        durationMs: buildDurationMs,
        filesGenerated: allNewFiles.length,
        filesDeleted: deletions.length,
        tokensUsed: msgTokens,
        contextChars: totalChars,
        validationErrors: validation.errors.length,
      };

      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, filesGenerated: totalChanges || undefined, suggestions, tokenEstimate: msgTokens, filesSnapshot: snapshot, planSteps, buildSummary: totalChanges > 0 ? buildSummary : undefined, migrations: parsedMigrations.length > 0 ? parsedMigrations : undefined, edgeFunctions: parsedEdgeFunctions.length > 0 ? parsedEdgeFunctions : undefined }
            : m
        )
      );
    };

    try {
      const resp = await fetchWithTimeout(BUILDER_URL, {
        method: 'POST',
        headers: fetchHeaders,
        body: buildPayload(apiMessages),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        const errMsg = errData?.error || '';
        const isSizeError = resp.status === 400 && (errMsg.includes('token') || errMsg.includes('too large') || errMsg.includes('exceeds') || errMsg.includes('maximum context'));
        const isServerError = resp.status >= 500 || resp.status === 504 || resp.status === 408;
        const isRetryable = (isSizeError || isServerError) && apiMessages.length > 2;

        // ── Exponential backoff retry (up to 2 attempts with progressive context reduction) ──
        if (isRetryable) {
          const MAX_RETRIES = 2;
          const RETRY_CONFIGS = [
            { label: 'Optimizing context...', maxChars: 200_000, keepMsgs: 4 },
            { label: 'Minimal context retry...', maxChars: 100_000, keepMsgs: 2 },
          ];

          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const config = RETRY_CONFIGS[attempt];
            const backoffMs = (attempt + 1) * 1500;
            console.warn(`Retry ${attempt + 1}/${MAX_RETRIES}: ${config.label} (backoff ${backoffMs}ms)`);
            toast.info(config.label, { duration: 3000 });

            await new Promise(r => setTimeout(r, backoffMs));
            if (controller.signal.aborted) break;

            // Progressive context reduction
            const systemMsg = apiMessages[0];
            const lastUserMsg = { ...apiMessages[apiMessages.length - 1] };
            const keepMessages = apiMessages.slice(0, Math.min(config.keepMsgs, apiMessages.length - 1));
            const reducedMessages = keepMessages[keepMessages.length - 1] === lastUserMsg
              ? keepMessages
              : [...keepMessages, lastUserMsg];

            // Truncate file content in the user message
            if (typeof lastUserMsg.content === 'string' && lastUserMsg.content.length > config.maxChars) {
              lastUserMsg.content = lastUserMsg.content.slice(0, config.maxChars) + `\n\n[Context reduced for retry attempt ${attempt + 1}. Focus on the specific request.]`;
            }
            if (Array.isArray(lastUserMsg.content)) {
              lastUserMsg.content = lastUserMsg.content.map((block: any) => {
                if (block.type === 'text' && block.text?.length > config.maxChars) {
                  return { ...block, text: block.text.slice(0, config.maxChars) + '\n[Truncated for retry]' };
                }
                return block;
              });
            }

            try {
              const retryResp = await fetchWithTimeout(BUILDER_URL, {
                method: 'POST',
                headers: fetchHeaders,
                body: buildPayload(reducedMessages),
                signal: controller.signal,
              });

              if (retryResp.ok && retryResp.body) {
                toast.success('Retry successful!', { duration: 2000 });
                setThinkingPhase(null);
                clearTimeout(phaseTimer1);
                clearTimeout(phaseTimer2);
                streaming.startStreaming();
                fullContent = '';
                await readStream(retryResp.body);
                await finalizeStream();
                setIsGenerating(false);
                setThinkingPhase(null);
                return;
              }
              // If non-ok, continue to next attempt
              console.warn(`Retry ${attempt + 1} returned ${retryResp.status}, continuing...`);
            } catch (retryErr: any) {
              if (retryErr.name === 'AbortError') break;
              console.warn(`Retry ${attempt + 1} failed:`, retryErr.message);
            }
          }
        }

        // All retries failed or not retryable — use smart error classifier
        const classified = classifyError(resp.status, errMsg);

        // ── Payload too large: trigger phase planner fallback instead of showing error ──
        if (classified.category === 'payload_too_large') {
          // Find the original user prompt from the last user message
          const lastUserContent = apiMessages[apiMessages.length - 1]?.content;
          const originalPrompt = typeof lastUserContent === 'string'
            ? lastUserContent
            : Array.isArray(lastUserContent)
            ? lastUserContent.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
            : input;
          window.dispatchEvent(new CustomEvent('phase-planner-fallback', { detail: { prompt: originalPrompt } }));
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(), role: 'assistant' as const,
              content: `🚧 **This project is too large for a single request.** I'm breaking it into phases so we can build it step by step.`,
              timestamp: new Date(),
            },
          ]);
          setIsGenerating(false);
          setThinkingPhase(null);
          clearTimeout(phaseTimer1);
          clearTimeout(phaseTimer2);
          return;
        }

        if (classified.category === 'credits') {
          toast.error(`${classified.userMessage} ${classified.suggestion}`, {
            duration: 8000,
            action: { label: 'Get Credits', onClick: () => window.dispatchEvent(new CustomEvent('open-billing')) },
          });
        } else {
          toast.error(`${classified.userMessage} ${classified.suggestion}`, { duration: 6000 });
        }
        // Attach classified error to the last assistant message for inline display
        setMessages(prev => {
          const errorAssistant: BuilderMessage = {
            id: crypto.randomUUID(), role: 'assistant',
            content: `⚠️ ${classified.userMessage}\n\n💡 **Suggestion:** ${classified.suggestion}`,
            timestamp: new Date(), classifiedError: classified,
          };
          return [...prev, errorAssistant];
        });
        setIsGenerating(false);
        setThinkingPhase(null);
        clearTimeout(phaseTimer1);
        clearTimeout(phaseTimer2);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      // Clear thinking phases once streaming starts
      setThinkingPhase(null);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      streaming.startStreaming();

      await readStream(resp.body);
      await finalizeStream();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Builder error:', err);
        const classified = classifyError(0, err.message || '', err);
        toast.error(`${classified.userMessage} ${classified.suggestion}`, { duration: 5000 });
        // Add error message to chat
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant' as const,
          content: `⚠️ ${classified.userMessage}\n\n💡 **Suggestion:** ${classified.suggestion}`,
          timestamp: new Date(), classifiedError: classified,
        }]);
      }
    } finally {
      setIsGenerating(false);
      setThinkingPhase(null);
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      abortRef.current = null;
    }
  }, [messages, isGenerating, mode, totalRemaining, deductCredits]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
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
  }, []);

  const restoreVersion = useCallback((versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version && version.files.length > 0) {
      setPreviousFiles([...latestFiles]);
      setLatestFiles([...version.files]);
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

  /** "Try to Fix" — auto-diagnose and fix a preview error (Phase 1B) */
  const tryToFix = useCallback(async (
    error: { message: string; source?: string; line?: number },
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

    // Build a targeted fix prompt
    const fixPrompt = [
      `Auto-fix error: "${error.message}"`,
      error.source ? `Source: ${error.source}${error.line ? `:${error.line}` : ''}` : '',
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
    sendMessage,
    stopGenerating,
    clearChat,
    restoreVersion,
    forwardErrorToChat,
    tryToFix,
    editAndResend,
    retryLastMessage,
    // Streaming preview state
    partialFiles: streaming.partialFiles,
    isStreamingPreview: streaming.isStreaming,
    completedFileCount: streaming.completedFileCount,
  };
}
