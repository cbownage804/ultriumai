import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Auto-repair common syntax issues in project files before sending to Vite.
 * This runs AFTER validation detects errors, attempting deterministic fixes
 * so the build can succeed without AI intervention.
 * 
 * Returns the repaired files and a list of fixes applied.
 */
export function autoRepairFiles(files: ProjectFile[]): { files: ProjectFile[]; repairs: string[] } {
  const repairs: string[] = [];
  
  const repaired = files.map(f => {
    const ext = f.path.split('.').pop()?.toLowerCase() || '';
    if (!['ts', 'tsx', 'js', 'jsx'].includes(ext)) return f;
    
    let content = f.content;
    let changed = false;

    // ── 1. Fix truncated files (missing closing braces/parens) ──
    const result = fixBracketBalance(content);
    if (result.fixed) {
      content = result.content;
      changed = true;
      repairs.push(`${f.path}: ${result.description}`);
    }

    // ── 2. Add missing React import for TSX/JSX files ──
    if (['tsx', 'jsx'].includes(ext)) {
      const hasReactImport = /import\s+(?:React|\{[^}]*\})\s+from\s+['"]react['"]/.test(content);
      const usesJSX = /<[A-Z]/.test(content) || /<[a-z]+[\s>]/.test(content);
      if (!hasReactImport && usesJSX) {
        content = `import React from 'react';\n${content}`;
        changed = true;
        repairs.push(`${f.path}: added missing React import`);
      }
    }

    // ── 3. Fix empty export default ──
    if (/export\s+default\s*;/.test(content)) {
      // Find the component name from the file
      const componentMatch = content.match(/(?:function|const)\s+(\w+)/);
      if (componentMatch) {
        content = content.replace(/export\s+default\s*;/, `export default ${componentMatch[1]};`);
        changed = true;
        repairs.push(`${f.path}: fixed empty export default → ${componentMatch[1]}`);
      }
    }

    // ── 4. Fix missing export default for component files ──
    if (['tsx', 'jsx'].includes(ext) && !f.path.includes('index.') && !f.path.includes('main.')) {
      const hasExportDefault = /export\s+default\s/.test(content);
      const hasNamedExport = /export\s+(?:function|const|class)\s/.test(content);
      if (!hasExportDefault && !hasNamedExport) {
        // Find the first function/const component
        const match = content.match(/(?:function|const)\s+([A-Z]\w*)/);
        if (match) {
          content += `\nexport default ${match[1]};\n`;
          changed = true;
          repairs.push(`${f.path}: added missing export default ${match[1]}`);
        }
      }
    }

    // ── 5. Fix dangling commas at end of file (truncation artifact) ──
    const trimmed = content.trimEnd();
    if (trimmed.length > 50) {
      const lastChar = trimmed[trimmed.length - 1];
      if ([',', ':', '=', '+', '&&', '||'].includes(lastChar)) {
        content = trimmed.slice(0, -1) + '\n';
        changed = true;
        repairs.push(`${f.path}: removed dangling "${lastChar}" (truncation artifact)`);
      }
    }

    // ── 6. Fix unclosed JSX tags (self-closing correction) ──
    if (['tsx', 'jsx'].includes(ext)) {
      // Detect common unclosed void-like elements that should be self-closing
      const unclosedVoidTags = content.match(/<(img|input|br|hr|meta|link)\b[^/>]*>/gi);
      if (unclosedVoidTags) {
        for (const tag of unclosedVoidTags) {
          if (!tag.endsWith('/>')) {
            const fixed = tag.slice(0, -1) + ' />';
            content = content.replace(tag, fixed);
            changed = true;
            repairs.push(`${f.path}: self-closed void JSX element`);
          }
        }
      }

      // Fix className="" with class="" (common non-JSX habit)
      if (/\bclass=/i.test(content) && !content.includes('className=')) {
        content = content.replace(/\bclass=/g, 'className=');
        changed = true;
        repairs.push(`${f.path}: replaced class= with className=`);
      }

      // ── 6b. Fix mismatched/missing JSX closing tags (HTML + fragments) ──
      const jsxBalance = fixJsxTagBalance(content);
      if (jsxBalance.fixed) {
        content = jsxBalance.content;
        changed = true;
        repairs.push(`${f.path}: ${jsxBalance.description}`);
      }
    }

    // ── 7. Fix broken import paths (missing extension or ./) ──
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      // Fix imports from '@components/...' → '@/components/...'
      const badAliasPattern = /from\s+['"]@(?!\/)([^'"]+)['"]/g;
      let aliasMatch;
      while ((aliasMatch = badAliasPattern.exec(content)) !== null) {
        const badImport = aliasMatch[0];
        const fixedImport = badImport.replace(/@(?!\/)/, '@/');
        content = content.replace(badImport, fixedImport);
        changed = true;
        repairs.push(`${f.path}: fixed import alias @ → @/`);
      }
    }

    // ── 8. Remove duplicate imports ──
    const importLines = new Map<string, number>();
    const lines = content.split('\n');
    const linesToRemove = new Set<number>();
    
    lines.forEach((line, idx) => {
      const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const key = importMatch[1] + ':' + line.trim();
        if (importLines.has(key)) {
          linesToRemove.add(idx);
          repairs.push(`${f.path}: removed duplicate import from "${importMatch[1]}"`);
          changed = true;
        } else {
          importLines.set(key, idx);
        }
      }
    });
    
    if (linesToRemove.size > 0) {
      content = lines.filter((_, idx) => !linesToRemove.has(idx)).join('\n');
    }

    if (!changed) return f;
    return { ...f, content };
  });

  return { files: repaired, repairs };
}

/**
 * Fix unbalanced brackets by appending missing closers.
 */
function fixBracketBalance(content: string): { content: string; fixed: boolean; description: string } {
  // Strip strings and comments for accurate counting
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/gs, '""');

  const counts: Record<string, number> = { '{': 0, '(': 0, '[': 0 };
  const closers: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
  const closerChars: Record<string, string> = { '{': '}', '(': ')', '[': ']' };

  for (const char of stripped) {
    if (char in counts) counts[char]++;
    if (char in closers) counts[closers[char]]--;
  }

  const fixes: string[] = [];
  let suffix = '';

  for (const [open, count] of Object.entries(counts)) {
    if (count > 0 && count <= 5) { // Only fix small imbalances (likely truncation)
      const closer = closerChars[open];
      suffix += closer.repeat(count);
      fixes.push(`added ${count}× "${closer}"`);
    }
  }

  // Fix odd backtick count (unterminated template literal)
  const commentStripped = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '');
  const backtickCount = (commentStripped.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    suffix = '`' + suffix;
    fixes.push('closed unterminated template literal');
  }

  if (fixes.length === 0) {
    return { content, fixed: false, description: '' };
  }

  return {
    content: content + '\n' + suffix + '\n',
    fixed: true,
    description: fixes.join(', '),
  };
}
