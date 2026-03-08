import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePostBuildSmokeTest, type SmokeTestResult } from '../usePostBuildSmokeTest';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function makeFile(path: string, content: string): ProjectFile {
  return { path, content } as ProjectFile;
}

describe('usePostBuildSmokeTest', () => {
  const addLog = vi.fn();

  function run(files: ProjectFile[]): SmokeTestResult {
    const { result } = renderHook(() => usePostBuildSmokeTest(addLog));
    return result.current.runSmokeTest(files);
  }

  it('passes with clean files', () => {
    const files = [
      makeFile('index.html', '<html><body><div id="root"></div><script src="main.js"></script></body></html>'),
      makeFile('main.js', 'document.getElementById("root").textContent = "hi";'),
    ];
    const result = run(files);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing script src', () => {
    const files = [
      makeFile('index.html', '<html><script src="missing.js"></script></html>'),
    ];
    const result = run(files);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.message.includes('missing.js'))).toBe(true);
  });

  it('detects missing CSS link href', () => {
    const files = [
      makeFile('index.html', '<html><link rel="stylesheet" href="style.css"></html>'),
    ];
    const result = run(files);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.message.includes('style.css'))).toBe(true);
  });

  it('detects querySelector referencing missing ID', () => {
    const files = [
      makeFile('index.html', '<html><body></body></html>'),
      makeFile('app.js', 'document.querySelector("#app").addEventListener("click", () => {})'),
    ];
    const result = run(files);
    expect(result.errors.some(e => e.message.includes('#app'))).toBe(true);
  });

  it('warns on duplicate function declarations', () => {
    const files = [
      makeFile('app.ts', 'function handleClick() {}\nfunction handleClick() {}'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('Duplicate'))).toBe(true);
  });

  it('warns on innerHTML + addEventListener pattern', () => {
    const files = [
      makeFile('app.js', 'el.innerHTML = "<div>hi</div>";\nel.addEventListener("click", fn);'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('innerHTML'))).toBe(true);
  });

  it('warns on splice without immutable copy', () => {
    const files = [
      makeFile('app.ts', 'items.splice(0, 1);'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('splice'))).toBe(true);
  });

  it('warns on excessive console.log', () => {
    const logs = Array(6).fill('console.log("x");').join('\n');
    const files = [makeFile('app.ts', logs)];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('console.log'))).toBe(true);
  });

  it('warns on localStorage getItem without setItem', () => {
    const files = [
      makeFile('a.ts', 'localStorage.getItem("theme")'),
      makeFile('b.ts', 'localStorage.setItem("user", "x")'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('theme'))).toBe(true);
  });

  it('warns on broken relative imports', () => {
    const files = [
      makeFile('src/App.tsx', 'import { Foo } from "./components/Foo";'),
      makeFile('src/main.tsx', 'import App from "./App";'),
      makeFile('src/index.html', '<div id="root"></div>'),
      // Foo component is missing — 6+ files needed for alias check
      makeFile('src/a.ts', ''),
      makeFile('src/b.ts', ''),
      makeFile('src/c.ts', ''),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('./components/Foo'))).toBe(true);
  });

  it('does not warn when relative import exists', () => {
    const files = [
      makeFile('src/App.tsx', 'import { Foo } from "./components/Foo";'),
      makeFile('src/components/Foo.tsx', 'export const Foo = () => null;'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('./components/Foo'))).toBe(false);
  });

  it('warns on empty CSS rules', () => {
    const files = [
      makeFile('style.css', '.a {} .b {} .c {}'),
    ];
    const result = run(files);
    expect(result.warnings.some(w => w.message.includes('empty CSS'))).toBe(true);
  });
});
