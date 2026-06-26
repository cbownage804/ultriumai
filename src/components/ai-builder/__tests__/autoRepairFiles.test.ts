import { describe, expect, it } from 'vitest';
import { autoRepairFiles } from '../autoRepairFiles';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { parseFile } from '@/lib/ai-builder/astEditor';

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

  it('repairs bare framer-motion closing tags before Vite sees them', () => {
    const files = [
      makeTsx('src/App.tsx', `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.div className="p-4">
      <h1>Hi</h1>
    </motion></div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('</motion.div>');
    expect(content).not.toMatch(/<\/motion>(?!\.)/);
    expect(repairs.some(r => r.includes('framer-motion closing tag'))).toBe(true);
  });

  it('removes orphaned framer-motion closing tags after a valid close', () => {
    const files = [
      makeTsx('src/App.tsx', `import { motion } from 'framer-motion';
export default function App() {
  return <div><motion.section>Ready</motion.section></motion></div>;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('<motion.section>Ready</motion.section>');
    expect(content).toContain('</div>');
    expect(content).not.toMatch(/<\/motion>(?!\.)/);
    expect(repairs.some(r => r.includes('framer-motion closing tag'))).toBe(true);
  });

  it('removes the exact orphaned </motion></div> sequence reported by preview compile', () => {
    const files = [
      makeTsx('src/App.tsx', `import { motion } from 'framer-motion';
export default function App() {
  return (
    <div>
      <motion.div>
        <p>Gentleman Fade</p>
      </motion.div>
      </motion></div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('</motion.div>');
    expect(content).toContain('</div>');
    expect(content).not.toMatch(/<\/motion\s*>/);
    expect(repairs.some(r => r.includes('framer-motion closing tag'))).toBe(true);
  });

  it('repairs framer-motion tags with > characters inside JSX attributes', () => {
    const files = [
      makeTsx('src/App.tsx', `import { motion } from 'framer-motion';
export default function App() {
  const items = [1, 2, 3];
  return (
    <motion.div animate={{ opacity: items.length > 0 ? 1 : 0 }} onClick={() => items.length > 1 && console.log('x')}>
      Ready
    </motion></div>
  );
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('</motion.div>');
    expect(content).not.toMatch(/<\/motion\s*>/);
    expect(content).toContain('items.length > 0');
    expect(content).toContain('items.length > 1');
    expect(repairs.some(r => r.includes('framer-motion closing tag'))).toBe(true);
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

describe('autoRepairFiles dangling JSX after export default', () => {
  it('removes orphaned JSX closers emitted after terminal export default', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';

const App = () => {
  return (
    <div><main><section><div>D'Taylor Barbershop
  );
};

export default App;
</div></div></div></section></main></div>`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;
    const afterExport = content.slice(content.lastIndexOf('export default App;') + 'export default App;'.length);

    expect(afterExport).not.toContain('</div>');
    expect(afterExport.trim()).toBe('');
    expect(repairs.some(r => r.includes('dangling JSX emitted after terminal export default'))).toBe(true);
  });

  it('removes stray closing brace emitted after terminal export default', () => {
    const files = [
      makeTsx('src/components/Navbar.tsx', `import React from 'react';

const Navbar = () => <nav>D'Taylor Barbershop</nav>;

export default Navbar;
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;
    const afterExport = content.slice(content.lastIndexOf('export default Navbar;') + 'export default Navbar;'.length);

    expect(afterExport.trim()).toBe('');
    expect(repairs.some(r => r.includes('removed trailing unexpected "}"'))).toBe(true);
  });

  it('removes stray closing punctuation emitted after terminal export default', () => {
    const files = [
      makeTsx('src/components/Navbar.tsx', `import React from 'react';

const Navbar = () => <nav>D'Taylor Barbershop</nav>;

export default Navbar;
};`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;
    const afterExport = content.slice(content.lastIndexOf('export default Navbar;') + 'export default Navbar;'.length);

    expect(afterExport.trim()).toBe('');
    expect(repairs.some(r => r.includes('dangling JSX emitted after terminal export default'))).toBe(true);
  });

  it('removes stray markdown backtick and brace emitted after terminal export default', () => {
    const files = [
      makeTsx('src/components/Navbar.tsx', `import React from 'react';

const Navbar = () => <nav>D'Taylor Barbershop</nav>;

export default Navbar;
\`
}`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;
    const afterExport = content.slice(content.lastIndexOf('export default Navbar;') + 'export default Navbar;'.length);

    expect(afterExport.trim()).toBe('');
    expect(repairs.some(r => r.includes('dangling JSX emitted after terminal export default'))).toBe(true);
  });
});

describe('autoRepairFiles final syntax stabilization', () => {
  it('moves generated JSX closers before appended return/function closers', () => {
    const files = [
      makeTsx('src/App.tsx', `import React from 'react';

export default function App() {
  return (
    <div>
      <section>
        <h1>ULTSEC</h1>
        <p>Pen testing platform by Ultrium</p>
  )}
</section></div>`),
    ];

    const { files: repairedFiles, repairs } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).toContain('</section>');
    expect(content).toContain('</div>');
    expect(content).not.toMatch(/\)\}\s*<\/section>/);
    expect(parseFile('src/App.tsx', content).ok).toBe(true);
    expect(repairs.some(r => r.includes('moved') || r.includes('stabilized generated syntax'))).toBe(true);
  });

  it('repairs the stuck preview shape with a stray backtick near the end', () => {
    const files = [
      makeTsx('src/components/Hero.tsx', `import React from 'react';

export default function Hero() {
  return (
    <main>
      <div className="hero">
        <h1>ULTSEC</h1>
        <p>Live Threat Map</p>
  )}
  \`
</div></main>`),
    ];

    const { files: repairedFiles } = autoRepairFiles(files);
    const content = repairedFiles[0].content;

    expect(content).not.toMatch(/\)\}\s*`/);
    expect(content).not.toMatch(/`\s*<\/div>/);
    expect(parseFile('src/components/Hero.tsx', content).ok).toBe(true);
  });
});