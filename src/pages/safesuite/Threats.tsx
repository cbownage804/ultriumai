/**
 * Threats — Managed by Ray.
 * Built on RayPageTemplate for consistency with every other module.
 */
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { ScanApp } from '@/components/apps/SafeScanApp';
import { motion } from 'framer-motion';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayActivityTicker } from '@/components/ray/RayActivityTicker';
import { RayContextBridge } from '@/components/ray/RayContextBridge';
import { ThreatScanInput } from '@/components/ray/ThreatScanInput';
import { ThreatAllClearCard } from '@/components/ray/ThreatAllClearCard';
import { ThreatsRayBrief } from '@/components/ray/ThreatsRayBrief';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';

export default function WraythScan() {
  return (
    <FeatureGate feature="scan">
      <RayPageTemplate
        header={
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
        }
        brief={<ThreatsRayBrief />}
        sinceLines={[
          { label: 'No active threats require your attention' },
          { label: 'Reputation feeds refreshed' },
          { label: 'Inbound submissions triaged' },
        ]}
        protectLines={[
          "I'm still watching incoming files and URLs as you submit them.",
          'I keep phishing patterns and malware signatures updated in the background.',
          "If anything comes back malicious, I'll surface it here and interrupt you if it's serious.",
        ]}
      >
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
      </RayPageTemplate>
    </FeatureGate>
  );
}
