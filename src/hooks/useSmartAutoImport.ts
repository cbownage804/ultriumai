/**
 * Smart Auto-Import — Phase 157
 * Detects undefined symbols and suggests import statements.
 */
import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface ImportSuggestion {
  id: string;
  symbol: string;
  importStatement: string;
  source: 'project' | 'npm' | 'react';
  filePath: string;
  line: number;
  confidence: number;
  timestamp: Date;
}

const REACT_EXPORTS = new Set([
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
  'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue',
  'forwardRef', 'memo', 'lazy', 'Suspense', 'Fragment', 'createContext',
  'createRef', 'createElement', 'cloneElement', 'isValidElement', 'Children',
  'StrictMode', 'startTransition', 'useTransition', 'useDeferredValue', 'useId',
]);

const COMMON_NPM: Record<string, string> = {
  'cn': "import { cn } from '@/lib/utils';",
  'toast': "import { toast } from 'sonner';",
  'motion': "import { motion } from 'framer-motion';",
  'AnimatePresence': "import { AnimatePresence } from 'framer-motion';",
  'Link': "import { Link } from 'react-router-dom';",
  'useNavigate': "import { useNavigate } from 'react-router-dom';",
  'useParams': "import { useParams } from 'react-router-dom';",
  'useSearchParams': "import { useSearchParams } from 'react-router-dom';",
  'useForm': "import { useForm } from 'react-hook-form';",
  'z': "import { z } from 'zod';",
  'zodResolver': "import { zodResolver } from '@hookform/resolvers/zod';",
  'supabase': "import { supabase } from '@/integrations/supabase/client';",
  'useQuery': "import { useQuery } from '@tanstack/react-query';",
  'useMutation': "import { useMutation } from '@tanstack/react-query';",
  'useQueryClient': "import { useQueryClient } from '@tanstack/react-query';",
  'format': "import { format } from 'date-fns';",
};

export function useSmartAutoImport() {
  const [suggestions, setSuggestions] = useState<ImportSuggestion[]>([]);

  const extractExports = useCallback((files: ProjectFile[]): Map<string, string> => {
    const exportMap = new Map<string, string>();
    for (const file of files) {
      // Named exports
      const namedExports = file.content.matchAll(/export\s+(?:const|function|class|type|interface|enum)\s+(\w+)/g);
      for (const m of namedExports) {
        exportMap.set(m[1], file.path);
      }
      // Default exports
      const defaultExport = file.content.match(/export\s+default\s+(?:function|class)\s+(\w+)/);
      if (defaultExport) {
        exportMap.set(defaultExport[1], file.path);
      }
    }
    return exportMap;
  }, []);

  const detectUndefined = useCallback((fileContent: string, filePath: string): string[] => {
    const imported = new Set<string>();
    // Collect already imported symbols
    const importMatches = fileContent.matchAll(/import\s+(?:\{([^}]+)\}|(\w+))\s+from/g);
    for (const m of importMatches) {
      if (m[1]) m[1].split(',').forEach(s => imported.add(s.trim().split(' as ')[0]));
      if (m[2]) imported.add(m[2]);
    }

    // Find used identifiers (simple heuristic)
    const usedSymbols = new Set<string>();
    const identifierRegex = /\b([A-Z][a-zA-Z0-9]+)\b/g;
    let match;
    while ((match = identifierRegex.exec(fileContent)) !== null) {
      const sym = match[1];
      if (!imported.has(sym) && sym.length > 1 && sym !== 'React') {
        usedSymbols.add(sym);
      }
    }

    // Also check common hooks/functions
    const hookRegex = /\b(use[A-Z]\w+)\b/g;
    while ((match = hookRegex.exec(fileContent)) !== null) {
      if (!imported.has(match[1])) usedSymbols.add(match[1]);
    }

    // Check lowercase common utils
    for (const key of Object.keys(COMMON_NPM)) {
      if (fileContent.includes(key + '(') && !imported.has(key)) {
        usedSymbols.add(key);
      }
    }

    return [...usedSymbols];
  }, []);

  const analyzeFile = useCallback((
    fileContent: string,
    filePath: string,
    allFiles: ProjectFile[],
  ): ImportSuggestion[] => {
    const undefined_ = detectUndefined(fileContent, filePath);
    const projectExports = extractExports(allFiles.filter(f => f.path !== filePath));
    const results: ImportSuggestion[] = [];

    for (const symbol of undefined_) {
      // Check React
      if (REACT_EXPORTS.has(symbol)) {
        results.push({
          id: crypto.randomUUID(),
          symbol,
          importStatement: `import { ${symbol} } from 'react';`,
          source: 'react',
          filePath,
          line: 1,
          confidence: 0.95,
          timestamp: new Date(),
        });
        continue;
      }

      // Check common NPM
      if (COMMON_NPM[symbol]) {
        results.push({
          id: crypto.randomUUID(),
          symbol,
          importStatement: COMMON_NPM[symbol],
          source: 'npm',
          filePath,
          line: 1,
          confidence: 0.9,
          timestamp: new Date(),
        });
        continue;
      }

      // Check project exports
      const sourcePath = projectExports.get(symbol);
      if (sourcePath) {
        const relPath = buildRelativePath(filePath, sourcePath);
        results.push({
          id: crypto.randomUUID(),
          symbol,
          importStatement: `import { ${symbol} } from '${relPath}';`,
          source: 'project',
          filePath,
          line: 1,
          confidence: 0.85,
          timestamp: new Date(),
        });
      }
    }

    setSuggestions(results);
    return results;
  }, [detectUndefined, extractExports]);

  const applyImport = useCallback((fileContent: string, importStatement: string): string => {
    const lines = fileContent.split('\n');
    const lastImportIdx = lines.reduce((acc, line, i) =>
      line.startsWith('import ') ? i : acc, -1);

    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, importStatement);
    } else {
      lines.unshift(importStatement);
    }
    return lines.join('\n');
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, analyzeFile, applyImport, clearSuggestions };
}

function buildRelativePath(from: string, to: string): string {
  const fromParts = from.split('/').slice(0, -1);
  const toParts = to.split('/');
  const toFile = toParts.pop()!.replace(/\.\w+$/, '');

  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++;
  }

  const ups = fromParts.length - common;
  const downs = toParts.slice(common);

  if (ups === 0) return './' + [...downs, toFile].join('/');
  return '../'.repeat(ups) + [...downs, toFile].join('/');
}
