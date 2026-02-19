import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

export interface CSPDirective {
  name: string;
  sources: string[];
  enabled: boolean;
}

export interface CSPConfig {
  directives: CSPDirective[];
  reportOnly: boolean;
  reportUri?: string;
}

const DEFAULT_DIRECTIVES: CSPDirective[] = [
  { name: 'default-src', sources: ["'self'"], enabled: true },
  { name: 'script-src', sources: ["'self'", "'unsafe-inline'"], enabled: true },
  { name: 'style-src', sources: ["'self'", "'unsafe-inline'"], enabled: true },
  { name: 'img-src', sources: ["'self'", 'data:', 'https:'], enabled: true },
  { name: 'font-src', sources: ["'self'", 'https://fonts.gstatic.com'], enabled: true },
  { name: 'connect-src', sources: ["'self'"], enabled: true },
  { name: 'frame-src', sources: ["'none'"], enabled: true },
  { name: 'object-src', sources: ["'none'"], enabled: true },
  { name: 'base-uri', sources: ["'self'"], enabled: true },
  { name: 'form-action', sources: ["'self'"], enabled: true },
];

export function useCSPGenerator() {
  const [config, setConfig] = useState<CSPConfig>({ directives: DEFAULT_DIRECTIVES, reportOnly: true });

  const analyzeProject = useCallback((files: ProjectFile[]) => {
    const allContent = files.map(f => f.content).join('\n');
    const externalDomains = new Set<string>();
    const urlMatches = allContent.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g);
    for (const m of urlMatches) externalDomains.add(m[1]);

    const updated = config.directives.map(d => {
      if (d.name === 'connect-src' && externalDomains.size > 0) {
        const apis = [...externalDomains].filter(d => d.includes('api') || d.includes('supabase') || d.includes('stripe'));
        return { ...d, sources: [...new Set([...d.sources, ...apis.map(a => `https://${a}`)])] };
      }
      if (d.name === 'script-src') {
        const scripts = [...externalDomains].filter(d => d.includes('cdn') || d.includes('esm.sh') || d.includes('unpkg'));
        return { ...d, sources: [...new Set([...d.sources, ...scripts.map(s => `https://${s}`)])] };
      }
      if (d.name === 'frame-src') {
        const frames = [...externalDomains].filter(d => d.includes('youtube') || d.includes('vimeo') || d.includes('loom'));
        if (frames.length) return { ...d, sources: [...new Set([...d.sources.filter(s => s !== "'none'"), ...frames.map(f => `https://${f}`)])] };
      }
      return d;
    });

    setConfig(prev => ({ ...prev, directives: updated }));
    return updated;
  }, [config.directives]);

  const addSource = useCallback((directiveName: string, source: string) => {
    setConfig(prev => ({ ...prev, directives: prev.directives.map(d => d.name === directiveName ? { ...d, sources: [...new Set([...d.sources, source])] } : d) }));
  }, []);

  const removeSource = useCallback((directiveName: string, source: string) => {
    setConfig(prev => ({ ...prev, directives: prev.directives.map(d => d.name === directiveName ? { ...d, sources: d.sources.filter(s => s !== source) } : d) }));
  }, []);

  const toggleDirective = useCallback((name: string) => {
    setConfig(prev => ({ ...prev, directives: prev.directives.map(d => d.name === name ? { ...d, enabled: !d.enabled } : d) }));
  }, []);

  const setReportOnly = useCallback((val: boolean) => setConfig(prev => ({ ...prev, reportOnly: val })), []);

  const generateCSP = useCallback((): string => {
    const parts = config.directives.filter(d => d.enabled).map(d => `${d.name} ${d.sources.join(' ')}`);
    const header = config.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    return `${header}: ${parts.join('; ')}`;
  }, [config]);

  const generateMetaTag = useCallback((): string => {
    const parts = config.directives.filter(d => d.enabled).map(d => `${d.name} ${d.sources.join(' ')}`);
    return `<meta http-equiv="Content-Security-Policy" content="${parts.join('; ')}">`;
  }, [config]);

  return { config, analyzeProject, addSource, removeSource, toggleDirective, setReportOnly, generateCSP, generateMetaTag };
}
