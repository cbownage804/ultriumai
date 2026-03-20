import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Smart File Scaffolding: Auto-generates companion test files
 * when a new component is created by the AI.
 * Wave 15: Added /new command scaffold support.
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
      if (!file.path.match(/\.tsx$/)) continue;
      if (file.path.includes('.test.') || file.path.includes('.spec.')) continue;
      if (file.path.includes('/hooks/') || file.path.includes('/utils/') || file.path.includes('/types/') || file.path.includes('/lib/')) continue;
      if (existingPaths.has(file.path)) continue;

      const componentMatch = file.content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
      if (!componentMatch) continue;
      const componentName = componentMatch[1];

      const testPath = file.path.replace(/\.tsx$/, '.test.tsx');
      if (existingPaths.has(testPath) || newFiles.some(f => f.path === testPath)) continue;

      const fileName = file.path.split('/').pop()!.replace(/\.tsx$/, '');

      companions.push({
        path: testPath,
        content: `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${fileName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(document.body).toBeTruthy();
  });
});
`,
        language: 'typescript',
      });
    }

    return companions;
  }, []);

  /**
   * Wave 15: Scaffold a new component from /new command.
   * Returns a ProjectFile with proper structure matching project conventions.
   */
  const scaffoldComponent = useCallback((
    name: string,
    existingFiles: ProjectFile[],
    type: 'component' | 'page' | 'hook' = 'component',
  ): ProjectFile | null => {
    if (!name || name.length < 2) return null;

    // Normalize name: PascalCase for components, camelCase for hooks
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1).replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
    const camelName = name.charAt(0).toLowerCase() + name.slice(1).replace(/[-_](\w)/g, (_, c) => c.toUpperCase());

    // Detect project conventions from existing files
    const usesTailwind = existingFiles.some(f => f.content.includes('className='));
    const usesMotion = existingFiles.some(f => f.content.includes('framer-motion'));

    if (type === 'hook') {
      const hookName = camelName.startsWith('use') ? camelName : `use${pascalName}`;
      return {
        path: `src/hooks/${hookName}.ts`,
        content: `import { useState, useCallback } from 'react';

export function ${hookName}() {
  const [state, setState] = useState<string | null>(null);

  const update = useCallback((value: string) => {
    setState(value);
  }, []);

  const reset = useCallback(() => {
    setState(null);
  }, []);

  return { state, update, reset };
}
`,
        language: 'typescript',
      };
    }

    if (type === 'page') {
      return {
        path: `src/pages/${pascalName}Page.tsx`,
        content: `${usesMotion ? "import { motion } from 'framer-motion';\n" : ''}
export default function ${pascalName}Page() {
  return (
    ${usesMotion ? '<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}' : '<div'}
      className="${usesTailwind ? 'min-h-screen bg-background text-foreground' : ''}"
    ${usesMotion ? '>' : '>'}
      <main className="${usesTailwind ? 'container mx-auto px-4 py-8' : ''}">
        <h1 className="${usesTailwind ? 'text-3xl font-bold mb-6' : ''}">${pascalName}</h1>
        {/* Add your page content here */}
      </main>
    ${usesMotion ? '</motion.div>' : '</div>'}
  );
}
`,
        language: 'typescript',
      };
    }

    // Default: component
    return {
      path: `src/components/${pascalName}.tsx`,
      content: `${usesMotion ? "import { motion } from 'framer-motion';\n" : ''}
interface ${pascalName}Props {
  className?: string;
}

export function ${pascalName}({ className }: ${pascalName}Props) {
  return (
    ${usesMotion ? '<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}' : '<div'}
      className={${usesTailwind ? '`${className || ""}`' : 'className'}}
    ${usesMotion ? '>' : '>'}
      <h2 className="${usesTailwind ? 'text-xl font-semibold' : ''}">${pascalName}</h2>
      {/* Add your component content here */}
    ${usesMotion ? '</motion.div>' : '</div>'}
  );
}
`,
      language: 'typescript',
    };
  }, []);

  /** Parse /new command and return scaffold type + name. */
  const parseNewCommand = useCallback((input: string): { name: string; type: 'component' | 'page' | 'hook' } | null => {
    const match = input.match(/^\/new\s+(page|hook|component)?\s*(\w+)/i);
    if (!match) return null;
    const type = (match[1]?.toLowerCase() as 'page' | 'hook' | 'component') || 'component';
    const name = match[2];
    return { name, type };
  }, []);

  return { generateCompanionFiles, scaffoldComponent, parseNewCommand };
}
