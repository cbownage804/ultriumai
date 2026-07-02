/**
 * ThreatScanInput — quick paste-and-analyze surface on the Threat Center.
 *
 * Ray's first-pass verdict runs locally so the user gets an immediate
 * read; ThreatVerdictCard then upgrades the answer with personalization
 * when the vault is open. The surface accepts drag-and-drop and pasted
 * text so it reads as "drop anything suspicious here," not "URL checker."
 */
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ThreatVerdictCard } from '@/components/ray/ThreatVerdictCard';
import { analyzeThreat, type ThreatVerdict } from '@/lib/ray/threatVerdict';
import { cn } from '@/lib/utils';

const PLACEHOLDERS = [
  'Paste a phishing email…',
  'Paste an invoice PDF filename…',
  'Paste a suspicious URL…',
  'Paste a browser error…',
  'Drop a screenshot…',
  'Paste email headers…',
  'Paste an IP address…',
  'Paste a file hash…',
  'Drop a ZIP file…',
  'Paste PowerShell…',
];

const ACCEPTED = [
  'URL',
  'Email',
  'Email headers',
  'Domain',
  'IP address',
  'Hash',
  'File',
  'Screenshot',
  'Error message',
];

export function ThreatScanInput() {
  const [input, setInput] = useState('');
  const [verdicts, setVerdicts] = useState<ThreatVerdict[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((n) => (n + 1) % PLACEHOLDERS.length),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  const runAnalysis = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const v = analyzeThreat(trimmed);
    setVerdicts((prev) => [v, ...prev].slice(0, 6));
    setInput('');
  };

  const handleAnalyze = () => runAnalysis(input);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      files.forEach((f) => runAnalysis(f.name));
      return;
    }
    const text = e.dataTransfer.getData('text');
    if (text) runAnalysis(text);
  };

  return (
    <section className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'wrayth-chamfer border bg-card/60 p-4 sm:p-5 transition-colors',
          dragActive ? 'border-violet-400/60 bg-violet-500/[0.06]' : 'border-border',
        )}
      >
        <label className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
          Send me something to look at
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={3}
          className="mt-2 resize-none bg-background/40 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCEPTED.map((a) => (
            <span
              key={a}
              className="rounded-full border border-violet-500/20 bg-violet-500/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-200/80"
            >
              {a}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {dragActive
              ? 'Drop it — I\'ll take it from here.'
              : 'Ray runs a first-pass verdict instantly. Personalization needs your vault open.'}
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Drag &amp; drop supported
            </span>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={!input.trim()}
              className="bg-violet-500 text-white hover:bg-violet-500/90"
            >
              Analyze
            </Button>
          </div>
        </div>
      </div>

      {verdicts.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Recent analyses
          </div>
          {verdicts.map((v, i) => (
            <ThreatVerdictCard key={`${v.input}-${i}`} verdict={v} />
          ))}
        </div>
      )}
    </section>
  );
}
