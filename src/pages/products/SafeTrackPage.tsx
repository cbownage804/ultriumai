import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, QrCode, Calendar, DollarSign, 
  ArrowRight, Check, Laptop, History, FileText,
  BarChart3, MapPin, AlertTriangle
} from 'lucide-react';

const features = [
  {
    icon: Laptop,
    title: 'Asset Inventory',
    description: 'Complete hardware and software tracking across your organization',
    capabilities: ['Auto-discovery', 'Manual entry', 'Bulk import', 'Custom fields']
  },
  {
    icon: QrCode,
    title: 'QR Code Tracking',
    description: 'Generate and scan QR codes for quick asset identification',
    capabilities: ['Auto-generation', 'Mobile scanning', 'Print labels', 'Quick lookup']
  },
  {
    icon: History,
    title: 'Lifecycle Management',
    description: 'Track assets from procurement to retirement',
    capabilities: ['Purchase tracking', 'Assignment history', 'Maintenance logs', 'Retirement workflow']
  },
  {
    icon: DollarSign,
    title: 'Depreciation Tracking',
    description: 'Automatic depreciation calculations for financial reporting',
    capabilities: ['Multiple methods', 'Schedule updates', 'Financial reports', 'Tax compliance']
  },
  {
    icon: Calendar,
    title: 'Maintenance Scheduling',
    description: 'Schedule and track preventive maintenance activities',
    capabilities: ['Recurring tasks', 'Reminders', 'Vendor tracking', 'Cost tracking']
  },
  {
    icon: BarChart3,
    title: 'Reporting & Analytics',
    description: 'Comprehensive reports on asset utilization and costs',
    capabilities: ['Asset utilization', 'Cost analysis', 'Warranty status', 'Custom reports']
  }
];

const stats = [
  { label: 'Asset Types', value: '50+', icon: Package },
  { label: 'Depreciation Methods', value: '5', icon: DollarSign },
  { label: 'Time Saved', value: '10hrs/wk', icon: Calendar },
  { label: 'Cost Visibility', value: '100%', icon: BarChart3 }
];

const pricing = [
  {
    name: 'SafeTrack Starter',
    price: 2,
    description: 'Essential asset tracking',
    features: ['Up to 500 assets', 'QR code generation', 'Basic reports', 'Email support'],
    cta: 'Start Free Trial'
  },
  {
    name: 'SafeTrack Pro',
    price: 3,
    description: 'Full lifecycle management',
    features: ['Unlimited assets', 'Depreciation tracking', 'Maintenance scheduling', 'API access', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'SafeTrack Enterprise',
    price: null,
    description: 'Multi-location with integrations',
    features: ['Everything in Pro', 'Multi-location', 'Custom integrations', 'SSO/SAML', 'Dedicated success manager'],
    cta: 'Contact Sales'
  }
];

export default function SafeTrackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 py-20 relative">
            <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
              <Package className="h-3 w-3 mr-1" />
              IT Asset Management
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
              SafeTrack™
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              Complete IT asset lifecycle management. Track hardware, software, and 
              licenses from procurement to retirement with automatic depreciation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/vanguard/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/vanguard/assets">
                <Button size="lg" variant="outline">
                  Try Live Demo
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
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-orange-500" />
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
              <h2 className="text-3xl font-bold mb-4">Complete Asset Lifecycle</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage IT assets from purchase to retirement
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.capabilities.map((cap, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-orange-500" />
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
              <h2 className="text-3xl font-bold mb-4">Per-Asset Pricing</h2>
              <p className="text-muted-foreground">Pay only for what you track. No hidden fees.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricing.map((plan, i) => (
                <Card key={i} className={`relative ${plan.popular ? 'border-orange-500 shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-orange-500">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      {plan.price ? (
                        <>
                          <span className="text-4xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/asset/mo</span>
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
                          <Check className="h-4 w-4 text-orange-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.price ? '/vanguard/auth' : '/contact'} className="block">
                      <Button className={`w-full ${plan.popular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}>
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
            <h2 className="text-3xl font-bold mb-4">Take Control of Your Assets</h2>
            <p className="text-muted-foreground mb-8">
              Start tracking assets in minutes. Import from spreadsheets or discover automatically.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/vanguard/auth">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500">
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