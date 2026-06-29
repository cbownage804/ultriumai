import { useState } from 'react';
import { Shield, Monitor, Bot, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductIntent = 'safesuite' | 'vanguard' | 'ai_studio';

interface ProductOption {
  id: ProductIntent;
  icon: React.ElementType;
  title: string;
  description: string;
  recommendation: string;
}

const PRODUCT_OPTIONS: ProductOption[] = [
  {
    id: 'safesuite',
    icon: Shield,
    title: 'Wrayth',
    description: 'Protect my passwords, emails, and digital life',
    recommendation: 'Recommended for individuals & small teams',
  },
  {
    id: 'vanguard',
    icon: Monitor,
    title: 'Vanguard',
    description: 'RMM, helpdesk, pentesting, or full IT operations',
    recommendation: 'For MSPs & IT teams',
  },
  {
    id: 'ai_studio',
    icon: Bot,
    title: 'AI Studio',
    description: 'Build custom AI assistants for my business',
    recommendation: 'No code required',
  },
];

interface ProductIntentPickerProps {
  selected: ProductIntent[];
  onChange: (selected: ProductIntent[]) => void;
}

export function ProductIntentPicker({ selected, onChange }: ProductIntentPickerProps) {
  const toggleProduct = (id: ProductIntent) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        What brings you here?
      </label>
      <p className="text-xs text-muted-foreground">Select one or more products you're interested in.</p>
      <div className="space-y-2">
        {PRODUCT_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleProduct(option.id)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/50 hover:border-border hover:bg-muted/30'
              )}
            >
              <div className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{option.title}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                <p className="text-[10px] text-primary/70 mt-0.5 italic">{option.recommendation}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
