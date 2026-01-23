import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Wrench, MessageSquare, Key, Network, Search,
  ArrowRight, Star, Zap
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const productCategories = [
  {
    id: 'security',
    name: 'Security Suite',
    description: 'Enterprise XDR, SOC, SIEM, and threat intelligence platform',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    href: '/products/security',
    popular: true,
    products: ['Threat Detection', 'SOC Operations', 'Pen Testing', 'SIEM', 'Threat Intel', 'UBA']
  },
  {
    id: 'operations',
    name: 'Operations Suite',
    description: 'IT infrastructure management, patching, and monitoring',
    icon: Wrench,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-500',
    href: '/products/operations',
    products: ['Patch Management', 'Backup Monitoring', 'Asset Inventory', 'Network Topology', 'SafeOps']
  },
  {
    id: 'helpdesk',
    name: 'SafeDesk™',
    description: 'Intelligent ticketing with AI-powered automation',
    icon: MessageSquare,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-500',
    href: '/products/helpdesk',
    products: ['AI Responses', 'Smart Routing', 'SLA Management', 'Knowledge Base', 'Multi-Channel']
  },
  {
    id: 'safesuite',
    name: 'SafeSuite™',
    description: 'Complete security bundle: passwords, scanning, dark web, and assets',
    icon: Shield,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    href: '/safesuite/features',
    popular: true,
    products: ['SafePass', 'SafeScan', 'SafeWeb', 'SafeTrack']
  },
  {
    id: 'safenet',
    name: 'SafeNet™',
    description: 'Network discovery and vulnerability assessment',
    icon: Network,
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-500',
    href: '/products/safenet',
    products: ['Network Scanning', 'Asset Discovery', 'Vulnerability Detection', 'Topology Mapping']
  }
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-background border-b">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Badge className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Product Portfolio
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Complete Security & IT Operations Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Enterprise-grade security, IT operations, and AI helpdesk—unified in one platform.
              Choose individual products or bundle with the Vanguard Suite.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/vanguard/suite">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600">
                  <Zap className="mr-2 h-4 w-4" />
                  View Vanguard Suite
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {productCategories.map((category) => (
                <Card key={category.id} className="relative group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {category.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center mb-4`}>
                      <category.icon className={`h-7 w-7 ${category.textColor}`} />
                    </div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {category.products.map((product, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                    <Link to={category.href} className="block">
                      <Button className={`w-full bg-gradient-to-r ${category.color} text-white`}>
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bundle CTA */}
        <section className="py-20 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-background border-t">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-purple-600 border-0">
              <Zap className="h-3 w-3 mr-1" />
              Best Value
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Bundle Everything with Vanguard Suite</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get all products unified in a single platform with integrated AI SOC, 
              unified dashboard, and significant savings over individual products.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/vanguard/suite">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600">
                  Configure Your Suite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/vanguard/auth">
                <Button size="lg" variant="outline">
                  Start Free Trial
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