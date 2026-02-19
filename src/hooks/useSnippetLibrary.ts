/**
 * Phase 112: User-Defined Snippet Library
 * Save, search, and expand code snippets with trigger prefixes.
 */
import { useCallback, useState, useEffect } from 'react';

export interface CodeSnippet {
  id: string;
  name: string;
  trigger: string; // e.g., "/btn", "/form"
  content: string;
  language: string;
  tags: string[];
  description: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'ultrium-snippet-library';

const DEFAULT_SNIPPETS: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'React Component',
    trigger: '/rfc',
    content: `export function ComponentName() {\n  return (\n    <div className="">\n      \n    </div>\n  );\n}`,
    language: 'typescriptreact',
    tags: ['react', 'component'],
    description: 'React functional component boilerplate',
    usageCount: 0,
  },
  {
    name: 'useState Hook',
    trigger: '/ust',
    content: `const [value, setValue] = useState<string>('');`,
    language: 'typescriptreact',
    tags: ['react', 'hook', 'state'],
    description: 'React useState hook',
    usageCount: 0,
  },
  {
    name: 'useEffect Hook',
    trigger: '/uef',
    content: `useEffect(() => {\n  \n  return () => {\n    // cleanup\n  };\n}, []);`,
    language: 'typescriptreact',
    tags: ['react', 'hook', 'effect'],
    description: 'React useEffect hook with cleanup',
    usageCount: 0,
  },
  {
    name: 'Tailwind Button',
    trigger: '/btn',
    content: `<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">\n  Click me\n</button>`,
    language: 'typescriptreact',
    tags: ['tailwind', 'button', 'ui'],
    description: 'Styled button with Tailwind',
    usageCount: 0,
  },
  {
    name: 'Async Function',
    trigger: '/async',
    content: `const fetchData = async () => {\n  try {\n    const response = await fetch('/api/endpoint');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n    throw error;\n  }\n};`,
    language: 'typescript',
    tags: ['async', 'fetch', 'api'],
    description: 'Async function with error handling',
    usageCount: 0,
  },
  {
    name: 'Tailwind Card',
    trigger: '/card',
    content: `<div className="rounded-xl border border-border bg-card p-6 shadow-sm">\n  <h3 className="text-lg font-semibold text-card-foreground">Title</h3>\n  <p className="mt-2 text-sm text-muted-foreground">Description</p>\n</div>`,
    language: 'typescriptreact',
    tags: ['tailwind', 'card', 'ui'],
    description: 'Card component with Tailwind',
    usageCount: 0,
  },
];

export function useSnippetLibrary() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSnippets(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })));
      } else {
        const defaults = DEFAULT_SNIPPETS.map(s => ({
          ...s,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setSnippets(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch {
      // fallback
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (snippets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    }
  }, [snippets]);

  const addSnippet = useCallback((snippet: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: crypto.randomUUID(),
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSnippets(prev => [...prev, newSnippet]);
    return newSnippet;
  }, []);

  const removeSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSnippet = useCallback((id: string, updates: Partial<CodeSnippet>) => {
    setSnippets(prev => prev.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
    ));
  }, []);

  const expandTrigger = useCallback((trigger: string): CodeSnippet | undefined => {
    const snippet = snippets.find(s => s.trigger === trigger);
    if (snippet) {
      setSnippets(prev => prev.map(s =>
        s.id === snippet.id ? { ...s, usageCount: s.usageCount + 1 } : s
      ));
    }
    return snippet;
  }, [snippets]);

  const searchSnippets = useCallback((query: string): CodeSnippet[] => {
    if (!query) return snippets;
    const lower = query.toLowerCase();
    return snippets.filter(s =>
      s.name.toLowerCase().includes(lower) ||
      s.trigger.toLowerCase().includes(lower) ||
      s.tags.some(t => t.toLowerCase().includes(lower)) ||
      s.description.toLowerCase().includes(lower)
    );
  }, [snippets]);

  const filteredSnippets = searchQuery ? searchSnippets(searchQuery) : snippets;

  const exportSnippets = useCallback((): string => {
    return JSON.stringify(snippets, null, 2);
  }, [snippets]);

  const importSnippets = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json);
      if (!Array.isArray(imported)) return;
      const newSnippets = imported.map((s: any) => ({
        ...s,
        id: crypto.randomUUID(),
        createdAt: new Date(s.createdAt || new Date()),
        updatedAt: new Date(),
      }));
      setSnippets(prev => [...prev, ...newSnippets]);
    } catch { /* ignore */ }
  }, []);

  return {
    snippets: filteredSnippets,
    allSnippets: snippets,
    searchQuery,
    setSearchQuery,
    addSnippet,
    removeSnippet,
    updateSnippet,
    expandTrigger,
    searchSnippets,
    exportSnippets,
    importSnippets,
  };
}
