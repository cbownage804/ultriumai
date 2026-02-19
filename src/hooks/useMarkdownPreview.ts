import { useState, useCallback } from 'react';

const DEFAULT_MD = `# Hello World

This is a **Markdown Preview** with GFM support.

## Features

- [x] Bold, italic, ~~strikethrough~~
- [x] Code blocks with syntax highlighting
- [ ] Tables
- [ ] Task lists

## Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Feature | Status | Priority |
|---------|--------|----------|
| Editor  | Done   | High     |
| Preview | Done   | High     |
| Export  | WIP    | Medium   |

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

---

*Rendered with GFM support*
`;

export function useMarkdownPreview() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [showPreview, setShowPreview] = useState(true);

  const toHtml = useCallback((md: string): string => {
    let html = md;
    // Headers
    html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold & italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // Links & images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    // HR
    html = html.replace(/^---$/gm, '<hr />');
    // Task lists
    html = html.replace(/^- \[x\]\s+(.+)$/gm, '<li class="task done">☑ $1</li>');
    html = html.replace(/^- \[ \]\s+(.+)$/gm, '<li class="task">☐ $1</li>');
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    // Tables (basic)
    const tableRegex = /\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (_, header: string, body: string) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    // Paragraphs
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');
    return html;
  }, []);

  const exportHtml = useCallback((): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a2e; }
    h1, h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre code { display: block; padding: 1em; overflow-x: auto; background: #1a1a2e; color: #e0e0e0; border-radius: 6px; }
    blockquote { border-left: 4px solid #0ea5e9; margin: 0; padding: 0.5em 1em; color: #555; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f5; }
    hr { border: none; border-top: 2px solid #eee; }
    .task { list-style: none; }
  </style>
</head>
<body>
${toHtml(markdown)}
</body>
</html>`;
  }, [markdown, toHtml]);

  const generateCode = useCallback((): string => {
    return exportHtml();
  }, [exportHtml]);

  return { markdown, setMarkdown, showPreview, setShowPreview, toHtml, exportHtml, generateCode };
}
