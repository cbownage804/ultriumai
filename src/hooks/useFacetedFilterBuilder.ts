import { useState, useCallback } from 'react';

export interface FilterFacet {
  id: string;
  name: string;
  field: string;
  type: 'checkbox' | 'range' | 'date' | 'select';
  options: string[];
}

export function useFacetedFilterBuilder() {
  const [facets, setFacets] = useState<FilterFacet[]>([
    { id: '1', name: 'Category', field: 'category', type: 'checkbox', options: ['Electronics', 'Clothing', 'Books'] },
    { id: '2', name: 'Price', field: 'price', type: 'range', options: [] },
  ]);
  const [syncWithURL, setSyncWithURL] = useState(true);

  const addFacet = useCallback(() => {
    setFacets(prev => [...prev, { id: crypto.randomUUID(), name: '', field: '', type: 'checkbox', options: [] }]);
  }, []);

  const updateFacet = useCallback((id: string, updates: Partial<FilterFacet>) => {
    setFacets(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const removeFacet = useCallback((id: string) => {
    setFacets(prev => prev.filter(f => f.id !== id));
  }, []);

  const addOption = useCallback((facetId: string, option: string) => {
    setFacets(prev => prev.map(f => f.id === facetId ? { ...f, options: [...f.options, option] } : f));
  }, []);

  const removeOption = useCallback((facetId: string, index: number) => {
    setFacets(prev => prev.map(f => f.id === facetId ? { ...f, options: f.options.filter((_, i) => i !== index) } : f));
  }, []);

  const generateCode = useCallback((): string => {
    const facetRenderers = facets.map(f => {
      if (f.type === 'checkbox') {
        return `      <div key="${f.id}" className="space-y-2">
        <h4 className="text-sm font-medium">${f.name}</h4>
        {${JSON.stringify(f.options)}.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={filters.${f.field}?.includes(opt) || false}
              onChange={e => { const val = filters.${f.field} || []; toggle('${f.field}', e.target.checked ? [...val, opt] : val.filter((v: string) => v !== opt)); }} />
            {opt}
          </label>
        ))}
      </div>`;
      }
      if (f.type === 'range') {
        return `      <div key="${f.id}" className="space-y-2">
        <h4 className="text-sm font-medium">${f.name}</h4>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.${f.field}Min || ''} onChange={e => toggle('${f.field}Min', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" />
          <input type="number" placeholder="Max" value={filters.${f.field}Max || ''} onChange={e => toggle('${f.field}Max', e.target.value)} className="w-20 px-2 py-1 border rounded text-sm" />
        </div>
      </div>`;
      }
      return `      <div key="${f.id}" className="space-y-2">
        <h4 className="text-sm font-medium">${f.name}</h4>
        <select value={filters.${f.field} || ''} onChange={e => toggle('${f.field}', e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
          <option value="">All</option>
          {${JSON.stringify(f.options)}.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>`;
    }).join('\n');

    const urlSync = syncWithURL ? `
import { useSearchParams } from 'react-router-dom';` : '';
    const stateHook = syncWithURL
      ? `  const [searchParams, setSearchParams] = useSearchParams();
  const filters: Record<string, any> = Object.fromEntries(searchParams.entries());
  const toggle = (key: string, value: any) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (Array.isArray(value) && !value.length)) next.delete(key);
    else next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    setSearchParams(next);
  };`
      : `  const [filters, setFilters] = useState<Record<string, any>>({});
  const toggle = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));`;

    return `import { useState } from 'react';${urlSync}

export function FacetedFilters({ onFiltersChange }: { onFiltersChange: (filters: Record<string, any>) => void }) {
${stateHook}

  return (
    <aside className="w-64 space-y-4 p-4 border-r">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Filters</h3>
${facetRenderers}
      <button onClick={() => { ${syncWithURL ? 'setSearchParams({})' : 'setFilters({})'}; onFiltersChange({}); }} className="text-xs text-primary hover:underline">Clear All</button>
    </aside>
  );
}`;
  }, [facets, syncWithURL]);

  return { facets, syncWithURL, setSyncWithURL, addFacet, updateFacet, removeFacet, addOption, removeOption, generateCode };
}
