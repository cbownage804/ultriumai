/**
 * Context Budget Overflow Protection — Phase 55
 * Prevents exceeding model token limits by trimming file context proactively.
 */

import { useCallback, useRef } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

interface ContextBudgetOptions {
  /** Max characters to send (rough proxy for tokens; ~4 chars/token) */
  maxChars?: number;
}

interface TrimResult {
  files: { path: string; content: string }[];
  wasTrimmed: boolean;
  omittedFiles: string[];
  totalChars: number;
}

export function useContextBudget(options: ContextBudgetOptions = {}) {
  const { maxChars = 120_000 } = options; // ~30k tokens
  const fileHashesRef = useRef<Map<string, string>>(new Map());

  /** Simple hash for content change detection */
  const hash = (s: string): string => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h.toString(36);
  };

  /**
   * Trim project files to fit within the context budget.
   * Priority: activeFile > mentioned files > import-referenced > rest (manifest only)
   */
  const trimForContext = useCallback((
    files: ProjectFile[],
    activeFilePath: string | null,
    userPrompt: string,
  ): TrimResult => {
    const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);

    // If under budget, send everything
    if (totalChars <= maxChars) {
      // Update hashes
      for (const f of files) fileHashesRef.current.set(f.path, hash(f.content));
      return {
        files: files.map(f => ({ path: f.path, content: f.content })),
        wasTrimmed: false,
        omittedFiles: [],
        totalChars,
      };
    }

    // Priority scoring
    const scored = files.map(f => {
      let score = 0;
      if (f.path === activeFilePath) score += 100;
      if (userPrompt.includes(f.path)) score += 50;
      // Files mentioned by name in prompt
      const fileName = f.path.split('/').pop() || '';
      if (userPrompt.toLowerCase().includes(fileName.toLowerCase())) score += 30;
      // Changed since last send
      const prevHash = fileHashesRef.current.get(f.path);
      if (!prevHash || prevHash !== hash(f.content)) score += 20;
      // Smaller files are cheaper to include
      if (f.content.length < 2000) score += 10;
      return { file: f, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const included: { path: string; content: string }[] = [];
    const omitted: string[] = [];
    let charBudget = maxChars;

    for (const { file, score } of scored) {
      if (charBudget >= file.content.length || score >= 50) {
        included.push({ path: file.path, content: file.content });
        charBudget -= file.content.length;
        fileHashesRef.current.set(file.path, hash(file.content));
      } else {
        // Manifest mode: path + hash only
        included.push({
          path: file.path,
          content: `// [MANIFEST] File hash: ${hash(file.content)} (${file.content.length} chars) — content omitted to fit context budget`,
        });
        omitted.push(file.path);
      }
    }

    return {
      files: included,
      wasTrimmed: true,
      omittedFiles: omitted,
      totalChars: included.reduce((sum, f) => sum + f.content.length, 0),
    };
  }, [maxChars]);

  return { trimForContext };
}
