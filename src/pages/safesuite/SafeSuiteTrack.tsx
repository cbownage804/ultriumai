/**
 * SafeSuite Track - Asset Management within SafeSuite
 */

import { useState } from 'react';
import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ArrowRight, BarChart3, Shield, Laptop, Server, FileSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedHeader, GlowContainer, AnimatedStatsCard, StaggerContainer, StaggerItem } from '@/components/safesuite/SafeSuiteEffects';
import safetrackLogo from '@/assets/safetrack-logo.png';
import WarrantyLookup from '@/components/safetrack/WarrantyLookup';

export default function SafeSuiteTrack() {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    { icon: <Laptop className="h-5 w-5" />, label: 'Hardware Tracking', desc: 'Monitor all devices' },
    { icon: <Server className="h-5 w-5" />, label: 'Software Licenses', desc: 'Track subscriptions' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Depreciation', desc: 'Calculate asset value' },
    { icon: <Shield className="h-5 w-5" />, label: 'Warranty Alerts', desc: 'Never miss renewals' },
  ];

  return (
    <FeatureGate feature="safetrack">
      <div className="min-h-screen bg-[#0a0a0a] space-y-6 p-6 -m-6">
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
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Package className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="warranty" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <FileSearch className="h-4 w-4 mr-2" />
              Warranty Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Feature cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, idx) => (
                <AnimatedStatsCard
                  key={feature.label}
                  icon={feature.icon}
                  label={feature.desc}
                  value={feature.label}
                  theme="safetrack"
                  delay={0.1 * idx}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <GlowContainer theme="safetrack" className="p-8">
                <div className="text-center">
                  <motion.div 
                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 w-fit mx-auto mb-6"
                    animate={{ 
                      boxShadow: ['0 0 30px rgba(16,185,129,0.2)', '0 0 50px rgba(16,185,129,0.3)', '0 0 30px rgba(16,185,129,0.2)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                      <Package className="h-16 w-16 text-emerald-400" />
                    </motion.div>
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">Asset Management</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Track hardware, software licenses, and IT inventory across your organization with powerful search and reporting
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link to="/asset-management">
                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-2 shadow-lg shadow-emerald-500/20">
                          Open Asset Manager
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                        onClick={() => setActiveTab('warranty')}
                      >
                        <FileSearch className="h-4 w-4" />
                        Warranty Lookup
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </GlowContainer>
            </motion.div>

            {/* Quick stats preview */}
            <StaggerContainer>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Assets', value: '—', color: 'emerald' },
                  { label: 'Active Warranties', value: '—', color: 'teal' },
                  { label: 'Expiring Soon', value: '—', color: 'yellow' },
                ].map((stat, idx) => (
                  <StaggerItem key={stat.label}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="p-4 rounded-xl bg-[#141414] border border-emerald-500/10"
                    >
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </motion.div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </TabsContent>

          <TabsContent value="warranty" className="mt-6">
            <WarrantyLookup />
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  );
}
