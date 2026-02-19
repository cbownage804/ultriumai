import { useState, useCallback } from 'react';

export interface APIPath {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  tag: string;
  requestBody: boolean;
  responseSchema: string;
}

export function useOpenAPISpecGenerator() {
  const [title, setTitle] = useState('My API');
  const [version, setVersion] = useState('1.0.0');
  const [serverUrl, setServerUrl] = useState('https://api.example.com');
  const [paths, setPaths] = useState<APIPath[]>([]);

  const addPath = useCallback(() => {
    setPaths(prev => [...prev, {
      id: crypto.randomUUID(),
      path: '/api/resource',
      method: 'GET',
      summary: 'Get resource',
      tag: 'default',
      requestBody: false,
      responseSchema: '{ "id": "string", "name": "string" }',
    }]);
  }, []);

  const updatePath = useCallback((id: string, updates: Partial<APIPath>) => {
    setPaths(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePath = useCallback((id: string) => {
    setPaths(prev => prev.filter(p => p.id !== id));
  }, []);

  const generateCode = useCallback((): string => {
    const tags = [...new Set(paths.map(p => p.tag))].map(t => ({ name: t }));
    const pathsObj: Record<string, any> = {};
    for (const p of paths) {
      if (!pathsObj[p.path]) pathsObj[p.path] = {};
      const op: any = { summary: p.summary, tags: [p.tag], responses: { '200': { description: 'Success' } } };
      if (p.requestBody) op.requestBody = { content: { 'application/json': { schema: { type: 'object' } } } };
      pathsObj[p.path][p.method.toLowerCase()] = op;
    }
    const spec = {
      openapi: '3.0.3',
      info: { title, version },
      servers: [{ url: serverUrl }],
      tags,
      paths: pathsObj,
    };
    return JSON.stringify(spec, null, 2);
  }, [paths, title, version, serverUrl]);

  return { title, setTitle, version, setVersion, serverUrl, setServerUrl, paths, addPath, updatePath, removePath, generateCode };
}
