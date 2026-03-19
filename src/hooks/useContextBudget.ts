/**
 * Context Budget Overflow Protection — Phase 55
 * Prevents exceeding model token limits by trimming file context proactively.
 * Step 6: File-type scoring + skeleton mode for large low-priority files.
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

/** CSS and config files are deprioritized to save budget for component code */
const CSS_EXTENSIONS = ['.css', '.scss', '.less', '.sass'];
const CONFIG_FILES = ['tailwind.config', 'postcss.config', 'vite.config', 'package.json', 'tsconfig.json', '.eslintrc'];

function isCSS(path: string): boolean {
  return CSS_EXTENSIONS.some(ext => path.endsWith(ext));
}

function isConfig(path: string): boolean {
  const name = path.split('/').pop() || '';
  return CONFIG_FILES.some(cf => name.startsWith(cf));
}

/** Skeleton mode: first 50 + last 20 lines with omission comment */
function skeletonize(content: string): string {
  const lines = content.split('\n');
  if (lines.length <= 80) return content;
  const head = lines.slice(0, 50).join('\n');
  const tail = lines.slice(-20).join('\n');
  const omitted = lines.length - 70;
  return `${head}\n// ... ${omitted} lines omitted (skeleton mode — imports/exports preserved)\n${tail}`;
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
   * Priority: activeFile > mentioned files > import-referenced > rest (skeleton/manifest)
   */
  const trimForContext = useCallback((
    files: ProjectFile[],
    activeFilePath: string | null,
    userPrompt: string,
  ): TrimResult => {
    const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);

    // If under budget, send everything
    if (totalChars <= maxChars) {
      for (const f of files) fileHashesRef.current.set(f.path, hash(f.content));
      return {
        files: files.map(f => ({ path: f.path, content: f.content })),
        wasTrimmed: false,
        omittedFiles: [],
        totalChars,
      };
    }

    // Priority scoring with file-type awareness
    const scored = files.map(f => {
      let score = 0;
      if (f.path === activeFilePath) score += 100;
      if (userPrompt.includes(f.path)) score += 50;
      const fileName = f.path.split('/').pop() || '';
      if (userPrompt.toLowerCase().includes(fileName.toLowerCase())) score += 30;
      const prevHash = fileHashesRef.current.get(f.path);
      if (!prevHash || prevHash !== hash(f.content)) score += 20;
      if (f.content.length < 2000) score += 10;
      // Step 6: Deprioritize CSS and config files
      if (isCSS(f.path)) score -= 20;
      if (isConfig(f.path)) score -= 15;
      return { file: f, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const included: { path: string; content: string }[] = [];
    const omitted: string[] = [];
    let charBudget = maxChars;

    for (const { file, score } of scored) {
      // Always include full content for high-priority files (active, mentioned)
      if (score >= 50) {
        included.push({ path: file.path, content: file.content });
        charBudget -= file.content.length;
        fileHashesRef.current.set(file.path, hash(file.content));
      } else if (charBudget >= file.content.length) {
        // Fits in budget — include full
        included.push({ path: file.path, content: file.content });
        charBudget -= file.content.length;
        fileHashesRef.current.set(file.path, hash(file.content));
      } else if (file.content.length > 3000) {
        // Step 6: Skeleton mode for large low-priority files
        const skeleton = skeletonize(file.content);
        included.push({ path: file.path, content: skeleton });
        charBudget -= skeleton.length;
        omitted.push(file.path);
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
