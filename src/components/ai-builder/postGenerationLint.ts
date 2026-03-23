import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Post-generation lint pass — lightweight static analysis that runs after
 * AI output is parsed but BEFORE compilation. Catches common AI mistakes
 * that autoRepair doesn't cover (semantic issues vs syntax issues).
 */

export interface LintIssue {
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  autoFix?: () => string; // Returns fixed content
}

/**
 * Run a quick lint pass on parsed AI output files.
 * Returns issues found and optionally auto-fixed files.
 */
export function postGenerationLint(files: ProjectFile[]): {
  issues: LintIssue[];
  fixedFiles: ProjectFile[];
  fixCount: number;
} {
  const issues: LintIssue[] = [];
  let fixCount = 0;
  
  const fixedFiles = files.map(file => {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) return file;
    
    let content = file.content;
    let changed = false;

    // ── 1. Missing keys in .map() JSX ──
    const mapJsxPattern = /\.map\(\s*\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?\s*=>\s*(?:\(?\s*<(?!React\.Fragment|Fragment)[A-Z]\w*)(?![^>]*\bkey\b)/g;
    let mapMatch;
    while ((mapMatch = mapJsxPattern.exec(content)) !== null) {
      const itemVar = mapMatch[1];
      const indexVar = mapMatch[2];
      issues.push({
        file: file.path,
        message: `Missing key prop in .map() JSX — add key={${indexVar || `${itemVar}.id`}} to the root element`,
        severity: 'warning',
      });
    }

    // ── 2. Unused imports (simple detection) ──
    const importRegex = /^import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"][^'"]+['"]/gm;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      const importedNames = importMatch[1]
        ? importMatch[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean)
        : importMatch[2] ? [importMatch[2]] : [];
      
      for (const name of importedNames) {
        if (name === 'React') continue; // Always needed for JSX transform
        if (name === 'type' || name === 'interface') continue;
        
        // Check if the name appears anywhere else in the file (beyond the import line)
        const restOfFile = content.slice(importMatch.index + importMatch[0].length);
        const usagePattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (!usagePattern.test(restOfFile)) {
          issues.push({
            file: file.path,
            message: `Unused import: "${name}" is imported but never used`,
            severity: 'warning',
          });
        }
      }
    }

    // ── 3. useState without type annotation containing object/array literal ──
    // Common AI mistake: useState({}) or useState([]) without type → TypeScript inference issues
    const untypedStatePattern = /useState\(\s*(\{|\[)/g;
    let stateMatch;
    while ((stateMatch = untypedStatePattern.exec(content)) !== null) {
      // Check if there's a type annotation: useState<Type>(
      const before = content.slice(Math.max(0, stateMatch.index - 20), stateMatch.index);
      if (!/<[^>]+>\s*$/.test(before)) {
        issues.push({
          file: file.path,
          message: `useState with object/array literal should have a type annotation: useState<Type>(${stateMatch[1]}...)`,
          severity: 'warning',
        });
      }
    }

    // ── 4. Event handlers referencing undefined functions ──
    const handlerPattern = /on[A-Z]\w*=\{(\w+)\}/g;
    let handlerMatch;
    while ((handlerMatch = handlerPattern.exec(content)) !== null) {
      const fnName = handlerMatch[1];
      // Check if the function is defined in the file
      const fnDefPattern = new RegExp(
        `(?:function\\s+${fnName}|const\\s+${fnName}\\s*=|let\\s+${fnName}\\s*=)\\b`
      );
      if (!fnDefPattern.test(content) && !content.includes(`import`) ) {
        // Only flag if no imports at all (could be imported)
        issues.push({
          file: file.path,
          message: `Event handler references "${fnName}" which may not be defined`,
          severity: 'warning',
        });
      }
    }

    // ── 5. Empty component return (AI truncation) ──
    if (['tsx', 'jsx'].includes(ext)) {
      const emptyReturnPattern = /return\s*\(\s*\)\s*;/;
      if (emptyReturnPattern.test(content)) {
        content = content.replace(
          /return\s*\(\s*\)\s*;/,
          'return (<div />);'
        );
        changed = true;
        fixCount++;
        issues.push({
          file: file.path,
          message: 'Empty return() fixed — added placeholder <div />',
          severity: 'error',
        });
      }
    }

    // ── 6. Detect async useEffect (common AI mistake) ──
    const asyncEffectPattern = /useEffect\(\s*async\s/;
    if (asyncEffectPattern.test(content)) {
      issues.push({
        file: file.path,
        message: 'useEffect callback should not be async — wrap async logic in an inner function',
        severity: 'warning',
      });
    }

    // ── 7. Missing return in component function ──
    if (['tsx', 'jsx'].includes(ext)) {
      const componentPattern = /(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)\s*\([^)]*\)\s*\{/g;
      let compMatch;
      while ((compMatch = componentPattern.exec(content)) !== null) {
        // Find the function body (simple heuristic: look for `return` within the next 2000 chars)
        const bodyStart = compMatch.index + compMatch[0].length;
        const bodySlice = content.slice(bodyStart, bodyStart + 2000);
        if (!bodySlice.includes('return')) {
          issues.push({
            file: file.path,
            message: `Component "${compMatch[1]}" may be missing a return statement`,
            severity: 'warning',
          });
        }
      }
    }

    if (!changed) return file;
    return { ...file, content };
  });

  return { issues, fixedFiles, fixCount };
}
