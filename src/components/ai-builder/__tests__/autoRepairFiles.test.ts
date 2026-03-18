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
    expect((content.match(/}/g) || []).length).toBe(1);
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
});