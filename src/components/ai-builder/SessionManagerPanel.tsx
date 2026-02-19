import { X, Clock, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';
import type { useSessionManager } from '@/hooks/useSessionManager';

type Props = ReturnType<typeof useSessionManager> & {
  onInsertCode: (code: string) => void;
  onClose: () => void;
};

export function SessionManagerPanel({ config, updateConfig, generateCode, onInsertCode, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleInsert = () => {
    onInsertCode(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/80">Session Manager</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Session Timeout (min)</label>
          <input type="number" value={config.timeoutMinutes} onChange={e => updateConfig({ timeoutMinutes: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Idle Timeout (min)</label>
          <input type="number" value={config.idleTimeoutMinutes} onChange={e => updateConfig({ idleTimeoutMinutes: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Warning Before (sec)</label>
          <input type="number" value={config.showWarningBeforeSeconds} onChange={e => updateConfig({ showWarningBeforeSeconds: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Logout Route</label>
          <input value={config.autoLogoutRoute} onChange={e => updateConfig({ autoLogoutRoute: e.target.value })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <label className="flex items-center gap-2 text-[10px] text-white/60 cursor-pointer">
          <input type="checkbox" checked={config.refreshRotation} onChange={e => updateConfig({ refreshRotation: e.target.checked })}
            className="rounded border-white/20" />
          Enable token refresh rotation
        </label>
      </div>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button onClick={handleInsert} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-lg text-xs font-medium">
          {copied ? <><Check className="h-3 w-3" />Inserted</> : <><Sparkles className="h-3 w-3" />Generate Session Code</>}
        </button>
      </div>
    </div>
  );
}
