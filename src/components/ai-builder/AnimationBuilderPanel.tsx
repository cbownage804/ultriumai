import { X, Play, Plus, Trash2, Copy, Sparkles } from 'lucide-react';
import type { AnimationConfig } from '@/hooks/useAnimationBuilder';

interface AnimationBuilderPanelProps {
  open: boolean;
  onClose: () => void;
  animations: AnimationConfig[];
  activeAnimation: AnimationConfig | null;
  presetNames: string[];
  easingPresets: Record<string, string>;
  isPlaying: boolean;
  onCreateAnimation: (preset?: string) => void;
  onUpdateAnimation: (id: string, updates: Partial<AnimationConfig>) => void;
  onDeleteAnimation: (id: string) => void;
  onSetActive: (id: string | null) => void;
  onTogglePlay: () => void;
  onExportFramerMotion: (anim: AnimationConfig) => string;
  onExportCSS: (anim: AnimationConfig) => string;
  onInsertCode: (code: string) => void;
}

export function AnimationBuilderPanel({ open, onClose, animations, activeAnimation, presetNames, easingPresets, isPlaying, onCreateAnimation, onUpdateAnimation, onDeleteAnimation, onSetActive, onTogglePlay, onExportFramerMotion, onExportCSS, onInsertCode }: AnimationBuilderPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span className="text-sm font-medium text-white">Animation Builder</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/[0.06] p-3 space-y-2 overflow-y-auto">
            <div className="text-[10px] text-white/30 mb-2">PRESETS</div>
            {presetNames.map(name => (
              <button key={name} onClick={() => onCreateAnimation(name)} className="w-full text-left px-2 py-1.5 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/5 rounded transition-colors">
                {name}
              </button>
            ))}
            <div className="h-px bg-white/[0.06] my-2" />
            <button onClick={() => onCreateAnimation()} className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/[0.08] rounded">
              <Plus className="h-3 w-3" /> Custom
            </button>
            <div className="h-px bg-white/[0.06] my-2" />
            <div className="text-[10px] text-white/30 mb-1">YOUR ANIMATIONS</div>
            {animations.map(a => (
              <div key={a.id} className="flex items-center justify-between group">
                <button onClick={() => onSetActive(a.id)} className={`flex-1 text-left px-2 py-1 text-[11px] rounded ${activeAnimation?.id === a.id ? 'text-pink-300 bg-pink-500/10' : 'text-white/40 hover:text-white/70'}`}>
                  {a.name}
                </button>
                <button onClick={() => onDeleteAnimation(a.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 p-1"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeAnimation ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30">Duration (ms)</label>
                    <input type="number" value={activeAnimation.duration} onChange={e => onUpdateAnimation(activeAnimation.id, { duration: Number(e.target.value) })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30">Delay (ms)</label>
                    <input type="number" value={activeAnimation.delay} onChange={e => onUpdateAnimation(activeAnimation.id, { delay: Number(e.target.value) })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30">Easing</label>
                    <select value={activeAnimation.easing} onChange={e => onUpdateAnimation(activeAnimation.id, { easing: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80">
                      {Object.entries(easingPresets).map(([name, value]) => (
                        <option key={name} value={value}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30">Direction</label>
                    <select value={activeAnimation.direction} onChange={e => onUpdateAnimation(activeAnimation.id, { direction: e.target.value as any })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80">
                      <option value="normal">Normal</option>
                      <option value="reverse">Reverse</option>
                      <option value="alternate">Alternate</option>
                    </select>
                  </div>
                </div>

                {/* Keyframe timeline */}
                <div className="space-y-1">
                  <span className="text-[10px] text-white/30">Keyframes ({activeAnimation.keyframes.length})</span>
                  <div className="relative h-8 bg-black/30 rounded-lg overflow-hidden">
                    {activeAnimation.keyframes.map(kf => (
                      <div
                        key={kf.id}
                        className="absolute top-0 h-full w-1 bg-pink-400/60 rounded"
                        style={{ left: `${kf.offset * 100}%` }}
                        title={`${Math.round(kf.offset * 100)}%: ${JSON.stringify(kf.properties)}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-center h-24 bg-black/20 rounded-lg border border-white/[0.06]">
                  <div
                    className="h-12 w-12 bg-pink-500/30 rounded-lg border border-pink-500/50"
                    style={isPlaying ? {
                      animation: `preview-anim ${activeAnimation.duration}ms ${activeAnimation.easing} ${activeAnimation.iterations === 'infinite' ? 'infinite' : activeAnimation.iterations} ${activeAnimation.direction}`,
                    } : {}}
                  />
                </div>
                <button onClick={onTogglePlay} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded text-xs hover:bg-pink-500/30">
                  <Play className="h-3 w-3" /> {isPlaying ? 'Stop' : 'Preview'}
                </button>

                {/* Export */}
                <div className="space-y-2">
                  <span className="text-[10px] text-white/30">Export as Framer Motion</span>
                  <pre className="bg-black/40 rounded p-2 text-[10px] font-mono text-white/50 overflow-auto max-h-24">{onExportFramerMotion(activeAnimation)}</pre>
                  <button onClick={() => onInsertCode(onExportFramerMotion(activeAnimation))} className="flex items-center gap-1 px-2 py-1 text-[10px] text-cyan-400/60 hover:text-cyan-300">
                    <Copy className="h-3 w-3" /> Insert Code
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-white/20">
                Select a preset or create a custom animation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
