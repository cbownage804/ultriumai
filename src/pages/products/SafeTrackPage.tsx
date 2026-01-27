import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  Package, QrCode, Calendar, DollarSign, 
  ArrowRight, Check, Laptop, History, FileText,
  BarChart3, Warehouse, Users, Clock, AlertTriangle,
  Truck, MapPin, Wrench, Shield, Smartphone, Cloud,
  RefreshCw, Search, Download, Play
} from 'lucide-react';
import heroTrack from '@/assets/hero-track.jpg';
import screenshotSafetrack from '@/assets/screenshot-safetrack.jpg';
import { safeSuiteProducts } from '@/components/safesuite/SafeSuiteProductIcons';
import { ProductDemoWrapper } from '@/components/demos/ProductDemoWrapper';
import { SafeTrackDemo } from '@/components/demos/SafeTrackDemo';

const features = [
  {
    icon: Laptop,
    title: 'Hardware Inventory',
    description: 'Track all physical IT assets including computers, monitors, peripherals, and network equipment',
    capabilities: ['Auto-discovery via agent', 'Serial number tracking', 'Warranty management', 'Specification details']
  },
  {
    icon: Cloud,
    title: 'Software Licensing',
    description: 'Manage software licenses, subscriptions, and compliance across your organization',
    capabilities: ['License compliance', 'Renewal tracking', 'Usage monitoring', 'Cost optimization']
  },
  {
    icon: QrCode,
    title: 'QR Code & Barcode',
    description: 'Generate and scan codes for instant asset identification in the field',
    capabilities: ['Auto-generation', 'Mobile app scanning', 'Print-ready labels', 'Bulk operations']
  },
  {
    icon: History,
    title: 'Full Audit Trail',
    description: 'Complete history of every asset change, assignment, and maintenance event',
    capabilities: ['Change tracking', 'User attribution', 'Date/time stamps', 'Export to PDF']
  },
  {
    icon: DollarSign,
    title: 'Depreciation & Finance',
    description: 'Automatic depreciation calculations with multiple accounting methods',
    capabilities: ['Straight-line', 'Declining balance', 'Sum-of-years', 'Custom schedules']
  },
  {
    icon: Wrench,
    title: 'Maintenance Management',
    description: 'Schedule and track preventive maintenance to extend asset life',
    capabilities: ['Recurring schedules', 'Vendor integration', 'Cost tracking', 'Downtime logging']
  }
];

const useCases = [
  {
    icon: Warehouse,
    title: 'IT Departments',
    description: 'Track all hardware, software, and equipment assignments. Know what you have, where it is, and who has it.',
  },
  {
    icon: Users,
    title: 'MSPs & IT Providers',
    description: 'Manage assets across multiple client sites. Bill accurately for equipment and track deployments.',
  },
  {
    icon: Truck,
    title: 'Field Service Teams',
    description: 'Mobile access to asset info. Scan QR codes on-site to pull up specs, history, and documentation.',
  },
  {
    icon: Shield,
    title: 'Compliance & Audits',
    description: 'Generate reports for ITAM audits. Track software licensing compliance and hardware lifecycles.',
  },
];

const integrations = [
  { name: 'Vanguard RMM', description: 'Auto-sync assets from managed endpoints' },
  { name: 'Helpdesk', description: 'Link tickets to assets automatically' },
  { name: 'Active Directory', description: 'Import users and computer objects' },
  { name: 'CSV/Excel', description: 'Bulk import and export capabilities' },
  { name: 'REST API', description: 'Custom integrations via API' },
  { name: 'Webhooks', description: 'Real-time event notifications' },
];

const stats = [
  { label: 'Asset Types', value: '50+', icon: Package },
  { label: 'Depreciation Methods', value: '5', icon: DollarSign },
  { label: 'Time Saved', value: '10hrs/wk', icon: Clock },
  { label: 'Audit Ready', value: '100%', icon: FileText }
];

const comparisonTable = [
  { feature: 'Asset Tracking', safetrack: true, assetpanda: true, snipeit: true },
  { feature: 'QR/Barcode Scanning', safetrack: true, assetpanda: true, snipeit: true },
  { feature: 'Depreciation Tracking', safetrack: true, assetpanda: true, snipeit: false },
  { feature: 'Maintenance Scheduling', safetrack: true, assetpanda: true, snipeit: false },
  { feature: 'RMM Integration', safetrack: true, assetpanda: false, snipeit: false },
  { feature: 'Helpdesk Integration', safetrack: true, assetpanda: false, snipeit: false },
  { feature: 'Multi-tenant/MSP', safetrack: true, assetpanda: true, snipeit: false },
  { feature: 'Access Via', safetrack: 'SafeSuite/Vanguard', assetpanda: 'Standalone only', snipeit: 'Self-hosted' },
];

// SafeTrack is available only through SafeSuite tiers or Vanguard for business

export default function SafeTrackPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroTrack} 
              alt="IT Asset Management"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          </div>
          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/20">
              <Package className="h-3 w-3 mr-1" />
              IT Asset Management
            </Badge>
            <div className="flex justify-start mb-8">
              <div className="px-8 py-4 bg-black rounded-2xl shadow-2xl shadow-orange-500/20 animate-fade-in">
                <img 
                  src={safeSuiteProducts.safetrack.logo} 
                  alt="SafeTrack" 
                  className="h-24 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              Complete IT asset lifecycle management. Track hardware, software, and 
              licenses from procurement to retirement with automatic depreciation and full audit trails.
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
                  <Smartphone className="mr-2 h-4 w-4" />
                  Try Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
                <Play className="h-3 w-3 mr-1" />
                Interactive Demo
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Try SafeTrack Live</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Experience the full asset management platform with sample data
              </p>
            </div>
            <ProductDemoWrapper
              productName="SafeTrack Asset Management"
              productColor="orange"
              compactMode
              compactHeight="h-[650px]"
              fullDemoPath="/vanguard/assets"
              description="Complete IT asset lifecycle management"
            >
              <SafeTrackDemo compactMode />
            </ProductDemoWrapper>
          </div>
        </section>

        {/* Screenshot Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See SafeTrack in Action</h2>
              <p className="text-muted-foreground">Complete asset lifecycle management</p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 border border-emerald-500/20">
              <img 
                src={screenshotSafetrack} 
                alt="SafeTrack Dashboard" 
                className="w-full h-auto"
              />
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
              <h2 className="text-3xl font-bold mb-4">Complete Asset Lifecycle Management</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage IT assets from purchase to retirement
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1 border-orange-500/10 hover:border-orange-500/30 group">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-7 w-7 text-orange-500" />
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

        {/* Use Cases */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Built for Every Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're an IT department, MSP, or field service team, SafeTrack adapts to your workflow
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                      <useCase.icon className="h-7 w-7 text-orange-500" />
                    </div>
                    <h3 className="font-semibold mb-2">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="secondary">
                <RefreshCw className="h-3 w-3 mr-1" />
                Integrations
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Connects to Your Stack</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Seamlessly integrates with Vanguard RMM, Helpdesk, and your existing tools
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {integrations.map((int, i) => (
                <Card key={i} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-1">{int.name}</h4>
                    <p className="text-xs text-muted-foreground">{int.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
              <p className="text-muted-foreground">
                See how SafeTrack stacks up against other IT asset management solutions
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-center p-4 font-semibold text-orange-500">SafeTrack</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground">Asset Panda</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground">Snipe-IT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonTable.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-4">{row.feature}</td>
                          <td className="text-center p-4">
                            {typeof row.safetrack === 'boolean' ? (
                              row.safetrack ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="font-semibold text-orange-500">{row.safetrack}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {typeof row.assetpanda === 'boolean' ? (
                              row.assetpanda ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-muted-foreground">{row.assetpanda}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {typeof row.snipeit === 'boolean' ? (
                              row.snipeit ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-muted-foreground">{row.snipeit}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available Through Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Get SafeTrack</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                SafeTrack is included in SafeSuite Business, or Vanguard for MSP/Enterprise
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* SafeSuite Option */}
              <Card className="relative border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500">SMB Teams</Badge>
                  <div className="mx-auto mb-4 w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl">SafeSuite Business</CardTitle>
                  <CardDescription className="text-base">
                    Complete security suite for small business teams
                  </CardDescription>
                  <div className="text-3xl font-bold text-primary mt-4">
                    $15<span className="text-sm font-normal text-muted-foreground">/user/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeTrack with unlimited assets</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafePass team password sharing</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeScan unlimited scans</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeWeb dark web monitoring</span>
                    </li>
                  </ul>
                  <Link to="/safesuite">
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                      View SafeSuite Plans
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Vanguard Option */}
              <Card className="relative border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500">MSP & Enterprise</Badge>
                  <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-cyan-500" />
                  </div>
                  <CardTitle className="text-2xl">Vanguard Suite</CardTitle>
                  <CardDescription className="text-base">
                    Full IT operations platform for managed service providers
                  </CardDescription>
                  <div className="text-3xl font-bold text-primary mt-4">
                    Custom<span className="text-sm font-normal text-muted-foreground"> pricing</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>SafeTrack with RMM integration</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>Multi-tenant asset management</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>AI-powered helpdesk</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>Client billing integration</span>
                    </li>
                  </ul>
                  <Link to="/vanguard">
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                      Explore Vanguard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Card className="p-8 bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/20">
              <CardContent className="pt-0">
                <Search className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">Know What You Own</h2>
                <p className="text-muted-foreground mb-8">
                  Stop losing track of IT assets. Start your free trial and import your first 100 assets in minutes.
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
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}