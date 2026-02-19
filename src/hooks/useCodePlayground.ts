import { useState, useCallback } from 'react';

export interface Snippet {
  id: string;
  name: string;
  language: 'typescript' | 'javascript' | 'html' | 'css' | 'json';
  code: string;
  output: string;
  createdAt: Date;
  lastRun: Date | null;
  isFavorite: boolean;
}

export function useCodePlayground() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);

  const SNIPPET_TEMPLATES: Record<string, Partial<Snippet>> = {
    reactComponent: { name: 'React Component', language: 'typescript', code: `function Counter() {\n  const [count, setCount] = React.useState(0);\n  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;\n}` },
    fetchAPI: { name: 'Fetch API', language: 'typescript', code: `const res = await fetch('https://jsonplaceholder.typicode.com/posts/1');\nconst data = await res.json();\nconsole.log(data);` },
    utilFunction: { name: 'Utility Function', language: 'typescript', code: `function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}` },
  };

  const createSnippet = useCallback((templateKey?: string) => {
    const template = templateKey ? SNIPPET_TEMPLATES[templateKey] : undefined;
    const snippet: Snippet = {
      id: crypto.randomUUID(),
      name: template?.name || 'Untitled Snippet',
      language: template?.language || 'typescript',
      code: template?.code || '// Start coding here\n',
      output: '', createdAt: new Date(), lastRun: null, isFavorite: false,
    };
    setSnippets(prev => [...prev, snippet]);
    setActiveSnippetId(snippet.id);
    return snippet;
  }, []);

  const updateSnippet = useCallback((id: string, update: Partial<Snippet>) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  }, []);

  const removeSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  }, []);

  const runSnippet = useCallback((id: string) => {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;
    try {
      const logs: string[] = [];
      const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(' ')), error: (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' ')) };
      const fn = new Function('console', snippet.code);
      fn(mockConsole);
      setSnippets(prev => prev.map(s => s.id === id ? { ...s, output: logs.join('\n') || '(no output)', lastRun: new Date() } : s));
    } catch (err: any) {
      setSnippets(prev => prev.map(s => s.id === id ? { ...s, output: `Error: ${err.message}`, lastRun: new Date() } : s));
    }
  }, [snippets]);

  const duplicateSnippet = useCallback((id: string) => {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;
    const copy: Snippet = { ...snippet, id: crypto.randomUUID(), name: `${snippet.name} (copy)`, createdAt: new Date() };
    setSnippets(prev => [...prev, copy]);
    setActiveSnippetId(copy.id);
  }, [snippets]);

  const getActiveSnippet = useCallback(() => snippets.find(s => s.id === activeSnippetId) || null, [snippets, activeSnippetId]);

  return {
    snippets, activeSnippetId, setActiveSnippetId, getActiveSnippet,
    SNIPPET_TEMPLATES: Object.keys(SNIPPET_TEMPLATES),
    createSnippet, updateSnippet, removeSnippet, runSnippet, duplicateSnippet,
  };
}
