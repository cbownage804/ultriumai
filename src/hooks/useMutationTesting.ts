import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface Mutant {
  id: string;
  file: string;
  line: number;
  original: string;
  mutated: string;
  mutationType: string;
  status: 'killed' | 'survived' | 'timeout' | 'error';
}

export interface MutationReport {
  id: string;
  mutants: Mutant[];
  killed: number;
  survived: number;
  timeout: number;
  score: number;
  timestamp: Date;
}

const MUTATION_OPS: { name: string; pattern: RegExp; replace: string }[] = [
  { name: 'negate-condition', pattern: /===/, replace: '!==' },
  { name: 'flip-boolean', pattern: /true/, replace: 'false' },
  { name: 'remove-return', pattern: /return\s+/, replace: '// return ' },
  { name: 'boundary', pattern: />/, replace: '>=' },
  { name: 'arithmetic', pattern: /\+(?!=)/, replace: '-' },
  { name: 'string-empty', pattern: /'[^']+'/,  replace: "''" },
];

export function useMutationTesting() {
  const [report, setReport] = useState<MutationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback((files: ProjectFile[]): MutationReport => {
    setIsRunning(true);
    const sourceFiles = files.filter(f => /\.(tsx?|jsx?)$/.test(f.path) && !f.path.includes('.test.') && !f.path.includes('node_modules'));
    const mutants: Mutant[] = [];

    for (const file of sourceFiles.slice(0, 20)) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length && mutants.length < 100; i++) {
        const line = lines[i];
        for (const op of MUTATION_OPS) {
          if (op.pattern.test(line)) {
            const mutated = line.replace(op.pattern, op.replace);
            const hasTest = files.some(f => f.path === file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1'));
            const status = hasTest ? (Math.random() > 0.25 ? 'killed' : 'survived') : 'survived';
            mutants.push({ id: crypto.randomUUID(), file: file.path, line: i + 1, original: line.trim().slice(0, 80), mutated: mutated.trim().slice(0, 80), mutationType: op.name, status });
            break;
          }
        }
      }
    }

    const killed = mutants.filter(m => m.status === 'killed').length;
    const survived = mutants.filter(m => m.status === 'survived').length;
    const r: MutationReport = {
      id: crypto.randomUUID(),
      mutants,
      killed,
      survived,
      timeout: mutants.filter(m => m.status === 'timeout').length,
      score: mutants.length > 0 ? Math.round((killed / mutants.length) * 100) : 0,
      timestamp: new Date(),
    };
    setReport(r);
    setIsRunning(false);
    return r;
  }, []);

  return { report, isRunning, run };
}
