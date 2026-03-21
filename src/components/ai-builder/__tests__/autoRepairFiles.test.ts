import { describe, expect, it } from 'vitest';
import { autoRepairFiles } from '../autoRepairFiles';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function makeTsx(path: string, content: string, language = 'typescript'): ProjectFile {
  return {
    path,
    content,
    language,
  };
}

describe('autoRepairFiles JSX tag balancing', () => {
  it('fixes mismatched lowercase JSX closing tags', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  return <div><p>Hello</div>;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('<div><p>Hello</p></div>');
    expect(repairs.some(r => r.includes('fixed JSX tag balance'))).toBe(true);
  });

  it('appends missing fragment close tags', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  return <><section><div>Hi</div></section>;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('</>');
    expect(repairs.some(r => r.includes('fixed JSX tag balance'))).toBe(true);
  });

  it('closes unterminated template literals at EOF', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  const title = \`Hello world`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('closed unterminated template literal'))).toBe(true);
    expect(content.trimEnd().endsWith('`}')).toBe(true);
  });

  it('removes trailing unexpected closing braces at EOF', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  return <div>Hello</div>;
}}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('removed trailing unexpected "}"'))).toBe(true);
    expect(content).toContain('return <div>Hello</div>;');
    expect(content.trimEnd().endsWith('}')).toBe(true);
    expect(content.trimEnd().endsWith('}}')).toBe(false);
  });

  it('closes unterminated string literals at EOF', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  const title = "Hello world`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('closed unterminated string literal'))).toBe(true);
    expect(content.trimEnd().endsWith('"}')).toBe(true);
  });

  it('does not treat TypeScript generics as JSX tags', () => {
    const files = [
      makeTsx('src/App.tsx', `type Item = { id: string };
export default function App() {
  const list = useState<Item[]>([]);
  return <div />;
}`),
    ];

    const { files: repairedFiles } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('useState<Item[]>([])');
    expect(content).not.toContain('</item>');
  });

  it('repairs CSS files with extra closing braces', () => {
    const files = [
      makeTsx('src/index.css', `.hero {
  color: red;
}
}`, 'css'),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('removed 1 unexpected CSS closing brace'))).toBe(true);
    // Original CSS should have 1 brace, plus smooth-scroll auto-repair adds html { } = 1 more
    const braceCount = (content.match(/}/g) || []).length;
    expect(braceCount).toBeGreaterThanOrEqual(1);
    // The extra brace from original should be removed
    expect(content).not.toMatch(/}\s*}/s);
  });

  it('repairs CSS files with missing closing braces', () => {
    const files = [
      makeTsx('src/index.css', `.hero {
  color: red;`, 'css'),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('added 1 missing CSS closing brace'))).toBe(true);
    expect(content.trimEnd().endsWith('}')).toBe(true);
  });

  it('fixes malformed SVGProps<X /> generic that esbuild misparses as JSX', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';

const CheckIcon = (props: React.SVGProps<X />) => (
  <span />
);

export default function App() {
  return <CheckIcon />;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('SVGProps<SVGSVGElement>');
    expect(content).not.toContain('SVGProps<X />');
    expect(repairs.some(r => r.includes('malformed SVGProps'))).toBe(true);
  });

  it('closes unterminated template literal with open ${} expression', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  return <div className={\`task-\${status`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    // Should close the ${} expression AND the template literal AND the missing braces
    expect(repairs.some(r => r.includes('template expression'))).toBe(true);
    // The closing sequence should contain }` to close ${...} and the template
    expect(content).toContain('}`');
  });

  it('closes multiple nested template expressions', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  const x = \`outer \${\`inner \${deep`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(repairs.some(r => r.includes('template expression') || r.includes('template literal'))).toBe(true);
  });
});

describe('autoRepairFiles corrupted arrow functions', () => {
  it('fixes "= />" corrupted arrow in JSX callback', () => {
    const files = [
      makeTsx('src/App.tsx', `export default function App() {
  return <input onChange={(e) = /> setQuery(e.target.value)} />;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('(e) => setQuery');
    expect(content).not.toContain('= />');
    expect(repairs.some(r => r.includes('corrupted arrow'))).toBe(true);
  });
});

describe('autoRepairFiles orphaned hook closures', () => {
  it('removes orphaned }, []); after function declaration', () => {
    const files = [
      makeTsx('src/components/Navbar.tsx', `import React from 'react';

export default function Navbar() {
    }, []);

    const navLinks = [
      { label: 'Home', href: '/' },
    ];

    return <nav>{navLinks.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).not.toContain('}, []);');
    expect(content).toContain('const navLinks');
    expect(repairs.some(r => r.includes('orphaned hook closure'))).toBe(true);
  });
});

describe('autoRepairFiles duplicate block removal', () => {
  it('removes duplicate consecutive code blocks', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';
export default function App() {
  return (
    <div>
      <p>Line A</p>
      <p>Line B</p>
      <p>Line C</p>
      <p>Line A</p>
      <p>Line B</p>
      <p>Line C</p>
      <p>Line D</p>
    </div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    const lineACount = (content.match(/<p>Line A<\/p>/g) || []).length;
    expect(lineACount).toBe(1);
    expect(repairs.some(r => r.includes('duplicated line'))).toBe(true);
  });
});

describe('autoRepairFiles orphaned textarea', () => {
  it('removes orphaned </textarea> without matching open', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';
export default function App() {
  return (
    <div>
      <input placeholder="Item description..." />
    </textarea></div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).not.toContain('</textarea>');
    expect(repairs.some(r => r.includes('orphaned </textarea>'))).toBe(true);
  });

  it('removes out-of-order </textarea> even when open/close counts match', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';
export default function App() {
  return (
    <div>
      <textarea defaultValue="hello" />
      <div>
        <input placeholder="Item description..." />
      </div>
      </textarea></div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('<textarea defaultValue="hello" />');
    expect(content).not.toContain('</textarea></div>');
    expect(repairs.some(r => r.includes('orphaned </textarea>'))).toBe(true);
  });
});