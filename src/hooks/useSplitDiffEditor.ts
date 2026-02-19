/**
 * Phase 113: Split Diff Editor
 * Side-by-side diff view for comparing two versions of a file.
 */
import { useCallback, useState } from 'react';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  leftLineNum: number | null;
  rightLineNum: number | null;
}

export interface FileDiff {
  filePath: string;
  leftLabel: string;
  rightLabel: string;
  leftContent: string;
  rightContent: string;
  diffLines: DiffLine[];
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
}

export function useSplitDiffEditor() {
  const [activeDiff, setActiveDiff] = useState<FileDiff | null>(null);
  const [diffHistory, setDiffHistory] = useState<FileDiff[]>([]);

  const computeDiff = useCallback((
    leftContent: string,
    rightContent: string,
    filePath: string,
    leftLabel = 'Before',
    rightLabel = 'After'
  ): FileDiff => {
    const leftLines = leftContent.split('\n');
    const rightLines = rightContent.split('\n');
    const diffLines: DiffLine[] = [];

    // Simple LCS-based diff
    const m = leftLines.length;
    const n = rightLines.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (leftLines[i - 1] === rightLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to build diff
    let i = m, j = n;
    const tempDiff: DiffLine[] = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
        tempDiff.push({ type: 'unchanged', content: leftLines[i - 1], leftLineNum: i, rightLineNum: j });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        tempDiff.push({ type: 'added', content: rightLines[j - 1], leftLineNum: null, rightLineNum: j });
        j--;
      } else {
        tempDiff.push({ type: 'removed', content: leftLines[i - 1], leftLineNum: i, rightLineNum: null });
        i--;
      }
    }
    tempDiff.reverse();

    let addedCount = 0, removedCount = 0, unchangedCount = 0;
    for (const line of tempDiff) {
      if (line.type === 'added') addedCount++;
      else if (line.type === 'removed') removedCount++;
      else unchangedCount++;
    }

    const diff: FileDiff = {
      filePath, leftLabel, rightLabel,
      leftContent, rightContent,
      diffLines: tempDiff,
      addedCount, removedCount, unchangedCount,
    };

    setActiveDiff(diff);
    return diff;
  }, []);

  const compareVersions = useCallback((
    filePath: string,
    beforeFiles: { path: string; content: string }[],
    afterFiles: { path: string; content: string }[],
  ): FileDiff | null => {
    const before = beforeFiles.find(f => f.path === filePath);
    const after = afterFiles.find(f => f.path === filePath);

    if (!before && !after) return null;

    return computeDiff(
      before?.content || '',
      after?.content || '',
      filePath,
      before ? 'Previous Version' : '(new file)',
      after ? 'Current Version' : '(deleted)',
    );
  }, [computeDiff]);

  const addToHistory = useCallback((diff: FileDiff) => {
    setDiffHistory(prev => [diff, ...prev].slice(0, 20));
  }, []);

  return {
    activeDiff,
    diffHistory,
    computeDiff,
    compareVersions,
    addToHistory,
    clearDiff: useCallback(() => setActiveDiff(null), []),
    clearHistory: useCallback(() => setDiffHistory([]), []),
  };
}
