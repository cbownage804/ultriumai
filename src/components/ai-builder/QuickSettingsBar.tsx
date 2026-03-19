/**
 * Quick Settings Toggle Bar — Wave 8 Step 5
 * Compact strip for frequently-toggled settings.
 */
import { Volume2, VolumeX, Zap, ZapOff, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickSettingsBarProps {
  soundEnabled: boolean;
  onSoundToggle: (v: boolean) => void;
  autoHealEnabled: boolean;
  onAutoHealToggle: (v: boolean) => void;
  selectedModel: string;
}

export function QuickSettingsBar({
  soundEnabled,
  onSoundToggle,
  autoHealEnabled,
  onAutoHealToggle,
  selectedModel,
}: QuickSettingsBarProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-white/25 hover:text-white/50 transition-colors"
        title="Quick settings"
      >
        <Wrench className="h-2.5 w-2.5" />
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 border-t border-white/[0.04] bg-white/[0.02]">
      {/* Sound */}
      <button
        onClick={() => onSoundToggle(!soundEnabled)}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors",
          soundEnabled ? "text-emerald-400/70 hover:bg-emerald-500/10" : "text-white/25 hover:bg-white/5"
        )}
        title={soundEnabled ? 'Sound on' : 'Sound off'}
      >
        {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        Sound
      </button>

      {/* Auto-heal */}
      <button
        onClick={() => onAutoHealToggle(!autoHealEnabled)}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-colors",
          autoHealEnabled ? "text-cyan-400/70 hover:bg-cyan-500/10" : "text-white/25 hover:bg-white/5"
        )}
        title={autoHealEnabled ? 'Auto-heal on' : 'Auto-heal off'}
      >
        {autoHealEnabled ? <Zap className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
        Auto-heal
      </button>

      {/* Model badge */}
      <Badge className="text-[9px] bg-violet-500/10 text-violet-400/60 border-violet-500/20 h-4 px-1.5">
        {selectedModel || 'default'}
      </Badge>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(true)}
        className="ml-auto text-white/20 hover:text-white/50 transition-colors"
        title="Collapse settings"
      >
        <ChevronUp className="h-3 w-3" />
      </button>
    </div>
  );
}
