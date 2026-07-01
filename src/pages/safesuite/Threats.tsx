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

export default function WraythScan() {
  return (
    <FeatureGate feature="scan">
      <div className="space-y-6">
        <RayPageHeader
          title="Threats"
          question="Got something suspicious? Send it to me and I'll take a look."
          description="I analyze files, emails, URLs, and unusual activity — then tell you plainly whether it's safe."
        />

        <div className="wrayth-chamfer border border-border bg-card/60 px-4 py-3">
          <RayActivityTicker context="threats" />
        </div>

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
