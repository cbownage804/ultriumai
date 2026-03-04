import { useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface ValidationIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0–100
}

/**
 * Post-generation output validator.
 * Catches common syntax/structural errors before rendering the preview.
 */
export function useOutputValidation() {
  const validate = useCallback((files: ProjectFile[]): ValidationResult => {
    const issues: ValidationIssue[] = [];

    for (const file of files) {
      if (shouldSkipValidationForFile(file.path)) continue;

      const ext = file.path.split('.').pop()?.toLowerCase() || '';

      // ── HTML validation ──
      if (ext === 'html' || ext === 'htm') {
        validateHTML(file, issues);
      }

      // ── JS/TS/JSX/TSX validation ──
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) {
        validateJS(file, issues);
      }

      // ── CSS validation ──
      if (ext === 'css') {
        validateCSS(file, issues);
      }

      // ── General checks ──
      validateGeneral(file, issues);
    }

    // Cross-file checks
    validateImports(files.filter(f => !shouldSkipValidationForFile(f.path)), issues);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5));

    return {
      isValid: errorCount === 0,
      issues,
      score,
    };
  }, []);

  return { validate };
}

const VALIDATION_SKIP_PATHS = new Set([
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'postcss.config.ts',
  'vite.config.js',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
]);

function shouldSkipValidationForFile(path: string): boolean {
  return VALIDATION_SKIP_PATHS.has(path);
}

// ── HTML Checks ──
function validateHTML(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;

  // Unclosed tags (simple heuristic)
  const openTags = (content.match(/<(?!\/|!|br|hr|img|input|meta|link|area|base|col|embed|source|track|wbr)[a-z][a-z0-9]*(?:\s[^>]*)?>(?!.*<\/\1)/gi) || []).length;
  const closeTags = (content.match(/<\/[a-z][a-z0-9]*>/gi) || []).length;
  if (Math.abs(openTags - closeTags) > 3) {
    issues.push({ file: file.path, severity: 'warning', message: `Potential unclosed HTML tags (${openTags} open vs ${closeTags} close)` });
  }

  // Missing doctype
  if (file.path === 'index.html' && !content.includes('<!DOCTYPE') && !content.includes('<!doctype')) {
    issues.push({ file: file.path, severity: 'warning', message: 'Missing <!DOCTYPE html> declaration' });
  }
}

// ── JS/TS Checks ──
function validateJS(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;
  const lines = content.split('\n');

  // Bracket balance
  const brackets: Record<string, number> = { '{': 0, '(': 0, '[': 0 };
  const closers: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
  // Strip strings, comments, and template literals for accurate bracket counting
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/gs, '""'); // 's' flag for multiline template literals

  for (const char of stripped) {
    if (char in brackets) brackets[char]++;
    if (char in closers) brackets[closers[char]]--;
  }

  if (brackets['{'] !== 0) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced curly braces: ${brackets['{']} unclosed`, suggestion: 'Check for missing } at the end of functions or blocks' });
  }
  if (brackets['('] !== 0) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced parentheses: ${brackets['(']} unclosed` });
  }
  if (brackets['['] !== 0) {
    issues.push({ file: file.path, severity: 'warning', message: `Unbalanced square brackets: ${brackets['[']} unclosed` });
  }

  // Unterminated template literals (backtick count should be even after stripping comments)
  const commentStripped = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '');
  const backtickCount = (commentStripped.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    issues.push({ file: file.path, severity: 'error', message: 'Unterminated template literal (odd number of backticks)', suggestion: 'Check for a missing closing backtick in template strings' });
  }

  // Duplicate function/const declarations
  const declarations = new Map<string, number>();
  lines.forEach((line, idx) => {
    const match = line.match(/^(?:export\s+)?(?:const|let|var|function|class)\s+(\w+)/);
    if (match) {
      const name = match[1];
      if (declarations.has(name)) {
        issues.push({ file: file.path, line: idx + 1, severity: 'warning', message: `Duplicate declaration: "${name}" (also at line ${declarations.get(name)})` });
      }
      declarations.set(name, idx + 1);
    }
  });

  // React-specific: hooks called conditionally
  if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
    let inConditional = 0;
    lines.forEach((line, idx) => {
      if (/\bif\s*\(/.test(line)) inConditional++;
      if (inConditional > 0 && /\buse[A-Z]\w*\s*\(/.test(line)) {
        issues.push({ file: file.path, line: idx + 1, severity: 'error', message: `React Hook called inside conditional block`, suggestion: 'Move hooks to the top level of the component' });
      }
      if (line.includes('}') && inConditional > 0) inConditional--;
    });
  }

  // Undefined references to common patterns
  if (/\bundefined\b/.test(content) === false) {
    // Check for obvious typos: console.olg, docuemnt, etc.
    const typos = [
      [/console\.\s*(?!log|warn|error|info|debug|trace|table|group|time|dir|assert|count|clear)\w+/g, 'Possible console method typo'],
      [/docuemnt|dcoument|documnet/gi, 'Typo: "document"'],
      [/widnow|windwo/gi, 'Typo: "window"'],
    ] as const;
    for (const [pattern, msg] of typos) {
      const match = content.match(pattern);
      if (match) {
        issues.push({ file: file.path, severity: 'warning', message: `${msg}: "${match[0]}"` });
      }
    }
  }

  // Empty export default
  if (/export\s+default\s*;/.test(content)) {
    issues.push({ file: file.path, severity: 'error', message: 'Empty export default statement' });
  }
}

// ── CSS Checks ──
function validateCSS(file: ProjectFile, issues: ValidationIssue[]) {
  const content = file.content;

  // Bracket balance
  const opens = (content.match(/{/g) || []).length;
  const closes = (content.match(/}/g) || []).length;
  if (opens !== closes) {
    issues.push({ file: file.path, severity: 'error', message: `Unbalanced CSS braces: ${opens} open vs ${closes} close` });
  }

  // Empty rules
  const emptyRules = content.match(/[^}]\s*{\s*}/g);
  if (emptyRules && emptyRules.length > 2) {
    issues.push({ file: file.path, severity: 'warning', message: `${emptyRules.length} empty CSS rules` });
  }
}

// ── General Checks ──
function validateGeneral(file: ProjectFile, issues: ValidationIssue[]) {
  // AI commentary leaked into code
  const aiLeaks = [
    /^(?:Sure|Here(?:'s| is)|I(?:'ve| have)|Let me|This (?:code|will|should))/m,
    /```(?:typescript|javascript|tsx|jsx|html|css)/,
    /^#{1,3}\s+/m,
  ];
  for (const pattern of aiLeaks) {
    if (pattern.test(file.content)) {
      issues.push({ file: file.path, severity: 'error', message: 'AI commentary detected in code output', suggestion: 'The parser may have failed to strip conversational text from code' });
      break;
    }
  }

  // Truncated file (ends mid-statement)
  const trimmed = file.content.trim();
  if (trimmed.length > 50) {
    const lastChar = trimmed[trimmed.length - 1];
    const dangerousEndings = [',', ':', '=', '+', '-', '(', '{', '[', '&&', '||'];
    if (dangerousEndings.includes(lastChar)) {
      issues.push({ file: file.path, severity: 'error', message: `File appears truncated (ends with "${lastChar}")`, suggestion: 'The AI may have hit a token limit mid-output' });
    }
  }
}

// ── Cross-file import validation ──
function validateImports(files: ProjectFile[], issues: ValidationIssue[]) {
  const filePaths = new Set(files.map(f => f.path));

  for (const file of files) {
    if (!file.path.match(/\.(js|ts|jsx|tsx)$/)) continue;

    // Find relative imports
    const importMatches = file.content.matchAll(/(?:import|from)\s+['"](\.[^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      // Resolve relative path (simplified)
      const resolved = resolveRelativeImport(file.path, importPath);
      const possiblePaths = [
        resolved,
        resolved + '.ts', resolved + '.tsx', resolved + '.js', resolved + '.jsx',
        resolved + '/index.ts', resolved + '/index.tsx', resolved + '/index.js',
      ];

      if (!possiblePaths.some(p => filePaths.has(p))) {
        // Only warn if the project has enough files to expect the import to exist
        if (files.length >= 3) {
          issues.push({ file: file.path, severity: 'warning', message: `Import "${importPath}" may not resolve to a project file` });
        }
      }
    }
  }
}

function resolveRelativeImport(fromPath: string, importPath: string): string {
  const fromDir = fromPath.split('/').slice(0, -1);
  const parts = importPath.split('/');

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') fromDir.pop();
    else fromDir.push(part);
  }

  return fromDir.join('/');
}

/**
 * Deterministic pre-validation sanitizer for staged builder files.
 * Strips inline SVG and normalizes obvious JSX breakage BEFORE validation runs.
 * Only operates on .tsx/.jsx files. Does not modify index.html or routing.
 */
export function sanitizeStagedFiles(files: ProjectFile[]): { files: ProjectFile[]; fixes: string[] } {
  const fixes: string[] = [];

  const SVG_TO_LUCIDE: Record<string, string> = {
    check: 'Check', checkmark: 'Check', tick: 'Check',
    arrow: 'ArrowRight', 'arrow-right': 'ArrowRight', 'arrow-left': 'ArrowLeft',
    'arrow-up': 'ArrowUp', 'arrow-down': 'ArrowDown',
    star: 'Star', stars: 'Star',
    shield: 'Shield', 'shield-check': 'ShieldCheck',
    zap: 'Zap', lightning: 'Zap', bolt: 'Zap',
    layers: 'Layers', stack: 'Layers',
    close: 'X', x: 'X', times: 'X',
    menu: 'Menu', hamburger: 'Menu',
    search: 'Search', magnify: 'Search',
    home: 'Home', house: 'Home',
    settings: 'Settings', gear: 'Settings', cog: 'Settings',
    user: 'User', person: 'User', profile: 'User',
    heart: 'Heart', like: 'Heart',
    mail: 'Mail', email: 'Mail', envelope: 'Mail',
    phone: 'Phone', call: 'Phone',
    plus: 'Plus', add: 'Plus',
    minus: 'Minus',
    edit: 'Edit', pencil: 'Pencil',
    trash: 'Trash2', delete: 'Trash2',
    eye: 'Eye', view: 'Eye',
    'eye-off': 'EyeOff', hide: 'EyeOff',
    lock: 'Lock', unlock: 'Unlock',
    calendar: 'Calendar', date: 'Calendar',
    clock: 'Clock', time: 'Clock',
    download: 'Download', upload: 'Upload',
    link: 'Link', chain: 'Link',
    globe: 'Globe', world: 'Globe', earth: 'Globe',
    sun: 'Sun', moon: 'Moon',
    bell: 'Bell', notification: 'Bell',
    info: 'Info', warning: 'AlertTriangle', alert: 'AlertTriangle',
    error: 'AlertCircle', danger: 'AlertCircle',
  };

  const sanitized = files.map(f => {
    const ext = f.path.split('.').pop()?.toLowerCase() || '';
    if (!['tsx', 'jsx'].includes(ext)) return f;

    let content = f.content;
    let changed = false;

    // 1. Replace inline <svg>...</svg> blocks
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const svgMatches = content.match(svgRegex);
    if (svgMatches) {
      const neededIcons = new Set<string>();

      for (const svgBlock of svgMatches) {
        let iconName: string | null = null;

        const hintMatch = svgBlock.match(/(?:className|aria-label|name|title)=["']([^"']*?)["']/i);
        const hint = hintMatch?.[1]?.toLowerCase().replace(/[^a-z-]/g, '') || '';

        if (hint && SVG_TO_LUCIDE[hint]) {
          iconName = SVG_TO_LUCIDE[hint];
        } else {
          const svgLower = svgBlock.toLowerCase();
          for (const [keyword, lucideName] of Object.entries(SVG_TO_LUCIDE)) {
            if (svgLower.includes(keyword)) {
              iconName = lucideName;
              break;
            }
          }
        }

        if (iconName) {
          neededIcons.add(iconName);
          content = content.replace(svgBlock, `<${iconName} />`);
          fixes.push(`${f.path}: replaced inline SVG with <${iconName} />`);
        } else {
          content = content.replace(svgBlock, '<span aria-hidden="true" />');
          fixes.push(`${f.path}: replaced unmapped inline SVG with placeholder`);
        }
        changed = true;
      }

      if (neededIcons.size > 0) {
        const iconList = Array.from(neededIcons).join(', ');
        const existingImport = content.match(/import\s*{([^}]*)}\s*from\s*['"]lucide-react['"]/);
        if (existingImport) {
          const existing = existingImport[1].split(',').map(s => s.trim()).filter(Boolean);
          const merged = Array.from(new Set([...existing, ...neededIcons]));
          content = content.replace(existingImport[0], `import { ${merged.join(', ')} } from 'lucide-react'`);
        } else {
          const lastImportIdx = content.lastIndexOf('\nimport ');
          if (lastImportIdx >= 0) {
            const insertAt = content.indexOf('\n', lastImportIdx + 1);
            content = content.slice(0, insertAt) + `\nimport { ${iconList} } from 'lucide-react';` + content.slice(insertAt);
          } else {
            content = `import { ${iconList} } from 'lucide-react';\n` + content;
          }
        }
      }
    }

    // 2. Remove orphaned SVG child tags outside <svg> context
    if (!content.match(/<svg/i)) {
      const orphanSvgTags = /<(?:path|circle|rect|line|polyline|polygon|ellipse|g)\s[^>]*\/?>/gi;
      if (orphanSvgTags.test(content)) {
        content = content.replace(/<(?:path|circle|rect|line|polyline|polygon|ellipse|g)\s[^>]*\/?>/gi, '');
        fixes.push(`${f.path}: removed orphaned SVG child tags`);
        changed = true;
      }
    }

    // 3. Normalize "return <JSX>" to "return (<JSX>)" when missing parens
    content = content.replace(/(\breturn)\s+(<[A-Z][a-zA-Z]*[\s/>])/g, (_match, ret, jsx) => {
      fixes.push(`${f.path}: wrapped JSX return in parentheses`);
      changed = true;
      return `${ret} (\n    ${jsx}`;
    });

    if (!changed) return f;
    return { ...f, content };
  });

  return { files: sanitized, fixes };
}
