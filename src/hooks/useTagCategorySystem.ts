import { useState, useCallback } from 'react';

export interface TagConfig {
  tableName: string;
  tagColors: boolean;
  maxTags: number;
  allowCreate: boolean;
  presetTags: string[];
}

export function useTagCategorySystem() {
  const [config, setConfig] = useState<TagConfig>({
    tableName: 'tags',
    tagColors: true,
    maxTags: 10,
    allowCreate: true,
    presetTags: ['featured', 'new', 'sale', 'popular'],
  });

  const updateConfig = useCallback((updates: Partial<TagConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addPresetTag = useCallback((tag: string) => {
    setConfig(prev => ({ ...prev, presetTags: [...prev.presetTags, tag] }));
  }, []);

  const removePresetTag = useCallback((index: number) => {
    setConfig(prev => ({ ...prev, presetTags: prev.presetTags.filter((_, i) => i !== index) }));
  }, []);

  const generateMigrationSQL = useCallback((): string => {
    return `-- Tags table
CREATE TABLE IF NOT EXISTS public.${config.tableName} (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  ${config.tagColors ? "color TEXT DEFAULT '#6366f1',\n  " : ''}created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Polymorphic taggings junction table
CREATE TABLE IF NOT EXISTS public.taggings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID NOT NULL REFERENCES public.${config.tableName}(id) ON DELETE CASCADE,
  taggable_type TEXT NOT NULL,
  taggable_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tag_id, taggable_type, taggable_id)
);

CREATE INDEX IF NOT EXISTS idx_taggings_taggable ON public.taggings(taggable_type, taggable_id);
CREATE INDEX IF NOT EXISTS idx_taggings_tag ON public.taggings(tag_id);

-- Enable RLS
ALTER TABLE public.${config.tableName} ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" ON public.${config.tableName} FOR SELECT USING (true);
CREATE POLICY "Taggings are viewable by everyone" ON public.taggings FOR SELECT USING (true);

-- Seed preset tags
${config.presetTags.map(t => `INSERT INTO public.${config.tableName} (name, slug) VALUES ('${t}', '${t.toLowerCase().replace(/\s+/g, '-')}') ON CONFLICT DO NOTHING;`).join('\n')}`;
  }, [config]);

  const generateTagInputComponent = useCallback((): string => {
    return `import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  max?: number;
}

export function TagInput({ tags, onChange, suggestions = ${JSON.stringify(config.presetTags)}, max = ${config.maxTags} }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed) || tags.length >= max) return;
    onChange([...tags, trimmed]);
    setInput('');
  };

  const removeTag = (index: number) => onChange(tags.filter((_, i) => i !== index));

  const filtered = suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button onClick={() => removeTag(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } if (e.key === 'Backspace' && !input) removeTag(tags.length - 1); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length >= max ? 'Max tags reached' : 'Add tag...'}
          disabled={tags.length >= max}
          className="text-sm"
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-32 overflow-auto">
            {filtered.map(s => (
              <button key={s} onMouseDown={() => addTag(s)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent">{s}</button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{tags.length}/{max} tags</p>
    </div>
  );
}`;
  }, [config]);

  return { config, updateConfig, addPresetTag, removePresetTag, generateMigrationSQL, generateTagInputComponent };
}
