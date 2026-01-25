/**
 * SafeSuite Track - Asset Management within SafeSuite
 */

import { useState } from 'react';
import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { Package, BarChart3, Shield, Laptop, Server, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedHeader, AnimatedStatsCard } from '@/components/safesuite/SafeSuiteEffects';
import safetrackLogo from '@/assets/safetrack-logo.png';
import heroSafetrackBg from '@/assets/hero-safetrack-bg.jpg';
import WarrantyLookup from '@/components/safetrack/WarrantyLookup';
import { AssetManagement } from '@/components/assets/AssetManagement';

export default function SafeSuiteTrack() {
  const [activeTab, setActiveTab] = useState('assets');

  const features = [
    { icon: <Laptop className="h-5 w-5" />, label: 'Hardware Tracking', desc: 'Monitor all devices' },
    { icon: <Server className="h-5 w-5" />, label: 'Software Licenses', desc: 'Track subscriptions' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Depreciation', desc: 'Calculate asset value' },
    { icon: <Shield className="h-5 w-5" />, label: 'Warranty Alerts', desc: 'Never miss renewals' },
  ];

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
          <UsageLimitBanner feature="safetrack" />
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#141414] border border-emerald-500/10">
            <TabsTrigger value="assets" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Package className="h-4 w-4 mr-2" />
              Asset Manager
            </TabsTrigger>
            <TabsTrigger value="warranty" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <FileSearch className="h-4 w-4 mr-2" />
              Warranty Lookup
            </TabsTrigger>
          </TabsList>

          {/* Asset Management Tab - Now embedded directly */}
          <TabsContent value="assets" className="mt-6">
            <AssetManagement />
          </TabsContent>

          {/* Warranty Lookup Tab */}
          <TabsContent value="warranty" className="mt-6">
            <WarrantyLookup />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </FeatureGate>
  );
}
