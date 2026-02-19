import { X, KeyRound, RefreshCw, AlertTriangle, Check, Trash2 } from 'lucide-react';
import type { ManagedSecret } from '@/hooks/useSecretRotation';

interface Props {
  open: boolean;
  onClose: () => void;
  secrets: ManagedSecret[];
  onAdd: (name: string, service: string, lastRotated: Date, interval: number) => void;
  onMarkRotated: (id: string) => void;
  onRemove: (id: string) => void;
  expiredCount: number;
  warningCount: number;
}

export function SecretRotationPanel({ open, onClose, secrets, onAdd, onMarkRotated, onRemove, expiredCount, warningCount }: Props) {
  if (!open) return null;
  const statusColor = (s: string) => s === 'expired' ? 'text-red-400' : s === 'warning' ? 'text-amber-400' : 'text-emerald-400';
  const statusBg = (s: string) => s === 'expired' ? 'bg-red-500/10' : s === 'warning' ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Secret Rotation</span>
            {expiredCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">{expiredCount} expired</span>}
            {warningCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">{warningCount} expiring</span>}
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={() => onAdd('API_KEY', 'supabase', new Date(Date.now() - 60 * 86400000), 90)} className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30">
            + Track New Secret
          </button>

          {secrets.map(secret => (
            <div key={secret.id} className={`p-3 rounded-lg border border-white/[0.06] ${statusBg(secret.status)}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${statusColor(secret.status)}`}>
                    {secret.status === 'expired' ? <AlertTriangle className="h-3 w-3 inline mr-1" /> : secret.status === 'healthy' ? <Check className="h-3 w-3 inline mr-1" /> : <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {secret.name}
                  </span>
                  <span className="text-[10px] text-white/30">{secret.service}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onMarkRotated(secret.id)} className="p-1 text-white/20 hover:text-emerald-400" title="Mark as rotated"><RefreshCw className="h-3 w-3" /></button>
                  <button onClick={() => onRemove(secret.id)} className="p-1 text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/30">
                <span>Last rotated: {secret.lastRotated.toLocaleDateString()}</span>
                <span>{secret.isExpired ? 'Overdue!' : `${secret.daysUntilExpiry}d remaining`}</span>
                <span>Every {secret.rotationIntervalDays}d</span>
              </div>
              {secret.rotationGuide && secret.status !== 'healthy' && (
                <pre className="mt-2 text-[9px] text-white/25 whitespace-pre-wrap">{secret.rotationGuide}</pre>
              )}
            </div>
          ))}

          {secrets.length === 0 && <div className="text-center text-white/20 text-xs py-6">Track API keys and secrets to get rotation reminders</div>}
        </div>
      </div>
    </div>
  );
}
