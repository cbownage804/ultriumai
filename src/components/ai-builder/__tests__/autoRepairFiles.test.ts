import { describe, expect, it } from 'vitest';
import { autoRepairFiles } from '../autoRepairFiles';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function makeTsx(path: string, content: string): ProjectFile {
  return {
    path,
    content,
    language: 'typescript',
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
});
