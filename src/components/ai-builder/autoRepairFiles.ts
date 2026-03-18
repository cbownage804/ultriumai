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

    // ── 4. Fix multiple default exports (truncation artifact) ──
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      const defaultExportMatches = [...content.matchAll(/^export\s+default\s+/gm)];
      if (defaultExportMatches.length > 1) {
        // Keep only the FIRST export default, remove subsequent ones
        // This handles the common truncation case where the AI repeats code blocks
        const lines2 = content.split('\n');
        let foundFirst = false;
        const cleanedLines: string[] = [];
        for (const line of lines2) {
          if (/^export\s+default\s+/.test(line)) {
            if (!foundFirst) {
              foundFirst = true;
              cleanedLines.push(line);
            } else {
              // Skip duplicate export default line
              changed = true;
            }
          } else {
            cleanedLines.push(line);
          }
        }
        if (changed) {
          content = cleanedLines.join('\n');
          repairs.push(`${f.path}: removed ${defaultExportMatches.length - 1} duplicate export default(s)`);
        }
      }
    }

    // ── 4b. Fix missing export default for component files ──
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

    // ── 4c. Fix duplicate top-level declarations (truncation artifact) ──
    // When AI output is truncated and retried, it sometimes produces duplicate
    // const/function declarations. Keep the last one (most likely complete).
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      const declPattern = /^(?:export\s+)?(?:const|let|var|function)\s+([A-Z_]\w*)\s*(?:[:=<(])/gm;
      const declMap = new Map<string, { index: number; line: number }>();
      const linesToRemoveDups = new Set<number>();
      const contentLines = content.split('\n');
      let declMatch2;
      
      while ((declMatch2 = declPattern.exec(content)) !== null) {
        const name = declMatch2[1];
        const lineNum = content.slice(0, declMatch2.index).split('\n').length - 1;
        
        if (declMap.has(name)) {
          // Mark the FIRST occurrence for removal (keep the last, which is more likely complete)
          const prev = declMap.get(name)!;
          // Find the range of the first declaration to remove
          // Simple heuristic: remove from the line of the first declaration up to the line before the second
          // This is imprecise but handles the common case of duplicated code blocks
          linesToRemoveDups.add(prev.line);
          changed = true;
        }
        declMap.set(name, { index: declMatch2.index, line: lineNum });
      }
      
      // Only apply if we found simple single-line duplicates (conservative)
      // For complex multi-line duplicates, we skip to avoid breaking code
      if (linesToRemoveDups.size > 0 && linesToRemoveDups.size <= 3) {
        content = contentLines.filter((_, idx) => !linesToRemoveDups.has(idx)).join('\n');
        repairs.push(`${f.path}: removed ${linesToRemoveDups.size} duplicate declaration line(s)`);
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

    // ── 5b. Fix stray truncation artifacts: lines like  ')}  or  ")}; ──
    // These appear when AI output is cut mid-JSX-attribute, leaving a orphaned
    // string-close + paren/brace that crashes esbuild internally.
    const strayArtifactPattern = /^[ \t]*['"`]\s*\)\s*[;}]?\s*$/gm;
    let strayMatch;
    while ((strayMatch = strayArtifactPattern.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', strayMatch.index) + 1;
      const lineEnd = content.indexOf('\n', strayMatch.index);
      const fullLine = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
      // Only remove if the line is ONLY the stray artifact (nothing else meaningful)
      if (fullLine.trim().length <= 4) {
        content = content.slice(0, lineStart) + content.slice(lineEnd === -1 ? content.length : lineEnd + 1);
        changed = true;
        repairs.push(`${f.path}: removed stray truncation artifact line: ${fullLine.trim()}`);
        // Reset regex since content changed
        strayArtifactPattern.lastIndex = 0;
      }
    }

    // ── 5c. Fix truncated component declarations (no arrow/body after params) ──
    // Pattern: `export const Foo = (props: SomeType\n);` — missing `=> (...)` body
    if (['tsx', 'jsx'].includes(ext)) {
      const truncatedComponentPattern = /(?:export\s+)?(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\([^)]*\)\s*;/g;
      let truncMatch;
      while ((truncMatch = truncatedComponentPattern.exec(content)) !== null) {
        const fullMatch = truncMatch[0];
        const compName = truncMatch[1];
        // Only fix if it looks like a component (starts uppercase) and has no arrow
        if (!fullMatch.includes('=>') && !fullMatch.includes('function')) {
          const replacement = fullMatch.replace(/\)\s*;/, ') => (\n  <div />\n);');
          content = content.replace(fullMatch, replacement);
          changed = true;
          repairs.push(`${f.path}: fixed truncated component "${compName}" — added placeholder body`);
        }
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

    // ── 6c. Fix corrupted arrow functions: `= />` should be `=>` ──
    // AI sometimes splits `=>` across a line boundary or confuses it with JSX self-close `/>`.
    // Pattern: `(e) = />` or `() = />` should be `(e) =>` or `() =>`
    {
      const corruptedArrowPattern = /=\s*\/>/g;
      let arrowMatch;
      // Only fix when it looks like a callback context (preceded by `)`)
      const corruptedCallbackPattern = /\)\s*=\s*\/>\s*/g;
      if (corruptedCallbackPattern.test(content)) {
        content = content.replace(/(\))\s*=\s*\/>\s*/g, '$1 => ');
        changed = true;
        repairs.push(`${f.path}: fixed corrupted arrow function "= />" → "=>"`);
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

    // ── 9. Auto-add loading="lazy" to img tags missing it (below-fold optimization) ──
    if (['tsx', 'jsx', 'html'].includes(ext)) {
      const imgWithoutLazy = /<img\b(?![^>]*loading=)[^>]*>/gi;
      let imgMatch;
      while ((imgMatch = imgWithoutLazy.exec(content)) !== null) {
        const original = imgMatch[0];
        // Don't add lazy to the first image (likely above fold / hero)
        const isFirstImage = content.indexOf(original) === imgMatch.index && imgMatch.index < 500;
        if (!isFirstImage) {
          const fixed = original.replace(/<img\b/, '<img loading="lazy"');
          content = content.replace(original, fixed);
          changed = true;
          repairs.push(`${f.path}: added loading="lazy" to img tag`);
        }
      }
    }

    // ── 10. Fix empty/missing img src attributes ──
    if (['tsx', 'jsx'].includes(ext)) {
      const emptySrcPattern = /<img\b[^>]*src\s*=\s*["']\s*["'][^>]*>/gi;
      let emptySrcMatch;
      while ((emptySrcMatch = emptySrcPattern.exec(content)) !== null) {
        const original = emptySrcMatch[0];
        const fixed = original.replace(/src\s*=\s*["']\s*["']/, 'src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"');
        content = content.replace(original, fixed);
        changed = true;
        repairs.push(`${f.path}: replaced empty img src with placeholder`);
      }
    }

    if (!changed) return f;
    return { ...f, content };
  });

  // ── Project-level structural repairs ──
  const existingPaths = new Set(repaired.map(f => f.path));

  // Ensure src/main.tsx imports src/index.css
  const mainFile = repaired.find(f => f.path === 'src/main.tsx' || f.path === 'src/main.ts');
  if (mainFile) {
    const hasCssImport = /import\s+['"]\.\/index\.css['"]/.test(mainFile.content) ||
                         /import\s+['"]\.\/styles\.css['"]/.test(mainFile.content) ||
                         /import\s+['"]\.\/App\.css['"]/.test(mainFile.content);
    const cssFileExists = existingPaths.has('src/index.css') || existingPaths.has('src/styles.css') || existingPaths.has('src/App.css');
    
    if (!hasCssImport && cssFileExists) {
      const cssPath = existingPaths.has('src/index.css') ? './index.css' : 
                      existingPaths.has('src/styles.css') ? './styles.css' : './App.css';
      mainFile.content = `import '${cssPath}';\n${mainFile.content}`;
      repairs.push(`${mainFile.path}: added missing CSS import (${cssPath})`);
    }
    
    // Ensure main.tsx imports React
    if (!mainFile.content.includes("from 'react'") && !mainFile.content.includes('from "react"')) {
      mainFile.content = `import React from 'react';\n${mainFile.content}`;
      repairs.push(`${mainFile.path}: added missing React import`);
    }
    
    // Ensure main.tsx imports ReactDOM
    if (!mainFile.content.includes("from 'react-dom") && !mainFile.content.includes('from "react-dom')) {
      mainFile.content = `import ReactDOM from 'react-dom/client';\n${mainFile.content}`;
      repairs.push(`${mainFile.path}: added missing ReactDOM import`);
    }
  }

  // If src/index.css exists but has no @tailwind directives, and other files use Tailwind classes
  const indexCss = repaired.find(f => f.path === 'src/index.css');
  const hasTailwindUsage = repaired.some(f => 
    /\.(tsx|jsx)$/.test(f.path) && 
    /className\s*=\s*["'][^"']*(?:bg-|text-|flex|grid|p-|m-|rounded|shadow|border|font-|hover:|w-|h-|gap-|items-|justify-)/i.test(f.content)
  );
  if (indexCss && hasTailwindUsage && !indexCss.content.includes('@tailwind')) {
    indexCss.content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${indexCss.content}`;
    repairs.push('src/index.css: prepended @tailwind directives');
  }

  // If no src/index.css but Tailwind classes are used, create one
  if (!existingPaths.has('src/index.css') && !existingPaths.has('src/styles.css') && hasTailwindUsage) {
    repaired.push({
      path: 'src/index.css',
      content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
      language: 'css',
    } as ProjectFile);
    existingPaths.add('src/index.css');
    repairs.push('src/index.css: auto-created with @tailwind directives');
    
    // Also ensure main.tsx imports it
    if (mainFile && !mainFile.content.includes('./index.css')) {
      mainFile.content = `import './index.css';\n${mainFile.content}`;
      repairs.push(`${mainFile.path}: added import for auto-created index.css`);
    }
  }

  // Ensure src/main.tsx exists if we have src/App.tsx but no entry point
  const hasApp = existingPaths.has('src/App.tsx') || existingPaths.has('src/App.ts');
  const hasMain = existingPaths.has('src/main.tsx') || existingPaths.has('src/main.ts');
  if (hasApp && !hasMain) {
    const cssImport = existingPaths.has('src/index.css') ? "import './index.css';\n" : '';
    repaired.push({
      path: 'src/main.tsx',
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n${cssImport}\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
      language: 'typescriptreact',
    } as ProjectFile);
    repairs.push('src/main.tsx: auto-generated entry point');
  }

  // ── Ensure index.html has essential SEO meta tags ──
  const indexHtml = repaired.find(f => f.path === 'index.html');
  if (indexHtml) {
    if (!indexHtml.content.includes('viewport')) {
      indexHtml.content = indexHtml.content.replace(
        '</head>',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  </head>'
      );
      repairs.push('index.html: added viewport meta tag');
    }
    if (!indexHtml.content.includes('charset')) {
      indexHtml.content = indexHtml.content.replace(
        '<head>',
        '<head>\n  <meta charset="UTF-8" />'
      );
      repairs.push('index.html: added charset meta tag');
    }
  }

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
