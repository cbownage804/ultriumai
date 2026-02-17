import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface PatchResult {
  patched: boolean;
  files: ProjectFile[];
  fixes: string[];
}

/**
 * Deterministic post-build auto-patcher for delete/remove buttons.
 * Scans generated code and fixes common broken patterns WITHOUT using AI.
 * Zero credit cost — pure regex/AST transforms.
 */
export function useDeleteButtonAutoPatcher() {
  const patchDeleteButtons = useCallback((files: ProjectFile[]): PatchResult => {
    const fixes: string[] = [];
    const patchedFiles = files.map(file => {
      if (!file.path.match(/\.(js|ts|jsx|tsx|html)$/)) return file;

      let content = file.content;
      let modified = false;

      // ─── FIX 1: Buttons with onclick referencing undefined functions ───
      // Pattern: onclick="deleteItem(id)" but deleteItem is never defined
      const onclickRefs = [...content.matchAll(/onclick\s*=\s*["'](\w+)\s*\(/g)];
      for (const match of onclickRefs) {
        const fnName = match[1];
        // Check if function is defined anywhere in this file
        const fnDefined = new RegExp(`(?:function\\s+${fnName}|(?:const|let|var)\\s+${fnName}\\s*=)`).test(content);
        if (!fnDefined && (fnName.includes('delete') || fnName.includes('remove') || fnName.includes('Delete') || fnName.includes('Remove'))) {
          // Inject a working delete function
          const arrayNameGuess = guessArrayName(content);
          const deleteFunc = buildDeleteFunction(fnName, arrayNameGuess);
          // Insert before the first function or at the end of script
          const insertPoint = findInsertPoint(content);
          content = content.slice(0, insertPoint) + '\n' + deleteFunc + '\n' + content.slice(insertPoint);
          modified = true;
          fixes.push(`Injected missing "${fnName}" function in ${file.path}`);
        }
      }

      // ─── FIX 2: addEventListener('click', ...) on delete buttons with no handler ───
      const addEventRefs = [...content.matchAll(/\.addEventListener\s*\(\s*['"]click['"]\s*,\s*(\w+)\s*\)/g)];
      for (const match of addEventRefs) {
        const fnName = match[1];
        const fnDefined = new RegExp(`(?:function\\s+${fnName}|(?:const|let|var)\\s+${fnName}\\s*=)`).test(content);
        if (!fnDefined && (fnName.toLowerCase().includes('delete') || fnName.toLowerCase().includes('remove'))) {
          const arrayNameGuess = guessArrayName(content);
          const deleteFunc = buildDeleteFunction(fnName, arrayNameGuess);
          const insertPoint = findInsertPoint(content);
          content = content.slice(0, insertPoint) + '\n' + deleteFunc + '\n' + content.slice(insertPoint);
          modified = true;
          fixes.push(`Injected missing "${fnName}" handler in ${file.path}`);
        }
      }

      // ─── FIX 3: Delete uses splice() without re-render ───
      const splicePattern = /\.splice\s*\([^)]+\)\s*;?\s*\n(?!\s*(?:save|render|update|display|refresh|draw|build|show|localStorage))/g;
      if (splicePattern.test(content)) {
        // Replace splice with filter pattern
        content = content.replace(
          /(\w+)\.splice\s*\(\s*(\w+)\s*,\s*1\s*\)\s*;/g,
          (match, arr, idx) => {
            // Check if there's a render call nearby (within 3 lines)
            const afterMatch = content.slice(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 200);
            if (!/render|save|update|display|refresh/.test(afterMatch.split('\n').slice(0, 3).join('\n'))) {
              modified = true;
              fixes.push(`Replaced splice() with filter() + re-render in ${file.path}`);
              return `${arr} = ${arr}.filter((_, i) => i !== ${idx}); render();`;
            }
            return match;
          }
        );
      }

      // ─── FIX 4: Delete button inside clickable parent without stopPropagation ───
      const deleteButtonPattern = /(<button[^>]*(?:delete|remove|trash|×|✕|✖|🗑)[^>]*onclick\s*=\s*["'])(?!.*stopPropagation)/gi;
      if (deleteButtonPattern.test(content)) {
        content = content.replace(deleteButtonPattern, (match, prefix) => {
          modified = true;
          fixes.push(`Added stopPropagation to delete button in ${file.path}`);
          return `${prefix}event.stopPropagation(); `;
        });
      }

      // ─── FIX 5: innerHTML += destroys event listeners — inject re-attachment ───
      const innerHTMLPattern = /(\w+)\.innerHTML\s*\+?=\s*[`'"]/g;
      const hasDeleteButton = /delete|remove|trash|🗑/i.test(content);
      if (innerHTMLPattern.test(content) && hasDeleteButton) {
        // Check if there's a function that re-attaches listeners after innerHTML
        const hasReattach = /querySelectorAll.*addEventListener|onclick\s*=/i.test(
          content.slice(content.search(innerHTMLPattern))
        );
        if (!hasReattach) {
          // Add a comment warning — this is the #1 cause of broken delete buttons
          const warningComment = '\n// ⚠️ AUTO-FIX: Re-attach delete handlers after innerHTML update\n';
          const reattachCode = buildReattachCode(content);
          // Find the end of the innerHTML assignment block
          const innerHTMLMatch = content.match(/(\w+)\.innerHTML\s*\+?=\s*[`'"][\s\S]*?[`'"]\s*;/);
          if (innerHTMLMatch) {
            const insertAt = content.indexOf(innerHTMLMatch[0]) + innerHTMLMatch[0].length;
            content = content.slice(0, insertAt) + warningComment + reattachCode + content.slice(insertAt);
            modified = true;
            fixes.push(`Added event re-attachment after innerHTML in ${file.path}`);
          }
        }
      }

      // ─── FIX 6: data-id attributes missing on delete buttons ───
      // If using event delegation with closest('[data-id]') but buttons don't have data-id
      if (content.includes("closest('[data-id]')") || content.includes('closest("[data-id]")')) {
        // Check if the rendered HTML includes data-id on the delete button's parent
        const templateLiterals = [...content.matchAll(/`([^`]*(?:delete|remove|trash)[^`]*)`/gi)];
        for (const tpl of templateLiterals) {
          if (!tpl[1].includes('data-id')) {
            // The template that renders delete buttons is missing data-id
            fixes.push(`Warning: Event delegation uses data-id but template may be missing it in ${file.path}`);
          }
        }
      }

      // ─── FIX 7: filter() used but render() not called after ───
      const filterAssignments = [...content.matchAll(/(\w+)\s*=\s*\1\.filter\([^)]+\)\s*;?\s*\n/g)];
      for (const fa of filterAssignments) {
        const afterFilter = content.slice(content.indexOf(fa[0]) + fa[0].length);
        const nextLines = afterFilter.split('\n').slice(0, 3).join('\n');
        if (!/render|save|update|display|refresh|persist|localStorage|setState/.test(nextLines)) {
          // Add render call after filter
          const insertAt = content.indexOf(fa[0]) + fa[0].length;
          const renderFn = findRenderFunction(content);
          if (renderFn) {
            content = content.slice(0, insertAt) + `  ${renderFn}();\n` + content.slice(insertAt);
            modified = true;
            fixes.push(`Added missing ${renderFn}() call after .filter() in ${file.path}`);
          }
        }
      }

      return modified ? { ...file, content } : file;
    });

    return {
      patched: fixes.length > 0,
      files: patchedFiles,
      fixes,
    };
  }, []);

  return { patchDeleteButtons };
}

// ─── Helper functions ───

function guessArrayName(content: string): string {
  // Try to find the main data array name
  const patterns = [
    /(?:let|var)\s+(\w+)\s*=\s*(?:JSON\.parse|localStorage|\[\])/,
    /(?:let|var)\s+(\w+)\s*=\s*\[/,
    /function\s+render(\w*)\s*\(/,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m?.[1]) {
      if (p === patterns[2]) {
        // renderItems -> items, renderTasks -> tasks
        return m[1].toLowerCase() || 'items';
      }
      return m[1];
    }
  }
  return 'items';
}

function buildDeleteFunction(fnName: string, arrayName: string): string {
  const renderFn = `render${arrayName.charAt(0).toUpperCase() + arrayName.slice(1)}`;
  return `function ${fnName}(id) {
  if (!confirm('Are you sure you want to remove this?')) return;
  ${arrayName} = ${arrayName}.filter(item => item.id !== id);
  try { localStorage.setItem('${arrayName}', JSON.stringify(${arrayName})); } catch(e) {}
  if (typeof ${renderFn} === 'function') ${renderFn}();
  else if (typeof render === 'function') render();
}`;
}

function findInsertPoint(content: string): number {
  // Insert before the first function definition or at end of script
  const firstFn = content.search(/(?:^|\n)(?:function\s+\w|(?:const|let|var)\s+\w+\s*=\s*(?:\([^)]*\)|function)\s*)/m);
  if (firstFn > 0) return firstFn;
  // Before closing </script> if HTML
  const scriptClose = content.lastIndexOf('</script>');
  if (scriptClose > 0) return scriptClose;
  return content.length;
}

function findRenderFunction(content: string): string | null {
  const match = content.match(/function\s+(render\w*)\s*\(/);
  if (match) return match[1];
  const constMatch = content.match(/(?:const|let|var)\s+(render\w*)\s*=/);
  if (constMatch) return constMatch[1];
  if (content.includes('function render(')) return 'render';
  return null;
}

function buildReattachCode(content: string): string {
  // Try to find the delete function name
  const deleteFnMatch = content.match(/function\s+((?:delete|remove)\w*)\s*\(/i);
  const fnName = deleteFnMatch?.[1] || 'deleteItem';

  return `document.querySelectorAll('[data-delete-id], .delete-btn, .remove-btn, [onclick*="delete"], [onclick*="remove"]').forEach(btn => {
  const id = btn.dataset.deleteId || btn.closest('[data-id]')?.dataset.id;
  if (id && typeof ${fnName} === 'function') {
    btn.onclick = (e) => { e.stopPropagation(); ${fnName}(id); };
  }
});\n`;
}
