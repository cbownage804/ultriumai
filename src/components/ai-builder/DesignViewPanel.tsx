import { useState, Suspense, lazy } from 'react';
import { X, Palette, Layers, MousePointer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeStudioPanel = lazy(() => import('./lazyPanels').then(m => ({ default: m.ThemeStudioPanel as any })));
const DesignSystemPanel = lazy(() => import('./lazyPanels').then(m => ({ default: m.DesignSystemPanel as any })));

interface DesignViewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Props forwarded to ThemeStudioPanel */
  themeStudioProps?: Record<string, any>;
  /** Props forwarded to DesignSystemPanel */
  designSystemProps?: Record<string, any>;
  /** Activate visual edit mode */
  onToggleVisualEdit?: () => void;
  isVisualEditActive?: boolean;
}

type DesignTab = 'themes' | 'design-system' | 'visual-edits';

const TABS: { id: DesignTab; label: string; icon: React.ElementType }[] = [
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'design-system', label: 'Design System', icon: Layers },
  { id: 'visual-edits', label: 'Visual Edits', icon: MousePointer },
];

function PanelFallback() {
  return (
    <div className="flex items-center justify-center h-full text-white/30">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function DesignViewPanel({ isOpen, onClose, themeStudioProps, designSystemProps, onToggleVisualEdit, isVisualEditActive }: DesignViewPanelProps) {
  const [activeTab, setActiveTab] = useState<DesignTab>('themes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-4xl h-full flex bg-[#0c0c0c] border-l border-white/[0.08] shadow-2xl">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white/80">Design</h2>
            <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                      : "text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Suspense fallback={<PanelFallback />}>
            <div className="flex-1 overflow-auto">
              {activeTab === 'themes' && (
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white/80">Theme Studio</h3>
                    <p className="text-xs text-white/40">Browse, customize, and apply theme presets. Edit CSS variables for light and dark modes.</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/50">Open the Theme Studio panel from the toolbar panels menu (⌘K → "Theme Studio") to edit tokens, preview colors, and export CSS/Tailwind config.</p>
                    {themeStudioProps && (
                      <button
                        onClick={() => themeStudioProps.onOpen?.()}
                        className="mt-3 text-xs px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
                      >
                        Open Theme Studio
                      </button>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'design-system' && (
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white/80">Design System</h3>
                    <p className="text-xs text-white/40">Generate WCAG-compliant design tokens from brand colors, apply automated theme variants, and inject a standardized design-tokens.css into your project.</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/50">Use the Design System engine to create consistent color, typography, and spacing tokens. Supports Light, Dark, High Contrast, Warm Shift, Cool Shift, and Complementary variants.</p>
                    {designSystemProps && (
                      <button
                        onClick={() => designSystemProps.onOpen?.()}
                        className="mt-3 text-xs px-3 py-1.5 rounded-md bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
                      >
                        Open Design System
                      </button>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'visual-edits' && (
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white/80">Visual Edits</h3>
                    <p className="text-xs text-white/40">Click elements in the preview to select them for editing. The AI will generate targeted edits based on your selection.</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        isVisualEditActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                      )} />
                      <span className="text-xs text-white/60">
                        Visual Edit Mode is {isVisualEditActive ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <button
                      onClick={() => { onToggleVisualEdit?.(); onClose(); }}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-md border transition-colors",
                        isVisualEditActive
                          ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30"
                          : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/30"
                      )}
                    >
                      {isVisualEditActive ? 'Deactivate Visual Edit' : 'Activate Visual Edit Mode'}
                    </button>
                    <p className="text-[11px] text-white/30">When active, click any element in the preview to pre-fill a targeted edit prompt in the chat.</p>
                  </div>
                </div>
              )}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default DesignViewPanel;
