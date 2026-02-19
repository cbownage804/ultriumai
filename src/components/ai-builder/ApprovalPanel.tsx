/**
 * Phase 117: Approval Workflow Panel
 */
import { useState } from 'react';
import { X, ShieldCheck, Clock, Check, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalRequest } from '@/hooks/useApprovalWorkflow';

interface ApprovalPanelProps {
  open: boolean;
  onClose: () => void;
  requests: ApprovalRequest[];
  requireApproval: boolean;
  onToggleRequire: (v: boolean) => void;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, note?: string) => void;
  onCancel: (id: string) => void;
  pendingCount: number;
}

export function ApprovalPanel({
  open, onClose, requests, requireApproval,
  onToggleRequire, onApprove, onReject, onCancel, pendingCount,
}: ApprovalPanelProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  if (!open) return null;

  const statusIcon = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3 text-amber-400/60" />;
      case 'approved': return <Check className="h-3 w-3 text-emerald-400/60" />;
      case 'rejected': return <XCircle className="h-3 w-3 text-red-400/60" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-400/60" />
          <h3 className="text-sm font-medium text-white/80">Approvals</h3>
          {pendingCount > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] text-white/40">Require approval for deploys</span>
        <button
          onClick={() => onToggleRequire(!requireApproval)}
          className={cn(
            "w-8 h-4 rounded-full transition-colors relative",
            requireApproval ? "bg-violet-500/40" : "bg-white/[0.1]"
          )}
        >
          <div className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
            requireApproval ? "translate-x-4.5" : "translate-x-0.5"
          )} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {requests.map(req => (
          <div key={req.id} className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                {statusIcon(req.status)}
                <span className="text-[10px] text-white/30 uppercase">{req.type}</span>
              </div>
              <span className="text-[9px] text-white/15">{req.submittedAt.toLocaleTimeString()}</span>
            </div>
            <h4 className="text-xs font-medium text-white/70 mb-0.5">{req.title}</h4>
            <p className="text-[10px] text-white/30 mb-2">{req.description}</p>
            {req.diff && (
              <div className="text-[9px] text-white/20 mb-2">
                {req.diff.filesChanged} files · +{req.diff.additions} −{req.diff.deletions}
              </div>
            )}

            {req.status === 'pending' && (
              <>
                {reviewingId === req.id ? (
                  <div className="space-y-1.5">
                    <input
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      placeholder="Add a note (optional)..."
                      className="w-full bg-white/[0.04] rounded px-2 py-1 text-[10px] text-white/50 outline-none"
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => { onApprove(req.id, reviewNote); setReviewingId(null); setReviewNote(''); }} className="flex-1 text-[10px] bg-emerald-500/20 text-emerald-300 py-1 rounded">Approve</button>
                      <button onClick={() => { onReject(req.id, reviewNote); setReviewingId(null); setReviewNote(''); }} className="flex-1 text-[10px] bg-red-500/20 text-red-300 py-1 rounded">Reject</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button onClick={() => setReviewingId(req.id)} className="flex-1 text-[10px] bg-white/[0.06] text-white/50 py-1 rounded hover:bg-white/[0.1]">Review</button>
                    <button onClick={() => onCancel(req.id)} className="text-[10px] text-white/20 hover:text-red-400 px-2">Cancel</button>
                  </div>
                )}
              </>
            )}

            {req.reviewNote && req.status !== 'pending' && (
              <div className="mt-1.5 text-[10px] text-white/25 italic">"{req.reviewNote}"</div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="text-center text-[11px] text-white/20 py-8">No approval requests</div>
        )}
      </div>
    </div>
  );
}
