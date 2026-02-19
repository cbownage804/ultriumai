import { useProjectHealthScore } from '@/hooks/useProjectHealthScore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { X, HeartPulse, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

type Props = ReturnType<typeof useProjectHealthScore> & { files: ProjectFile[]; onInsertCode: (code: string) => void; onClose: () => void };

export function ProjectHealthPanel({ metrics, overallScore, grade, isScanning, scan, generateCode, files, onInsertCode, onClose }: Props) {
  const gradeColor = grade === 'A' ? 'text-green-400' : grade === 'B' ? 'text-blue-400' : grade === 'C' ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0b] border-l border-white/10 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4 text-pink-400" /><span className="text-sm font-medium text-white">Project Health</span></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs">Overall Score</p>
            <p className="text-2xl font-bold text-white">{overallScore}%</p>
          </div>
          <span className={`text-5xl font-black ${gradeColor}`}>{grade}</span>
        </div>
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => scan(files)} disabled={isScanning}>
          <RefreshCw className={`w-3 h-3 mr-1 ${isScanning ? 'animate-spin' : ''}`} />{isScanning ? 'Scanning...' : 'Scan Project'}
        </Button>
        {metrics.map((m, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-white/70 text-xs">{m.name}</Label>
              <span className="text-white/50 text-[10px]">{m.score}% (weight: {m.weight})</span>
            </div>
            <Progress value={m.score} className={m.score >= 80 ? '' : m.score >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'} />
            <p className="text-white/40 text-[10px]">{m.details}</p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Button size="sm" className="flex-1 text-xs" onClick={() => { onInsertCode(generateCode()); toast.success('Health dashboard inserted'); }}>Insert Dashboard</Button>
        <Button size="sm" variant="outline" className="text-xs" onClick={() => { navigator.clipboard.writeText(generateCode()); toast.success('Copied'); }}><Copy className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}
