/**
 * Wave 9 Step 2: Element-to-Source Mapping
 * Maps a visual-edit selected element back to its JSX source line.
 */

import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface SourceMatch {
  filePath: string;
  line: number;
  column: number;
  snippet: string;
}

export function useElementSourceMapper(files: ProjectFile[]) {
  const findSource = useCallback((selector: string, textContent: string, tagName: string): SourceMatch | null => {
    const tsxFiles = files.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    const normalizedText = textContent.trim().slice(0, 80);

    for (const file of tsxFiles) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match by text content inside JSX
        if (normalizedText.length > 3 && line.includes(normalizedText)) {
          return { filePath: file.path, line: i + 1, column: line.indexOf(normalizedText) + 1, snippet: line.trim() };
        }

        // Match by tag name + className from selector
        const classes = selector.match(/\.([a-zA-Z0-9_-]+)/g)?.map(c => c.slice(1)) || [];
        if (classes.length > 0) {
          const tagLower = tagName.toLowerCase();
          const hasTag = line.toLowerCase().includes(`<${tagLower}`) || line.toLowerCase().includes(`<${tagName}`);
          const hasClass = classes.some(c => line.includes(c));
          if (hasTag && hasClass) {
            return { filePath: file.path, line: i + 1, column: 1, snippet: line.trim() };
          }
        }

        // Match by id from selector
        const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch && line.includes(`id="${idMatch[1]}"`)) {
          return { filePath: file.path, line: i + 1, column: 1, snippet: line.trim() };
        }
      }
    }

    return null;
  }, [files]);

  return { findSource };
}
