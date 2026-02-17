import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Smart File Scaffolding: Auto-generates companion test files
 * when a new component is created by the AI.
 */
export function useSmartFileScaffolding() {
  /** Detect newly created component files and generate test stubs. */
  const generateCompanionFiles = useCallback((
    newFiles: ProjectFile[],
    existingFiles: ProjectFile[]
  ): ProjectFile[] => {
    const companions: ProjectFile[] = [];
    const existingPaths = new Set(existingFiles.map(f => f.path));

    for (const file of newFiles) {
      // Only for new .tsx component files (not hooks, utils, types, etc.)
      if (!file.path.match(/\.tsx$/)) continue;
      if (file.path.includes('.test.') || file.path.includes('.spec.')) continue;
      if (file.path.includes('/hooks/') || file.path.includes('/utils/') || file.path.includes('/types/') || file.path.includes('/lib/')) continue;
      if (existingPaths.has(file.path)) continue; // Not a new file

      // Extract component name
      const componentMatch = file.content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
      if (!componentMatch) continue;
      const componentName = componentMatch[1];

      // Build test path
      const testPath = file.path.replace(/\.tsx$/, '.test.tsx');
      if (existingPaths.has(testPath) || newFiles.some(f => f.path === testPath)) continue;

      // Determine the relative import path
      const fileName = file.path.split('/').pop()!.replace(/\.tsx$/, '');

      companions.push({
        path: testPath,
        content: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${fileName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    // Update this assertion based on your component's output
    expect(document.body).toBeTruthy();
  });
});
`,
        language: 'typescript',
      });
    }

    return companions;
  }, []);

  return { generateCompanionFiles };
}
