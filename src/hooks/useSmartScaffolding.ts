import { useState, useCallback } from 'react';

export interface ScaffoldTemplate {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'page' | 'hook' | 'api' | 'utility' | 'test';
  files: { path: string; content: string }[];
}

const TEMPLATES: ScaffoldTemplate[] = [
  {
    id: 'react-component', name: 'React Component', description: 'Functional component with props interface',
    category: 'component',
    files: [{ path: 'components/{{name}}.tsx', content: `import React from 'react';\n\ninterface {{Name}}Props {\n  className?: string;\n}\n\nexport function {{Name}}({ className }: {{Name}}Props) {\n  return (\n    <div className={className}>\n      <h2>{{Name}}</h2>\n    </div>\n  );\n}\n` }],
  },
  {
    id: 'custom-hook', name: 'Custom Hook', description: 'React hook with state and callbacks',
    category: 'hook',
    files: [{ path: 'hooks/use{{Name}}.ts', content: `import { useState, useCallback } from 'react';\n\nexport function use{{Name}}() {\n  const [data, setData] = useState<any>(null);\n  const [loading, setLoading] = useState(false);\n\n  const fetch = useCallback(async () => {\n    setLoading(true);\n    try {\n      // TODO: implement\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  return { data, loading, fetch };\n}\n` }],
  },
  {
    id: 'api-route', name: 'API Route', description: 'Edge function with CORS and error handling',
    category: 'api',
    files: [{ path: 'functions/{{name}}/index.ts', content: `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';\n\nconst corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };\n\nserve(async (req) => {\n  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });\n  try {\n    const data = { message: 'Hello from {{name}}' };\n    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });\n  } catch (error) {\n    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });\n  }\n});\n` }],
  },
  {
    id: 'crud-page', name: 'CRUD Page', description: 'Full CRUD page with table, forms, and Supabase',
    category: 'page',
    files: [{ path: 'pages/{{Name}}Page.tsx', content: `import { useState, useEffect } from 'react';\n\nexport function {{Name}}Page() {\n  const [items, setItems] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => { setLoading(false); }, []);\n\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold mb-4">{{Name}}</h1>\n      {loading ? <p>Loading...</p> : <p>{items.length} items</p>}\n    </div>\n  );\n}\n` }],
  },
  {
    id: 'test-file', name: 'Test File', description: 'Vitest test suite with setup',
    category: 'test',
    files: [{ path: '__tests__/{{name}}.test.ts', content: `import { describe, it, expect } from 'vitest';\n\ndescribe('{{Name}}', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});\n` }],
  },
];

export function useSmartScaffolding() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('react-component');
  const [entityName, setEntityName] = useState('');

  const getTemplate = useCallback((id: string) => TEMPLATES.find(t => t.id === id), []);

  const scaffold = useCallback((templateId: string, name: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template || !name) return [];
    const pascal = name.charAt(0).toUpperCase() + name.slice(1);
    return template.files.map(f => ({
      path: f.path.replace(/\{\{name\}\}/g, name).replace(/\{\{Name\}\}/g, pascal),
      content: f.content.replace(/\{\{name\}\}/g, name).replace(/\{\{Name\}\}/g, pascal),
    }));
  }, []);

  return {
    templates: TEMPLATES, selectedTemplate, entityName,
    setSelectedTemplate, setEntityName, getTemplate, scaffold,
  };
}
