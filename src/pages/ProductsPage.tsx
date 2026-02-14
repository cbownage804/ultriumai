import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Wrench, Bot, Code2,
  ArrowRight, Star, CheckCircle2
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const products = [
  {
    id: 'vanguard',
    name: 'Vanguard',
    tagline: 'IT Operations & Security Platform',
    description: 'Enterprise RMM, endpoint security, helpdesk, pentesting, compliance, and AI-powered SOC — unified for MSPs and IT teams.',
    icon: Wrench,
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-500',
    href: '/products/vanguard',
    popular: true,
    capabilities: ['Remote Monitoring & Management', 'XDR & Endpoint Security', 'Helpdesk & Ticketing', 'Penetration Testing', 'Compliance & Documentation', 'AI Intelligence Suite'],
  },
  {
    id: 'safesuite',
    name: 'SafeSuite',
    tagline: 'Personal & Business Security Bundle',
    description: 'Password management, email & URL scanning, dark web monitoring, asset tracking, and an AI security assistant — all in one suite.',
    icon: Shield,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    href: '/safesuite',
    popular: true,
    capabilities: ['Password Vault (SafePass)', 'Email & URL Scanner (SafeScan)', 'Dark Web Monitoring (SafeWeb)', 'Asset Tracking (SafeTrack)', 'AI Security Assistant (SafeAssist)'],
  },
  {
    id: 'ai-studio',
    name: 'AI Studio',
    tagline: 'Build Custom AI Assistants & Apps',
    description: 'Create production-ready AI applications and custom GPTs with a no-code builder, knowledge sources, and team collaboration.',
    icon: Bot,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    textColor: 'text-violet-500',
    href: '/products/ai-studio',
    capabilities: ['App Builder (Chat-to-Code)', 'Custom GPT Builder', 'Knowledge Base Integration', 'Team Collaboration', 'API & Embed Support'],
  },
  {
    id: 'custom-apps',
    name: 'Custom Apps',
    tagline: 'Bespoke AI-Powered Solutions',
    description: 'Work with our team to build tailored AI applications, integrations, and platforms designed specifically for your business needs.',
    icon: Code2,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-500',
    href: '/contact',
    capabilities: ['Custom Development', 'AI Integration', 'White-Label Solutions', 'Dedicated Support'],
  },
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
              Our Products
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Security, IT Operations & AI — Unified
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              From enterprise IT management to personal digital security and custom AI solutions,
              UltriumAI has the tools your organization needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) => (
                <Card key={product.id} className="relative group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {product.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 border-0">Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl ${product.bgColor} flex items-center justify-center mb-4`}>
                      <product.icon className={`h-7 w-7 ${product.textColor}`} />
                    </div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <p className={`text-sm font-medium ${product.textColor}`}>{product.tagline}</p>
                    <CardDescription className="mt-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {product.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${product.textColor}`} />
                          {cap}
                        </li>
                      ))}
                    </ul>
                    <Link to={product.href} className="block pt-2">
                      <Button className={`w-full bg-gradient-to-r ${product.color} text-white`}>
                        {product.id === 'custom-apps' ? 'Get in Touch' : 'Learn More'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
