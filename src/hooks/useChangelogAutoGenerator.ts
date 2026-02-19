import { useState, useCallback } from 'react';

export interface ChangelogVersion {
  id: string;
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
}

export function useChangelogAutoGenerator() {
  const [versions, setVersions] = useState<ChangelogVersion[]>([]);
  const [projectName, setProjectName] = useState('My Project');
  const [format, setFormat] = useState<'markdown' | 'html'>('markdown');

  const addVersion = useCallback(() => {
    const now = new Date();
    setVersions(prev => [{
      id: crypto.randomUUID(),
      version: prev.length === 0 ? '1.0.0' : bumpPatch(prev[0].version),
      date: now.toISOString().split('T')[0],
      added: ['New feature'],
      changed: [],
      fixed: [],
      removed: [],
    }, ...prev]);
  }, []);

  const updateVersion = useCallback((id: string, updates: Partial<ChangelogVersion>) => {
    setVersions(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const removeVersion = useCallback((id: string) => {
    setVersions(prev => prev.filter(v => v.id !== id));
  }, []);

  const addEntry = useCallback((id: string, category: 'added' | 'changed' | 'fixed' | 'removed', text: string) => {
    setVersions(prev => prev.map(v => v.id === id ? { ...v, [category]: [...v[category], text] } : v));
  }, []);

  const removeEntry = useCallback((id: string, category: 'added' | 'changed' | 'fixed' | 'removed', idx: number) => {
    setVersions(prev => prev.map(v => v.id === id ? { ...v, [category]: v[category].filter((_, i) => i !== idx) } : v));
  }, []);

  const generateCode = useCallback((): string => {
    if (format === 'html') {
      const sections = versions.map(v => {
        const parts: string[] = [];
        if (v.added.length) parts.push(`<h3>Added</h3><ul>${v.added.map(a => `<li>${a}</li>`).join('')}</ul>`);
        if (v.changed.length) parts.push(`<h3>Changed</h3><ul>${v.changed.map(a => `<li>${a}</li>`).join('')}</ul>`);
        if (v.fixed.length) parts.push(`<h3>Fixed</h3><ul>${v.fixed.map(a => `<li>${a}</li>`).join('')}</ul>`);
        if (v.removed.length) parts.push(`<h3>Removed</h3><ul>${v.removed.map(a => `<li>${a}</li>`).join('')}</ul>`);
        return `<h2>[${v.version}] - ${v.date}</h2>\n${parts.join('\n')}`;
      }).join('\n\n');
      return `<!DOCTYPE html>\n<html><head><title>Changelog - ${projectName}</title></head>\n<body>\n<h1>Changelog</h1>\n${sections}\n</body></html>`;
    }
    const sections = versions.map(v => {
      const parts: string[] = [];
      if (v.added.length) parts.push(`### Added\n${v.added.map(a => `- ${a}`).join('\n')}`);
      if (v.changed.length) parts.push(`### Changed\n${v.changed.map(a => `- ${a}`).join('\n')}`);
      if (v.fixed.length) parts.push(`### Fixed\n${v.fixed.map(a => `- ${a}`).join('\n')}`);
      if (v.removed.length) parts.push(`### Removed\n${v.removed.map(a => `- ${a}`).join('\n')}`);
      return `## [${v.version}] - ${v.date}\n\n${parts.join('\n\n')}`;
    }).join('\n\n---\n\n');
    return `# Changelog\n\nAll notable changes to **${projectName}** will be documented in this file.\n\n${sections}`;
  }, [versions, projectName, format]);

  return { versions, projectName, setProjectName, format, setFormat, addVersion, updateVersion, removeVersion, addEntry, removeEntry, generateCode };
}

function bumpPatch(v: string): string {
  const parts = v.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}
