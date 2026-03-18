import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

import { useWorkerCompiler } from './useWorkerCompiler';
import type { ProjectFile } from './useProjectFileSystem';

function makeFile(path: string, content: string, language = 'typescript'): ProjectFile {
  return { path, content, language };
}

describe('useWorkerCompiler', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('preserves sandbox build errors when html is empty', async () => {
    invokeMock.mockResolvedValue({
      data: {
        html: '',
        errors: ["src/App.tsx(1,1): error TS2304: Cannot find name 'foo'"],
        componentCount: 0,
      },
      error: null,
    });

    const { result } = renderHook(() => useWorkerCompiler());

    await expect(result.current.compileReactProject([
      makeFile('src/App.tsx', 'export default function App() { return <div>{foo}</div>; }'),
    ])).resolves.toMatchObject({
      html: '',
      errors: ["src/App.tsx(1,1): error TS2304: Cannot find name 'foo'"],
      errorMessage: "src/App.tsx(1,1): error TS2304: Cannot find name 'foo'",
    });
  });

  it('throws empty result only when sandbox returns neither html nor errors', async () => {
    invokeMock.mockResolvedValue({
      data: {
        html: '',
        errors: [],
        componentCount: 0,
      },
      error: null,
    });

    const { result } = renderHook(() => useWorkerCompiler());

    await expect(result.current.compileReactProject([
      makeFile('src/App.tsx', 'export default function App() { return <div>Hello</div>; }'),
    ])).rejects.toThrow('Compilation failed: Vite sandbox returned empty result');
  });
});
