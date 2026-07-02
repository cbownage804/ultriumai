import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Minus,
  Shield,
  Zap,
  Building2,
  Crown,
  Lock,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import WraythNav from '@/components/safesuite/SafeSuiteNav';
import { FAQSchema } from '@/components/seo/FAQSchema';

interface PlanCard {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  featured?: boolean;
  features: string[];
  usage: string[];
  cta: { label: string; to: string };
  ctaVariant?: 'default' | 'outline';
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    icon: Shield,
    tagline: 'Meet Ray. Start protecting yourself in minutes.',
    price: '$0',
    badge: 'Free Forever',
    features: [
      'Ray secures your passwords in a zero-knowledge vault',
      'Ray scans links and files on demand',
      'Ray watches the dark web for your email',
      'Ray answers security questions in chat',
      'Browser extension included',
    ],
    usage: ['25 vault items', '5 scans / month', '25 Ray conversations / month'],
    cta: { label: 'Start Free', to: '/auth?mode=signup' },
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    tagline: 'Ray, fully unlocked for power users.',
    price: '$12',
    priceSuffix: '/mo',
    features: [
      'Ray secures unlimited passwords',
      'Ray monitors your identity everywhere',
      'Ray keeps your passwords healthy and rotates them',
      'Ray explains every threat in plain English',
      'Ray watches historical breach intelligence',
      'Ray talks back — voice conversations',
    ],
    usage: ['100 scans / month', '100 Ray conversations / month', '2 min Ray Voice / month'],
    cta: { label: 'Start Pro', to: '/auth?mode=signup&plan=pro' },
    ctaVariant: 'outline',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    tagline: 'One AI security teammate for your whole team.',
    price: '$24',
    priceSuffix: '/user/mo',
    badge: 'Most Popular · Best for Teams',
    featured: true,
    features: [
      'Everything in Pro, for every seat',
      'Ray manages shared team vaults',
      'Ray enforces roles and permissions',
      'Ray keeps a full audit trail',
      'Ray monitors threats across your team',
      'White-label branding',
    ],
    usage: ['500 scans / month', '250 Ray conversations / month', 'Up to 20 team members'],
    cta: { label: 'Start Business', to: '/auth?mode=signup&plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    tagline: 'Built for enterprises, MSPs, governments, and regulated industries.',
    price: 'Custom',
    badge: 'Enterprise',
    features: [
      'Everything in Business',
      'Ray integrates with SSO / SCIM (Entra, Okta)',
      'Ray operates across MSP multi-tenant portals',
      'Ray generates compliance reports (SOC 2, HIPAA)',
      'Dedicated onboarding & priority SLAs',
      'API access & custom integrations',
    ],
    usage: ['500+, 1000+, or unlimited seats', 'Custom scan & Ray capacity', 'Dedicated success manager'],
    cta: { label: 'Contact Sales', to: '/contact?interest=enterprise' },
    ctaVariant: 'outline',
  },
];

type Cell = boolean | string;

const COMPARISON: { category: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    category: 'Core Platform',
    rows: [
      { label: 'Password Vault', values: ['25 items', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Threat Scans', values: ['5 / mo', '100 / mo', '500 / mo', 'Custom'] },
      { label: 'Dark Web Monitoring', values: ['Basic', true, true, true] },
      { label: 'Identity Monitoring', values: [false, true, true, true] },
      { label: 'Browser Extension', values: [true, true, true, true] },
    ],
  },
  {
    category: 'Ray AI',
    rows: [
      { label: 'Ray AI Assistant', values: [true, true, true, true] },
      { label: 'AI Threat Explanations', values: [false, true, true, true] },
      { label: 'Ray Voice', values: [false, true, true, 'Custom'] },
      { label: 'Ray Conversations', values: ['25 / mo', '100 / mo', '250 / mo', 'Custom'] },
    ],
  },
  {
    category: 'Teams & Organizations',
    rows: [
      { label: 'Shared Vaults', values: [false, false, true, true] },
      { label: 'Organization Management', values: [false, false, true, true] },
      { label: 'Role-Based Access', values: [false, false, true, true] },
      { label: 'Audit Logs', values: [false, false, true, true] },
      { label: 'White-Label Branding', values: [false, false, true, true] },
    ],
  },
  {
    category: 'Enterprise',
    rows: [
      { label: 'SSO / SCIM', values: [false, false, false, true] },
      { label: 'MSP Multi-Tenant Portal', values: [false, false, false, true] },
      { label: 'Compliance Reports', values: [false, false, false, true] },
      { label: 'API Access', values: [false, false, false, true] },
      { label: 'Custom Integrations', values: [false, false, false, true] },
      { label: 'Dedicated Support', values: [false, false, false, true] },
    ],
  },
];

const FAQS = [
  {
    question: 'Can I upgrade later?',
    answer:
      'Yes. You can upgrade or downgrade at any time from your billing settings. Upgrades are prorated instantly, and downgrades take effect at the end of your billing cycle.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. There are no long-term contracts on Pro or Business. Cancel from your billing portal and you keep access through the end of your paid period.',
  },
  {
    question: 'How is my data encrypted?',
    answer:
      'Wrayth uses zero-knowledge, device-local encryption. Your vault is encrypted with a key derived from your master password using PBKDF2 (600,000 iterations). We never see your data — not your passwords, not your notes, not your keys.',
  },
  {
    question: 'What happens if I exceed my scan limit?',
    answer:
      'Ray will let you know and pause additional scans until the next billing cycle. You can upgrade instantly to unlock more capacity — no interruptions to your saved data or monitoring.',
  },
  {
    question: 'Do you offer student or nonprofit discounts?',
    answer:
      'Yes. We offer 50% off Pro for verified students and qualifying nonprofits. Contact support@wrayth.com from your institutional email to get started.',
  },
  {
    question: 'How does Business differ from Enterprise?',
    answer:
      'Business is designed for teams up to ~20 people who need shared vaults, RBAC, and audit logs. Enterprise adds SSO/SCIM, multi-tenant MSP capabilities, compliance reporting, API access, and dedicated onboarding — built for organizations with hundreds or thousands of users.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer:
      'The Free plan is available forever with no time limit. For Pro and Business, we offer a 14-day money-back guarantee on your first subscription.',
  },
];

const TRUST_LINE = [
  { icon: Lock, label: 'Zero-Knowledge Encryption' },
  { icon: Sparkles, label: 'AI-Powered Protection' },
  { icon: Globe, label: 'Cross-Platform' },
];

const BUILT_WITH = [
  'AES-256',
  'PBKDF2 (600k)',
  'WebAuthn',
  'Passkeys',
  'Zero Knowledge',
  'MITRE ATT&CK',
  'HIBP',
  'Dark Web Intel',
];

function CellIcon({ value }: { value: Cell }) {
  if (value === true) return <Check className="h-4 w-4 text-primary mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function WraythPricing() {
  return (
    <div className="min-h-screen bg-background">
      <FAQSchema faqs={FAQS} />
      <WraythNav />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-10">
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="mb-4">Pricing</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Protection that grows with you
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            Every plan includes Vault, Scan, Watch, and Ray — your AI security teammate.
            Upgrade as your security needs expand.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {TRUST_LINE.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={
                  plan.featured
                    ? 'border-primary/70 shadow-2xl shadow-primary/20 ring-1 ring-primary/40 relative flex flex-col lg:scale-[1.03] bg-gradient-to-b from-primary/[0.06] to-transparent'
                    : 'relative flex flex-col'
                }
              >
                <CardHeader className="pb-3">
                  {plan.badge && (
                    <Badge
                      variant={plan.featured ? 'default' : 'secondary'}
                      className="w-fit mb-2"
                    >
                      {plan.badge}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${plan.featured ? 'text-primary' : 'text-muted-foreground'}`} />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="border-t border-border/50 pt-4">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                      Usage
                    </p>
                    <ul className="space-y-0.5">
                      {plan.usage.map((u, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      asChild
                      className="w-full"
                      variant={plan.ctaVariant ?? (plan.featured ? 'default' : 'outline')}
                    >
                      <Link to={plan.cta.to}>{plan.cta.label}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Built with */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {BUILT_WITH.map((tech) => (
              <span
                key={tech}
                className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare every feature</h2>
          <p className="text-muted-foreground">
            The full picture of what's included in each plan.
          </p>
        </div>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-background">
              <tr>
                <th className="text-left py-4 px-4 font-medium text-sm w-1/3">Feature</th>
                {['Free', 'Pro', 'Business', 'Enterprise'].map((name) => (
                  <th
                    key={name}
                    className={`text-center py-4 px-4 font-semibold text-sm ${
                      name === 'Business' ? 'text-primary' : ''
                    }`}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <>
                  <tr key={section.category}>
                    <td
                      colSpan={5}
                      className="bg-muted/60 py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border"
                    >
                      {section.category}
                    </td>
                  </tr>
                  {section.rows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    >
                      <td className="py-3 px-4 text-sm">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className={`py-3 px-4 text-center text-sm ${
                            i === 2 ? 'bg-primary/[0.04]' : ''
                          }`}
                        >
                          <CellIcon value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground">
              Everything you need to know before you upgrade.
            </p>
          </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to meet Ray?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Put an AI security teammate on your side — watching your vault, your identity,
            and the dark web, 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/auth?mode=signup">Start Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact?interest=demo">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
