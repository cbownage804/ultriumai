/**
 * Threats — Managed by Ray.
 * Unified design: no hero artwork, no module logo.
 */
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { ScanApp } from '@/components/apps/SafeScanApp';
import { motion } from 'framer-motion';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { RayPageHeader } from '@/components/ray/RayPageHeader';

export default function WraythScan() {
  return (
    <FeatureGate feature="scan">
      <div className="space-y-6">
        <RayPageHeader
          title="Threats"
          description="AI-powered analysis of files, emails, URLs, and suspicious activity."
        />

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
