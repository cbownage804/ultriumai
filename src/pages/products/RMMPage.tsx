import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, Shield, Clock, Zap, 
  ArrowRight, Check, Terminal, HardDrive, Cpu,
  Download, Settings, Activity
} from 'lucide-react';
import logoSafeops from '@/assets/logos/logo-safeops.png';

const features = [
  {
    icon: Monitor,
    title: 'Remote Monitoring',
    description: 'Real-time endpoint health monitoring with instant alerting',
    capabilities: ['CPU/Memory tracking', 'Disk monitoring', 'Service status', 'Custom thresholds']
  },
  {
    icon: Terminal,
    title: 'Remote Access',
    description: 'Secure remote desktop and command-line access to endpoints',
    capabilities: ['One-click RDP', 'PowerShell access', 'File transfer', 'Session recording']
  },
  {
    icon: Download,
    title: 'Patch Management',
    description: 'Automated Windows and third-party application patching',
    capabilities: ['Auto-scheduling', 'Approval workflows', 'Rollback support', 'Compliance reports']
  },
  {
    icon: Settings,
    title: 'Script Automation',
    description: 'Execute PowerShell and batch scripts across all endpoints',
    capabilities: ['Script library', 'Scheduled tasks', 'Output logging', 'Error handling']
  },
  {
    icon: HardDrive,
    title: 'Asset Inventory',
    description: 'Automatic hardware and software inventory collection',
    capabilities: ['Hardware specs', 'Software licenses', 'Change tracking', 'Export reports']
  },
  {
    icon: Activity,
    title: 'Performance Analytics',
    description: 'Historical performance data and trend analysis',
    capabilities: ['30-day history', 'Trend charts', 'Anomaly detection', 'Capacity planning']
  }
];

const stats = [
  { label: 'Avg Response Time', value: '<100ms', icon: Zap },
  { label: 'Uptime SLA', value: '99.9%', icon: Shield },
  { label: 'Endpoints Managed', value: '50K+', icon: Cpu },
  { label: 'Scripts in Library', value: '200+', icon: Terminal }
];

const vanguardTiers = [
  {
    name: 'Vanguard Starter',
    price: 30,
    description: 'Core security with basic RMM',
    features: ['Basic endpoint monitoring', 'Alert notifications', 'Asset inventory', 'Up to 50 endpoints'],
    cta: 'Get Started',
    tier: 'starter'
  },
  {
    name: 'Vanguard Professional',
    price: 50,
    description: 'Full SafeOps RMM capabilities',
    features: ['Everything in Starter', 'Remote access & scripting', 'Patch management', 'SafeDesk helpdesk', 'Up to 250 endpoints'],
    cta: 'Get Started',
    popular: true,
    tier: 'professional'
  },
  {
    name: 'Vanguard Enterprise',
    price: 80,
    description: 'Complete MSP platform',
    features: ['Everything in Professional', 'AI-powered automation', 'Custom integrations', 'White-label options', 'Unlimited endpoints'],
    cta: 'Contact Sales',
    tier: 'enterprise'
  }
];

export default function RMMPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero with Logo */}
        <section className="relative overflow-hidden border-b bg-[#000000]">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10" />
          <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
            {/* Logo Display */}
            <div className="flex justify-center mb-8">
              <div className="bg-black px-12 py-6 rounded-xl shadow-[0_0_60px_rgba(34,197,94,0.3)] border border-green-500/20">
                <img 
                  src={logoSafeops} 
                  alt="SafeOps Logo"
                  className="h-28 w-auto"
                />
              </div>
            </div>
            
            <div className="text-center">
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                <Monitor className="h-3 w-3 mr-1" />
                Included with Vanguard Suite
              </Badge>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Enterprise endpoint management included with Vanguard Suite. Monitor, patch, and automate 
                across your entire fleet with a single unified platform.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/vanguard/auth">
                  <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    Get Started with Vanguard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/demos/rmm">
                  <Button size="lg" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10">
                    Try Live Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-b bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Endpoint Management</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to monitor, manage, and secure your endpoints
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-green-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.capabilities.map((cap, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Access via Vanguard */}
        <section className="py-20 bg-muted/30 border-y">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20">
                Part of Vanguard Suite
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Access SafeOps via Vanguard</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                SafeOps is included in all Vanguard Suite tiers. Choose the plan that fits your MSP needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vanguardTiers.map((plan, i) => (
                <Card key={i} className={`relative ${plan.popular ? 'border-red-500 shadow-lg shadow-red-500/10' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-red-500">Recommended</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/user/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.tier === 'enterprise' ? '/contact' : '/vanguard/auth'} className="block">
                      <Button className={`w-full ${plan.popular ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-muted-foreground mb-8">
              Deploy agents and start monitoring endpoints in under 5 minutes with Vanguard Suite.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/vanguard/auth">
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500">
                  Get Started with Vanguard
                </Button>
              </Link>
              <Link to="/vanguard/suite">
                <Button size="lg" variant="outline">
                  View Full Suite
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
