/**
 * Phase 111: Breadcrumb Symbol Navigator
 * Extracts symbols (functions, components, types, interfaces) from files for navigation.
 */
import { useCallback, useState } from 'react';

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'component' | 'type' | 'interface' | 'class' | 'const' | 'hook' | 'enum';
  filePath: string;
  line: number;
  exported: boolean;
  params?: string;
}

export function useSymbolNavigator() {
  const [symbols, setSymbols] = useState<CodeSymbol[]>([]);
  const [outline, setOutline] = useState<CodeSymbol[]>([]);

  const extractSymbols = useCallback((files: { path: string; content: string }[]): CodeSymbol[] => {
    const result: CodeSymbol[] = [];
    const patterns: { regex: RegExp; kind: CodeSymbol['kind']; exported: boolean }[] = [
      { regex: /^export\s+(?:default\s+)?function\s+(\w+)\s*\(([^)]*)\)/gm, kind: 'function', exported: true },
      { regex: /^export\s+const\s+(\w+)\s*[=:]/gm, kind: 'const', exported: true },
      { regex: /^export\s+(?:type|interface)\s+(\w+)/gm, kind: 'type', exported: true },
      { regex: /^export\s+class\s+(\w+)/gm, kind: 'class', exported: true },
      { regex: /^export\s+enum\s+(\w+)/gm, kind: 'enum', exported: true },
      { regex: /^function\s+(\w+)\s*\(([^)]*)\)/gm, kind: 'function', exported: false },
      { regex: /^const\s+(\w+)\s*[:=]\s*(?:\([^)]*\)\s*=>|function)/gm, kind: 'function', exported: false },
      { regex: /^interface\s+(\w+)/gm, kind: 'interface', exported: false },
      { regex: /^type\s+(\w+)/gm, kind: 'type', exported: false },
    ];

    for (const file of files) {
      if (!/\.(tsx?|jsx?)$/.test(file.path)) continue;
      const lines = file.content.split('\n');

      for (const { regex, kind, exported } of patterns) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(file.content)) !== null) {
          const lineIndex = file.content.slice(0, match.index).split('\n').length;
          let symbolKind = kind;
          const name = match[1];

          // Detect React components (PascalCase + returns JSX)
          if ((kind === 'function' || kind === 'const') && /^[A-Z]/.test(name)) {
            symbolKind = 'component';
          }
          // Detect hooks (use prefix)
          if ((kind === 'function' || kind === 'const') && /^use[A-Z]/.test(name)) {
            symbolKind = 'hook';
          }

          result.push({
            name,
            kind: symbolKind,
            filePath: file.path,
            line: lineIndex,
            exported,
            params: match[2]?.trim(),
          });
        }
      }
    }

    setSymbols(result);
    return result;
  }, []);

  const getFileOutline = useCallback((filePath: string, content: string): CodeSymbol[] => {
    const fileSymbols = extractSymbols([{ path: filePath, content }]);
    setOutline(fileSymbols);
    return fileSymbols;
  }, [extractSymbols]);

  const findDefinition = useCallback((name: string): CodeSymbol | undefined => {
    return symbols.find(s => s.name === name && s.exported);
  }, [symbols]);

  const findReferences = useCallback((name: string, files: { path: string; content: string }[]): { filePath: string; line: number; context: string }[] => {
    const refs: { filePath: string; line: number; context: string }[] = [];
    const wordRegex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    for (const file of files) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (wordRegex.test(lines[i])) {
          refs.push({ filePath: file.path, line: i + 1, context: lines[i].trim() });
        }
        wordRegex.lastIndex = 0;
      }
    }
    return refs;
  }, []);

  const getSymbolIcon = useCallback((kind: CodeSymbol['kind']): string => {
    switch (kind) {
      case 'component': return '🧩';
      case 'hook': return '🪝';
      case 'function': return 'ƒ';
      case 'type': return 'T';
      case 'interface': return 'I';
      case 'class': return 'C';
      case 'const': return 'K';
      case 'enum': return 'E';
      default: return '•';
    }
  }, []);

  return {
    symbols,
    outline,
    extractSymbols,
    getFileOutline,
    findDefinition,
    findReferences,
    getSymbolIcon,
  };
}
