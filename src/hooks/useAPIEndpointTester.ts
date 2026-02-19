import { useState, useCallback } from 'react';

export interface APIRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: string;
  createdAt: Date;
}

export interface APIResponse {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  timestamp: Date;
}

export interface RequestCollection {
  id: string;
  name: string;
  requests: APIRequest[];
}

export function useAPIEndpointTester() {
  const [collections, setCollections] = useState<RequestCollection[]>([
    { id: 'default', name: 'Default Collection', requests: [] },
  ]);
  const [activeRequest, setActiveRequest] = useState<APIRequest | null>(null);
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ request: APIRequest; response: APIResponse }[]>([]);

  const createRequest = useCallback((collectionId: string, name?: string): APIRequest => {
    const req: APIRequest = {
      id: crypto.randomUUID(),
      name: name || 'New Request',
      method: 'GET',
      url: '',
      headers: { 'Content-Type': 'application/json' },
      createdAt: new Date(),
    };
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, requests: [...c.requests, req] } : c
    ));
    setActiveRequest(req);
    return req;
  }, []);

  const updateRequest = useCallback((updates: Partial<APIRequest>) => {
    if (!activeRequest) return;
    const updated = { ...activeRequest, ...updates };
    setActiveRequest(updated);
    setCollections(prev => prev.map(c => ({
      ...c,
      requests: c.requests.map(r => r.id === updated.id ? updated : r),
    })));
  }, [activeRequest]);

  const deleteRequest = useCallback((requestId: string) => {
    setCollections(prev => prev.map(c => ({
      ...c,
      requests: c.requests.filter(r => r.id !== requestId),
    })));
    if (activeRequest?.id === requestId) setActiveRequest(null);
  }, [activeRequest]);

  const sendRequest = useCallback(async (req?: APIRequest) => {
    const request = req || activeRequest;
    if (!request || !request.url) return;

    setIsLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const fetchOpts: RequestInit = {
        method: request.method,
        headers: request.headers,
      };
      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        fetchOpts.body = request.body;
      }

      const res = await fetch(request.url, fetchOpts);
      const duration = Math.round(performance.now() - start);
      const bodyText = await res.text();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });

      const apiResponse: APIResponse = {
        requestId: request.id,
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: bodyText,
        duration,
        timestamp: new Date(),
      };

      setResponse(apiResponse);
      setHistory(prev => [{ request, response: apiResponse }, ...prev].slice(0, 50));
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      const apiResponse: APIResponse = {
        requestId: request.id,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: err instanceof Error ? err.message : String(err),
        duration,
        timestamp: new Date(),
      };
      setResponse(apiResponse);
    } finally {
      setIsLoading(false);
    }
  }, [activeRequest]);

  const createCollection = useCallback((name: string) => {
    setCollections(prev => [...prev, { id: crypto.randomUUID(), name, requests: [] }]);
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    collections, activeRequest, response, isLoading, history,
    createRequest, updateRequest, deleteRequest, sendRequest,
    setActiveRequest, createCollection, deleteCollection,
  };
}
