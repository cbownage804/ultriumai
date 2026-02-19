import { useState, useCallback } from 'react';

export interface CacheRule {
  id: string;
  name: string;
  queryKey: string;
  endpoint: string;
  staleTime: number; // ms
  gcTime: number; // ms
  refetchOnWindowFocus: boolean;
  refetchOnMount: boolean;
  refetchInterval: number; // 0 = disabled
  retry: number;
  retryDelay: number;
  strategy: 'swr' | 'cache-first' | 'network-only' | 'cache-only';
  enabled: boolean;
}

const PRESETS: Record<string, Partial<CacheRule>> = {
  realtime: { staleTime: 0, gcTime: 30000, refetchOnWindowFocus: true, refetchInterval: 5000, strategy: 'swr' },
  standard: { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: true, refetchInterval: 0, strategy: 'swr' },
  aggressive: { staleTime: 600000, gcTime: 3600000, refetchOnWindowFocus: false, refetchInterval: 0, strategy: 'cache-first' },
  static: { staleTime: Infinity, gcTime: Infinity, refetchOnWindowFocus: false, refetchInterval: 0, strategy: 'cache-only' },
};

export function useCacheStrategyManager() {
  const [rules, setRules] = useState<CacheRule[]>([
    {
      id: '1', name: 'User Profile', queryKey: 'userProfile', endpoint: '/api/profile',
      staleTime: 300000, gcTime: 600000, refetchOnWindowFocus: true, refetchOnMount: true,
      refetchInterval: 0, retry: 3, retryDelay: 1000, strategy: 'swr', enabled: true,
    },
  ]);

  const addRule = useCallback((name: string, queryKey: string, endpoint: string, preset: keyof typeof PRESETS = 'standard') => {
    const p = PRESETS[preset];
    setRules(prev => [...prev, {
      id: crypto.randomUUID(), name, queryKey, endpoint,
      staleTime: p.staleTime || 60000, gcTime: p.gcTime || 300000,
      refetchOnWindowFocus: p.refetchOnWindowFocus ?? true, refetchOnMount: true,
      refetchInterval: p.refetchInterval || 0, retry: 3, retryDelay: 1000,
      strategy: p.strategy || 'swr', enabled: true,
    }]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<CacheRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const applyPreset = useCallback((id: string, preset: keyof typeof PRESETS) => {
    const p = PRESETS[preset];
    if (!p) return;
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...p } : r));
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms === Infinity) return '∞';
    if (ms >= 3600000) return `${ms / 3600000}h`;
    if (ms >= 60000) return `${ms / 60000}m`;
    if (ms >= 1000) return `${ms / 1000}s`;
    return `${ms}ms`;
  };

  const generateCode = useCallback((): string => {
    const enabledRules = rules.filter(r => r.enabled);
    if (enabledRules.length === 0) return '// No cache rules configured';

    const queryOptions = enabledRules.map(r => {
      const opts: string[] = [];
      opts.push(`  queryKey: ['${r.queryKey}'],`);
      opts.push(`  queryFn: async () => {\n    const res = await fetch('${r.endpoint}');\n    if (!res.ok) throw new Error('Failed to fetch ${r.name}');\n    return res.json();\n  },`);
      if (r.staleTime === Infinity) opts.push(`  staleTime: Infinity,`);
      else opts.push(`  staleTime: ${r.staleTime}, // ${formatDuration(r.staleTime)}`);
      if (r.gcTime === Infinity) opts.push(`  gcTime: Infinity,`);
      else opts.push(`  gcTime: ${r.gcTime}, // ${formatDuration(r.gcTime)}`);
      opts.push(`  refetchOnWindowFocus: ${r.refetchOnWindowFocus},`);
      opts.push(`  refetchOnMount: ${r.refetchOnMount},`);
      if (r.refetchInterval > 0) opts.push(`  refetchInterval: ${r.refetchInterval}, // ${formatDuration(r.refetchInterval)}`);
      opts.push(`  retry: ${r.retry},`);
      if (r.retryDelay > 0) opts.push(`  retryDelay: ${r.retryDelay},`);
      return `export const ${r.queryKey}Options = queryOptions({\n${opts.join('\n')}\n});`;
    });

    return `import { queryOptions, useQuery } from '@tanstack/react-query';

// ═══ Generated Cache Strategy Configuration ═══
// ${enabledRules.length} route(s) configured

${queryOptions.join('\n\n')}

// ═══ Usage ═══
// import { ${enabledRules.map(r => r.queryKey + 'Options').join(', ')} } from './cacheConfig';
// const { data } = useQuery(${enabledRules[0]?.queryKey}Options);
`;
  }, [rules]);

  return {
    rules, presets: Object.keys(PRESETS),
    addRule, removeRule, updateRule, applyPreset,
    formatDuration, generateCode,
  };
}
