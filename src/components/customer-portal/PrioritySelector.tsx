/**
 * Priority Selector Component
 * Visual priority selection with descriptions
 */

import { AlertCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrioritySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const priorities = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor issue, no rush',
    icon: Clock,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    activeColor: 'bg-slate-500/30 border-slate-400',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Normal priority',
    icon: AlertCircle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    activeColor: 'bg-amber-500/30 border-amber-400',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Impacting work',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    activeColor: 'bg-orange-500/30 border-orange-400',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Critical - needs immediate attention',
    icon: Zap,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    activeColor: 'bg-red-500/30 border-red-400',
  },
];

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {priorities.map((priority) => {
        const Icon = priority.icon;
        const isActive = value === priority.value;

        return (
          <button
            key={priority.value}
            type="button"
            onClick={() => onChange(priority.value)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
              isActive
                ? priority.activeColor
                : `${priority.bgColor} ${priority.borderColor} hover:border-white/30`
            )}
          >
            <div className={cn('w-8 h-8 rounded-md flex items-center justify-center shrink-0', priority.bgColor)}>
              <Icon className={cn('h-4 w-4', priority.color)} />
            </div>
            <div>
              <p className={cn('font-medium', isActive ? 'text-white' : 'text-white/80')}>
                {priority.label}
              </p>
              <p className="text-xs text-white/50">{priority.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
