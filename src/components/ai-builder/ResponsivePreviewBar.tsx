import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: ViewportMode; icon: typeof Monitor; label: string; width: number }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: 0 },
  { id: 'tablet', icon: Tablet, label: 'Tablet (768px)', width: 768 },
  { id: 'mobile', icon: Smartphone, label: 'Mobile (390px)', width: 390 },
];

interface ResponsivePreviewBarProps {
  active: ViewportMode;
  onChange: (mode: ViewportMode) => void;
}

export function ResponsivePreviewBar({ active, onChange }: ResponsivePreviewBarProps) {
  return (
    <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
      {VIEWPORTS.map(v => {
        const Icon = v.icon;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            title={v.label}
            className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center transition-all",
              active === v.id ? "bg-white/10 text-white" : "text-white/25 hover:text-white/50 hover:bg-white/5"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export function getViewportWidth(mode: ViewportMode): number {
  return VIEWPORTS.find(v => v.id === mode)?.width || 0;
}
