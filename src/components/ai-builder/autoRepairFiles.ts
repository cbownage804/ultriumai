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
    const result = fixBracketBalance(content, { jsx: ['tsx', 'jsx'].includes(ext) });
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

      // Fix class= with className= (common non-JSX habit)
      if (/\bclass\s*=/i.test(content)) {
        // Replace `class=` but NOT `className=` — and not inside strings
        const classFixed = content.replace(/\bclass(\s*=)/g, (match, eq, offset) => {
          // Don't replace if already className
          if (content.slice(Math.max(0, offset - 5), offset + match.length).includes('className')) return match;
          return 'className' + eq;
        });
        if (classFixed !== content) {
          content = classFixed;
          changed = true;
          repairs.push(`${f.path}: replaced class= with className=`);
        }
      }

      // Fix for= with htmlFor= on labels (common non-JSX habit)
      if (/\bfor\s*=\s*["']/.test(content) && /<label/i.test(content)) {
        content = content.replace(/\bfor(\s*=\s*["'])/g, 'htmlFor$1');
        changed = true;
        repairs.push(`${f.path}: replaced for= with htmlFor=`);
      }

      // ── 6a. Fix malformed framer-motion closing tags: `</motion>` → `</motion.X>` ──
      // AI frequently drops the `.div`/`.section`/etc. on the closing tag, producing
      // `</motion></div>` which esbuild rejects ("Syntax error near </motion>").
      // This parser intentionally does NOT use `[^>]*` for opening tags because JSX
      // attributes can contain comparisons/arrows (`count > 0`, `() => ...`).
      const motionRepair = fixFramerMotionTagBalance(content);
      if (motionRepair.fixed) {
        content = motionRepair.content;
        changed = true;
        repairs.push(`${f.path}: ${motionRepair.description}`);
      }

      // ── 6b0. Remove orphaned/out-of-order </textarea> before JSX balance runs ──
      // AI sometimes generates `</textarea></div>` after an <input> or other node,
      // which can still have equal open/close counts but is structurally invalid.
      {
        const originalContent = content;
        let openTextareaDepth = 0;
        let removedCount = 0;

        content = content.replace(/<textarea\b[^>]*>|<\/textarea\s*>/gi, (match) => {
          if (/^<textarea\b/i.test(match)) {
            if (!/\/\s*>$/.test(match)) {
              openTextareaDepth += 1;
            }
            return match;
          }

          if (openTextareaDepth > 0) {
            openTextareaDepth -= 1;
            return match;
          }

          removedCount += 1;
          return '';
        });

        if (removedCount > 0 && content !== originalContent) {
          changed = true;
          repairs.push(`${f.path}: removed ${removedCount} orphaned </textarea> tag(s)`);
        }
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

    // ── 6d. Fix orphaned hook closures at start of function body ──
    // AI truncation sometimes produces:
    //   export default function Foo() {
    //     }, []);        ← orphaned useEffect/useMemo/useCallback closure
    //     const x = ...  ← real code starts here
    // Remove the orphaned `}, [...]); ` or `});` lines that appear before any real statement.
    {
      const orphanedHookPattern = /^((?:export\s+)?(?:default\s+)?(?:function|const|let|var)\s+\w+[\s\S]*?\{\s*\n)((?:\s*\}(?:,\s*\[[^\]]*\])?\s*\)?\s*;?\s*\n)+)/m;
      const orphanMatch = orphanedHookPattern.exec(content);
      if (orphanMatch) {
        const orphanedBlock = orphanMatch[2];
        // Only remove if the orphaned block looks like a hook closure (}, []); or });)
        if (/\}\s*,?\s*\[?\]?\s*\)?\s*;/.test(orphanedBlock.trim())) {
          content = content.replace(orphanMatch[0], orphanMatch[1]);
          changed = true;
          repairs.push(`${f.path}: removed orphaned hook closure at start of function body`);
        }
      }
    }

    // ── 6e. Remove duplicate consecutive code blocks (truncation/retry artifact) ──
    // AI sometimes duplicates a block of lines when retrying. Detect 3+ consecutive
    // lines that appear again immediately after, and remove the duplicate.
    {
      const cLines = content.split('\n');
      const minBlockSize = 3;
      let i = 0;
      const cleanedLines: string[] = [];
      let dupRemoved = 0;

      while (i < cLines.length) {
        let foundDup = false;
        for (let blockSize = Math.min(20, Math.floor((cLines.length - i) / 2)); blockSize >= minBlockSize; blockSize--) {
          if (i + blockSize * 2 > cLines.length) continue;
          let isMatch = true;
          for (let j = 0; j < blockSize; j++) {
            if (cLines[i + j].trim() !== cLines[i + blockSize + j].trim()) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            for (let j = 0; j < blockSize; j++) {
              cleanedLines.push(cLines[i + j]);
            }
            i += blockSize * 2;
            dupRemoved += blockSize;
            foundDup = true;
            break;
          }
        }
        if (!foundDup) {
          cleanedLines.push(cLines[i]);
          i++;
        }
      }

      if (dupRemoved > 0) {
        content = cleanedLines.join('\n');
        changed = true;
        repairs.push(`${f.path}: removed ${dupRemoved} duplicated line(s) (retry artifact)`);
      }
    }

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

    // ── 11. Auto-add missing React hook imports ──
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      const hookUsageMap: Record<string, RegExp> = {
        useState: /\buseState\b/,
        useEffect: /\buseEffect\b/,
        useCallback: /\buseCallback\b/,
        useMemo: /\buseMemo\b/,
        useRef: /\buseRef\b/,
        useContext: /\buseContext\b/,
        useReducer: /\buseReducer\b/,
      };
      const usedHooks: string[] = [];
      for (const [hook, pattern] of Object.entries(hookUsageMap)) {
        if (pattern.test(content)) usedHooks.push(hook);
      }
      if (usedHooks.length > 0) {
        // Check if these hooks are already imported
        const existingReactImport = content.match(/import\s+(?:React,?\s*)?\{([^}]+)\}\s+from\s+['"]react['"]/);
        const importedHooks = existingReactImport
          ? existingReactImport[1].split(',').map(h => h.trim())
          : [];
        const missingHooks = usedHooks.filter(h => !importedHooks.includes(h));
        // Also check for standalone `import React from 'react'` without destructured hooks
        const hasReactDefaultOnly = /import\s+React\s+from\s+['"]react['"]/.test(content) &&
          !existingReactImport;

        if (missingHooks.length > 0) {
          if (existingReactImport) {
            // Add missing hooks to existing import
            const allHooks = [...new Set([...importedHooks, ...missingHooks])].sort();
            content = content.replace(
              /import\s+(?:React,?\s*)?\{[^}]+\}\s+from\s+['"]react['"]/,
              `import React, { ${allHooks.join(', ')} } from 'react'`
            );
            changed = true;
            repairs.push(`${f.path}: added missing hooks to React import: ${missingHooks.join(', ')}`);
          } else if (hasReactDefaultOnly) {
            // Upgrade `import React from 'react'` to include hooks
            content = content.replace(
              /import\s+React\s+from\s+['"]react['"]/,
              `import React, { ${missingHooks.join(', ')} } from 'react'`
            );
            changed = true;
            repairs.push(`${f.path}: added missing hooks to React import: ${missingHooks.join(', ')}`);
          } else if (!content.includes("from 'react'") && !content.includes('from "react"')) {
            // No React import at all — add one
            content = `import React, { ${missingHooks.join(', ')} } from 'react';\n${content}`;
            changed = true;
            repairs.push(`${f.path}: added React import with hooks: ${missingHooks.join(', ')}`);
          }
        }
      }
    }

    // ── 12. Auto-add missing react-router-dom imports ──
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      const routerComponents: Record<string, RegExp> = {
        BrowserRouter: /\bBrowserRouter\b/,
        Routes: /\bRoutes\b/,
        Route: /\bRoute\b/,
        Link: /\b<Link\b/,
        NavLink: /\b<NavLink\b/,
        useNavigate: /\buseNavigate\b/,
        useParams: /\buseParams\b/,
        useLocation: /\buseLocation\b/,
        Navigate: /\b<Navigate\b/,
        Outlet: /\b<Outlet\b/,
      };
      const usedRouterItems: string[] = [];
      for (const [name, pattern] of Object.entries(routerComponents)) {
        if (pattern.test(content)) usedRouterItems.push(name);
      }
      if (usedRouterItems.length > 0 && !content.includes("from 'react-router-dom'") && !content.includes('from "react-router-dom"')) {
        content = `import { ${usedRouterItems.join(', ')} } from 'react-router-dom';\n${content}`;
        changed = true;
        repairs.push(`${f.path}: added missing react-router-dom import: ${usedRouterItems.join(', ')}`);
      }
    }

    // ── 13. Auto-add missing lucide-react imports ──
    if (['tsx', 'jsx'].includes(ext)) {
      const lucideUsage = content.match(/<([A-Z][a-zA-Z]+)\s[^>]*(?:className|size|strokeWidth)/g);
      if (lucideUsage && content.includes('lucide-react')) {
        // Already has a lucide import — check for missing icons
        const existingLucideImport = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
        if (existingLucideImport) {
          const importedIcons = existingLucideImport[1].split(',').map(s => s.trim());
          const usedIcons = new Set<string>();
          const iconUsagePattern = /<([A-Z][a-zA-Z]+)\s/g;
          let iconMatch;
          while ((iconMatch = iconUsagePattern.exec(content)) !== null) {
            usedIcons.add(iconMatch[1]);
          }
          // Filter to only icons that look like lucide icons (not regular components)
          const missingIcons = [...usedIcons].filter(icon => 
            !importedIcons.includes(icon) && 
            // Heuristic: lucide icons are multi-word PascalCase like ChevronRight, ArrowLeft
            /^[A-Z][a-z]+[A-Z]/.test(icon)
          );
          if (missingIcons.length > 0 && missingIcons.length <= 10) {
            const allIcons = [...new Set([...importedIcons, ...missingIcons])];
            content = content.replace(
              /import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"]/,
              `import { ${allIcons.join(', ')} } from 'lucide-react'`
            );
            changed = true;
            repairs.push(`${f.path}: added missing lucide-react icons: ${missingIcons.join(', ')}`);
          }
        }
      }
    }

    // Absolute last-line shield: bare </motion> is never valid JSX and has
    // repeatedly surfaced as a preview-blocking esbuild syntax error. Run this
    // after every other pass so later JSX balancing cannot leave it behind.
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      const beforeBareMotionShield = content;
      content = removeBareFramerMotionClosers(content);
      if (content !== beforeBareMotionShield) {
        changed = true;
        const removed = (beforeBareMotionShield.match(/<\/motion\s*>/gi) || []).length;
        repairs.push(`${f.path}: removed ${removed} invalid bare framer-motion closing tag${removed === 1 ? '' : 's'} in final shield`);
      }
    }

    // Final syntax shield for a real failure mode seen in generated output:
    // the model completes the component, writes `export default App;`, then
    // streams a tail of orphan JSX closers such as
    // `</div></div></section></main></div>`. Even if JSX balancing missed the
    // earlier structure, JSX after a terminal export statement can never be
    // valid module syntax, so prune it before Vite/esbuild sees it.
    if (['tsx', 'jsx'].includes(ext)) {
      const trailingJsx = stripDanglingJsxAfterDefaultExport(content);
      if (trailingJsx.fixed) {
        content = trailingJsx.content;
        changed = true;
        repairs.push(`${f.path}: ${trailingJsx.description}`);
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

  // ── Ensure smooth scrolling in CSS ──
  const cssFileForScroll = repaired.find(f => f.path === 'src/index.css') || repaired.find(f => f.path === 'src/styles.css');
  if (cssFileForScroll && !cssFileForScroll.content.includes('scroll-behavior')) {
    const insertPoint = cssFileForScroll.content.includes('@tailwind utilities;') 
      ? cssFileForScroll.content.indexOf('@tailwind utilities;') + '@tailwind utilities;'.length
      : 0;
    const smoothScrollCSS = '\n\nhtml {\n  scroll-behavior: smooth;\n}\n';
    cssFileForScroll.content = cssFileForScroll.content.slice(0, insertPoint) + smoothScrollCSS + cssFileForScroll.content.slice(insertPoint);
    repairs.push(`${cssFileForScroll.path}: added smooth scrolling to html`);
  }

  return { files: repaired, repairs };
}

/**
 * Repair malformed framer-motion JSX tags without being confused by `>` inside
 * JSX attribute expressions. This specifically prevents generated code like
 * `</motion></div>` or `</motion.div></motion></div>` from ever reaching Vite.
 */
function fixFramerMotionTagBalance(content: string): { content: string; fixed: boolean; description: string } {
  const events: Array<{ index: number; length: number; replacement: string }> = [];
  const stack: string[] = [];
  let repairedBare = 0;
  let removedBare = 0;
  let removedMember = 0;

  let i = 0;
  while (i < content.length) {
    const openIndex = content.indexOf('<', i);
    if (openIndex === -1) break;

    const parsed = parseMotionTokenAt(content, openIndex);
    if (!parsed) {
      i = openIndex + 1;
      continue;
    }

    if (parsed.kind === 'open') {
      if (!parsed.selfClosing) stack.push(parsed.tag);
      i = parsed.end;
      continue;
    }

    const closeTag = parsed.tag;
    const expected = stack[stack.length - 1];

    if (!closeTag) {
      if (expected) {
        // Bare `</motion>` while a specific motion tag is open: preserve the
        // generated structure by rewriting to the expected member close.
        stack.pop();
        events.push({
          index: openIndex,
          length: parsed.end - openIndex,
          replacement: `</motion.${expected}>`,
        });
        repairedBare++;
      } else {
        // Bare `</motion>` with no corresponding opener is never legal JSX.
        events.push({ index: openIndex, length: parsed.end - openIndex, replacement: '' });
        removedBare++;
      }
      i = parsed.end;
      continue;
    }

    if (expected === closeTag) {
      stack.pop();
    } else {
      const matchingIndex = stack.lastIndexOf(closeTag);
      if (matchingIndex >= 0) {
        // Close any unclosed inner motion tags first, then consume this close.
        stack.length = matchingIndex;
      } else {
        // Extra `</motion.div>` with no corresponding opener is invalid JSX.
        events.push({ index: openIndex, length: parsed.end - openIndex, replacement: '' });
        removedMember++;
      }
    }
    i = parsed.end;
  }

  // Absolute last line of defense: no bare `</motion>` token is valid JSX. If
  // one escaped structural parsing (for example after malformed neighboring
  // markup), remove it before Vite/esbuild can choke on it.
  const alreadyHandled = new Set(events.map(e => e.index));
  const bareCloseRe = /<\/motion\s*>/g;
  let bareMatch: RegExpExecArray | null;
  while ((bareMatch = bareCloseRe.exec(content)) !== null) {
    if (alreadyHandled.has(bareMatch.index)) continue;
    events.push({ index: bareMatch.index, length: bareMatch[0].length, replacement: '' });
    removedBare++;
  }

  if (events.length === 0) {
    return { content, fixed: false, description: '' };
  }

  events.sort((a, b) => b.index - a.index);
  let output = content;
  for (const event of events) {
    output = output.slice(0, event.index) + event.replacement + output.slice(event.index + event.length);
  }

  const parts: string[] = [];
  if (repairedBare > 0) parts.push(`rewrote ${repairedBare} bare framer-motion closing tag${repairedBare === 1 ? '' : 's'}`);
  if (removedBare > 0) parts.push(`removed ${removedBare} orphaned bare framer-motion closing tag${removedBare === 1 ? '' : 's'}`);
  if (removedMember > 0) parts.push(`removed ${removedMember} orphaned framer-motion member closing tag${removedMember === 1 ? '' : 's'}`);

  return {
    content: output,
    fixed: true,
    description: parts.join(', ') || `repaired ${events.length} framer-motion closing tag${events.length === 1 ? '' : 's'}`,
  };
}

function parseMotionTokenAt(content: string, index: number):
  | { kind: 'open'; tag: string; end: number; selfClosing: boolean }
  | { kind: 'close'; tag: string | null; end: number }
  | null {
  const rest = content.slice(index);
  const closeMatch = rest.match(/^<\/motion(?:\.([A-Za-z][\w-]*))?\s*>/);
  if (closeMatch) {
    return {
      kind: 'close',
      tag: closeMatch[1] || null,
      end: index + closeMatch[0].length,
    };
  }

  const openMatch = rest.match(/^<motion\.([A-Za-z][\w-]*)(?=[\s/>])/);
  if (!openMatch) return null;

  const tagEnd = findJsxTagEnd(content, index + openMatch[0].length);
  if (tagEnd === -1) return null;

  const tagText = content.slice(index, tagEnd + 1);
  return {
    kind: 'open',
    tag: openMatch[1],
    end: tagEnd + 1,
    selfClosing: /\/\s*>$/.test(tagText),
  };
}

function removeBareFramerMotionClosers(content: string): string {
  return content.replace(/<\/motion\s*>/gi, '');
}

function stripDanglingJsxAfterDefaultExport(content: string): { content: string; fixed: boolean; description: string } {
  const exportLineRe = /^[ \t]*export\s+default\s+[A-Za-z_$][\w$]*\s*;?[ \t]*(?:\/\/.*)?$/gm;
  let match: RegExpExecArray | null;
  let lastMatch: RegExpExecArray | null = null;

  while ((match = exportLineRe.exec(content)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch || lastMatch.index === undefined) {
    return { content, fixed: false, description: '' };
  }

  const lineEnd = content.indexOf('\n', lastMatch.index);
  const suffixStart = lineEnd === -1 ? content.length : lineEnd + 1;
  const suffix = content.slice(suffixStart);
  if (!looksLikeDanglingExportSuffix(suffix)) {
    return { content, fixed: false, description: '' };
  }

  return {
    content: `${content.slice(0, suffixStart).trimEnd()}\n`,
    fixed: true,
    description: 'removed dangling JSX emitted after terminal export default',
  };
}

function looksLikeDanglingExportSuffix(suffix: string): boolean {
  const trimmed = suffix.trim();
  if (!trimmed) return false;
  if (/^[`)\]},;]+$/.test(trimmed)) return /[`\])}]/.test(trimmed);
  if (!/^<\/?(?:[a-z][\w-]*|motion(?:\.[A-Za-z][\w-]*)?|>|\s)/i.test(trimmed)) return false;

  let rest = trimmed;
  const tagRe = /^(?:<\/?[a-z][\w-]*(?:\s[^<>]*)?>|<\/?motion(?:\.[A-Za-z][\w-]*)?\s*>|<>|<\/>)\s*/i;
  let tagCount = 0;

  while (rest.length > 0) {
    const tag = rest.match(tagRe);
    if (tag) {
      tagCount++;
      rest = rest.slice(tag[0].length).trimStart();
      continue;
    }

    const punctuation = rest.match(/^[)\]},;]+\s*/);
    if (punctuation) {
      rest = rest.slice(punctuation[0].length).trimStart();
      continue;
    }

    return false;
  }

  return tagCount > 0;
}

function findJsxTagEnd(content: string, start: number): number {
  let quote: '"' | "'" | '`' | null = null;
  let escaped = false;
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = start; i < content.length; i++) {
    const ch = content[i];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      braceDepth++;
      continue;
    }
    if (ch === '}' && braceDepth > 0) {
      braceDepth--;
      continue;
    }
    if (ch === '(' && braceDepth > 0) {
      parenDepth++;
      continue;
    }
    if (ch === ')' && braceDepth > 0 && parenDepth > 0) {
      parenDepth--;
      continue;
    }
    if (ch === '[' && braceDepth > 0) {
      bracketDepth++;
      continue;
    }
    if (ch === ']' && braceDepth > 0 && bracketDepth > 0) {
      bracketDepth--;
      continue;
    }

    if (ch === '>' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      return i;
    }
  }

  return -1;
}

/**
 * Fix JSX tag balance for lowercase HTML tags + fragments.
 * Designed to be conservative (avoids uppercase tags to prevent TS generic false-positives).
 */
function fixJsxTagBalance(content: string): { content: string; fixed: boolean; description: string } {
  const tokenRegex = /<\/>|<>|<\/[a-z][a-z0-9]*\s*>|<[a-z][a-z0-9]*(?=[\s/>])[^>]*>/g;
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
function fixBracketBalance(content: string, options: { jsx?: boolean } = {}): { content: string; fixed: boolean; description: string } {
  const fixes: string[] = [];
  let working = content;

  // Remove stray trailing closers like `}` / `]` / `)` that often appear in
  // truncated AI output and trigger `Unexpected '}'` before repair can run.
  while (true) {
    const trimmed = working.trimEnd();
    if (!trimmed || !/[\]\)}]$/.test(trimmed)) break;

    const analysis = analyzeBracketSyntax(trimmed, options);
    const lastIndex = trimmed.length - 1;
    if (!analysis.issue || analysis.issue.index !== lastIndex) break;

    working = `${trimmed.slice(0, -1)}\n`;
    fixes.push(`removed trailing unexpected "${analysis.issue.char}"`);
  }

  const unterminatedLiteral = detectUnterminatedLiteral(working, options);
  const analysisTarget = unterminatedLiteral ? `${working}${unterminatedLiteral}` : working;
  const analysis = analyzeBracketSyntax(analysisTarget, options);
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
function detectUnterminatedLiteral(content: string, options: { jsx?: boolean } = {}): string | null {
  let inString: '"' | "'" | null = null;
  let inTemplateLiteral = false;
  let templateExpressionDepth = 0; // depth of ${...} nesting inside template literals
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  let jsxDepth = 0;
  let inJsxTag = false;
  let jsxTagQuote: '"' | "'" | null = null;
  let pendingJsxTag: 'open' | 'close' | 'self' | null = null;
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

    if (options.jsx && (inJsxTag || jsxDepth > 0)) {
      if (inJsxTag) {
        if (jsxTagQuote) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === jsxTagQuote) jsxTagQuote = null;
          continue;
        }
        if (ch === '"' || ch === "'") {
          jsxTagQuote = ch;
          continue;
        }
        if (ch === '`') {
          // Template literals inside JSX attributes still need normal JS repair
          // when the stream cuts off before the closing `}` / tag `>`.
          inTemplateLiteral = true;
          inJsxTag = false;
          pendingJsxTag = null;
          continue;
        }
        if (ch === '/' && next === '>') {
          if (pendingJsxTag === 'open') jsxDepth = Math.max(0, jsxDepth - 1);
          inJsxTag = false;
          pendingJsxTag = null;
          i++;
          continue;
        }
        if (ch === '>') {
          if (pendingJsxTag === 'open') jsxDepth++;
          if (pendingJsxTag === 'close') jsxDepth = Math.max(0, jsxDepth - 1);
          inJsxTag = false;
          pendingJsxTag = null;
          continue;
        }
        continue;
      }

      // JSX text: apostrophes/quotes are plain text, not JS string delimiters.
      if (ch === '<') {
        if (next === '/') {
          inJsxTag = true;
          pendingJsxTag = 'close';
          i++;
          continue;
        }
        if (next === '>' || /[A-Za-z]/.test(next || '')) {
          inJsxTag = true;
          pendingJsxTag = 'open';
          if (next === '>') {
            jsxDepth++;
            inJsxTag = false;
            pendingJsxTag = null;
            i++;
          }
          continue;
        }
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
    if (options.jsx && ch === '<' && (next === '>' || /[A-Za-z]/.test(next || ''))) {
      inJsxTag = true;
      pendingJsxTag = 'open';
      if (next === '>') {
        jsxDepth++;
        inJsxTag = false;
        pendingJsxTag = null;
        i++;
      }
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

function analyzeBracketSyntax(code: string, options: { jsx?: boolean } = {}): {
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
  let jsxDepth = 0;
  let inJsxTag = false;
  let jsxTagQuote: string | null = null;
  let pendingJsxTag: 'open' | 'close' | 'self' | null = null;

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

    if (options.jsx && (inJsxTag || jsxDepth > 0)) {
      if (inJsxTag) {
        if (jsxTagQuote) {
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (ch === jsxTagQuote) jsxTagQuote = null;
          continue;
        }
        if (ch === '"' || ch === "'") {
          jsxTagQuote = ch;
          continue;
        }
        if (ch === '`') {
          inTemplateLiteral = true;
          inJsxTag = false;
          pendingJsxTag = null;
          continue;
        }
        if (ch === '/' && next === '>') {
          if (pendingJsxTag === 'open') jsxDepth = Math.max(0, jsxDepth - 1);
          inJsxTag = false;
          pendingJsxTag = null;
          i++;
          continue;
        }
        if (ch === '>') {
          if (pendingJsxTag === 'open') jsxDepth++;
          if (pendingJsxTag === 'close') jsxDepth = Math.max(0, jsxDepth - 1);
          inJsxTag = false;
          pendingJsxTag = null;
          continue;
        }
        continue;
      }

      // JSX text can contain quotes, braces, and parens as plain content.
      // Only tag boundaries matter for returning to normal JS parsing.
      if (ch === '<') {
        if (next === '/') {
          inJsxTag = true;
          pendingJsxTag = 'close';
          i++;
          continue;
        }
        if (next === '>' || /[A-Za-z]/.test(next || '')) {
          inJsxTag = true;
          pendingJsxTag = 'open';
          if (next === '>') {
            jsxDepth++;
            inJsxTag = false;
            pendingJsxTag = null;
            i++;
          }
          continue;
        }
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

    if (options.jsx && ch === '<' && (next === '>' || /[A-Za-z]/.test(next || ''))) {
      inJsxTag = true;
      pendingJsxTag = 'open';
      if (next === '>') {
        jsxDepth++;
        inJsxTag = false;
        pendingJsxTag = null;
        i++;
      }
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
