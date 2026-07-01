/**
 * ThreatScanInput — quick paste-and-analyze surface on the Threats page.
 *
 * Runs Ray's first-pass verdict locally so the user gets an immediate
 * read; the vault-context bridge inside ThreatVerdictCard then upgrades
 * the answer with personalization when the vault is open.
 */
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ThreatVerdictCard } from '@/components/ray/ThreatVerdictCard';
import { analyzeThreat, type ThreatVerdict } from '@/lib/ray/threatVerdict';

export function ThreatScanInput() {
  const [input, setInput] = useState('');
  const [verdicts, setVerdicts] = useState<ThreatVerdict[]>([]);

  const handleAnalyze = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const v = analyzeThreat(trimmed);
    setVerdicts((prev) => [v, ...prev].slice(0, 6));
    setInput('');
  };

  return (
    <section className="space-y-4">
      <div className="wrayth-chamfer border border-border bg-card/60 p-4 sm:p-5">
        <label className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
          Send me something to look at
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a URL, a suspicious email, or a file name…"
          rows={3}
          className="mt-2 resize-none bg-background/40 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAnalyze();
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ray runs a first-pass verdict instantly. Personalization needs your vault open.</span>
          <Button size="sm" onClick={handleAnalyze} disabled={!input.trim()} className="bg-violet-500 text-white hover:bg-violet-500/90">
            Analyze
          </Button>
        </div>
      </div>

      {verdicts.length > 0 && (
        <div className="space-y-3">
          {verdicts.map((v, i) => (
            <ThreatVerdictCard key={`${v.input}-${i}`} verdict={v} />
          ))}
        </div>
      )}
    </section>
  );
}
