import { describe, it, expect } from 'vitest';

/**
 * Tests for parseMultiFileOutput strict state-machine parser.
 * Re-implements core logic in isolation.
 */

const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;
const DELETE_DELIMITER = /^===DELETE:\s*(.+?)===$/;
const EDIT_DELIMITER = /^===EDIT:\s*(.+?)===$/;
const END_RE = /^===END===\s*$/;

interface ParsedFile {
  path: string;
  content: string;
  language: string;
  incomplete?: boolean;
}

function stripOuterMarkdownFenceOnly(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1].trimEnd() + '\n' : content;
}

function parseFiles(raw: string): { files: ParsedFile[]; deletions: string[]; ignored: string[] } {
  const lines = raw.split('\n');
  const files: ParsedFile[] = [];
  const deletions: string[] = [];
  const ignored: string[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let inEditBlock = false;
  let sawEnd = false;

  const langMap: Record<string, string> = {
    html: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
  };

  const flushCurrent = (isIncomplete: boolean) => {
    if (!currentPath) return;
    let content = stripOuterMarkdownFenceOnly(currentLines.join('\n')).trim();
    if (content) {
      const ext = currentPath.split('.').pop()?.toLowerCase() || '';
      const file: ParsedFile = { path: currentPath, content, language: langMap[ext] || 'plaintext' };
      if (isIncomplete) file.incomplete = true;
      files.push(file);
    }
    currentPath = null;
    currentLines = [];
  };

  for (const line of lines) {
    if (END_RE.test(line)) {
      sawEnd = true;
      flushCurrent(false);
      break;
    }
    if (EDIT_DELIMITER.test(line)) {
      flushCurrent(false); inEditBlock = true; continue;
    }
    const delMatch = line.match(DELETE_DELIMITER);
    if (delMatch) {
      flushCurrent(false); inEditBlock = false; deletions.push(delMatch[1].trim()); continue;
    }
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flushCurrent(false); currentPath = match[1].trim(); currentLines = []; inEditBlock = false; continue;
    }
    if (inEditBlock) continue;
    if (currentPath !== null) {
      currentLines.push(line);
      continue;
    }
    if (line.trim()) ignored.push(line);
  }

  if (currentPath !== null) {
    flushCurrent(!sawEnd);
  }

  return { files, deletions, ignored };
}

// Keep isConversationalLine exported for backward-compat tests
function isConversationalLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[<{\/\[\]()@#.;:=!&|+\-*%?~`\\]/.test(trimmed)) return false;
  if (/^(import |export |const |let |var |function |class |return |if |else |for |while |switch |case |try |catch |throw |new |type |interface |enum |async |await |from |default |module |require|<!DOCTYPE|<\?xml)/.test(trimmed)) return false;
  const markers = [
    /^(what'?s (next|changed)|would you like|let me know|here'?s what|i('?ve| have)|shall i|want me to|feel free|happy to|hope this|this (should|will|creates?|adds?|implements?|includes?|features?|provides?|is a))/i,
    /^(#{1,4}\s)/,
    /^(🎉|👋|✅|🚀|💡|📝)/,
    /^(Great|Perfect|Done|Now |Next |The app|Your app|I've |Here are|Here is|Let me|I can|This (update|change|version|adds|creates|implements|gives|provides|includes|features|is a|should))/,
    /^\*\*[\w\s]+\*\*[.:]/,
    /^```[\w]*\s*$/,
    /^I\s[a-z]/,
    /^\d+\s+(new|component|file|change)/i,
    /^\d+\.\s+\*\*[A-Z]/,
    /^[-•]\s+\*\*[A-Z]/,
    /^[-•]\s+[A-Z][a-z].*[:.]\s*$/,
    /^\[.+\]\(.+\)/,
    /^[A-Z][a-z]+ly,?\s/,
  ];
  return markers.some(r => r.test(trimmed));
}

describe('parseMultiFileOutput (strict state machine)', () => {
  it('parses basic multi-file output', () => {
    const input = `===FILE: index.html===\n<h1>Hello</h1>\n===FILE: styles.css===\nbody { color: red; }`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('index.html');
    expect(files[0].content).toBe('<h1>Hello</h1>');
    expect(files[1].path).toBe('styles.css');
    expect(files[1].language).toBe('css');
  });

  it('handles ===DELETE: blocks', () => {
    const input = `===DELETE: old.js===\n===FILE: new.js===\nconsole.log('new');`;
    const { files, deletions } = parseFiles(input);
    expect(deletions).toEqual(['old.js']);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('new.js');
  });

  it('keeps prose inside file blocks (strict: no conversational stripping)', () => {
    const input = `===FILE: app.js===\nconsole.log('hi');\n\n\nI added a new feature here.\n===END===`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('I added');
  });

  it('does NOT strip code after a single blank line', () => {
    const input = `===FILE: style.css===\nbody { color: red; }\n\n/* comment after blank line */\ndiv { padding: 10px; }\n===END===`;
    const { files } = parseFiles(input);
    expect(files[0].content).toContain('/* comment after blank line */');
    expect(files[0].content).toContain('div { padding: 10px; }');
  });

  it('collects preamble text into ignored[]', () => {
    const input = `Here's your app:\n\n===FILE: index.html===\n<div>OK</div>\n===END===`;
    const { files, ignored } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].content).toBe('<div>OK</div>');
    expect(ignored).toContain("Here's your app:");
  });

  it('handles empty/malformed input', () => {
    const { files: f1 } = parseFiles('');
    expect(f1).toHaveLength(0);
    const { files: f2 } = parseFiles('Just some text without any delimiters');
    expect(f2).toHaveLength(0);
  });

  it('handles React tsx files', () => {
    const input = `===FILE: App.tsx===\nimport { useState } from 'react';\nexport default function App() {\n  return <div>Hello</div>;\n}\n===END===`;
    const { files } = parseFiles(input);
    expect(files[0].language).toBe('typescript');
    expect(files[0].content).toContain('export default function App');
  });

  it('skips ===EDIT: blocks', () => {
    const input = `===FILE: new.js===\nconst x = 1;\n===EDIT: existing.js===\n@@ 5-8 @@\nconst y = 2;\n===FILE: another.js===\nconst z = 3;\n===END===`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('new.js');
    expect(files[1].path).toBe('another.js');
  });

  it('handles multiple deletes', () => {
    const input = `===DELETE: old1.js===\n===DELETE: old2.css===\n===FILE: replacement.js===\nconsole.log('replaced');\n===END===`;
    const { files, deletions } = parseFiles(input);
    expect(deletions).toEqual(['old1.js', 'old2.css']);
    expect(files).toHaveLength(1);
  });

  // ── ===END=== and incomplete flag tests ──

  it('marks last file incomplete when no ===END=== and no closing delimiter', () => {
    const input = `===FILE: src/App.tsx===\nexport default function App(){\n  return <div/>\n}`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].incomplete).toBe(true);
  });

  it('does NOT mark incomplete when ===END=== is present', () => {
    const input = `===FILE: src/App.tsx===\nexport default function App(){ return <div/> }\n===END===\nthis should be ignored`;
    const { files, ignored } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].incomplete).toBeUndefined();
    // Content after ===END=== is not collected at all (parsing stops)
    expect(ignored).not.toContain('this should be ignored');
  });

  it('file closed by next ===FILE: is NOT incomplete', () => {
    const input = `===FILE: src/App.tsx===\nexport default function App(){ return <div/> }\n===FILE: src/main.tsx===\nconsole.log('x')`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(files[0].incomplete).toBeUndefined();
    // Last file IS incomplete (no END)
    expect(files[1].incomplete).toBe(true);
  });

  it('strips only outer markdown fences, preserves inner fences', () => {
    const input = `===FILE: src/App.tsx===\n\`\`\`tsx\nexport default function App(){ return <div/> }\n\`\`\`\n===END===`;
    const { files } = parseFiles(input);
    expect(files[0].content).toContain('export default function App()');
    expect(files[0].content).not.toContain('```');
  });

  it('preserves inner fences when outer fence is not present', () => {
    const input = `===FILE: readme.md===\n# Hello\n\`\`\`js\nconsole.log('x')\n\`\`\`\nMore text\n===END===`;
    const { files } = parseFiles(input);
    expect(files[0].content).toContain('```js');
    expect(files[0].content).toContain('```');
  });

  it('collects outside-block text into ignored[] but trailing text after END is not collected', () => {
    const input = `hello there\n===FILE: src/App.tsx===\nexport default function App(){ return <div/> }\n===FILE: src/main.tsx===\nconsole.log('x')\ntrailing note`;
    const { files, ignored } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(ignored).toContain('hello there');
    // trailing note is INSIDE the last file block (no END marker)
    expect(ignored).not.toContain('trailing note');
    expect(files[1].content).toContain('trailing note');
  });
});

describe('isConversationalLine', () => {
  it('detects AI prose patterns', () => {
    expect(isConversationalLine("I added a dark mode toggle")).toBe(true);
    expect(isConversationalLine("Here's what I changed:")).toBe(true);
    expect(isConversationalLine("🚀 Your app is ready!")).toBe(true);
    expect(isConversationalLine("This creates a responsive layout")).toBe(true);
  });

  it('does NOT flag code lines', () => {
    expect(isConversationalLine("import React from 'react';")).toBe(false);
    expect(isConversationalLine("const x = 1;")).toBe(false);
    expect(isConversationalLine("export default App;")).toBe(false);
    expect(isConversationalLine("<div className='test'>")).toBe(false);
    expect(isConversationalLine("// This is a comment")).toBe(false);
    expect(isConversationalLine("function handleClick() {")).toBe(false);
  });
});
