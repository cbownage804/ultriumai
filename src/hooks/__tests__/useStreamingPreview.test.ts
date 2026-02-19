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
}

function parseIncremental(rawContent: string): { files: ParsedFile[]; completedCount: number } {
  const lines = rawContent.split('\n');
  const files: ParsedFile[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let completedCount = 0;

  const flush = (isComplete: boolean) => {
    if (currentPath) {
      const content = currentLines.join('\n').trimEnd();
      if (content) {
        files.push({ path: currentPath, content, language: detectLanguage(currentPath) });
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
  flush(false);

  return { files, completedCount };
}

describe('parseIncremental', () => {
  it('parses a single complete file', () => {
    const input = '===FILE: index.html===\n<h1>Hello</h1>';
    const { files, completedCount } = parseIncremental(input);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('index.html');
    expect(files[0].content).toBe('<h1>Hello</h1>');
    expect(files[0].language).toBe('html');
    expect(completedCount).toBe(0); // last file is always in-progress
  });

  it('parses multiple files with correct completed count', () => {
    const input = '===FILE: index.html===\n<h1>Hi</h1>\n===FILE: style.css===\nbody { color: red; }';
    const { files, completedCount } = parseIncremental(input);
    expect(files).toHaveLength(2);
    expect(completedCount).toBe(1); // first file is complete, second is in-progress
    expect(files[0].path).toBe('index.html');
    expect(files[1].path).toBe('style.css');
    expect(files[1].language).toBe('css');
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
});
