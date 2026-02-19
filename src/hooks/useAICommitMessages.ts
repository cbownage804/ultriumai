/**
 * AI Commit Message Generator — Phase 156
 * Analyzes file diffs and generates conventional commit messages.
 */
import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface CommitMessage {
  id: string;
  type: 'feat' | 'fix' | 'refactor' | 'style' | 'docs' | 'test' | 'chore' | 'perf';
  scope: string;
  subject: string;
  body: string;
  breaking: boolean;
  filesChanged: string[];
  timestamp: Date;
}

export interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  oldContent?: string;
  newContent?: string;
}

const TYPE_LABELS: Record<CommitMessage['type'], string> = {
  feat: '✨ Feature',
  fix: '🐛 Bug Fix',
  refactor: '♻️ Refactor',
  style: '💅 Style',
  docs: '📝 Docs',
  test: '✅ Test',
  chore: '🔧 Chore',
  perf: '⚡ Performance',
};

export function useAICommitMessages() {
  const [messages, setMessages] = useState<CommitMessage[]>([]);
  const [currentDiffs, setCurrentDiffs] = useState<FileDiff[]>([]);

  const computeDiffs = useCallback((oldFiles: ProjectFile[], newFiles: ProjectFile[]): FileDiff[] => {
    const oldMap = new Map(oldFiles.map(f => [f.path, f]));
    const newMap = new Map(newFiles.map(f => [f.path, f]));
    const diffs: FileDiff[] = [];

    for (const [path, file] of newMap) {
      const old = oldMap.get(path);
      if (!old) {
        diffs.push({ path, status: 'added', additions: file.content.split('\n').length, deletions: 0, newContent: file.content });
      } else if (old.content !== file.content) {
        const oldLines = old.content.split('\n');
        const newLines = file.content.split('\n');
        diffs.push({
          path, status: 'modified',
          additions: Math.max(0, newLines.length - oldLines.length),
          deletions: Math.max(0, oldLines.length - newLines.length),
          oldContent: old.content, newContent: file.content,
        });
      }
    }

    for (const path of oldMap.keys()) {
      if (!newMap.has(path)) {
        diffs.push({ path, status: 'deleted', additions: 0, deletions: oldMap.get(path)!.content.split('\n').length, oldContent: oldMap.get(path)!.content });
      }
    }

    setCurrentDiffs(diffs);
    return diffs;
  }, []);

  const inferType = useCallback((diffs: FileDiff[]): CommitMessage['type'] => {
    const paths = diffs.map(d => d.path.toLowerCase());
    if (paths.some(p => p.includes('test') || p.includes('spec'))) return 'test';
    if (paths.some(p => p.includes('.md') || p.includes('doc'))) return 'docs';
    if (paths.some(p => p.includes('.css') || p.includes('style') || p.includes('theme'))) return 'style';
    if (diffs.every(d => d.status === 'modified') && diffs.length <= 3) return 'refactor';
    if (diffs.some(d => d.status === 'added')) return 'feat';
    if (diffs.some(d => d.status === 'deleted')) return 'chore';
    return 'fix';
  }, []);

  const inferScope = useCallback((diffs: FileDiff[]): string => {
    const dirs = diffs.map(d => {
      const parts = d.path.split('/');
      return parts.length > 2 ? parts[parts.length - 2] : parts[0];
    });
    const unique = [...new Set(dirs)];
    return unique.length === 1 ? unique[0] : unique.length <= 3 ? unique.join(',') : 'multiple';
  }, []);

  const buildPrompt = useCallback((diffs: FileDiff[]): string => {
    const diffSummary = diffs.map(d => {
      const badge = d.status === 'added' ? '[A]' : d.status === 'deleted' ? '[D]' : '[M]';
      return `${badge} ${d.path} (+${d.additions}/-${d.deletions})`;
    }).join('\n');

    return `Generate a conventional commit message for these changes.

Changed files:
${diffSummary}

Format: type(scope): subject
Types: feat, fix, refactor, style, docs, test, chore, perf

Rules:
- Subject should be imperative mood, lowercase, no period, max 72 chars
- Add a body with bullet points explaining key changes
- Note if there are breaking changes

Return format:
TYPE: <type>
SCOPE: <scope>
SUBJECT: <subject>
BODY: <body>
BREAKING: <true/false>`;
  }, []);

  const generateLocal = useCallback((diffs: FileDiff[]): CommitMessage => {
    const type = inferType(diffs);
    const scope = inferScope(diffs);
    const fileNames = diffs.map(d => d.path.split('/').pop()?.replace(/\.\w+$/, '')).filter(Boolean);
    const subject = diffs.length === 1
      ? `${diffs[0].status === 'added' ? 'add' : diffs[0].status === 'deleted' ? 'remove' : 'update'} ${fileNames[0]}`
      : `update ${fileNames.slice(0, 3).join(', ')}${fileNames.length > 3 ? ` and ${fileNames.length - 3} more` : ''}`;

    const msg: CommitMessage = {
      id: crypto.randomUUID(),
      type, scope, subject,
      body: diffs.map(d => `- ${d.status} ${d.path} (+${d.additions}/-${d.deletions})`).join('\n'),
      breaking: false,
      filesChanged: diffs.map(d => d.path),
      timestamp: new Date(),
    };
    setMessages(prev => [msg, ...prev].slice(0, 50));
    return msg;
  }, [inferType, inferScope]);

  const clearHistory = useCallback(() => setMessages([]), []);

  return {
    messages, currentDiffs, typeLabels: TYPE_LABELS,
    computeDiffs, buildPrompt, generateLocal, inferType, inferScope, clearHistory,
  };
}
