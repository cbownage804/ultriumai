import { describe, it, expect } from 'vitest';

/**
 * Phase 83: Tests for parseMultiFileOutput from useAIAppBuilder.
 * 
 * We re-implement the core parsing logic here to test it in isolation.
 */

const FILE_DELIMITER = /^===FILE:\s*(.+?)===$/;
const DELETE_DELIMITER = /^===DELETE:\s*(.+?)===$/;
const EDIT_DELIMITER = /^===EDIT:\s*(.+?)===$/;
const HUNK_HEADER = /^@@\s*(\d+)-(\d+)\s*@@$/;

function isConversationalLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[<{\/\[\]()@#.;:=!&|+\-*%?~`\\]/.test(trimmed)) return false;
  if (/^(import |export |const |let |var |function |class |return |if |else |for |while |switch |case |try |catch |throw |new |type |interface |enum |async |await |from |default |module |require|<!DOCTYPE|<\?xml)/.test(trimmed)) return false;

  const markers = [
    /^(what'?s (next|changed)|would you like|let me know|here'?s what|i('?ve| have)|shall i|want me to|feel free|happy to|hope this|this (should|will|creates?|adds?|implements?))/i,
    /^(#{1,4}\s)/,
    /^(🎉|👋|✅|🚀|💡|📝)/,
    /^(Great|Perfect|Done|Now |Next |The app|Your app|I've |Here are|Here is|Let me|I can|This (update|change|version|adds))/,
    /^\*\*[\w\s]+\*\*[.:]/,
    /^```[\w]*\s*$/,
    /^I\s[a-z]/,
    /^\d+\s+(new|component|file|change)/i,
    /^\[.+\]\(.+\)/,
    /^[A-Z][a-z]+ly,?\s/,
  ];
  return markers.some(r => r.test(trimmed));
}

interface ParsedFile {
  path: string;
  content: string;
  language: string;
}

function parseFiles(raw: string): { files: ParsedFile[]; deletions: string[] } {
  const lines = raw.split('\n');
  const files: ParsedFile[] = [];
  const deletions: string[] = [];
  let currentPath: string | null = null;
  let currentLines: string[] = [];
  let blankLineStreak = 0;
  let inEditBlock = false;

  const langMap: Record<string, string> = {
    html: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
  };

  const flush = () => {
    if (currentPath) {
      const content = currentLines.join('\n').trim();
      if (content) {
        const ext = currentPath.split('.').pop()?.toLowerCase() || '';
        files.push({ path: currentPath, content, language: langMap[ext] || 'plaintext' });
      }
    }
  };

  for (const line of lines) {
    if (EDIT_DELIMITER.test(line)) {
      flush(); currentPath = null; currentLines = []; blankLineStreak = 0; inEditBlock = true; continue;
    }
    const delMatch = line.match(DELETE_DELIMITER);
    if (delMatch) {
      flush(); currentPath = null; currentLines = []; blankLineStreak = 0; inEditBlock = false;
      deletions.push(delMatch[1].trim()); continue;
    }
    const match = line.match(FILE_DELIMITER);
    if (match) {
      flush(); currentPath = match[1].trim(); currentLines = []; blankLineStreak = 0; inEditBlock = false;
    } else if (inEditBlock) {
      continue;
    } else if (currentPath !== null) {
      if (!line.trim()) {
        blankLineStreak++;
        currentLines.push(line);
      } else if (blankLineStreak >= 2 && isConversationalLine(line)) {
        flush(); currentPath = null; currentLines = []; blankLineStreak = 0;
      } else {
        blankLineStreak = 0;
        currentLines.push(line);
      }
    }
  }
  flush();
  return { files, deletions };
}

describe('parseMultiFileOutput (core logic)', () => {
  it('parses basic multi-file output', () => {
    const input = `===FILE: index.html===
<h1>Hello</h1>
===FILE: styles.css===
body { color: red; }`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('index.html');
    expect(files[0].content).toBe('<h1>Hello</h1>');
    expect(files[1].path).toBe('styles.css');
    expect(files[1].language).toBe('css');
  });

  it('handles ===DELETE: blocks', () => {
    const input = `===DELETE: old.js===
===FILE: new.js===
console.log('new');`;
    const { files, deletions } = parseFiles(input);
    expect(deletions).toEqual(['old.js']);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('new.js');
  });

  it('strips conversational prose after 2+ blank lines', () => {
    const input = `===FILE: app.js===
console.log('hi');


I added a new feature here.`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].content).not.toContain('I added');
  });

  it('does NOT strip code after a single blank line', () => {
    const input = `===FILE: style.css===
body { color: red; }

/* comment after blank line */
div { padding: 10px; }`;
    const { files } = parseFiles(input);
    expect(files[0].content).toContain('/* comment after blank line */');
    expect(files[0].content).toContain('div { padding: 10px; }');
  });

  it('ignores preamble text before first delimiter', () => {
    const input = `Here's your app:

===FILE: index.html===
<div>OK</div>`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(1);
    expect(files[0].content).toBe('<div>OK</div>');
  });

  it('handles empty/malformed input', () => {
    const { files: f1 } = parseFiles('');
    expect(f1).toHaveLength(0);

    const { files: f2 } = parseFiles('Just some text without any delimiters');
    expect(f2).toHaveLength(0);
  });

  it('handles React tsx files', () => {
    const input = `===FILE: App.tsx===
import { useState } from 'react';
export default function App() {
  return <div>Hello</div>;
}`;
    const { files } = parseFiles(input);
    expect(files[0].language).toBe('typescript');
    expect(files[0].content).toContain('export default function App');
  });

  it('skips ===EDIT: blocks and does not include them in files', () => {
    const input = `===FILE: new.js===
const x = 1;
===EDIT: existing.js===
@@ 5-8 @@
const y = 2;
===FILE: another.js===
const z = 3;`;
    const { files } = parseFiles(input);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe('new.js');
    expect(files[1].path).toBe('another.js');
  });

  it('handles multiple deletes', () => {
    const input = `===DELETE: old1.js===
===DELETE: old2.css===
===FILE: replacement.js===
console.log('replaced');`;
    const { files, deletions } = parseFiles(input);
    expect(deletions).toEqual(['old1.js', 'old2.css']);
    expect(files).toHaveLength(1);
  });
});

describe('isConversationalLine', () => {
  it('detects AI prose patterns', () => {
    expect(isConversationalLine("I added a dark mode toggle")).toBe(true);
    expect(isConversationalLine("Here's what I changed:")).toBe(true);
    expect(isConversationalLine("🚀 Your app is ready!")).toBe(true);
    expect(isConversationalLine("Additionally, the component now supports...")).toBe(true);
    expect(isConversationalLine("Great job! The app is working.")).toBe(true);
    expect(isConversationalLine("This creates a responsive layout")).toBe(true);
    expect(isConversationalLine("Now the dashboard has dark mode")).toBe(true);
  });

  it('does NOT flag code lines', () => {
    expect(isConversationalLine("import React from 'react';")).toBe(false);
    expect(isConversationalLine("const x = 1;")).toBe(false);
    expect(isConversationalLine("export default App;")).toBe(false);
    expect(isConversationalLine("<div className='test'>")).toBe(false);
    expect(isConversationalLine("// This is a comment")).toBe(false);
    expect(isConversationalLine("{ color: red; }")).toBe(false);
    expect(isConversationalLine("function handleClick() {")).toBe(false);
  });
});
