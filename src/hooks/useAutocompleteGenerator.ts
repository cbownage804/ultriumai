import { useState, useCallback } from 'react';

export interface AutocompleteConfig {
  placeholder: string;
  dataSource: 'static' | 'supabase' | 'api';
  tableName: string;
  displayField: string;
  valueField: string;
  searchField: string;
  maxResults: number;
  allowCreate: boolean;
  staticItems: string[];
}

export function useAutocompleteGenerator() {
  const [config, setConfig] = useState<AutocompleteConfig>({
    placeholder: 'Search...',
    dataSource: 'static',
    tableName: 'items',
    displayField: 'name',
    valueField: 'id',
    searchField: 'name',
    maxResults: 10,
    allowCreate: false,
    staticItems: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'],
  });

  const updateConfig = useCallback((updates: Partial<AutocompleteConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addStaticItem = useCallback((item: string) => {
    setConfig(prev => ({ ...prev, staticItems: [...prev.staticItems, item] }));
  }, []);

  const removeStaticItem = useCallback((index: number) => {
    setConfig(prev => ({ ...prev, staticItems: prev.staticItems.filter((_, i) => i !== index) }));
  }, []);

  const generateCode = useCallback((): string => {
    const dataFetch = config.dataSource === 'static'
      ? `  const allItems = ${JSON.stringify(config.staticItems)};
  const filtered = allItems.filter(item => item.toLowerCase().includes(query.toLowerCase())).slice(0, ${config.maxResults});`
      : config.dataSource === 'supabase'
      ? `  const [filtered, setFiltered] = useState<{${config.valueField}: string; ${config.displayField}: string}[]>([]);
  useEffect(() => {
    if (query.length < 1) { setFiltered([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('${config.tableName}').select('${config.valueField}, ${config.displayField}').ilike('${config.searchField}', \`%\${query}%\`).limit(${config.maxResults});
      if (data) setFiltered(data);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);`
      : `  const [filtered, setFiltered] = useState<string[]>([]);
  useEffect(() => {
    if (query.length < 1) { setFiltered([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&limit=${config.maxResults}\`);
      const data = await res.json();
      setFiltered(data);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);`;

    const supabaseImport = config.dataSource === 'supabase' ? "\nimport { supabase } from '@/integrations/supabase/client';" : '';
    const effectImport = config.dataSource !== 'static' ? ', useEffect' : '';

    return `import { useState, useRef${effectImport} } from 'react';${supabaseImport}
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function Autocomplete({ value, onChange }: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

${dataFetch}

  return (
    <div className="relative">
      <Command className="border rounded-lg" shouldFilter={false}>
        <CommandInput
          ref={inputRef}
          placeholder="${config.placeholder}"
          value={query}
          onValueChange={q => { setQuery(q); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <CommandList className="absolute top-full left-0 right-0 z-50 bg-popover border rounded-b-lg shadow-lg max-h-60 overflow-auto">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {${config.dataSource === 'static' ? 'filtered' : 'filtered'}.map((item${config.dataSource === 'static' ? '' : `, i`}) => (
                <CommandItem
                  key={${config.dataSource === 'static' ? 'item' : config.dataSource === 'supabase' ? `item.${config.valueField}` : 'i'}}
                  value={${config.dataSource === 'static' ? 'item' : config.dataSource === 'supabase' ? `item.${config.displayField}` : 'item'}}
                  onSelect={val => { onChange(val); setQuery(val); setOpen(false); }}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                >
                  {${config.dataSource === 'static' ? 'item' : config.dataSource === 'supabase' ? `item.${config.displayField}` : 'item'}}
                </CommandItem>
              ))}
            </CommandGroup>${config.allowCreate ? `
            {query && !filtered.some(i => (typeof i === 'string' ? i : i.${config.displayField}) === query) && (
              <CommandItem onSelect={() => { onChange(query); setOpen(false); }} className="cursor-pointer px-3 py-2 text-sm text-primary">
                + Create "{query}"
              </CommandItem>
            )}` : ''}
          </CommandList>
        )}
      </Command>
    </div>
  );
}`;
  }, [config]);

  return { config, updateConfig, addStaticItem, removeStaticItem, generateCode };
}
