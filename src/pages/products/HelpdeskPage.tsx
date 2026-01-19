import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VanguardUpsell } from '@/components/products/VanguardUpsell';
import { 
  MessageSquare, Bot, Users, Clock, Zap, 
  ArrowRight, Check, Brain, BarChart3,
  Target
} from 'lucide-react';
import heroAi from '@/assets/hero-ai.jpg';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Responses',
    description: 'Intelligent ticket triage with automated solution suggestions and confidence scoring',
    capabilities: ['Auto-categorization', 'Smart routing', 'Solution generation', 'Confidence scoring']
  },
  {
    icon: Target,
    title: 'Intelligent Routing',
    description: 'Route tickets to the right technician based on skills, workload, and availability',
    capabilities: ['Skill matching', 'Workload balancing', 'Availability checking', 'Priority handling']
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Support',
    description: 'Accept tickets via email, portal, chat, and API with unified inbox',
    capabilities: ['Email integration', 'Customer portal', 'Live chat', 'API submission']
  },
  {
    icon: Clock,
    title: 'SLA Management',
    description: 'Automated SLA tracking with escalation rules and breach prevention',
    capabilities: ['Response SLAs', 'Resolution SLAs', 'Auto-escalation', 'Breach alerts']
  },
  {
    icon: Brain,
    title: 'Knowledge Base',
    description: 'Self-service knowledge base with AI-powered article suggestions',
    capabilities: ['Article management', 'Auto-suggestions', 'Search analytics', 'Feedback tracking']
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description: 'Comprehensive reporting on ticket trends, technician performance, and satisfaction',
    capabilities: ['Ticket analytics', 'CSAT tracking', 'Performance metrics', 'Custom reports']
  }
];

const stats = [
  { label: 'Avg Resolution', value: '2.5hrs', icon: Clock },
  { label: 'Auto-Resolution Rate', value: '35%', icon: Bot },
  { label: 'Customer Satisfaction', value: '4.8/5', icon: Users },
  { label: 'First Response', value: '<5min', icon: Zap }
];

const pricing = [
  {
    name: 'Helpdesk Starter',
    price: 29,
    description: 'Essential ticketing for small teams',
    features: ['Unlimited tickets', 'Email integration', 'Basic SLAs', '3 agents included'],
    cta: 'Start Free Trial'
  },
  {
    name: 'Helpdesk Pro',
    price: 59,
    description: 'AI-powered helpdesk with automation',
    features: ['Everything in Starter', 'AI responses', 'Smart routing', 'Knowledge base', '10 agents included'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise Helpdesk',
    price: null,
    description: 'Full platform with custom workflows',
    features: ['Everything in Pro', 'Custom workflows', 'SSO/SAML', 'API access', 'Unlimited agents'],
    cta: 'Contact Sales'
  }
];

export default function HelpdeskPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0">
            <img 
              src={heroAi} 
              alt="AI neural network"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          </div>
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <Badge className="mb-4 bg-purple-500/10 text-purple-500 border-purple-500/20">
            <MessageSquare className="h-3 w-3 mr-1" />
            AI Helpdesk
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
            AI-Powered IT Service Desk
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Intelligent ticketing with AI-powered responses, smart routing, and automated resolution. 
            Resolve 35% of tickets automatically.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500">
                Start Free Trial
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
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-purple-500" />
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
            <h2 className="text-3xl font-bold mb-4">Intelligent Service Desk</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              AI-enhanced ticketing that learns from your data to resolve issues faster
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-purple-500" />
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
            <h2 className="text-3xl font-bold mb-4">Per-Agent Pricing</h2>
            <p className="text-muted-foreground">Simple pricing that scales with your team.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <Card key={i} className={`relative ${plan.popular ? 'border-purple-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/agent/mo</span>
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
                    <Button className={`w-full ${plan.popular ? 'bg-purple-500 hover:bg-purple-600' : ''}`}>
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
          currentProduct="AI Helpdesk™" 
          currentProductPrice="$29/agent/mo"
          competitorComparison="47% cheaper than Zendesk, plus get full RMM in Vanguard Enterprise"
        />

        {/* CTA */}
        <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Transform Your IT Support</h2>
          <p className="text-muted-foreground mb-8">
            Start your free 14-day trial. No credit card required.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500">
                Start Free Trial
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