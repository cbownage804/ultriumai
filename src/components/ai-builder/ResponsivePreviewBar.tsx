import { useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, Laptop, RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewportMode = 'desktop' | 'laptop' | 'tablet' | 'tablet-sm' | 'mobile' | 'mobile-sm' | 'custom';

interface DevicePreset {
  id: ViewportMode;
  icon: typeof Monitor;
  label: string;
  width: number;
  height: number;
  group: 'primary' | 'extra';
}

const PRESETS: DevicePreset[] = [
  { id: 'desktop',    icon: Monitor,    label: 'Desktop',         width: 0,    height: 0,    group: 'primary' },
  { id: 'laptop',     icon: Laptop,     label: 'Laptop — 1280px', width: 1280, height: 800,  group: 'extra' },
  { id: 'tablet',     icon: Tablet,     label: 'iPad — 820px',    width: 820,  height: 1180, group: 'primary' },
  { id: 'tablet-sm',  icon: Tablet,     label: 'iPad Mini — 768px', width: 768, height: 1024, group: 'extra' },
  { id: 'mobile',     icon: Smartphone, label: 'iPhone 15 — 393px', width: 393,  height: 852,  group: 'primary' },
  { id: 'mobile-sm',  icon: Smartphone, label: 'iPhone SE — 375px', width: 375,  height: 667,  group: 'extra' },
];

const PRIMARY_PRESETS = PRESETS.filter(p => p.group === 'primary');

interface ResponsivePreviewBarProps {
  active: ViewportMode;
  onChange: (mode: ViewportMode) => void;
  customWidth?: number;
  customHeight?: number;
  onCustomSize?: (w: number, h: number) => void;
  isLandscape?: boolean;
  onToggleLandscape?: () => void;
}

export function ResponsivePreviewBar({
  active,
  onChange,
  customWidth = 400,
  customHeight = 700,
  onCustomSize,
  isLandscape = false,
  onToggleLandscape,
}: ResponsivePreviewBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const activePreset = PRESETS.find(p => p.id === active);
  const showDimensions = active !== 'desktop';
  const displayWidth = active === 'custom' ? customWidth : (activePreset?.width || 0);
  const displayHeight = active === 'custom' ? customHeight : (activePreset?.height || 0);
  const effectiveWidth = isLandscape && showDimensions ? displayHeight : displayWidth;
  const effectiveHeight = isLandscape && showDimensions ? displayWidth : displayHeight;

  return (
    <div className="flex items-center gap-1 relative" ref={dropdownRef}>
      {/* Primary device buttons */}
      <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
        {PRIMARY_PRESETS.map(v => {
          const Icon = v.icon;
          const isActive = active === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              title={v.label}
              className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center transition-all",
                isActive ? "bg-white/10 text-white" : "text-white/25 hover:text-white/50 hover:bg-white/5"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}

        {/* More devices dropdown trigger */}
        <button
          onClick={() => setShowDropdown(prev => !prev)}
          title="More devices"
          className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center transition-all",
            showDropdown ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40 hover:bg-white/5"
          )}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", showDropdown && "rotate-180")} />
        </button>
      </div>

      {/* Dimension label + orientation toggle */}
      {showDimensions && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/25 font-mono tabular-nums whitespace-nowrap">
            {effectiveWidth} × {effectiveHeight}
          </span>
          {onToggleLandscape && (
            <button
              onClick={onToggleLandscape}
              title={isLandscape ? 'Portrait' : 'Landscape'}
              className={cn(
                "h-5 w-5 rounded flex items-center justify-center transition-colors",
                isLandscape ? "text-cyan-400/60 hover:text-cyan-400" : "text-white/20 hover:text-white/40"
              )}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Extended device dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1.5 z-50 bg-[#12121a] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden w-52">
          <div className="px-2.5 py-1.5 text-[9px] text-white/25 uppercase tracking-wider font-medium border-b border-white/[0.06]">
            Device Presets
          </div>
          <div className="py-1">
            {PRESETS.map(preset => {
              const Icon = preset.icon;
              const isActive = active === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => { onChange(preset.id); setShowDropdown(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                    isActive ? "bg-cyan-500/10 text-cyan-400" : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] block truncate">{preset.label}</span>
                  </div>
                  {preset.width > 0 && (
                    <span className="text-[9px] text-white/20 font-mono tabular-nums shrink-0">
                      {preset.width}×{preset.height}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom size input */}
          {onCustomSize && (
            <>
              <div className="border-t border-white/[0.06] px-3 py-2">
                <div className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Custom Size</div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={280}
                    max={2560}
                    value={customWidth}
                    onChange={(e) => onCustomSize(parseInt(e.target.value) || 400, customHeight)}
                    className="w-14 h-6 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] text-white/60 font-mono text-center outline-none focus:border-cyan-500/40"
                    placeholder="W"
                  />
                  <span className="text-[10px] text-white/15">×</span>
                  <input
                    type="number"
                    min={280}
                    max={2560}
                    value={customHeight}
                    onChange={(e) => onCustomSize(customWidth, parseInt(e.target.value) || 700)}
                    className="w-14 h-6 bg-white/[0.04] border border-white/[0.08] rounded text-[10px] text-white/60 font-mono text-center outline-none focus:border-cyan-500/40"
                    placeholder="H"
                  />
                  <button
                    onClick={() => { onChange('custom'); setShowDropdown(false); }}
                    className="h-6 px-2 rounded bg-cyan-500/20 text-cyan-400 text-[10px] hover:bg-cyan-500/30 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function getViewportWidth(mode: ViewportMode, customWidth?: number, isLandscape?: boolean): number {
  if (mode === 'custom') return customWidth || 400;
  const preset = PRESETS.find(v => v.id === mode);
  if (!preset) return 0;
  if (isLandscape && preset.width > 0) return preset.height;
  return preset.width;
}
