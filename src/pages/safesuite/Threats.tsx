/**
 * Threats — Managed by Ray.
 * Unified design: no hero artwork, no module logo.
 */
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { ScanApp } from '@/components/apps/SafeScanApp';
import { motion } from 'framer-motion';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayActivityTicker } from '@/components/ray/RayActivityTicker';
import { RayContextBridge } from '@/components/ray/RayContextBridge';
import { ThreatScanInput } from '@/components/ray/ThreatScanInput';

export default function WraythScan() {
  return (
    <FeatureGate feature="scan">
      <div className="space-y-6">
        <RayPageHeader
          title="Threat Center"
          question="Got something suspicious? Send it to me and I'll take a look."
          description="Paste a URL, drop a file, forward an email — I'll tell you plainly whether it's safe, and whether it touches anything you actually use."
          explain={{
            title: 'How Ray decides what is a threat',
            bullets: [
              'Files and URLs are scored by known-malware signatures, reputation feeds, and heuristic analysis.',
              'Emails are checked for phishing patterns, spoofed senders, and suspicious links.',
              'Ray always tells you plainly: safe, suspicious, or malicious — never just a raw score.',
            ],
          }}
        />

        <div className="wrayth-chamfer border border-border bg-card/60 px-4 py-3">
          <RayActivityTicker context="threats" />
        </div>

        <RayContextBridge
          headline="I identify suspicious files, links, and emails instantly."
          knows="Open your vault and I'll also tell you whether they threaten any of your actual accounts, passwords, or devices — so a phishing verdict turns into 'this targets your Microsoft 365, rotate that password first.'"
          needs={['vault']}
          reason="A threat verdict is only useful if I can tell you whether it touches an account you actually use. Unlock so I can cross-reference."
          capabilities={[
            'Match phishing URLs to accounts you actually have',
            'Tell you which stored credentials a stealer would take',
            'Flag CVEs against browsers and apps your vault syncs with',
            'Prioritize rotations by real blast radius',
          ]}
          confidence={72}
        />

        <ThreatAllClearCard />

        <ThreatScanInput />

        <RayConversationCard context="threats" />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ScanApp isWhiteLabeled={false} brandName="Wrayth" hideHeader={true} />
        </motion.div>
      </div>
    </FeatureGate>
  );
}
