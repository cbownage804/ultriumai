import { IntelligenceCodeAnalyzer } from '@/components/intelligence/IntelligenceCodeAnalyzer';
import { ModuleRayBrief } from '@/components/ray/ModuleRayBrief';
import { HowIProtectYouCard } from '@/components/ray/HowIProtectYouCard';

export default function IntelligenceScripts() {
  return (
    <div className="space-y-6">
      <ModuleRayBrief
        eventPatterns={['event_type.ilike.script%', 'event_type.ilike.powershell%', 'event_type.ilike.analysis%']}
        idleLines={[
          "I haven't analyzed any scripts for you recently.",
          'Paste a PowerShell, Bash, or Python snippet and I\u2019ll explain what it does before you run it.',
        ]}
        composer={({ events }) => {
          const runs = events.filter((e) => /script|powershell|analysis/i.test(e.event_type)).length;
          const risky = events.filter((e) => /risky|malicious|suspicious/i.test(e.event_type + ' ' + (e.summary ?? ''))).length;
          const lines: string[] = [];
          lines.push(runs === 1 ? 'I analyzed 1 script for you recently.' : `I analyzed ${runs} scripts for you recently.`);
          if (risky > 0) {
            lines.push(risky === 1 ? '1 looked risky — I flagged it.' : `${risky} looked risky — I flagged them.`);
          } else {
            lines.push('None of them contained anything concerning.');
          }
          return { lines, tone: risky > 0 ? 'warn' : 'ok' };
        }}
      />

      <IntelligenceCodeAnalyzer mode="script" />

      <HowIProtectYouCard
        title="While you work…"
        lines={[
          "I'm explaining every script you hand me in plain language.",
          "I'm calling out obfuscation, destructive commands, and network callouts.",
          "If it matches a known pattern from a previous case, I'll tell you.",
        ]}
      />
    </div>
  );
}
