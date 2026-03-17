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
