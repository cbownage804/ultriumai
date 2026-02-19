/**
 * Phase 118: Project Forking Panel
 */
import { useState } from 'react';
import { X, GitFork, ArrowRightLeft, Copy } from 'lucide-react';
import type { ForkRecord, TransferRecord } from '@/hooks/useProjectForking';

interface ForkingPanelProps {
  open: boolean;
  onClose: () => void;
  forks: ForkRecord[];
  transfers: TransferRecord[];
  projectName: string;
  projectId: string;
  fileCount: number;
  onFork: (includeHistory: boolean) => void;
  onTransfer: (toEmail: string, reason?: string) => void;
}

export function ForkingPanel({
  open, onClose, forks, transfers,
  projectName, projectId, fileCount,
  onFork, onTransfer,
}: ForkingPanelProps) {
  const [transferEmail, setTransferEmail] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [tab, setTab] = useState<'fork' | 'transfer' | 'history'>('fork');

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-cyan-400/60" />
          <h3 className="text-sm font-medium text-white/80">Fork & Transfer</h3>
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex border-b border-white/[0.06]">
        {(['fork', 'transfer', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider ${
              tab === t ? 'text-white/70 border-b border-cyan-400/40' : 'text-white/25 hover:text-white/40'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'fork' && (
          <>
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
              <h4 className="text-xs font-medium text-white/60 mb-1">Fork "{projectName}"</h4>
              <p className="text-[10px] text-white/30 mb-3">Create an independent copy of this project with {fileCount} files.</p>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={e => setIncludeHistory(e.target.checked)}
                  className="rounded border-white/20"
                />
                <span className="text-[10px] text-white/40">Include version history</span>
              </label>
              <button
                onClick={() => onFork(includeHistory)}
                className="w-full flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-300 text-xs py-2 rounded-lg hover:bg-cyan-500/30"
              >
                <Copy className="h-3.5 w-3.5" /> Fork Project
              </button>
            </div>
          </>
        )}

        {tab === 'transfer' && (
          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] space-y-2">
            <h4 className="text-xs font-medium text-white/60 mb-1">Transfer Ownership</h4>
            <p className="text-[10px] text-white/30 mb-2">Transfer this project to another team member. You'll become an editor.</p>
            <input
              value={transferEmail}
              onChange={e => setTransferEmail(e.target.value)}
              placeholder="Recipient email"
              className="w-full bg-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 outline-none"
            />
            <input
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full bg-white/[0.04] rounded px-2.5 py-1.5 text-xs text-white/60 outline-none"
            />
            <button
              onClick={() => { if (transferEmail) { onTransfer(transferEmail, transferReason); setTransferEmail(''); setTransferReason(''); } }}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs py-2 rounded-lg hover:bg-amber-500/30"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {forks.length > 0 && (
              <>
                <h4 className="text-[10px] text-white/25 uppercase tracking-wider">Forks</h4>
                {forks.map(f => (
                  <div key={f.id} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                    <div className="text-xs text-white/60">{f.forkedProjectName}</div>
                    <div className="text-[9px] text-white/20">by {f.forkedBy} · {f.fileCount} files · {f.forkedAt.toLocaleDateString()}</div>
                  </div>
                ))}
              </>
            )}
            {transfers.length > 0 && (
              <>
                <h4 className="text-[10px] text-white/25 uppercase tracking-wider mt-3">Transfers</h4>
                {transfers.map(t => (
                  <div key={t.id} className="bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                    <div className="text-xs text-white/60">{t.fromEmail} → {t.toEmail}</div>
                    <div className="text-[9px] text-white/20">{t.transferredAt.toLocaleDateString()}{t.reason && ` · ${t.reason}`}</div>
                  </div>
                ))}
              </>
            )}
            {forks.length === 0 && transfers.length === 0 && (
              <div className="text-center text-[11px] text-white/20 py-8">No history</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
