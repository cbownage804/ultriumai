import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ProjectFile } from './useProjectFileSystem';
import { useStreamingPreview } from './useStreamingPreview';
import { useUserCredits } from './useUserCredits';
import { detectSupabaseIntents, buildSupabaseContext, buildConversationMemory, buildErrorDiagnosisContext, analyzeConversationComplexity, generateProactiveSuggestions, compressConversationHistory, detectCommunicationStyle, extractUserPreferences, buildPreferencesContext, detectWorkflowIntent, buildEnhancedErrorContext, buildVisualIntelligenceContext, detectWebSearchIntent, buildWebSearchContext, detectURLCloneIntent } from '@/components/ai-builder/SupabaseConversational';

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
  ];
  return markers.some(r => r.test(trimmed));
}

/** Parse the ===FILE: path=== and ===DELETE: path=== delimited format */
export function parseMultiFileOutput(raw: string): { files: ProjectFile[]; deletions: string[] } {
  const lines = raw.split('\n');
  const files: ProjectFile[] = [];
  const deletions: string[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let blankLineStreak = 0;

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
    const deleteMatch = line.match(DELETE_DELIMITER);
    if (deleteMatch) {
      flush();
      currentPath = null;
      currentLines = [];
      blankLineStreak = 0;
      deletions.push(deleteMatch[1].trim());
      continue;
    }
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flush();
      currentPath = match[1].trim();
      currentLines = [];
      blankLineStreak = 0;
    } else if (currentPath !== null) {
      // Track blank lines — conversational text after 2+ blank lines signals end of file
      if (!line.trim()) {
        blankLineStreak++;
        currentLines.push(line);
      } else if (blankLineStreak >= 1 && isConversationalLine(line)) {
        // End of file content — AI started talking (even after 1 blank line)
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
  // This catches cases where AI commentary is appended without blank line gaps
  for (const file of files) {
    const fileLines = file.content.split('\n');
    let cutIndex = fileLines.length;
    
    // Scan from the end to find where conversational text starts
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

  if (files.length === 0 && deletions.length === 0) {
    const trimmed = raw.trim();
    const htmlMatch = trimmed.match(/```html\n?([\s\S]*?)```/);
    const html = htmlMatch ? htmlMatch[1] : trimmed;
    if (html.includes('<') && html.includes('>')) {
      files.push({ path: 'index.html', content: html, language: 'html' });
    }
  }

  return { files, deletions };
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
  const abortRef = useRef<AbortController | null>(null);
  const streaming = useStreamingPreview();
  const { deductCredits, totalRemaining } = useUserCredits();

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

    // Detect fix/retry requests — these should be free to avoid burning credits on repeated fixes
    const isFixRequest = isAutoFix || /\b(fix|broken|doesn'?t work|not working|still broken|won'?t|can'?t|bug|error|issue|remove.*(button|doesn|broken|work)|delete.*(button|doesn|broken|work))\b/i.test(input);

    // Check credits before sending — AUTO-FIX and fix requests are free
    const creditCost = mode === 'build' ? 3 : 1;
    if (!isFixRequest && totalRemaining < creditCost) {
      toast.error(`Insufficient credits. You need ${creditCost} but have ${totalRemaining}. Purchase more to continue.`);
      return;
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

    // Prepend knowledge context if provided
    if (knowledgeContext) {
      apiMessages.push({ role: 'system', content: knowledgeContext });
    }

    // Inject conversational Supabase context based on intent detection
    const detectedIntents = detectSupabaseIntents(input);
    const hasSupabase = !!supabaseConfig;
    const supabaseContext = buildSupabaseContext(detectedIntents, hasSupabase);
    if (supabaseContext) {
      apiMessages.push({ role: 'system', content: supabaseContext });
    }

    // Inject conversation memory for multi-turn coherence
    const memoryContext = buildConversationMemory(
      messages.map(m => ({ role: m.role, content: m.content }))
    );
    if (memoryContext) {
      apiMessages.push({ role: 'system', content: memoryContext });
    }

    // Inject adaptive tone based on user's communication style
    const userTexts = messages.filter(m => m.role === 'user').map(m => m.content);
    const { prompt: tonePrompt } = detectCommunicationStyle(userTexts);
    if (tonePrompt) {
      apiMessages.push({ role: 'system', content: tonePrompt });
    }

    // Inject learned user preferences
    const prefs = extractUserPreferences(messages.map(m => ({ role: m.role, content: m.content })));
    const prefsContext = buildPreferencesContext(prefs);
    if (prefsContext) {
      apiMessages.push({ role: 'system', content: prefsContext });
    }

    // Detect multi-step workflow and inject step context
    const workflow = detectWorkflowIntent(input);
    if (workflow) {
      apiMessages.push({ role: 'system', content: `[WORKFLOW DETECTED] The user has a multi-step request with ${workflow.steps.length} steps:\n${workflow.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nExecute ALL steps in sequence in a single response. Show progress for each step.` });
    }

    // Inject visual intelligence context when images are attached
    const visualContext = buildVisualIntelligenceContext(!!(imageDataUrls?.length), input);
    if (visualContext) {
      apiMessages.push({ role: 'system', content: visualContext });
    }

    // Detect web search intent and inject search guidance
    const searchIntent = detectWebSearchIntent(input);
    if (searchIntent.shouldSearch) {
      apiMessages.push({ role: 'system', content: `[WEB SEARCH INTENT] The user wants current information about: ${searchIntent.queries.join(', ')}. Use your training knowledge to provide the most up-to-date, accurate information. Reference official documentation where possible. Then generate code incorporating that knowledge.` });
    }

    // Detect URL clone intent
    const urlClone = detectURLCloneIntent(input);
    if (urlClone.hasURL && urlClone.url) {
      apiMessages.push({ role: 'system', content: `[URL CLONE] The user wants to clone/replicate the design from: ${urlClone.url}. Analyze the typical design patterns of this website and generate a faithful reproduction. Focus on layout structure, color scheme, typography, and component patterns.` });
    }

    // Smart conversation compression — keep recent messages intact, compress older ones
    const rawHistory = messages.map(m => ({ role: m.role, content: m.content }));
    const compressedHistory = compressConversationHistory(rawHistory, 8, MAX_CONTEXT_MESSAGES);
    
    for (const m of compressedHistory) {
      // Strip file content from old assistant messages to save tokens
      const content = m.role === 'assistant'
        ? m.content.replace(/===FILE:[\s\S]*?(?====FILE:|$)/g, '[file content omitted]').slice(0, 500)
        : m.content;
      apiMessages.push({ role: m.role, content });
    }

    // Build the user message content — send manifest + only relevant files for efficiency
    const buildFileContext = (files: ProjectFile[], userInput: string): string => {
      if (files.length === 0) return userInput;

      // Build a compact manifest of all files
      const manifest = files.map(f => `  - ${f.path} (${f.content.length} chars)`).join('\n');

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

      const scored = files.map(f => {
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

        // Import graph: if a high-scored file imports this file, boost it
        // (simplified: check if any file that scores >5 imports this file)
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

      // Take files with score > 0, sorted by score, limited to top 15 for token efficiency
      const MAX_FILES = 15;
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_FILES);

      const filesToSend = relevant.length > 0 ? relevant.map(s => s.file) : files.slice(0, MAX_FILES);
      const fileContext = filesToSend.map(f => `===FILE: ${f.path}===\n${f.content}`).join('\n\n');

      const omittedCount = files.length - filesToSend.length;
      const omittedNote = omittedCount > 0
        ? `\n\n(${omittedCount} other files exist but are omitted for brevity. Only output files you need to change.)`
        : '';

      return `PROJECT FILE MANIFEST (${files.length} files total):\n${manifest}${structureNote}\n\nFILE CONTENTS:\n${fileContext}${omittedNote}\n\nIMPORTANT: Only output ===FILE: path=== blocks for files you are CHANGING. To delete a file, use ===DELETE: path===. Do NOT re-output unchanged files.\n\nAFTER all ===FILE: blocks, write a brief 1-2 sentence conversational summary of what you changed and why — be friendly and helpful like a coding assistant. Example: "I've updated the header component with your new color scheme and added the mobile menu you asked for. Let me know if you'd like any tweaks!"\n\nUser request: ${userInput}`;
    };

    if (imageDataUrls?.length) {
      const userContent: any[] = [
        { type: 'text', text: buildFileContext(currentFiles, input) },
        ...imageDataUrls.map(url => ({ type: 'image_url', image_url: { url } })),
      ];
      apiMessages.push({ role: 'user', content: userContent });
    } else {
      apiMessages.push({ role: 'user', content: buildFileContext(currentFiles, input) });
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let fullContent = '';

    try {
      const resp = await fetch(BUILDER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          stream: true,
          mode: effectiveMode,
          model: model || undefined,
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          activeServices: serviceKeys?.map(sk => sk.serviceId) || [],
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Unknown error' }));
        if (resp.status === 429) {
          toast.error('Rate limited — please wait 30 seconds and try again.', { duration: 6000 });
        } else if (resp.status === 402) {
          toast.error('AI credits exhausted. Purchase more credits to continue building.', {
            duration: 8000,
            action: { label: 'Get Credits', onClick: () => window.dispatchEvent(new CustomEvent('open-billing')) },
          });
        } else if (resp.status === 504 || resp.status === 408) {
          toast.error('Request timed out. The AI is overloaded — try again with a simpler prompt.', { duration: 6000 });
        } else if (resp.status >= 500) {
          toast.error('Server error — our AI service is temporarily unavailable. Please try again in a moment.', { duration: 6000 });
        } else {
          toast.error(errData.error || 'Failed to generate. Check your prompt and try again.');
        }
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

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const upsertAssistant = (content: string) => {
        fullContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [
            ...prev,
            { id: crypto.randomUUID(), role: 'assistant' as const, content, timestamp: new Date() },
          ];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
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
              const newContent = fullContent + delta;
              upsertAssistant(newContent);
              // Incrementally parse files for hot-reload
              streaming.parseIncremental(newContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
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

      // Parse multi-file output — store as pending for approval
      const { files: parsedFiles, deletions } = parseMultiFileOutput(fullContent);
      if (parsedFiles.length > 0 || deletions.length > 0) {
        // Merge: start with current files, remove deletions, then overlay changed files
        let mergedFiles = [...currentFiles];
        
        // Process deletions
        if (deletions.length > 0) {
          mergedFiles = mergedFiles.filter(f => !deletions.includes(f.path));
        }
        
        // Process additions/updates
        for (const newFile of parsedFiles) {
          const existingIdx = mergedFiles.findIndex(f => f.path === newFile.path);
          if (existingIdx >= 0) {
            mergedFiles[existingIdx] = newFile;
          } else {
            mergedFiles.push(newFile);
          }
        }
        // Auto-apply files (approval UI in chat shows summary, user can revert)
        setLatestFiles(mergedFiles);
      }
      streaming.stopStreaming();

      // Track token usage and deduct credits
      const msgTokens = estimateTokens(input + fullContent);
      setTotalTokensUsed(prev => prev + msgTokens);
      
      // Deduct credits after successful generation — but NOT for auto-fixes or fix requests
      if (!isFixRequest) {
        await deductCredits(creditCost, `App Builder ${effectiveMode === 'build' ? 'build' : 'chat'}`);
      }
      // Add suggestions + file count + token estimate + filesSnapshot to the final assistant message
      const suggestions = generateSuggestions(fullContent, effectiveMode, messages, currentFiles);
      const totalChanges = parsedFiles.length + deletions.length;
      const snapshot = totalChanges > 0 ? [...currentFiles, ...parsedFiles.filter(pf => !currentFiles.some(cf => cf.path === pf.path))] : [...currentFiles];
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, filesGenerated: totalChanges || undefined, suggestions, tokenEstimate: msgTokens, filesSnapshot: snapshot }
            : m
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Builder error:', err);
        const errorMsg = err.message?.includes('fetch')
          ? 'Network error — check your connection and try again.'
          : err.message?.includes('timeout') || err.message?.includes('Timeout')
          ? 'Request timed out. Try a simpler prompt or try again.'
          : 'Something went wrong during generation. Your project files are safe — try again.';
        toast.error(errorMsg, { duration: 5000 });
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
    totalTokensUsed,
    sendMessage,
    stopGenerating,
    clearChat,
    restoreVersion,
    forwardErrorToChat,
    // Streaming preview state
    partialFiles: streaming.partialFiles,
    isStreamingPreview: streaming.isStreaming,
    completedFileCount: streaming.completedFileCount,
  };
}
