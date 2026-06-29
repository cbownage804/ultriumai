/**
 * Wrayth Track - Asset Management within Wrayth
 */

import { useState } from 'react';
import { FeatureGate, TierLimitInfo } from '@/components/safesuite/SafeSuitePaywall';
import { Package, FileSearch, Package2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedHeader } from '@/components/safesuite/SafeSuiteEffects';
import { TeaserLock } from '@/components/safesuite/TeaserLock';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import safetrackLogo from '@/assets/safetrack-logo.png';
import heroSafetrackBg from '@/assets/hero-safetrack-bg.jpg';
import WarrantyLookup from '@/components/safetrack/WarrantyLookup';
import { AssetManagement } from '@/components/assets/AssetManagement';
import { SoftwareLicenses } from '@/components/safetrack/SoftwareLicenses';

export default function WraythTrack() {
  const [activeTab, setActiveTab] = useState('assets');
  const { isBusiness, loading: subLoading } = useWraythSubscription();

  return (
    <FeatureGate feature="safetrack">
      <div 
        className="min-h-screen space-y-6 p-6 -m-6 relative"
        style={{
          backgroundImage: `url(${heroSafetrackBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatedHeader
            logo={safetrackLogo}
            logoAlt="SafeTrack"
            tagline="Track and manage your IT assets with AI-powered search"
            theme="safetrack"
            badge="Asset Management"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TierLimitInfo feature="safetrack" />
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#141414] border border-emerald-500/10 w-full flex overflow-x-auto touch-pan-x scrollbar-hide">
            <TabsTrigger value="assets" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 touch-target text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="warranty" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 touch-target text-xs sm:text-sm">
              <FileSearch className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Warranty</span>
            </TabsTrigger>
            <TabsTrigger value="software" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 touch-target text-xs sm:text-sm">
              <Package2 className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">Licenses</span>
              {!isBusiness && !subLoading && (
                <Lock className="h-3 w-3 ml-1 text-amber-400 shrink-0" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Asset Management Tab */}
          <TabsContent value="assets" className="mt-6">
            <AssetManagement />
          </TabsContent>

          {/* Warranty Lookup Tab */}
          <TabsContent value="warranty" className="mt-6">
            <WarrantyLookup />
          </TabsContent>

          {/* Software Licenses Tab - Business Only */}
          <TabsContent value="software" className="mt-6">
            {!subLoading && !isBusiness ? (
              <TeaserLock
                feature="team"
                message="Track all your software licenses, subscriptions, and seat usage in one place. Get alerts before renewals and never overpay for unused licenses."
              >
                <div />
              </TeaserLock>
            ) : (
              <SoftwareLicenses />
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </FeatureGate>
  );
}
