/**
 * AI Documentation Writer — Phase 158
 * Generates JSDoc, README, and API docs with configurable verbosity.
 */
import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export type VerbosityLevel = 'minimal' | 'standard' | 'detailed';
export type DocType = 'jsdoc' | 'readme' | 'api' | 'component' | 'changelog';

export interface DocResult {
  id: string;
  type: DocType;
  filePath: string;
  content: string;
  verbosity: VerbosityLevel;
  timestamp: Date;
}

export function useAIDocWriter() {
  const [results, setResults] = useState<DocResult[]>([]);
  const [verbosity, setVerbosity] = useState<VerbosityLevel>('standard');

  const buildJSDocPrompt = useCallback((file: ProjectFile, level: VerbosityLevel): string => {
    const detail = level === 'minimal'
      ? 'Add brief one-line JSDoc comments above each export.'
      : level === 'detailed'
        ? 'Add comprehensive JSDoc with @param, @returns, @example, @throws, and @description for every export.'
        : 'Add standard JSDoc with @param and @returns for each export.';

    return `Generate JSDoc comments for all exported functions/components in this file.
${detail}
Do NOT modify any logic. Only add documentation comments.
Return the full file with comments in ===FILE: ${file.path}=== format.

${file.content}`;
  }, []);

  const buildReadmePrompt = useCallback((files: ProjectFile[], projectName: string, level: VerbosityLevel): string => {
    const tree = files.map(f => f.path).sort().join('\n');
    const components = files.filter(f => /\.(tsx|jsx)$/.test(f.path));
    const hooks = files.filter(f => f.path.includes('/hooks/') || f.path.match(/use[A-Z]/));

    const sections = level === 'minimal'
      ? 'Title, one-line description, tech stack, and getting started.'
      : level === 'detailed'
        ? 'Title, description, features list, tech stack with versions, architecture diagram (mermaid), project structure, component API table, hooks reference, environment setup, scripts, deployment guide, contributing guidelines, and license.'
        : 'Title, description, tech stack, project structure, key components, hooks, getting started, and scripts.';

    return `Generate a professional README.md for "${projectName}".

Include: ${sections}

File tree:
${tree}

Components: ${components.length}
Hooks: ${hooks.length}

Return ONLY the README.md content in ===FILE: README.md=== format.`;
  }, []);

  const buildAPIDocPrompt = useCallback((file: ProjectFile, level: VerbosityLevel): string => {
    return `Generate API documentation for this file in markdown format.

Verbosity: ${level}
${level === 'detailed' ? 'Include: function signatures, parameter tables, return types, usage examples, error handling notes, and related functions.' : ''}
${level === 'minimal' ? 'Include: function signatures and brief descriptions only.' : ''}

Format as markdown. Return in ===FILE: docs/api/${file.path.replace(/\.\w+$/, '.md')}=== format.

${file.content}`;
  }, []);

  const buildComponentDocPrompt = useCallback((file: ProjectFile, level: VerbosityLevel): string => {
    return `Generate Storybook-style documentation for this React component.

Verbosity: ${level}
Include:
- Component name and description
${level !== 'minimal' ? '- Props table (name, type, default, description)' : ''}
- Usage example
${level === 'detailed' ? '- All states and variants\n- Accessibility notes\n- Performance considerations\n- Related components' : ''}

Format as markdown. Return in ===FILE: docs/components/${file.path.replace(/\.\w+$/, '.md')}=== format.

${file.content}`;
  }, []);

  const buildChangelogPrompt = useCallback((diffs: { path: string; status: string }[], version: string): string => {
    return `Generate a CHANGELOG entry for version ${version}.

Changes:
${diffs.map(d => `- [${d.status.toUpperCase()}] ${d.path}`).join('\n')}

Format using Keep a Changelog convention:
## [${version}] - ${new Date().toISOString().split('T')[0]}
### Added / Changed / Fixed / Removed

Return in ===FILE: CHANGELOG.md=== format.`;
  }, []);

  const addResult = useCallback((type: DocType, filePath: string, content: string) => {
    const result: DocResult = {
      id: crypto.randomUUID(),
      type, filePath, content,
      verbosity,
      timestamp: new Date(),
    };
    setResults(prev => [result, ...prev].slice(0, 50));
    return result;
  }, [verbosity]);

  const clearResults = useCallback(() => setResults([]), []);

  return {
    results, verbosity, setVerbosity,
    buildJSDocPrompt, buildReadmePrompt, buildAPIDocPrompt,
    buildComponentDocPrompt, buildChangelogPrompt,
    addResult, clearResults,
  };
}
