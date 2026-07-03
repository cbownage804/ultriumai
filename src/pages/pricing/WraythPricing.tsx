/**
 * Wrayth Pricing
 * Repositioned around Ray + outcomes. Devices, identities, and organization
 * capabilities define the plan — not scan counts, message counts, or minutes.
 */
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
  /** Positive capabilities the plan includes (outcomes, not features). */
  features: string[];
  /** Physical limits that define the plan — devices, identities, seats. */
  limits: string[];
  /** What this plan doesn't include (helps buyers self-select up). */
  notIncluded?: string[];
  cta: { label: string; to: string };
  ctaVariant?: 'default' | 'outline';
}

const PLANS: PlanCard[] = [
  {
    id: 'free',
    name: 'Free',
    icon: Shield,
    tagline: 'For individuals who want to experience Ray.',
    price: '$0',
    badge: 'Free Forever',
    features: [
      'Ray AI Assistant',
      'Security Score',
      'Weekly Security Brief',
      'Threat Analysis',
      'Exposure Monitoring',
      'Knowledge Assistant',
      'Timeline',
    ],
    limits: [
      '1 monitored device',
      '2 monitored identities',
      '10 URL scans / month',
      '5 email analyses / month',
    ],
    notIncluded: [
      'Teams & Slack',
      'Device remediation',
      'Recommendations engine',
      'Organization Memory',
      'Microsoft 365 monitoring',
    ],
    cta: { label: 'Start Free', to: '/auth?mode=signup' },
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    tagline: 'For individuals and power users who want the full endpoint story.',
    price: '$15',
    priceSuffix: '/month',
    features: [
      'Everything in Free',
      'Windows endpoint agent',
      'AI Recommendations engine',
      'Device timeline',
      'Password monitoring',
      'Browser extension analysis',
      'Startup & software inventory',
      'Windows Update monitoring',
      'One-click safe remediations',
      'Explain security score',
      'Unlimited threat analysis',
    ],
    limits: [
      '5 monitored devices',
      '10 monitored identities',
    ],
    notIncluded: [
      'Teams & Slack',
      'Multi-user administration',
      'Organization Memory',
      'Microsoft 365 monitoring',
    ],
    cta: { label: 'Start Pro', to: '/auth?mode=signup&plan=pro' },
    ctaVariant: 'outline',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    tagline: 'The flagship plan. One AI security teammate for the whole company.',
    price: '$39',
    priceSuffix: '/user/month',
    badge: 'Most Popular',
    featured: true,
    features: [
      'Everything in Pro',
      'Microsoft 365 security monitoring',
      'Teams integration',
      'Slack integration',
      'Organization Memory',
      'Company Knowledge Base',
      'Daily & Weekly Executive Brief',
      'Ray Organization Timeline',
      'Approval workflows',
      'Full device remediation',
      'Risk approval system',
      'Audit history',
      'Release channels',
      'Multiple administrators',
      'White-label portal',
      'Priority support',
    ],
    limits: [
      'Unlimited monitored devices',
      'Unlimited monitored identities',
    ],
    cta: { label: 'Start Business', to: '/auth?mode=signup&plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    tagline: 'Governance, scale, and control for regulated organizations and MSPs.',
    price: 'Contact Sales',
    badge: 'Governance',
    features: [
      'Everything in Business',
      'SSO (SAML / OIDC)',
      'SCIM provisioning',
      'Multiple organizations & tenants',
      'Advanced RBAC',
      'Custom AI policies',
      'Custom Ray skills',
      'Private AI models',
      'SIEM integration',
      'API access',
      'Custom compliance reports',
      'Dedicated Success Manager',
      'Private deployment (future)',
      'Unlimited white-label',
      'Unlimited admins & organizations',
    ],
    limits: [],
    cta: { label: 'Contact Sales', to: '/contact?interest=enterprise' },
    ctaVariant: 'outline',
  },
];

type Cell = boolean | string;

const COMPARISON: { category: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    category: 'Coverage',
    rows: [
      { label: 'Monitored devices', values: ['1', '5', 'Unlimited', 'Unlimited'] },
      { label: 'Monitored identities', values: ['2', '10', 'Unlimited', 'Unlimited'] },
      { label: 'Users / seats', values: ['1', '1', 'Per seat', 'Unlimited'] },
    ],
  },
  {
    category: 'AI Security Analyst',
    rows: [
      { label: 'Ray AI Assistant', values: [true, true, true, true] },
      { label: 'Security Score & explanations', values: [true, true, true, true] },
      { label: 'AI Recommendations engine', values: [false, true, true, true] },
      { label: 'Organization Memory', values: [false, false, true, true] },
      { label: 'Company Knowledge Base', values: [false, false, true, true] },
    ],
  },
  {
    category: 'Monitoring',
    rows: [
      { label: 'Threat Analysis', values: ['Limited', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Exposure Monitoring', values: [true, true, true, true] },
      { label: 'Password monitoring', values: [false, true, true, true] },
      { label: 'Windows endpoint agent', values: [false, true, true, true] },
      { label: 'Device timeline', values: [false, true, true, true] },
      { label: 'Microsoft 365 monitoring', values: [false, false, true, true] },
    ],
  },
  {
    category: 'Remediation',
    rows: [
      { label: 'One-click safe fixes', values: [false, true, true, true] },
      { label: 'Full device remediation', values: [false, false, true, true] },
      { label: 'Approval workflows', values: [false, false, true, true] },
      { label: 'Release channels', values: [false, false, true, true] },
    ],
  },
  {
    category: 'Collaboration',
    rows: [
      { label: 'Teams integration', values: [false, false, true, true] },
      { label: 'Slack integration', values: [false, false, true, true] },
      { label: 'Daily & Weekly Executive Brief', values: [false, false, true, true] },
      { label: 'Multiple administrators', values: [false, false, true, true] },
      { label: 'White-label portal', values: [false, false, true, 'Unlimited'] },
    ],
  },
  {
    category: 'Governance',
    rows: [
      { label: 'SSO / SCIM', values: [false, false, false, true] },
      { label: 'Multiple organizations & tenants', values: [false, false, false, true] },
      { label: 'Advanced RBAC', values: [false, false, false, true] },
      { label: 'Custom AI policies & Ray skills', values: [false, false, false, true] },
      { label: 'Private AI models', values: [false, false, false, true] },
      { label: 'SIEM integration', values: [false, false, false, true] },
      { label: 'API access', values: [false, false, false, true] },
      { label: 'Custom compliance reports', values: [false, false, false, true] },
      { label: 'Dedicated Success Manager', values: [false, false, false, true] },
    ],
  },
];

const FAQS = [
  {
    question: 'What actually consumes Ray Compute?',
    answer:
      "Everyday Ray usage — chat, briefs, monitoring, recommendations, and standard threat analysis — is included with every plan. Ray Compute is only spent on premium AI horsepower like advanced threat investigations. You'll never wonder \"am I paying every time Ray helps me?\"",
  },
  {
    question: 'Why is there no per-message or per-scan limit on paid plans?',
    answer:
      "Because a security platform shouldn't make you ration protection. Paid plans include unlimited threat analysis. We scale plans by monitored devices, monitored identities, and organization capabilities — not by counting messages.",
  },
  {
    question: 'Can I upgrade later?',
    answer:
      'Yes. Upgrade or downgrade any time from your billing settings. Upgrades are prorated instantly, downgrades take effect at the end of your billing cycle.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. No long-term contracts on Pro or Business. Cancel from your billing portal and you keep access through the end of your paid period.',
  },
  {
    question: 'How is my data protected?',
    answer:
      "Wrayth uses zero-knowledge, device-local encryption for anything sensitive. Ray watches your security posture — not your files, photos, documents, emails, camera, microphone, or keystrokes.",
  },
  {
    question: 'How does Business differ from Enterprise?',
    answer:
      "Business is the flagship plan for companies that want the full AI security teammate across their whole team — M365, Teams, Slack, Org Memory, white-label. Enterprise is a governance package on top: SSO, SCIM, multi-org, RBAC, custom AI policies, SIEM, compliance reporting, dedicated CSM.",
  },
  {
    question: 'Do you offer student or nonprofit discounts?',
    answer:
      'Yes. We offer 50% off Pro for verified students and qualifying nonprofits. Contact support@wrayth.com from your institutional email to get started.',
  },
];

const TRUST_LINE = [
  { icon: Lock, label: 'Privacy by design' },
  { icon: Sparkles, label: 'AI-Powered Security' },
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
            An AI security analyst
            <br className="hidden md:block" /> that scales with your team
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            Wrayth continuously monitors your security posture, watches for threats, explains
            risks in plain English, and helps you fix them — all through Ray, your AI security
            analyst. Plans scale by monitored devices, identities, and organization capabilities.
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
                  {plan.limits.length > 0 && (
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                        Coverage
                      </p>
                      <ul className="space-y-0.5">
                        {plan.limits.map((u, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            {u}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                        Not included
                      </p>
                      <ul className="space-y-1">
                        {plan.notIncluded.map((n, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Minus className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare every capability</h2>
          <p className="text-muted-foreground">
            Grouped by outcome — coverage, intelligence, monitoring, remediation, collaboration, governance.
          </p>
        </div>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-background">
              <tr>
                <th className="text-left py-4 px-4 font-medium text-sm w-1/3">Capability</th>
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
            Your AI security analyst never sleeps.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Ray continuously monitors your devices, identities, and Microsoft 365 tenant.
            It explains what matters, recommends what to fix, and remediates approved issues
            in seconds.
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
