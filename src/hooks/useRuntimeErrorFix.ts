import { useState, useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

/**
 * Wave 18: Runtime Error-to-Fix Loop
 * Captures runtime errors from the preview iframe and auto-triggers
 * targeted fix generation instead of full rebuilds.
 */

export interface RuntimeError {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
  type: 'runtime' | 'unhandled-rejection' | 'react-error' | 'console-error';
}

interface FixAttempt {
  error: RuntimeError;
  fixPrompt: string;
  timestamp: number;
  success: boolean;
}

const MAX_AUTO_FIX_ATTEMPTS = 2;
const COOLDOWN_MS = 10_000;
const ROOT_MOUNT_FILES = [
  'index.html',
  'main.tsx',
  'main.ts',
  'src/main.tsx',
  'src/main.ts',
  'App.tsx',
  'App.ts',
  'src/App.tsx',
  'src/App.ts',
];

function findProjectFile(files: ProjectFile[], filePath: string) {
  const normalized = filePath.replace(/^\.?\//, '');
  const baseName = normalized.split('/').pop();

  return files.find(f => f.path === normalized)
    ?? files.find(f => f.path.endsWith(`/${normalized}`))
    ?? files.find(f => baseName ? f.path.split('/').pop() === baseName : false);
}

function extractMountIdsFromHtml(content: string): string[] {
  const ids = new Set<string>();
  const matches = content.matchAll(/<([a-z][^>]*?)\sid=["']([^"']+)["'][^>]*>/gi);
  for (const match of matches) {
    if (match[2]) ids.add(match[2]);
  }
  return Array.from(ids);
}

function extractCreateRootTargets(content: string): string[] {
  const targets = new Set<string>();
  const getElementMatches = content.matchAll(/document\.getElementById\((['"`])([^'"`]+)\1\)/g);
  for (const match of getElementMatches) {
    if (match[2]) targets.add(match[2]);
  }
  return Array.from(targets);
}

function buildMountIntegritySummary(files: ProjectFile[]): string[] {
  const htmlFile = findProjectFile(files, 'index.html');
  const entryFiles = ROOT_MOUNT_FILES
    .filter(path => path !== 'index.html')
    .map(path => findProjectFile(files, path))
    .filter((file, index, arr): file is ProjectFile => Boolean(file) && arr.findIndex(candidate => candidate?.path === file?.path) === index);

  const htmlIds = htmlFile ? extractMountIdsFromHtml(htmlFile.content) : [];
  const entryTargets = entryFiles.flatMap(file => extractCreateRootTargets(file.content));
  const uniqueTargets = Array.from(new Set(entryTargets));

  const summary = [
    `Mount element ids in index.html: ${htmlIds.length > 0 ? htmlIds.join(', ') : '(none found)'}`,
    `createRoot/getElementById targets: ${uniqueTargets.length > 0 ? uniqueTargets.join(', ') : '(none found)'}`,
  ];

  if (htmlIds.length > 0 && uniqueTargets.length > 0) {
    const mismatches = uniqueTargets.filter(target => !htmlIds.includes(target));
    if (mismatches.length > 0) {
      summary.push(`Mismatch detected: ${mismatches.join(', ')} ${mismatches.length === 1 ? 'is' : 'are'} targeted by React but missing from index.html.`);
    }
  }

  return summary;
}

function decodeKnownRuntimeError(error: RuntimeError): {
  decodedMessage?: string;
  rootCause?: string;
  targetFile?: string;
  fixStrategy?: string;
  relatedFiles?: string[];
} {
  const msg = error.message.toLowerCase();

  if (msg.includes('minified react error #299') || msg.includes('invariant=299')) {
    return {
      decodedMessage: 'React error #299: createRoot target container is not a DOM element. The preview is missing the expected mount element or main.tsx is targeting the wrong container id.',
      rootCause: 'missing-root-container',
      targetFile: 'src/main.tsx',
      fixStrategy: 'Ensure index.html contains a mount element like <div id="root"></div> or <div id="app"></div>, ensure the real entry file targets that exact id, and avoid deleting or replacing that container.',
      relatedFiles: ROOT_MOUNT_FILES,
    };
  }

  return {};
}

/** Classify runtime error and determine if it's auto-fixable */
function classifyRuntimeError(error: RuntimeError): {
  fixable: boolean;
  rootCause: string;
  targetFile?: string;
  fixStrategy: string;
  relatedFiles?: string[];
  decodedMessage?: string;
} {
  const msg = error.message.toLowerCase();
  const src = error.source || '';
  const decoded = decodeKnownRuntimeError(error);

  if (decoded.rootCause) {
    return {
      fixable: true,
      rootCause: decoded.rootCause,
      targetFile: decoded.targetFile,
      fixStrategy: decoded.fixStrategy || 'Fix the decoded runtime error',
      relatedFiles: decoded.relatedFiles,
      decodedMessage: decoded.decodedMessage,
    };
  }

  // Not fixable: network errors, CORS, third-party scripts
  if (msg.includes('cors') || msg.includes('network') || msg.includes('failed to fetch')) {
    return { fixable: false, rootCause: 'network', fixStrategy: 'none' };
  }
  if (src.includes('node_modules') || src.includes('cdn') || src.includes('esm.sh')) {
    return { fixable: false, rootCause: 'third-party', fixStrategy: 'none' };
  }

  // Fixable: undefined/null reference
  if (msg.includes('cannot read propert') || msg.includes('is not defined') || msg.includes('is undefined') || msg.includes('is null')) {
    return {
      fixable: true,
      rootCause: 'null-reference',
      targetFile: extractFileFromSource(src),
      fixStrategy: 'Add null checks, optional chaining, or default values',
    };
  }

  // Fixable: missing import/module
  if (msg.includes('failed to resolve') || msg.includes('module not found') || msg.includes('cannot find module')) {
    return {
      fixable: true,
      rootCause: 'missing-import',
      targetFile: extractFileFromSource(src),
      fixStrategy: 'Fix import path or add missing export',
    };
  }

  // Fixable: React-specific errors
  if (msg.includes('invalid hook call') || msg.includes('rendered fewer hooks') || msg.includes('rendered more hooks')) {
    return {
      fixable: true,
      rootCause: 'hooks-violation',
      targetFile: extractFileFromSource(src),
      fixStrategy: 'Ensure hooks are called unconditionally at top level',
    };
  }

  // Fixable: type errors in runtime
  if (msg.includes('is not a function') || msg.includes('is not iterable')) {
    return {
      fixable: true,
      rootCause: 'type-error',
      targetFile: extractFileFromSource(src),
      fixStrategy: 'Check variable types and ensure correct API usage',
    };
  }

  // Fixable: JSX/render errors
  if (msg.includes('objects are not valid as a react child') || msg.includes('each child in a list should have')) {
    return {
      fixable: true,
      rootCause: 'react-render',
      targetFile: extractFileFromSource(src),
      fixStrategy: 'Fix JSX structure — ensure proper children and list keys',
    };
  }

  return { fixable: msg.length < 200, rootCause: 'unknown', fixStrategy: 'Analyze and fix the error' };
}

function extractFileFromSource(source: string): string | undefined {
  const match = source.match(/(src\/[\w/.-]+\.\w+)/);
  return match?.[1];
}

function appendFileContext(parts: string[], files: ProjectFile[], filePath: string, errorLine?: number) {
  const targetFile = findProjectFile(files, filePath);
  if (!targetFile) return;

  const lines = targetFile.content.split('\n');
  const start = errorLine ? Math.max(0, errorLine - 10) : 0;
  const end = errorLine ? Math.min(lines.length, errorLine + 10) : Math.min(lines.length, 80);
  const snippet = lines.slice(start, end).map((l, i) => {
    const lineNum = start + i + 1;
    const marker = errorLine && lineNum === errorLine ? ' >>> ' : '     ';
    return `${marker}${lineNum}: ${l}`;
  }).join('\n');

  parts.push(`\nRelevant code from ${targetFile.path}:\n${snippet}`);
}

/** Build a targeted fix prompt from a runtime error */
function buildFixPrompt(error: RuntimeError, classification: ReturnType<typeof classifyRuntimeError>, files: ProjectFile[]): string {
  const parts: string[] = ['[AUTO-FIX: Runtime error detected in preview]'];

  parts.push(`Error: ${error.message}`);
  if (classification.decodedMessage) parts.push(`Decoded: ${classification.decodedMessage}`);
  if (error.source) parts.push(`Source: ${error.source}${error.line ? `:${error.line}` : ''}`);
  if (error.stack) parts.push(`Stack (truncated):\n${error.stack.split('\n').slice(0, 5).join('\n')}`);

  parts.push(`\nRoot cause: ${classification.rootCause}`);
  parts.push(`Strategy: ${classification.fixStrategy}`);

  if (classification.targetFile) {
    appendFileContext(parts, files, classification.targetFile, error.line);
  }

  if (classification.rootCause === 'missing-root-container') {
    parts.push('\nMount integrity summary:');
    parts.push(...buildMountIntegritySummary(files).map(line => `- ${line}`));
  }

  for (const relatedFile of classification.relatedFiles || []) {
    if (relatedFile !== classification.targetFile) {
      appendFileContext(parts, files, relatedFile);
    }
  }

  parts.push('\nCheck mount integrity first: verify index.html still has the root/app element and the actual entry file mounts into that exact id. Prefer fixing index.html + the real entry file only.');
  parts.push(`\nFix ONLY the error above. Use ===EDIT: path=== for minimal changes. Do not restructure or restyle anything.`);

  return parts.join('\n');
}

export function useRuntimeErrorFix() {
  const [recentErrors, setRecentErrors] = useState<RuntimeError[]>([]);
  const [fixAttempts, setFixAttempts] = useState<FixAttempt[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const lastFixTimeRef = useRef(0);
  const errorCountRef = useRef(0);

  /** Record a runtime error from the preview iframe */
  const captureError = useCallback((error: RuntimeError) => {
    setRecentErrors(prev => [...prev.slice(-19), error]);
    errorCountRef.current++;
  }, []);

  /** Determine if we should auto-fix this error */
  const shouldAutoFix = useCallback((error: RuntimeError): boolean => {
    // Cooldown check
    if (Date.now() - lastFixTimeRef.current < COOLDOWN_MS) return false;

    // Max attempts check
    const recentAttempts = fixAttempts.filter(
      a => Date.now() - a.timestamp < 60_000
    );
    if (recentAttempts.length >= MAX_AUTO_FIX_ATTEMPTS) return false;

    // Don't auto-fix the same error repeatedly
    const sameErrorAttempts = fixAttempts.filter(
      a => a.error.message === error.message && Date.now() - a.timestamp < 120_000
    );
    if (sameErrorAttempts.length > 0) return false;

    const classification = classifyRuntimeError(error);
    return classification.fixable;
  }, [fixAttempts]);

  /** Build a fix prompt for the given error */
  const buildAutoFixPrompt = useCallback((error: RuntimeError, files: ProjectFile[]): string | null => {
    const classification = classifyRuntimeError(error);
    if (!classification.fixable) return null;
    return buildFixPrompt(error, classification, files);
  }, []);

  /** Record that a fix was attempted */
  const recordFixAttempt = useCallback((error: RuntimeError, fixPrompt: string, success: boolean) => {
    lastFixTimeRef.current = Date.now();
    setFixAttempts(prev => [...prev.slice(-9), {
      error,
      fixPrompt,
      timestamp: Date.now(),
      success,
    }]);
    setIsAutoFixing(false);
  }, []);

  /** Clear errors (e.g., after successful compilation) */
  const clearErrors = useCallback(() => {
    setRecentErrors([]);
    errorCountRef.current = 0;
  }, []);

  return {
    recentErrors,
    isAutoFixing,
    setIsAutoFixing,
    captureError,
    shouldAutoFix,
    buildAutoFixPrompt,
    recordFixAttempt,
    clearErrors,
    fixAttemptCount: fixAttempts.length,
  };
}
