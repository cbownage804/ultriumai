import { useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export function useDocGenerator() {
  /** Generate a JSDoc prompt for a specific file */
  const generateDocPrompt = useCallback((file: ProjectFile): string => {
    return `Generate JSDoc comments for all exported functions and components in this file.
Do NOT modify any logic. Only add documentation comments above each export.
Return the full file with comments added using ===FILE: ${file.path}=== format.

${file.content}`;
  }, []);

  /** Generate a README.md based on the project structure */
  const generateReadmePrompt = useCallback((files: ProjectFile[], projectName: string): string => {
    const tree = files.map(f => f.path).sort().join('\n');
    const components = files
      .filter(f => /\.(tsx|jsx)$/.test(f.path))
      .map(f => {
        const name = f.path.split('/').pop()?.replace(/\.\w+$/, '') || f.path;
        const hasExport = /export\s+(default\s+)?function\s+(\w+)/.exec(f.content);
        const propsMatch = /interface\s+(\w+Props)\s*\{([^}]*)\}/s.exec(f.content);
        return {
          name: hasExport?.[2] || name,
          path: f.path,
          hasProps: !!propsMatch,
          propsName: propsMatch?.[1],
        };
      });

    return `Generate a professional README.md for this project called "${projectName}".

Include:
1. Project title and one-line description
2. Tech stack (infer from file types)
3. Project structure (based on file tree below)
4. Key components list with brief descriptions
5. Getting started instructions
6. Available scripts

File tree:
${tree}

Components found:
${components.map(c => `- ${c.name} (${c.path})${c.hasProps ? ` — Props: ${c.propsName}` : ''}`).join('\n')}

Return ONLY the README.md content in ===FILE: README.md=== format.`;
  }, []);

  /** Generate component documentation prompt */
  const generateComponentDocPrompt = useCallback((file: ProjectFile): string => {
    return `Generate Storybook-style documentation for this React component.

Include:
- Component name and description
- Props table (name, type, default, description)
- Usage example with code snippet
- Any key behaviors or states

Format as markdown. Return in ===FILE: docs/${file.path.replace(/\.\w+$/, '.md')}=== format.

${file.content}`;
  }, []);

  return {
    generateDocPrompt,
    generateReadmePrompt,
    generateComponentDocPrompt,
  };
}
