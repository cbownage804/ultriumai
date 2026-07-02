import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Minus } from 'lucide-react';
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
  tagline: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  popular?: boolean;
  headline: string;
  features: string[];
  usage: string[];
  cta: { label: string; to: string };
  ctaVariant?: 'default' | 'outline';
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Personal essentials, forever free.',
    price: '$0',
    badge: 'Free Forever',
    headline: 'Start protecting yourself in minutes.',
    features: [
      'Zero-knowledge Password Vault',
      'Threat Scans for links & files',
      'Basic Dark Web Monitoring',
      'Ray AI Security Assistant',
      'Browser Extension',
    ],
    usage: ['25 vault items', '5 scans / month', '25 Ray conversations / month'],
    cta: { label: 'Get started free', to: '/auth?mode=signup' },
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Advanced protection for power users.',
    price: '$12',
    priceSuffix: '/mo',
    badge: 'Most Popular',
    popular: true,
    headline: 'Everything you need to stay ahead of attackers.',
    features: [
      'Unlimited Password Vault',
      'Identity Monitoring',
      'Dark Web Monitoring',
      'AI Threat Explanations',
      'Password Health & Rotation',
      'Browser Extension',
      'Historical Breach Intelligence',
    ],
    usage: ['100 scans / month', '100 Ray conversations / month', '2 min Ray Voice / month'],
    cta: { label: 'Start Pro', to: '/auth?mode=signup&plan=pro' },
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Complete security for growing teams.',
    price: '$24',
    priceSuffix: '/user/mo',
    badge: 'For Teams',
    headline: 'Bring your whole team under one AI security teammate.',
    features: [
      'Everything in Pro',
      'Shared Team Vaults',
      'Organization Management',
      'Role-Based Access Control',
      'Audit Logs',
      'White-Label Branding',
      'Team Threat Monitoring',
      'Team Dashboard',
    ],
    usage: ['500 scans / month', '250 Ray conversations / month', 'Up to 20 team members'],
    cta: { label: 'Start Business', to: '/auth?mode=signup&plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Maximum security for large organizations.',
    price: 'Custom',
    badge: 'Enterprise',
    headline: 'Custom deployment, dedicated support, tailored to your org.',
    features: [
      'Everything in Business',
      'SSO / SCIM (Entra, Okta)',
      'MSP Multi-Tenant Portal',
      'Compliance Reports (SOC 2, HIPAA)',
      'Dedicated Support & Onboarding',
      'API Access',
      'Custom Integrations',
      'Priority SLAs',
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
    answer: 'Yes. You can upgrade or downgrade at any time from your billing settings. Upgrades are prorated instantly, and downgrades take effect at the end of your billing cycle.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Absolutely. There are no long-term contracts on Pro or Business. Cancel from your billing portal and you keep access through the end of your paid period.',
  },
  {
    question: 'How is my data encrypted?',
    answer: 'Wrayth uses zero-knowledge, device-local encryption. Your vault is encrypted with a key derived from your master password using PBKDF2 (600,000 iterations). We never see your data — not your passwords, not your notes, not your keys.',
  },
  {
    question: 'What happens if I exceed my scan limit?',
    answer: 'Ray will let you know and pause additional scans until the next billing cycle. You can upgrade instantly to unlock more capacity — no interruptions to your saved data or monitoring.',
  },
  {
    question: 'Do you offer student or nonprofit discounts?',
    answer: 'Yes. We offer 50% off Pro for verified students and qualifying nonprofits. Contact support@wrayth.com from your institutional email to get started.',
  },
  {
    question: 'How does Business differ from Enterprise?',
    answer: 'Business is designed for teams up to ~20 people who need shared vaults, RBAC, and audit logs. Enterprise adds SSO/SCIM, multi-tenant MSP capabilities, compliance reporting, API access, and dedicated onboarding — built for organizations with hundreds or thousands of users.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'The Free plan is available forever with no time limit. For Pro and Business, we offer a 14-day money-back guarantee on your first subscription.',
  },
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
      <section className="container mx-auto px-4 pt-20 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="mb-4">Pricing</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Protection that grows with you
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Every plan includes Vault, Scan, Watch, and Ray — your AI security teammate.
            Upgrade as your security needs expand.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.popular
                  ? 'border-primary shadow-xl shadow-primary/10 relative flex flex-col'
                  : 'relative flex flex-col'
              }
            >
              <CardHeader>
                {plan.badge && (
                  <Badge
                    variant={plan.popular ? 'default' : 'secondary'}
                    className="w-fit mb-2"
                  >
                    {plan.badge}
                  </Badge>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.tagline}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.priceSuffix && (
                    <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm font-medium mb-4">{plan.headline}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 border-t border-border/50 mb-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Usage
                  </p>
                  <ul className="space-y-1">
                    {plan.usage.map((u, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  asChild
                  className="w-full"
                  variant={plan.ctaVariant ?? (plan.popular ? 'default' : 'outline')}
                >
                  <Link to={plan.cta.to}>{plan.cta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
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
                  <th key={name} className="text-center py-4 px-4 font-semibold text-sm">
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
                      className="bg-muted/40 py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-t border-border"
                    >
                      {section.category}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="py-3 px-4 text-sm">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="py-3 px-4 text-center text-sm">
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
          <Accordion type="single" collapsible className="w-full">
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
            Start securing your digital life today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join early adopters using Wrayth to protect passwords, identities, devices, and
            organizations — with Ray AI watching over everything.
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
