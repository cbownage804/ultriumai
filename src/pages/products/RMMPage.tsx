import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VanguardUpsell } from '@/components/products/VanguardUpsell';
import { 
  Monitor, Wrench, Shield, Clock, Zap, 
  ArrowRight, Check, Terminal, HardDrive, Cpu,
  Download, RefreshCw, Settings, Activity
} from 'lucide-react';
import logoRmm from '@/assets/logos/logo-rmm.png';

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

const pricing = [
  {
    name: 'RMM',
    price: 3,
    description: 'Full RMM suite with monitoring and automation',
    features: ['Real-time monitoring', 'Remote desktop', 'Patch management', 'Advanced scripting', 'Custom dashboards', 'API access'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'RMM Enterprise',
    price: null,
    description: 'White-label with custom integrations',
    features: ['Everything included', 'White-label branding', 'Custom integrations', 'Dedicated support', 'On-prem option'],
    cta: 'Contact Sales'
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
                  src={logoRmm} 
                  alt="RMM Logo"
                  className="h-28 w-auto"
                />
              </div>
            </div>
            
            <div className="text-center">
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                <Monitor className="h-3 w-3 mr-1" />
                Remote Monitoring & Management
              </Badge>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Enterprise endpoint management at $3/endpoint. Monitor, patch, and automate 
                across your entire fleet with a single unified platform.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/vanguard/auth">
                  <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    Start Free Trial
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

        {/* Pricing */}
        <section className="py-20 bg-muted/30 border-y">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Per-Endpoint Pricing</h2>
              <p className="text-muted-foreground">Simple, transparent pricing. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricing.map((plan, i) => (
                <Card key={i} className={`relative ${plan.popular ? 'border-green-500 shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      {plan.price ? (
                        <>
                          <span className="text-4xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/endpoint/mo</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">Custom Pricing</span>
                      )}
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
                    <Link to={plan.price ? '/vanguard/auth' : '/contact'} className="block">
                      <Button className={`w-full ${plan.popular ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Vanguard Upsell */}
        <VanguardUpsell 
          currentProduct="RMM™" 
          currentProductPrice="$3/endpoint/mo"
          competitorComparison="Compete with Atera & NinjaOne at a fraction of the cost in Vanguard Enterprise"
        />

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-muted-foreground mb-8">
              Deploy agents and start monitoring endpoints in under 5 minutes.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/vanguard/auth">
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/vanguard/suite">
                <Button size="lg" variant="outline">
                  View Vanguard Suite
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