/**
 * parseViteErrors — Extract file paths and line numbers from Vite/esbuild
 * error messages to power inline editor annotations.
 */

export interface ParsedViteError {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Parse Vite/esbuild/TypeScript error strings into structured annotations.
 * Handles formats like:
 *   - "src/App.tsx(12,5): error TS2304: Cannot find name 'foo'"
 *   - "src/App.tsx:12:5 - error: ..."
 *   - "[plugin:vite:esbuild] ... (12:5)"
 *   - "ERROR: ... in src/App.tsx:12:5"
 */
export function parseViteErrors(errors: string[]): ParsedViteError[] {
  const results: ParsedViteError[] = [];

  for (const raw of errors) {
    const parsed = tryParseError(raw);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

function tryParseError(raw: string): ParsedViteError | null {
  // Format: "path(line,col): error ..."  (TypeScript style)
  const tsMatch = raw.match(/^([\w/.-]+\.(?:tsx?|jsx?))\((\d+),(\d+)\):\s*(error|warning)\s+(.+)/i);
  if (tsMatch) {
    return {
      file: tsMatch[1],
      line: parseInt(tsMatch[2], 10),
      column: parseInt(tsMatch[3], 10),
      message: tsMatch[5].trim(),
      severity: tsMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
    };
  }

  // Format: "path:line:col - error: ..."
  const colonMatch = raw.match(/([\w/.-]+\.(?:tsx?|jsx?|css|html)):(\d+):(\d+)\s*[-–]\s*(error|warning):\s*(.+)/i);
  if (colonMatch) {
    return {
      file: colonMatch[1],
      line: parseInt(colonMatch[2], 10),
      column: parseInt(colonMatch[3], 10),
      message: colonMatch[5].trim(),
      severity: colonMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
    };
  }

  // Format: "... in path:line:col" (esbuild style)
  const inMatch = raw.match(/in\s+([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)/i);
  if (inMatch) {
    return {
      file: inMatch[1],
      line: parseInt(inMatch[2], 10),
      column: parseInt(inMatch[3], 10),
      message: raw.trim(),
      severity: 'error',
    };
  }

  // Format: "[plugin:...] path:line:col" (Vite plugin errors)
  const pluginMatch = raw.match(/\[plugin:[^\]]+\]\s*([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)/i);
  if (pluginMatch) {
    return {
      file: pluginMatch[1],
      line: parseInt(pluginMatch[2], 10),
      column: parseInt(pluginMatch[3], 10),
      message: raw.replace(/\[plugin:[^\]]+\]\s*/, '').trim(),
      severity: 'error',
    };
  }

  // Format: just "path:line:col ..." (simple colon-separated)
  const simpleMatch = raw.match(/^([\w/.-]+\.(?:tsx?|jsx?)):(\d+):(\d+)\s+(.+)/);
  if (simpleMatch) {
    return {
      file: simpleMatch[1],
      line: parseInt(simpleMatch[2], 10),
      column: parseInt(simpleMatch[3], 10),
      message: simpleMatch[4].trim(),
      severity: 'error',
    };
  }

  return null;
}

/**
 * Merge pre-compile validation issues and Vite errors into a unified annotation list.
 */
export function mergeErrorSources(
  preCompileIssues: { file: string; message: string; severity: 'error' | 'warning' }[],
  viteErrors: ParsedViteError[],
): ParsedViteError[] {
  const merged: ParsedViteError[] = [];

  // Pre-compile issues (no line info — default to line 1)
  for (const issue of preCompileIssues) {
    merged.push({
      file: issue.file,
      line: 1,
      message: `[Pre-compile] ${issue.message}`,
      severity: issue.severity,
    });
  }

  // Vite errors (have line info)
  for (const err of viteErrors) {
    merged.push(err);
  }

  return merged;
}

/**
 * Generate actionable follow-up prompt suggestions from build errors.
 * Returns 2-3 specific chips like "Add missing import for useState" or "Create file src/utils/helpers.ts".
 */
export function generateErrorSuggestions(errors: ParsedViteError[]): { label: string; prompt: string }[] {
  const suggestions: { label: string; prompt: string }[] = [];
  const seen = new Set<string>();

  for (const err of errors) {
    const msg = err.message;

    // Missing import / Cannot find name
    const nameMatch = msg.match(/Cannot find name '(\w+)'/i) || msg.match(/is not defined.*'(\w+)'/i);
    if (nameMatch && !seen.has(`import-${nameMatch[1]}`)) {
      seen.add(`import-${nameMatch[1]}`);
      suggestions.push({
        label: `Add missing import for \`${nameMatch[1]}\``,
        prompt: `Add the missing import for "${nameMatch[1]}" in ${err.file}`,
      });
    }

    // Module not found / Cannot find module
    const moduleMatch = msg.match(/Cannot find module '([^']+)'/i) || msg.match(/Module not found.*'([^']+)'/i);
    if (moduleMatch && !seen.has(`module-${moduleMatch[1]}`)) {
      seen.add(`module-${moduleMatch[1]}`);
      const mod = moduleMatch[1];
      if (mod.startsWith('.') || mod.startsWith('/')) {
        suggestions.push({
          label: `Create file \`${mod}\``,
          prompt: `Create the missing file "${mod}" that is imported in ${err.file}`,
        });
      } else {
        suggestions.push({
          label: `Install package \`${mod}\``,
          prompt: `Add the missing npm package "${mod}" and update the imports in ${err.file}`,
        });
      }
    }

    // Type errors
    const typeMatch = msg.match(/Type '(\w+)' is not assignable to type '(\w+)'/i);
    if (typeMatch && !seen.has(`type-${typeMatch[1]}-${typeMatch[2]}`)) {
      seen.add(`type-${typeMatch[1]}-${typeMatch[2]}`);
      suggestions.push({
        label: `Fix type mismatch in \`${err.file.split('/').pop()}\``,
        prompt: `Fix the type error in ${err.file}:${err.line} — Type '${typeMatch[1]}' is not assignable to type '${typeMatch[2]}'`,
      });
    }

    // Property does not exist
    const propMatch = msg.match(/Property '(\w+)' does not exist on type '(\w+)'/i);
    if (propMatch && !seen.has(`prop-${propMatch[1]}`)) {
      seen.add(`prop-${propMatch[1]}`);
      suggestions.push({
        label: `Add property \`${propMatch[1]}\` to \`${propMatch[2]}\``,
        prompt: `Fix the error in ${err.file}:${err.line} — add the missing property "${propMatch[1]}" to the type "${propMatch[2]}"`,
      });
    }

    // JSX/syntax errors
    if (/unexpected token|expected.*[;,)}]/i.test(msg) && !seen.has(`syntax-${err.file}`)) {
      seen.add(`syntax-${err.file}`);
      suggestions.push({
        label: `Fix syntax error in \`${err.file.split('/').pop()}\``,
        prompt: `Fix the syntax error at ${err.file}:${err.line} — ${msg}`,
      });
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions.slice(0, 3);
}
