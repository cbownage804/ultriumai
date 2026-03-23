import { useState } from 'react';
import { cn } from '@/lib/utils';
import { APP_STARTER_TEMPLATES, type AppStarterTemplate } from './AppStarterTemplates';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';

interface StarterTemplatePickerProps {
  onSelect: (template: AppStarterTemplate) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'app', label: 'Apps' },
  { id: 'site', label: 'Sites' },
  { id: 'tool', label: 'Tools' },
  { id: 'react', label: 'React' },
];

export function StarterTemplatePicker({ onSelect }: StarterTemplatePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');

  const filtered = APP_STARTER_TEMPLATES.filter(
    t => category === 'all' || t.category === category
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-medium text-cyan-400">Start with a Template</span>
        </div>
        <p className="text-xs text-white/40">Choose a foundation — the AI will extend it based on your instructions.</p>
      </div>

      {/* Category filter */}
      <div className="flex items-center justify-center gap-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "px-3 py-1 rounded-lg text-[10px] font-medium transition-colors",
              category === cat.id
                ? "bg-white/10 text-white/80"
                : "text-white/30 hover:text-white/50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map(template => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => setSelectedId(isSelected ? null : template.id)}
              className={cn(
                "text-left p-3 rounded-xl border transition-all",
                isSelected
                  ? "bg-cyan-500/[0.08] border-cyan-500/30 ring-1 ring-cyan-500/20"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/80">{template.name}</span>
                    {template.id !== 'blank' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">PRE-TESTED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{template.description}</p>
                </div>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-white/20 transition-transform shrink-0",
                  isSelected && "rotate-180 text-cyan-400/60"
                )} />
              </div>

              {/* Expanded details */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-[11px] text-white/40 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/25 mb-3">
                    <span>{template.files.length} file{template.files.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{template.category}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(template); }}
                    className="w-full flex items-center justify-center gap-2 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-xs font-medium"
                  >
                    Use this template
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
