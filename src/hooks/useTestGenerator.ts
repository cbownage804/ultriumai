import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface GeneratedTest {
  id: string;
  sourcePath: string;
  testPath: string;
  testContent: string;
  status: 'generated' | 'injected';
  timestamp: Date;
}

export function useTestGenerator() {
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([]);

  const buildTestPrompt = useCallback((file: ProjectFile, allFiles: ProjectFile[]): string => {
    const isComponent = /\.(tsx|jsx)$/.test(file.path) && /(?:export\s+(?:default\s+)?function|export\s+const)\s+\w+/.test(file.content);
    const isHook = file.path.includes('/use') && /export\s+(?:function|const)\s+use\w+/.test(file.content);
    const isUtil = /(?:utils?|helpers?|lib)\//i.test(file.path);

    let testFramework = 'Vitest';
    let testInstructions = '';

    if (isComponent) {
      testInstructions = `Generate comprehensive unit tests for this React component using ${testFramework} and @testing-library/react.

Requirements:
- Import from 'vitest' for describe, it, expect, vi
- Import from '@testing-library/react' for render, screen, fireEvent, waitFor
- Test rendering without crashing
- Test all user interactions (clicks, inputs, form submissions)
- Test conditional rendering (loading, error, empty states)
- Test prop variations
- Mock any external hooks/services with vi.mock()
- Use descriptive test names

Component file: ${file.path}`;
    } else if (isHook) {
      testInstructions = `Generate unit tests for this custom React hook using ${testFramework} and @testing-library/react.

Requirements:
- Import { renderHook, act } from '@testing-library/react'
- Test initial state
- Test state changes after calling hook methods
- Test edge cases (empty input, errors)
- Mock API calls or external dependencies
- Test cleanup/unmount behavior if applicable

Hook file: ${file.path}`;
    } else if (isUtil) {
      testInstructions = `Generate unit tests for these utility functions using ${testFramework}.

Requirements:
- Test each exported function
- Test with valid inputs (happy path)
- Test with edge cases (empty, null, undefined, boundary values)
- Test with invalid inputs (error cases)
- Achieve high coverage

Utility file: ${file.path}`;
    } else {
      testInstructions = `Generate appropriate tests for this file using ${testFramework}.

File: ${file.path}`;
    }

    // Add related file context
    const imports = file.content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    const relatedFiles = imports
      .map(imp => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1] || '')
      .filter(p => p.startsWith('.') || p.startsWith('@/'))
      .slice(0, 5);
    
    const relatedContext = relatedFiles
      .map(rel => {
        const resolved = allFiles.find(f => f.path.includes(rel.replace('@/', '').replace('./', '')));
        return resolved ? `\n// Related: ${resolved.path}\n${resolved.content.slice(0, 500)}` : '';
      })
      .filter(Boolean)
      .join('\n');

    return `${testInstructions}

\`\`\`typescript
${file.content}
\`\`\`
${relatedContext ? `\nRelated file context:\n${relatedContext}` : ''}

Return the test file using ===FILE: ${file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1')}=== format.`;
  }, []);

  const getTestPath = useCallback((sourcePath: string): string => {
    return sourcePath.replace(/\.(tsx?|jsx?)$/, '.test.$1');
  }, []);

  const addGeneratedTest = useCallback((sourcePath: string, testContent: string) => {
    const testPath = getTestPath(sourcePath);
    const test: GeneratedTest = {
      id: crypto.randomUUID(),
      sourcePath,
      testPath,
      testContent,
      status: 'generated',
      timestamp: new Date(),
    };
    setGeneratedTests(prev => [test, ...prev]);
    return test;
  }, [getTestPath]);

  const getTestableFiles = useCallback((files: ProjectFile[]): ProjectFile[] => {
    return files.filter(f => {
      if (f.path.includes('.test.') || f.path.includes('.spec.')) return false;
      if (f.path.includes('node_modules')) return false;
      if (!/\.(tsx?|jsx?)$/.test(f.path)) return false;
      if (f.content.length < 50) return false;
      return true;
    });
  }, []);

  const getCoverageEstimate = useCallback((files: ProjectFile[]): { covered: number; total: number; percentage: number } => {
    const testable = getTestableFiles(files);
    const total = testable.length;
    const covered = testable.filter(f => {
      const testPath = getTestPath(f.path);
      return files.some(tf => tf.path === testPath);
    }).length;
    return { covered, total, percentage: total > 0 ? Math.round((covered / total) * 100) : 0 };
  }, [getTestableFiles, getTestPath]);

  return {
    generatedTests,
    buildTestPrompt,
    getTestPath,
    addGeneratedTest,
    getTestableFiles,
    getCoverageEstimate,
  };
}
