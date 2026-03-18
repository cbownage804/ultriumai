import { describe, it, expect } from 'vitest';

// Test the core parsing logic extracted from useStreamingPreview
const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    json: 'json', md: 'markdown', svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

interface ParsedFile {
  path: string;
  content: string;
  language: string;
  incomplete?: boolean;
}

function isFileTruncated(content: string): boolean {
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/gs, '""');

  let braces = 0, parens = 0, brackets = 0;
  for (const ch of stripped) {
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }

  return braces > 0 || parens > 0 || brackets > 0;
}

function parseIncremental(rawContent: string): { files: ParsedFile[]; completedCount: number } {
  const lines = rawContent.split('\n');
  const files: ParsedFile[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let completedCount = 0;
  const hasEndMarker = lines.some(line => line.trim() === '===END===');

  const flush = (isComplete: boolean, isLast = false) => {
    if (currentPath) {
      const content = currentLines.join('\n').trimEnd().replace(/\n\s*===END===\s*$/, '');
      if (content) {
        const ext = currentPath.split('.').pop()?.toLowerCase() || '';
        const shouldCheckTruncation = ['ts', 'tsx', 'js', 'jsx'].includes(ext);
        const isTruncated = shouldCheckTruncation && isFileTruncated(content);
        files.push({
          path: currentPath,
          content,
          language: detectLanguage(currentPath),
          ...(isLast && (!hasEndMarker || isTruncated) ? { incomplete: true } : {}),
        });
        if (isComplete) completedCount++;
      }
    }
  };

  for (const line of lines) {
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flush(true);
      currentPath = match[1].trim();
      currentLines = [];
    } else if (currentPath !== null) {
      currentLines.push(line);
    }
  }
  flush(false, true);

  return { files, completedCount };
}

describe('parseIncremental', () => {
  it('marks a single streamed file as incomplete until ===END=== arrives', () => {
    const input = '===FILE: index.html===\n<h1>Hello</h1>';
    const { files, completedCount } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('index.html');
    expect(files[0].content).toBe('<h1>Hello</h1>');
    expect(files[0].language).toBe('html');
    expect(files[0].incomplete).toBe(true);
    expect(completedCount).toBe(0);
  });

  it('treats the final file as complete once ===END=== is present', () => {
    const input = '===FILE: index.html===\n<h1>Hello</h1>\n===END===';
    const { files, completedCount } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].incomplete).toBeUndefined();
    expect(completedCount).toBe(0);
  });

  it('parses multiple files with correct completed count', () => {
    const input = '===FILE: index.html===\n<h1>Hi</h1>\n===FILE: style.css===\nbody { color: red; }';
    const { files, completedCount } = parseIncremental(input);
    expect(files).toHaveLength(2);
    expect(completedCount).toBe(1);
    expect(files[0].path).toBe('index.html');
    expect(files[1].path).toBe('style.css');
    expect(files[1].language).toBe('css');
    expect(files[1].incomplete).toBe(true);
  });

  it('detects TypeScript language', () => {
    const input = '===FILE: App.tsx===\nexport default () => <div />';
    const { files } = parseIncremental(input);
    expect(files[0].language).toBe('typescript');
  });

  it('handles empty content between delimiters', () => {
    const input = '===FILE: empty.js===\n===FILE: real.js===\nconsole.log("hi")';
    const { files } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('real.js');
  });

  it('ignores content before first delimiter', () => {
    const input = 'some preamble text\n===FILE: index.html===\n<div>ok</div>';
    const { files } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('index.html');
  });

  it('marks truncated tsx output as incomplete even if an end marker exists', () => {
    const input = '===FILE: src/App.tsx===\nexport default function App() {\n  return (\n    <div>Hi</div>\n===END===';
    const { files } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].incomplete).toBe(true);
  });
});
