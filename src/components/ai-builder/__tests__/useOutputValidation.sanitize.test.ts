import { describe, expect, it } from 'vitest';
import { sanitizeStagedFiles } from '../useOutputValidation';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function file(path: string, content: string, language = 'typescript'): ProjectFile {
  return { path, content, language };
}

describe('sanitizeStagedFiles protocol marker cleanup', () => {
  it('removes leaked ===END=== marker lines from code files', () => {
    const files = [
      file('src/App.tsx', `export default function App() {
  return <div>Hello</div>;
}
===END===
const x = 1;`),
    ];

    const { files: sanitized, fixes } = sanitizeStagedFiles(files);
    expect(sanitized[0].content).not.toContain('===END===');
    expect(sanitized[0].content).toContain('const x = 1;');
    expect(fixes.some(f => f.includes('removed leaked protocol delimiter artifacts'))).toBe(true);
  });

  it('removes leaked FILE/EDIT marker lines that corrupt runtime bundles', () => {
    const files = [
      file('src/utils.ts', `export const a = 1;
===FILE: src/Other.ts===
===EDIT: src/App.tsx===
export const b = 2;`),
    ];

    const { files: sanitized } = sanitizeStagedFiles(files);
    expect(sanitized[0].content).not.toContain('===FILE:');
    expect(sanitized[0].content).not.toContain('===EDIT:');
    expect(sanitized[0].content).toContain('export const b = 2;');
  });
});
