import { X, Shield, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';
import type { useMFAFlowGenerator } from '@/hooks/useMFAFlowGenerator';

type Props = ReturnType<typeof useMFAFlowGenerator> & {
  onInsertCode: (code: string) => void;
  onClose: () => void;
};

export function MFAFlowPanel({ config, updateConfig, generateCode, onInsertCode, onClose }: Props) {
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
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-white/80">MFA/2FA Flow</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Issuer Name</label>
          <input value={config.issuerName} onChange={e => updateConfig({ issuerName: e.target.value })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">QR Code Size</label>
          <input type="number" value={config.qrSize} onChange={e => updateConfig({ qrSize: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Backup Codes Count</label>
          <input type="number" value={config.backupCodesCount} onChange={e => updateConfig({ backupCodesCount: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/40 uppercase tracking-wider">Grace Period (days)</label>
          <input type="number" value={config.gracePeriodDays} onChange={e => updateConfig({ gracePeriodDays: Number(e.target.value) })}
            className="w-full text-[10px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white/70" />
        </div>
        <label className="flex items-center gap-2 text-[10px] text-white/60 cursor-pointer">
          <input type="checkbox" checked={config.enrollmentRequired} onChange={e => updateConfig({ enrollmentRequired: e.target.checked })}
            className="rounded border-white/20" />
          Require enrollment for all users
        </label>
      </div>

      <div className="p-3 border-t border-white/[0.06] shrink-0">
        <button onClick={handleInsert} className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg text-xs font-medium">
          {copied ? <><Check className="h-3 w-3" />Inserted</> : <><Sparkles className="h-3 w-3" />Generate MFA Flow</>}
        </button>
      </div>
    </div>
  );
}
