import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, Package, HardDrive, Network, Server, 
  ArrowRight, Check, Download,
  BarChart3, Clock, Shield, Zap
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Patch Management',
    description: 'Automated patch deployment with severity-based scheduling and rollback capabilities',
    capabilities: ['Auto-discovery of missing patches', 'Scheduled deployment windows', 'Rollback support', 'Compliance reporting']
  },
  {
    icon: HardDrive,
    title: 'Backup Monitoring',
    description: 'Ensure backup integrity with automated verification and alerting',
    capabilities: ['Backup job tracking', 'Integrity verification', 'Storage analytics', 'Recovery testing']
  },
  {
    icon: Network,
    title: 'Network Topology',
    description: 'Visualize your entire network infrastructure with real-time discovery',
    capabilities: ['Auto-discovery', 'Device mapping', 'Connection tracking', 'Change detection']
  },
  {
    icon: Server,
    title: 'Asset Inventory',
    description: 'Complete IT asset lifecycle management with depreciation tracking',
    capabilities: ['Hardware tracking', 'Software licensing', 'Warranty management', 'Depreciation']
  },
  {
    icon: Wrench,
    title: 'RMM Tools',
    description: 'Remote monitoring and management for all your endpoints',
    capabilities: ['Remote desktop', 'Script execution', 'File transfer', 'Registry editing']
  },
  {
    icon: BarChart3,
    title: 'Executive Dashboard',
    description: 'High-level metrics and KPIs for leadership visibility',
    capabilities: ['Risk scoring', 'Compliance trends', 'Cost analytics', 'SLA tracking']
  }
];

const stats = [
  { label: 'Endpoints Managed', value: '50K+', icon: Server },
  { label: 'Patches Deployed', value: '1M+', icon: Download },
  { label: 'Uptime Guarantee', value: '99.9%', icon: Zap },
  { label: 'Avg Resolution Time', value: '<15min', icon: Clock }
];

const vanguardTiers = [
  {
    name: 'Vanguard Starter',
    price: 30,
    description: 'Essential operations tools',
    features: ['Basic monitoring', 'Asset inventory', 'Alert notifications', 'Up to 50 endpoints'],
    cta: 'Get Started',
    tier: 'starter'
  },
  {
    name: 'Vanguard Professional',
    price: 50,
    description: 'Complete operations suite',
    features: ['Everything in Starter', 'Patch management', 'Backup monitoring', 'Network topology', 'Up to 250 endpoints'],
    cta: 'Get Started',
    popular: true,
    tier: 'professional'
  },
  {
    name: 'Vanguard Enterprise',
    price: 80,
    description: 'Full platform with customizations',
    features: ['Everything in Professional', 'Executive dashboard', 'Custom reports', 'API access', 'Unlimited endpoints'],
    cta: 'Contact Sales',
    tier: 'enterprise'
  }
];

export default function OperationsSuitePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20">
            <Wrench className="h-3 w-3 mr-1" />
            Included with Vanguard Suite
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
            Unified IT Operations & Infrastructure Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Patch management, backup monitoring, asset tracking, and network visibility—all included in Vanguard Suite. 
            Keep your infrastructure running smoothly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500">
                Get Started with Vanguard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
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
            <h2 className="text-3xl font-bold mb-4">Complete IT Operations Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage, monitor, and maintain your IT infrastructure
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-500" />
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
            <h2 className="text-3xl font-bold mb-4">Access Operations Suite via Vanguard</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Operations tools are included in all Vanguard Suite tiers. Choose the plan that fits your MSP needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vanguardTiers.map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? 'border-red-500 shadow-lg shadow-red-500/10' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-red-500">Most Popular</Badge>
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
          <h2 className="text-3xl font-bold mb-4">Streamline Your IT Operations</h2>
          <p className="text-muted-foreground mb-8">
            Start your free 14-day trial with Vanguard Suite. No credit card required.
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
    </div>
  );
}
