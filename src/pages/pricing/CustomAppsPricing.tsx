import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Code2, Layers, Rocket, Shield, Sparkles, Clock, Users, ArrowRight, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

const tiers = [
  {
    name: 'Starter App',
    description: 'Perfect for MVPs, landing pages, and internal tools',
    startingPrice: '$2,500',
    timeline: '1–2 weeks',
    features: [
      'Up to 5 pages / views',
      'Responsive design (mobile + desktop)',
      'Basic authentication (login/signup)',
      'Up to 2 third-party integrations',
      'Hosted on UltriumAI Cloud',
      '30 days post-launch support',
    ],
    accent: 'from-blue-500 to-cyan-500',
    accentBg: 'bg-blue-500/10 hover:border-blue-500/30',
    icon: Rocket,
  },
  {
    name: 'Business App',
    description: 'Full-featured applications with custom workflows',
    startingPrice: '$7,500',
    timeline: '3–6 weeks',
    popular: true,
    features: [
      'Unlimited pages / views',
      'Custom database schema design',
      'Role-based access control',
      'Dashboard & analytics',
      'Up to 5 third-party integrations',
      'Payment processing (Stripe)',
      'Email / SMS notifications',
      '90 days post-launch support',
    ],
    accent: 'from-primary to-purple-500',
    accentBg: 'bg-primary/10 hover:border-primary/30',
    icon: Layers,
  },
  {
    name: 'Enterprise Platform',
    description: 'Complex multi-tenant platforms and SaaS products',
    startingPrice: 'Custom',
    timeline: '8–16 weeks',
    features: [
      'Multi-tenant architecture',
      'White-label / custom branding',
      'Advanced security & compliance',
      'API development & documentation',
      'SSO / SAML integration',
      'Custom AI/ML features',
      'Dedicated project manager',
      'SLA-backed support & maintenance',
    ],
    accent: 'from-amber-500 to-orange-500',
    accentBg: 'bg-amber-500/10 hover:border-amber-500/30',
    icon: Shield,
  },
];

const process_steps = [
  { step: '01', title: 'Discovery Session', description: 'We learn your goals, users, and requirements in a free consultation.', icon: Phone },
  { step: '02', title: 'Proposal & Design', description: 'You receive a detailed scope, timeline, and interactive wireframes for approval.', icon: Code2 },
  { step: '03', title: 'Build & Iterate', description: 'Weekly demos keep you in the loop. We iterate until it\'s exactly right.', icon: Layers },
  { step: '04', title: 'Launch & Support', description: 'We deploy, monitor, and provide ongoing support so you can focus on growth.', icon: Rocket },
];

export default function CustomAppsPricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Custom App Development Pricing | UltriumAI"
        description="Get a custom web application built by UltriumAI. From MVPs to enterprise platforms, we build fast, secure, and scalable apps."
      />
      <Navigation />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="text-center max-w-4xl mx-auto px-4 mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" /> Custom Development
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            We Build Your App.{' '}
            <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              You Own It.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From idea to production — our team designs, builds, and deploys custom web applications
            tailored to your business. Fast turnaround, transparent pricing, no surprises.
          </p>
        </section>

        {/* Pricing Tiers */}
        <section className="max-w-6xl mx-auto px-4 mb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card
                  key={tier.name}
                  className={`relative border transition-all duration-300 ${tier.accentBg} ${
                    tier.popular ? 'border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]' : 'border-border'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground border-none">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${tier.accent} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl text-foreground">{tier.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="text-3xl font-bold text-foreground">
                        {tier.startingPrice}
                        {tier.startingPrice !== 'Custom' && (
                          <span className="text-sm font-normal text-muted-foreground ml-1">starting</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {tier.timeline}
                      </div>
                    </div>

                    <ul className="space-y-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={tier.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/contact')}
                    >
                      {tier.startingPrice === 'Custom' ? 'Contact Sales' : 'Get a Quote'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Process */}
        <section className="max-w-5xl mx-auto px-4 mb-24">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {process_steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Step {s.step}</div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="max-w-4xl mx-auto px-4 mb-24">
          <Card className="border-border bg-muted/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Built With Modern Tech</h2>
              <p className="text-muted-foreground text-center mb-8">
                Every app is built on a battle-tested, scalable stack.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'React & TypeScript', desc: 'Type-safe, component-driven UI' },
                  { label: 'Supabase', desc: 'Postgres DB, auth, storage, edge functions' },
                  { label: 'Tailwind CSS', desc: 'Responsive, utility-first styling' },
                  { label: 'Stripe', desc: 'Payments, subscriptions, invoicing' },
                  { label: 'Vercel / Cloud', desc: 'Global CDN, instant deploys' },
                  { label: 'AI Integration', desc: 'OpenAI, Gemini, custom models' },
                ].map((t) => (
                  <div key={t.label} className="p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="font-medium text-sm text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-6">
            Schedule a free discovery call and get a detailed proposal within 48 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/contact')}>
              Schedule Free Consultation
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
              Contact Us
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
