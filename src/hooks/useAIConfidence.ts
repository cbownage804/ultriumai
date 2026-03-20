import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Wave 17: AI Reasoning & Confidence Engine
 * Enhances AI output quality through chain-of-thought planning,
 * multi-pass self-review, confidence scoring, and automatic error recovery.
 */

export interface ConfidenceResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: ConfidenceFactor[];
  shouldRetry: boolean;
  retryReason?: string;
}

interface ConfidenceFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface ReasoningPlan {
  steps: PlanStep[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  estimatedFiles: number;
  suggestedApproach: string;
}

interface PlanStep {
  order: number;
  action: string;
  targetFiles: string[];
  reasoning: string;
}

// ── Complexity analysis ──
function analyzeRequestComplexity(input: string, fileCount: number): ReasoningPlan['estimatedComplexity'] {
  const lower = input.toLowerCase();
  const complexSignals = [
    /\b(full|complete|entire|whole|redesign|rewrite|overhaul|rebuild)\b/,
    /\b(authentication|auth|login|signup|payment|stripe|checkout)\b/,
    /\b(dashboard|admin|crud|api|database|schema)\b/,
    /\b(real-?time|websocket|subscription|live)\b/,
    /\band\b.*\band\b.*\band\b/, // Multiple "and" — multi-feature request
  ];
  const simpleSignals = [
    /\b(change|update|fix|tweak|adjust|modify)\b.*\b(color|font|text|size|margin|padding|spacing)\b/,
    /\b(add|remove)\b.*\b(button|link|image|icon)\b/,
    /^(fix|update|change)\b/,
  ];

  const complexScore = complexSignals.filter(r => r.test(lower)).length;
  const simpleScore = simpleSignals.filter(r => r.test(lower)).length;

  if (complexScore >= 2 || (complexScore >= 1 && fileCount > 10)) return 'complex';
  if (simpleScore >= 2 || input.length < 80) return 'simple';
  return 'moderate';
}

/**
 * Build a chain-of-thought planning directive for complex requests.
 */
export function buildReasoningDirective(
  input: string,
  files: ProjectFile[],
): string | null {
  const complexity = analyzeRequestComplexity(input, files.length);

  // Simple requests don't need planning overhead
  if (complexity === 'simple') return null;

  const directive = complexity === 'complex'
    ? `[CHAIN-OF-THOUGHT PLANNING — MANDATORY for this complex request]
Before generating ANY code, you MUST first output a numbered plan (3-7 steps) describing:
1. What files you will create or modify
2. What each change accomplishes
3. Dependencies between changes (what must come first)
4. Potential edge cases to handle

Then implement the plan step-by-step. After ALL code output, include a brief self-review:
- Are all imports resolved?
- Are all referenced components/functions defined?
- Will the preview render without errors?
- Did you address everything the user asked for?

Format: Start with "## Plan" then numbered steps, then code, then "## Review" with a checklist.`
    : `[STRUCTURED APPROACH — Recommended]
Before generating code, briefly outline your approach (2-3 sentences).
After code output, verify: imports resolved, components defined, no missing dependencies.`;

  return directive;
}

/**
 * Score the confidence of generated output through static analysis.
 */
export function scoreConfidence(
  generatedFiles: ProjectFile[],
  existingFiles: ProjectFile[],
  userRequest: string,
): ConfidenceResult {
  const factors: ConfidenceFactor[] = [];

  // Factor 1: Import resolution — can all imports be resolved?
  const existingPaths = new Set(existingFiles.map(f => f.path));
  const allPaths = new Set([...existingPaths, ...generatedFiles.map(f => f.path)]);
  let resolvedImports = 0;
  let totalImports = 0;

  for (const f of generatedFiles) {
    const imports = f.content.match(/from\s+['"](@\/|\.\.?\/)([^'"]+)['"]/g) || [];
    totalImports += imports.length;
    for (const imp of imports) {
      const pathMatch = imp.match(/['"](@\/|\.\.?\/)([^'"]+)['"]/);
      if (!pathMatch) continue;
      let resolved = pathMatch[2];
      if (pathMatch[1] === '@/') resolved = 'src/' + resolved;
      const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      if (exts.some(e => allPaths.has(resolved + e))) resolvedImports++;
    }
  }
  const importScore = totalImports === 0 ? 100 : Math.round((resolvedImports / totalImports) * 100);
  factors.push({ name: 'Import Resolution', score: importScore, weight: 0.3, details: `${resolvedImports}/${totalImports} imports resolved` });

  // Factor 2: Syntax completeness — balanced brackets
  let syntaxIssues = 0;
  for (const f of generatedFiles) {
    const opens = (f.content.match(/[{(\[]/g) || []).length;
    const closes = (f.content.match(/[})\]]/g) || []).length;
    if (Math.abs(opens - closes) > 2) syntaxIssues++;
  }
  const syntaxScore = Math.max(0, 100 - syntaxIssues * 25);
  factors.push({ name: 'Syntax Integrity', score: syntaxScore, weight: 0.25, details: `${syntaxIssues} files with bracket imbalance` });

  // Factor 3: Completeness — does the output address the user's request?
  const requestKeywords = userRequest.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const uniqueKeywords = [...new Set(requestKeywords)].filter(k =>
    !['with', 'that', 'this', 'from', 'have', 'make', 'like', 'want', 'need', 'please', 'should', 'would', 'could'].includes(k)
  );
  const allContent = generatedFiles.map(f => f.content.toLowerCase()).join(' ');
  const matchedKeywords = uniqueKeywords.filter(k => allContent.includes(k));
  const completenessScore = uniqueKeywords.length === 0 ? 80 : Math.round((matchedKeywords.length / uniqueKeywords.length) * 100);
  factors.push({ name: 'Request Coverage', score: completenessScore, weight: 0.25, details: `${matchedKeywords.length}/${uniqueKeywords.length} keywords addressed` });

  // Factor 4: Output quality — no AI prose, proper structure
  let qualityDeductions = 0;
  for (const f of generatedFiles) {
    const lastLines = f.content.split('\n').slice(-5);
    if (lastLines.some(l => /^(I've |Here's |This |Let me |Great|Perfect|Done)/i.test(l.trim()))) qualityDeductions += 15;
    if (f.content.length < 20) qualityDeductions += 10; // Nearly empty file
    if (f.content.includes('// TODO') || f.content.includes('/* TODO')) qualityDeductions += 5;
  }
  const qualityScore = Math.max(0, 100 - qualityDeductions);
  factors.push({ name: 'Output Quality', score: qualityScore, weight: 0.2, details: `${qualityDeductions} quality deductions` });

  // Overall score
  const overall = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
  const grade: ConfidenceResult['grade'] =
    overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F';

  // Should retry if score is very low
  const shouldRetry = overall < 50;
  const retryReason = shouldRetry
    ? factors.filter(f => f.score < 50).map(f => f.name).join(', ') + ' scored below threshold'
    : undefined;

  return { score: overall, grade, factors, shouldRetry, retryReason };
}

/**
 * Hook for managing AI confidence scoring and reasoning.
 */
export function useAIConfidence() {
  const [lastConfidence, setLastConfidence] = useState<ConfidenceResult | null>(null);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const MAX_AUTO_RETRIES = 2;

  const evaluateOutput = useCallback((
    generated: ProjectFile[],
    existing: ProjectFile[],
    request: string,
  ): ConfidenceResult => {
    const result = scoreConfidence(generated, existing, request);
    setLastConfidence(result);
    return result;
  }, []);

  const shouldAutoRetry = useCallback((): boolean => {
    if (!lastConfidence) return false;
    return lastConfidence.shouldRetry && autoRetryCount < MAX_AUTO_RETRIES;
  }, [lastConfidence, autoRetryCount]);

  const recordRetry = useCallback(() => {
    setAutoRetryCount(prev => prev + 1);
  }, []);

  const resetRetryCount = useCallback(() => {
    setAutoRetryCount(0);
  }, []);

  return {
    lastConfidence,
    autoRetryCount,
    evaluateOutput,
    shouldAutoRetry,
    recordRetry,
    resetRetryCount,
    buildReasoningDirective,
  };
}
