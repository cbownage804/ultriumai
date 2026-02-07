import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DevicePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: typeof Monitor;
  category: 'desktop' | 'tablet' | 'mobile';
};

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'desktop', label: 'Desktop', width: 0, height: 0, icon: Monitor, category: 'desktop' }, // 0 = 100%
  { id: 'laptop', label: 'Laptop', width: 1366, height: 768, icon: Laptop, category: 'desktop' },
  { id: 'ipad-pro', label: 'iPad Pro', width: 1024, height: 1366, icon: Tablet, category: 'tablet' },
  { id: 'ipad', label: 'iPad', width: 768, height: 1024, icon: Tablet, category: 'tablet' },
  { id: 'iphone-15', label: 'iPhone 15', width: 393, height: 852, icon: Smartphone, category: 'mobile' },
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, icon: Smartphone, category: 'mobile' },
  { id: 'pixel-7', label: 'Pixel 7', width: 412, height: 915, icon: Smartphone, category: 'mobile' },
  { id: 'galaxy-s23', label: 'Galaxy S23', width: 360, height: 780, icon: Smartphone, category: 'mobile' },
];

interface DevicePresetPickerProps {
  activePreset: string;
  onSelect: (preset: DevicePreset) => void;
}

export function DevicePresetPicker({ activePreset, onSelect }: DevicePresetPickerProps) {
  return (
    <div className="flex items-center gap-0.5">
      {DEVICE_PRESETS.slice(0, 4).map(preset => {
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            title={`${preset.label}${preset.width ? ` (${preset.width}×${preset.height})` : ''}`}
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center transition-all",
              activePreset === preset.id
                ? "bg-white/10 text-white"
                : "text-white/25 hover:text-white/50 hover:bg-white/5"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
