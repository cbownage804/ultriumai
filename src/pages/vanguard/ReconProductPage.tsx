import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  Search,
  AlertTriangle,
  Activity,
  FileText,
  Check,
  ArrowRight,
  Cpu,
  Zap,
  Lock,
} from 'lucide-react';
import { VanguardNavigation } from '@/components/vanguard/VanguardNavigation';
import { ReconPricingCards } from '@/components/vanguard/recon/ReconPricingCards';
import { ReconHardwareManagement } from '@/components/vanguard/recon/ReconHardwareManagement';
import { 
  RECON_HARDWARE_TIERS, 
  RECON_SUBSCRIPTION_TIERS,
  formatPrice,
} from '@/config/reconPricing';

const capabilities = [
  {
    icon: Search,
    title: 'Network Discovery',
    description: 'Automatically discover and map all devices on your network with detailed asset inventory.',
  },
  {
    icon: AlertTriangle,
    title: 'Vulnerability Scanning',
    description: 'Continuous CVE detection and risk assessment with prioritized remediation guidance.',
  },
  {
    icon: Activity,
    title: 'Live Traffic Monitoring',
    description: 'Real-time network traffic analysis with protocol detection and bandwidth monitoring.',
  },
  {
    icon: Shield,
    title: 'Threat Detection',
    description: 'AI-powered threat detection with MITRE ATT&CK mapping and automated alerts.',
  },
  {
    icon: FileText,
    title: 'Compliance Reporting',
    description: 'Generate compliance reports for CIS, NIST, and industry-specific frameworks.',
  },
  {
    icon: Lock,
    title: 'Zero-Touch Deployment',
    description: 'Pre-configured units ship ready to use. Just plug in and your network is protected.',
  },
];

const ReconProductPage = () => {
  const basePath = getVanguardBasePath();
  const { user } = useAuth();
  const [selectedHardware, setSelectedHardware] = useState<'lite' | 'pro'>('pro');
  const [selectedSubscription, setSelectedSubscription] = useState<'essential' | 'professional' | 'enterprise'>('professional');
  const [showPurchase, setShowPurchase] = useState(false);

  // Check if user has any recon agents (linux devices)
  const { data: hasReconUnits, isLoading: checkingUnits } = useQuery({
    queryKey: ['has-recon-units', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await supabase
        .from('vanguard_agents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return (count || 0) > 0;
    },
    enabled: !!user,
  });

  const showManagement = user && hasReconUnits && !showPurchase && !checkingUnits;

  if (checkingUnits && user) {
    return (
      <div className="min-h-screen bg-[#050a0a]">
        <VanguardNavigation />
        <div className="md:ml-56 flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a0a]">
      <VanguardNavigation />

      <div className="md:ml-56">
        {showManagement ? (
          <div className="p-6 max-w-7xl mx-auto">
            <ReconHardwareManagement onShowPurchase={() => setShowPurchase(true)} />
          </div>
        ) : (
          <>
            {/* Back to management button if coming from purchase */}
            {showPurchase && (
              <div className="px-6 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowPurchase(false)}
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  ← Back to Hardware Management
                </Button>
              </div>
            )}

            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative max-w-6xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Hardware Security Appliance
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                    Vanguard Recon™
                  </h1>
                  <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                    Enterprise-grade network security in a plug-and-play device. 
                    Continuous vulnerability scanning, threat detection, and compliance monitoring 
                    for your on-premise infrastructure.
                  </p>

                  <div className="flex items-center justify-center gap-4 mb-12">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
                      onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Watch Demo
                    </Button>
                  </div>

                  {/* Hardware Preview */}
                  <div className="relative max-w-md mx-auto">
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex items-center justify-center">
                      <Cpu className="h-24 w-24 text-cyan-500/50" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-500/20 text-cyan-400 text-xs px-4 py-1 rounded-full border border-cyan-500/30">
                      Powered by Raspberry Pi 5
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Capabilities Section */}
            <section className="py-20 px-6 border-t border-gray-800/50">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Complete Network Security Platform
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Everything you need to secure your network infrastructure in one powerful device.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {capabilities.map((cap, index) => (
                    <motion.div
                      key={cap.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/30 transition-colors h-full">
                        <CardHeader>
                          <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                            <cap.icon className="h-6 w-6 text-cyan-500" />
                          </div>
                          <CardTitle className="text-white">{cap.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-gray-400">
                            {cap.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Hardware Tiers */}
            <section className="py-20 px-6 border-t border-gray-800/50 bg-gray-900/30">
              
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Choose Your Hardware
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Select the Recon unit that matches your network size and security needs.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {Object.entries(RECON_HARDWARE_TIERS).map(([key, tier]) => (
                    <Card 
                      key={key}
                      className={`bg-gray-900/50 border-2 transition-all cursor-pointer ${
                        selectedHardware === key 
                          ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                      onClick={() => setSelectedHardware(key as 'lite' | 'pro')}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">{tier.name}</CardTitle>
                          {key === 'pro' && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{tier.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-white">
                          {formatPrice(tier.priceCents)}
                          <span className="text-sm font-normal text-gray-400"> one-time</span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="text-gray-400">
                            <span className="text-white font-medium">{tier.specs.model}</span>
                          </p>
                          <p className="text-gray-400">
                            Up to <span className="text-white font-medium">{tier.specs.maxDevices} devices</span>
                          </p>
                          <p className="text-gray-400">
                            <span className="text-white font-medium">{tier.specs.storage}</span> storage
                          </p>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                          <p className="text-xs text-gray-500 mb-2">Included Features:</p>
                          <ul className="space-y-1">
                            {tier.specs.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                                <Check className="h-3 w-3 text-cyan-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Subscription Pricing */}
            <section id="pricing" className="py-20 px-6 border-t border-gray-800/50">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Choose Your Subscription
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Unlock the full potential of your Recon unit with a subscription plan.
                  </p>
                </div>

                <ReconPricingCards 
                  selectedHardware={selectedHardware}
                  selectedSubscription={selectedSubscription}
                  onSelectSubscription={setSelectedSubscription}
                />
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 border-t border-gray-800/50">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Secure Your Network?
                </h2>
                <p className="text-gray-400 mb-8">
                  Get your Vanguard Recon unit shipped within 48 hours. 
                  Free shipping on all orders.
                </p>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-left">
                      <p className="text-sm text-gray-400">Your Selection</p>
                      <p className="text-xl font-bold text-white">
                        {RECON_HARDWARE_TIERS[selectedHardware].name} + {RECON_SUBSCRIPTION_TIERS[selectedSubscription].name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Total Today</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatPrice(
                          RECON_HARDWARE_TIERS[selectedHardware].priceCents + 
                          RECON_SUBSCRIPTION_TIERS[selectedSubscription].monthlyPriceCents
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        then {formatPrice(RECON_SUBSCRIPTION_TIERS[selectedSubscription].monthlyPriceCents)}/mo
                      </p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
                    asChild
                  >
                    <Link to={`${basePath}/recon/checkout?hardware=${selectedHardware}&subscription=${selectedSubscription}`}>
                      <Zap className="h-4 w-4" />
                      Order Now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <p className="text-xs text-gray-500 mt-4">
                    30-day money-back guarantee • Free shipping • Lifetime security updates
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ReconProductPage;

