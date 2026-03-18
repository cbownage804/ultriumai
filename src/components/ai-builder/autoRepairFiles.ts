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
    if (ext === 'css') {
      const cssResult = fixCssBraceBalance(f.content);
      if (!cssResult.fixed) return f;
      repairs.push(`${f.path}: ${cssResult.description}`);
      return { ...f, content: cssResult.content };
    }
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

    // ── 6. Fix inline SVG icon components → replace with lucide-react placeholder ──
    if (['tsx', 'jsx'].includes(ext)) {
      // Detect custom SVG icon components with React.SVGProps (esbuild misparses generics as JSX)
      // Pattern: const IconName = (props: React.SVGProps<SVGSVGElement>) => ( <svg ... /> );
      const svgComponentPattern = /(?:const|function)\s+(\w+)\s*=?\s*\(?(?:\s*props\s*:\s*(?:React\.)?SVGProps<[^>]*>)?\)?\s*(?:=>|{)\s*\(?[\s\S]*?<svg\b[\s\S]*?<\/svg>\s*\)?\s*\)?\s*;?/g;
      let svgMatch;
      while ((svgMatch = svgComponentPattern.exec(content)) !== null) {
        const componentName = svgMatch[1];
        const replacement = `const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (\n  <span {...props as any} className="inline-block w-6 h-6" />\n);`;
        content = content.replace(svgMatch[0], replacement);
        changed = true;
        repairs.push(`${f.path}: replaced inline SVG component "${componentName}" (use lucide-react instead)`);
      }

      // Also fix the specific broken pattern: React.SVGProps<X /> where esbuild sees <X /> as JSX
      // This catches truncated/malformed generic type annotations
      const brokenGenericPattern = /SVGProps<(\w+)\s*\/>/g;
      if (brokenGenericPattern.test(content)) {
        content = content.replace(/SVGProps<(\w+)\s*\/>/g, 'SVGProps<SVGSVGElement>');
        changed = true;
        repairs.push(`${f.path}: fixed malformed SVGProps generic type annotation`);
      }

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
 * Fix JSX tag balance for lowercase HTML tags + fragments.
 * Designed to be conservative (avoids uppercase tags to prevent TS generic false-positives).
 */
function fixJsxTagBalance(content: string): { content: string; fixed: boolean; description: string } {
  const tokenRegex = /<\/>|<>|<\/[a-z][a-z0-9]*\s*>|<[a-z][a-z0-9]*\b[^>]*>/g;
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const stack: Array<{ tag: string; isFragment: boolean }> = [];

  let fixed = false;
  let cursor = 0;
  let output = '';
  let tokenMatch: RegExpExecArray | null;

  while ((tokenMatch = tokenRegex.exec(content)) !== null) {
    const token = tokenMatch[0];
    const start = tokenMatch.index;
    output += content.slice(cursor, start);

    if (token === '<>') {
      stack.push({ tag: '', isFragment: true });
      output += token;
    } else if (token === '</>') {
      if (stack.length > 0 && stack[stack.length - 1].isFragment) {
        stack.pop();
        output += token;
      } else if (stack.length > 0) {
        const top = stack.pop()!;
        output += top.isFragment ? '</>' : `</${top.tag}>`;
        fixed = true;
      } else {
        fixed = true;
      }
    } else if (token.startsWith('</')) {
      const closeTag = token.slice(2, -1).trim().toLowerCase();
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (!top.isFragment && top.tag === closeTag) {
          stack.pop();
          output += token;
        } else if (stack.some(s => !s.isFragment && s.tag === closeTag)) {
          // Close any unclosed inner tags first, then keep the current close token.
          while (stack.length > 0) {
            const current = stack[stack.length - 1];
            if (!current.isFragment && current.tag === closeTag) break;
            const popped = stack.pop()!;
            output += popped.isFragment ? '</>' : `</${popped.tag}>`;
            fixed = true;
          }
          if (stack.length > 0) stack.pop();
          output += token;
        } else {
          const expected = stack.pop()!;
          output += expected.isFragment ? '</>' : `</${expected.tag}>`;
          fixed = true;
        }
      } else {
        fixed = true;
      }
    } else {
      const openTagName = (token.match(/^<([a-z][a-z0-9]*)\b/)?.[1] || '').toLowerCase();
      const selfClosing = /\/\s*>$/.test(token);
      if (!selfClosing && openTagName && !voidTags.has(openTagName)) {
        stack.push({ tag: openTagName, isFragment: false });
      }
      output += token;
    }

    cursor = start + token.length;
  }

  output += content.slice(cursor);

  if (stack.length > 0) {
    fixed = true;
    for (let i = stack.length - 1; i >= 0; i--) {
      const tag = stack[i];
      output += tag.isFragment ? '</>' : `</${tag.tag}>`;
    }
  }

  return {
    content: output,
    fixed,
    description: fixed ? 'fixed JSX tag balance (mismatched/missing closers)' : '',
  };
}

/**
 * Fix unbalanced brackets by trimming trailing unexpected closers and
 * appending missing closers for small EOF truncation cases.
 */
function fixBracketBalance(content: string): { content: string; fixed: boolean; description: string } {
  const fixes: string[] = [];
  let working = content;

  // Remove stray trailing closers like `}` / `]` / `)` that often appear in
  // truncated AI output and trigger `Unexpected '}'` before repair can run.
  while (true) {
    const trimmed = working.trimEnd();
    if (!trimmed || !/[\]\)}]$/.test(trimmed)) break;

    const analysis = analyzeBracketSyntax(trimmed);
    const lastIndex = trimmed.length - 1;
    if (!analysis.issue || analysis.issue.index !== lastIndex) break;

    working = `${trimmed.slice(0, -1)}\n`;
    fixes.push(`removed trailing unexpected "${analysis.issue.char}"`);
  }

  const unterminatedLiteral = detectUnterminatedLiteral(working);
  const analysisTarget = unterminatedLiteral ? `${working}${unterminatedLiteral}` : working;
  const analysis = analyzeBracketSyntax(analysisTarget);
  let suffix = '';

  if (unterminatedLiteral) {
    suffix += unterminatedLiteral;
    if (unterminatedLiteral === '`' || unterminatedLiteral.endsWith('`')) {
      const exprClosers = unterminatedLiteral.slice(0, -1); // everything before the backtick
      if (exprClosers.length > 0) {
        fixes.push(`closed ${exprClosers.length} open template expression(s) and template literal`);
      } else {
        fixes.push('closed unterminated template literal');
      }
    } else if (unterminatedLiteral === '"' || unterminatedLiteral === "'") {
      fixes.push('closed unterminated string literal');
    }
  }

  if (!analysis.issue && analysis.stack.length > 0 && analysis.stack.length <= 5) {
    const closerChars: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
    const missingClosers = [...analysis.stack].reverse().map(open => closerChars[open]).join('');
    suffix += missingClosers;

    const groupedCounts = new Map<string, number>();
    for (const closer of missingClosers) {
      groupedCounts.set(closer, (groupedCounts.get(closer) || 0) + 1);
    }
    for (const [closer, count] of groupedCounts.entries()) {
      fixes.push(`added ${count}× "${closer}"`);
    }
  }

  if (fixes.length === 0) {
    return { content, fixed: false, description: '' };
  }

  return {
    content: suffix ? `${working}\n${suffix}\n` : working,
    fixed: true,
    description: fixes.join(', '),
  };
}

/**
 * Detect unterminated string/template literals and return the FULL closing
 * sequence needed. For template literals this includes closing any open
 * `${...}` expressions before closing the backtick.
 * 
 * Returns null if everything is balanced, or a string like:
 *   `"`   – close a regular string
 *   `` ` ``   – close a template literal (no open expressions)
 *   `` }` ``  – close one open `${...}` expression, then the template literal
 *   `` }}` `` – close two nested `${...}` expressions, then the literal
 */
function detectUnterminatedLiteral(content: string): string | null {
  let inString: '"' | "'" | null = null;
  let inTemplateLiteral = false;
  let templateExpressionDepth = 0; // depth of ${...} nesting inside template literals
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  // Track brace depth within template expressions to distinguish
  // `${ obj.x }` from `${ {a:1} }` (object literal inside expression)
  const templateBraceStack: number[] = []; // stack of brace depths per ${} level

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (inTemplateLiteral && templateExpressionDepth === 0) {
      // We're inside the template literal text (not inside ${...})
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '`') {
        inTemplateLiteral = false;
        continue;
      }
      if (ch === '$' && next === '{') {
        templateExpressionDepth++;
        templateBraceStack.push(0);
        i++; // skip '{'
        continue;
      }
      continue;
    }

    if (templateExpressionDepth > 0) {
      // We're inside a ${...} expression within a template literal
      // Need to track nested braces, strings, comments, and nested template literals
      if (ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = ch;
        continue;
      }
      if (ch === '`') {
        // Nested template literal inside ${...}
        inTemplateLiteral = true;
        // The outer expression is still open; this is a new template literal layer
        // We handle it by re-entering the template literal state
        // but templateExpressionDepth stays > 0 so the outer ${} is still tracked
        // Actually, we need to recurse conceptually. For simplicity,
        // let's track this as: we're in a new template literal layer.
        // When we exit it (find matching `), we return to the expression.
        // The simplest approach: push a marker and handle inline.
        continue;
      }
      if (ch === '{') {
        templateBraceStack[templateBraceStack.length - 1]++;
        continue;
      }
      if (ch === '}') {
        const currentBraceDepth = templateBraceStack[templateBraceStack.length - 1];
        if (currentBraceDepth > 0) {
          // Closing a nested brace inside the expression (e.g., object literal)
          templateBraceStack[templateBraceStack.length - 1]--;
        } else {
          // This '}' closes the ${...} expression
          templateBraceStack.pop();
          templateExpressionDepth--;
          // Now we're back in template literal text
        }
        continue;
      }
      if (ch === '$' && next === '{') {
        // Nested ${...} inside an expression (rare but possible in nested templates)
        templateExpressionDepth++;
        templateBraceStack.push(0);
        i++;
        continue;
      }
      continue;
    }

    // Top-level code (not in any string/template/comment)
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === '`') {
      inTemplateLiteral = true;
    }
  }

  if (inString) return inString;
  if (inTemplateLiteral || templateExpressionDepth > 0) {
    // Build closing sequence: close all open ${} expressions, then close the template
    let closer = '';
    // Close any nested braces inside the innermost expression
    if (templateBraceStack.length > 0) {
      closer += '}'.repeat(templateBraceStack[templateBraceStack.length - 1]);
    }
    // Close each open ${} expression level
    closer += '}'.repeat(templateExpressionDepth);
    // Close the template literal itself
    closer += '`';
    return closer;
  }
  return null;
}

function analyzeBracketSyntax(code: string): {
  issue: { char: string; index: number } | null;
  stack: string[];
} {
  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let inString: string | null = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inTemplateLiteral = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (inTemplateLiteral) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '`') inTemplateLiteral = false;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === '`') {
      inTemplateLiteral = true;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch === ')' || ch === ']' || ch === '}') {
      const expected = pairs[ch];
      if (stack.length === 0 || stack[stack.length - 1] !== expected) {
        return { issue: { char: ch, index: i }, stack };
      }
      stack.pop();
    }
  }

  return { issue: null, stack };
}

/**
 * Repair basic CSS brace imbalance by dropping unmatched closing braces and
 * appending missing closing braces at EOF. Strings/comments are preserved.
 */
function fixCssBraceBalance(content: string): { content: string; fixed: boolean; description: string } {
  let output = '';
  let depth = 0;
  let removedClosers = 0;
  let inString: '"' | "'" | null = null;
  let inComment = false;
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inComment) {
      output += ch;
      if (ch === '*' && next === '/') {
        output += '/';
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      output += ch;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '/' && next === '*') {
      output += '/*';
      inComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      output += ch;
      continue;
    }

    if (ch === '{') {
      depth++;
      output += ch;
      continue;
    }

    if (ch === '}') {
      if (depth === 0) {
        removedClosers++;
        continue;
      }
      depth--;
      output += ch;
      continue;
    }

    output += ch;
  }

  const fixes: string[] = [];
  if (removedClosers > 0) fixes.push(`removed ${removedClosers} unexpected CSS closing brace${removedClosers === 1 ? '' : 's'}`);
  if (depth > 0) fixes.push(`added ${depth} missing CSS closing brace${depth === 1 ? '' : 's'}`);

  if (fixes.length === 0) {
    return { content, fixed: false, description: '' };
  }

  const repairedContent = depth > 0 ? `${output.trimEnd()}\n${'}'.repeat(depth)}\n` : output;
  return {
    content: repairedContent,
    fixed: true,
    description: fixes.join(', '),
  };
}
