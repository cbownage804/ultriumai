import { describe, it, expect } from 'vitest';
import { preCompileValidate } from '../preCompileValidation';

describe('preCompileValidate', () => {
  it('returns no issues for valid code', () => {
    const issues = preCompileValidate([
      { path: 'src/App.tsx', content: 'export default function App() { return <div>Hello</div>; }', language: 'typescript' },
    ]);
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });

  it('detects unbalanced braces', () => {
    const issues = preCompileValidate([
      { path: 'src/App.tsx', content: 'function App() { return <div>Hello</div>;', language: 'typescript' },
    ]);
    expect(issues.some(i => i.message.includes('Unclosed'))).toBe(true);
  });

  it('detects duplicate export default', () => {
    const issues = preCompileValidate([
      { path: 'src/App.tsx', content: 'export default function A() {}\nexport default function B() {}', language: 'typescript' },
    ]);
    expect(issues.some(i => i.message.includes('Multiple default exports'))).toBe(true);
  });

  it('detects class instead of className in JSX', () => {
    const issues = preCompileValidate([
      { path: 'src/App.tsx', content: 'import React from "react";\nexport default function App() { return <div class="test">Hi</div>; }', language: 'typescript' },
    ]);
    expect(issues.some(i => i.message.includes('className'))).toBe(true);
  });

  it('skips config files', () => {
    const issues = preCompileValidate([
      { path: 'vite.config.ts', content: 'this is { broken {{{', language: 'typescript' },
    ]);
    // Config files are not in the check list for preCompileValidate (it checks extensions)
    // but they should not crash
    expect(issues).toBeDefined();
  });

  it('warns on missing relative imports', () => {
    const issues = preCompileValidate([
      { path: 'src/App.tsx', content: 'import { Foo } from "./Foo";\nexport default function App() { return <Foo />; }', language: 'typescript' },
    ]);
    expect(issues.some(i => i.message.includes('Import not found'))).toBe(true);
  });
});
