/**
 * Wrayth Scan - Security Scanner within Wrayth
 */

import { FeatureGate, TierLimitInfo } from '@/components/safesuite/SafeSuitePaywall';
import { ScanApp } from '@/components/apps/SafeScanApp';
import { motion } from 'framer-motion';
import { AnimatedHeader, GlowContainer } from '@/components/safesuite/SafeSuiteEffects';
import safescanLogo from '@/assets/safescan-logo.png';
import heroSafescanBg from '@/assets/hero-safescan-bg.jpg';

export default function WraythScan() {
  return (
    <FeatureGate feature="safescan">
      <div 
        className="min-h-screen space-y-4 sm:space-y-6 p-4 sm:p-6 -m-4 sm:-m-6 relative safe-area-inset-bottom"
        style={{
          backgroundImage: `url(${heroSafescanBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll'
        }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative z-10 space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedHeader
            logo={safescanLogo}
            logoAlt="Scan"
            tagline="Scan emails, URLs, and documents for security threats"
            theme="safescan"
            badge="Real-time Protection"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TierLimitInfo feature="safescan" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <ScanApp isWhiteLabeled={false} brandName="Wrayth" hideHeader={true} />
        </motion.div>
        </div>
      </div>
    </FeatureGate>
  );
}
