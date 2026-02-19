import { X, Shield, AlertTriangle } from 'lucide-react';
import type { ScanResult } from '@/hooks/useDependencyScanner';

interface Props {
  open: boolean;
  onClose: () => void;
  latestScan: ScanResult | null;
  isScanning: boolean;
  onScan: () => void;
}

export function DependencyScannerPanel({ open, onClose, latestScan, isScanning, onScan }: Props) {
  if (!open) return null;
  const severityColor = (s: string) => s === 'critical' ? 'text-red-400 bg-red-500/10' : s === 'high' ? 'text-orange-400 bg-orange-500/10' : s === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-red-400" /><span className="text-sm font-medium text-white">Dependency Scanner</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <button onClick={onScan} disabled={isScanning} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 disabled:opacity-50">
            {isScanning ? 'Scanning...' : 'Scan Dependencies'}
          </button>

          {latestScan && (
            <>
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded bg-red-500/10 text-center"><div className="text-sm font-bold text-red-400">{latestScan.criticalCount}</div><div className="text-[9px] text-white/30">Critical</div></div>
                <div className="p-2 rounded bg-orange-500/10 text-center"><div className="text-sm font-bold text-orange-400">{latestScan.highCount}</div><div className="text-[9px] text-white/30">High</div></div>
                <div className="p-2 rounded bg-amber-500/10 text-center"><div className="text-sm font-bold text-amber-400">{latestScan.mediumCount}</div><div className="text-[9px] text-white/30">Medium</div></div>
                <div className="p-2 rounded bg-blue-500/10 text-center"><div className="text-sm font-bold text-blue-400">{latestScan.lowCount}</div><div className="text-[9px] text-white/30">Low</div></div>
              </div>
              <div className="text-[10px] text-white/30">{latestScan.totalPackages} packages scanned • {latestScan.scannedAt.toLocaleString()}</div>

              {latestScan.vulnerabilities.map(v => (
                <div key={v.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${severityColor(v.severity)}`}>{v.severity}</span>
                    <span className="text-xs text-white/70">{v.packageName}@{v.currentVersion}</span>
                  </div>
                  <div className="text-[10px] text-white/40">{v.description}</div>
                  {v.cveId && <div className="text-[10px] text-cyan-400/50 mt-1">{v.cveId}</div>}
                  {v.patchedVersion && <div className="text-[10px] text-emerald-400 mt-1">Fix: upgrade to {v.patchedVersion}</div>}
                </div>
              ))}

              {latestScan.vulnerabilities.length === 0 && <div className="text-center text-emerald-400 text-xs py-4">✓ No vulnerabilities found</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
