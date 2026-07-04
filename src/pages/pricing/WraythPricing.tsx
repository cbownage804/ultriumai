/**
 * Wrayth Pricing
 *
 * Capability-first pricing. Every plan gets unlimited devices, unlimited
 * identities, and unlimited Ray conversations. Ray Compute is the single
 * usage meter, reserved for expensive AI workflows (Deep Threat
 * Investigations, Executive Reports, Compliance, Policy Generation, etc.).
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
  Cpu,
  Infinity as InfinityIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import WraythNav from '@/components/safesuite/SafeSuiteNav';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { RAY_COMPUTE_ACTION_LIST } from '@/lib/ray/compute';

interface PlanCard {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  featured?: boolean;
  rayCompute: string;
  /** Capabilities the plan unlocks on top of the "included with every plan" set. */
  features: string[];
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
    tagline: 'For individuals getting started.',
    price: '$0',
    badge: 'Free Forever',
    rayCompute: 'Upgrade to unlock advanced AI workflows',
    features: [
      'Personal vault',
      'Browser extension',
      'Identity monitoring',
      'Device monitoring',
      'Threat Center',
      'Unlimited Ray conversations',
      'Daily security score',
      'Basic recommendations',
    ],
    notIncluded: [
      'Deep Threat Investigations',
      'Executive Reports',
      'Compliance',
      'Policy Generator',
      'Malware Analysis',
      'Attack Paths',
    ],
    cta: { label: 'Start Free', to: '/auth?mode=signup' },
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    tagline: 'For power users and consultants.',
    price: '$15',
    priceSuffix: '/month',
    rayCompute: 'Includes 25 Ray Compute / month · top up anytime',
    features: [
      'Everything in Free',
      'Unlimited monitored devices',
      'Unlimited monitored identities',
      'Microsoft 365 monitoring',
      'Threat Investigations',
      'Malware Analysis',
      'Log Analysis',
      'Script Analysis',
      'Security Graph',
      'Reports',
    ],
    notIncluded: [
      'Team management',
      'Executive Reports',
      'Organization Memory',
      'Compliance automation',
    ],
    cta: { label: 'Start Pro', to: '/auth?mode=signup&plan=pro' },
    ctaVariant: 'outline',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    tagline: 'AI security platform for teams.',
    price: '$39',
    priceSuffix: '/user/month',
    badge: 'Most Popular',
    featured: true,
    rayCompute: 'Includes 100 Ray Compute / user / month · top up anytime',
    features: [
      'Everything in Pro',
      'Team management',
      'Organization Memory',
      'Executive Dashboard',
      'Executive Reports',
      'Policy Generator',
      'Compliance',
      'Shared investigations',
      'Shared timeline',
      'Organization knowledge graph',
      'Scheduled reports',
    ],
    cta: { label: 'Start Business', to: '/auth?mode=signup&plan=business' },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    tagline: 'Governance, scale, and control for regulated organizations and MSPs.',
    price: 'Custom',
    badge: 'Enterprise',
    rayCompute: 'Custom Ray Compute pool · unlimited scheduled reporting',
    features: [
      'Everything in Business',
      'Unlimited organizations',
      'SSO (SAML / OIDC)',
      'SCIM provisioning',
      'API access',
      'Custom AI',
      'Private AI models',
      'Compliance automation',
      'Dedicated support',
      'Unlimited scheduled reporting',
      'Custom onboarding',
    ],
    cta: { label: 'Contact Sales', to: '/contact?interest=enterprise' },
    ctaVariant: 'outline',
  },
];

// Everything below is included on EVERY plan (Free through Enterprise).
const INCLUDED_EVERY_PLAN = [
  'Unlimited device monitoring',
  'Unlimited identity monitoring',
  'Unlimited Ray conversations',
  'Password manager',
  'Browser extension',
  'Daily & weekly briefings',
  'Security coaching & recommendations',
  'Threat Center',
];

type Cell = boolean | string;

const COMPARISON: { category: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    category: 'Included on every plan',
    rows: [
      { label: 'Monitored devices', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Monitored identities', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Ray conversations', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'Password manager', values: [true, true, true, true] },
      { label: 'Browser extension', values: [true, true, true, true] },
      { label: 'Daily & weekly brief', values: [true, true, true, true] },
      { label: 'Security score & recommendations', values: [true, true, true, true] },
      { label: 'Threat Center', values: [true, true, true, true] },
    ],
  },
  {
    category: 'Ray Compute (advanced AI)',
    rows: [
      { label: 'Monthly Ray Compute allowance', values: ['—', '25', '100 / user', 'Custom'] },
      { label: 'Top-up anytime', values: [false, true, true, true] },
      { label: 'Deep Threat Investigation (3 RC)', values: [false, true, true, true] },
      { label: 'Malware Analysis (3 RC)', values: [false, true, true, true] },
      { label: 'Large Log Analysis (5 RC)', values: [false, true, true, true] },
      { label: 'Compliance Gap Report (5 RC)', values: [false, false, true, true] },
      { label: 'Executive Report (5 RC)', values: [false, false, true, true] },
      { label: 'Attack Path Analysis (4 RC)', values: [false, true, true, true] },
      { label: 'Policy Generation (2 RC)', values: [false, false, true, true] },
    ],
  },
  {
    category: 'Team & organization',
    rows: [
      { label: 'Team management', values: [false, false, true, true] },
      { label: 'Organization Memory', values: [false, false, true, true] },
      { label: 'Executive Dashboard', values: [false, false, true, true] },
      { label: 'Shared investigations & timeline', values: [false, false, true, true] },
      { label: 'Scheduled reports', values: [false, false, true, 'Unlimited'] },
      { label: 'Microsoft 365 monitoring', values: [false, true, true, true] },
    ],
  },
  {
    category: 'Governance',
    rows: [
      { label: 'SSO / SCIM', values: [false, false, false, true] },
      { label: 'Unlimited organizations', values: [false, false, false, true] },
      { label: 'API access', values: [false, false, false, true] },
      { label: 'Custom AI / Private models', values: [false, false, false, true] },
      { label: 'Compliance automation', values: [false, false, false, true] },
      { label: 'Dedicated support', values: [false, false, false, true] },
      { label: 'Custom onboarding', values: [false, false, false, true] },
    ],
  },
];

const FAQS = [
  {
    question: 'What is Ray Compute?',
    answer:
      "Ray Compute (RC) is the single meter for expensive AI work. Everyday Ray — conversations, monitoring, recommendations, briefings, threat analysis — is unlimited on every paid plan. RC is spent only when Ray runs substantial workloads on your behalf: Deep Threat Investigations, Malware Analysis, Executive Reports, Policy Generation, Attack Paths, and large Log Analysis. Each plan includes a monthly allowance, and you can top up anytime.",
  },
  {
    question: 'Why no per-message, per-scan, or per-password limits?',
    answer:
      "Because a security platform shouldn't make you ration protection. Monitoring, conversations, and the password vault are unlimited on every plan. You're paying for continuous protection, not counting interactions.",
  },
  {
    question: 'What happens if I run out of Ray Compute?',
    answer:
      "Nothing about your core protection changes — monitoring, briefings, recommendations, and Ray conversations keep working. Advanced AI workflows will prompt you to top up. You can buy additional Ray Compute at any time, or upgrade your plan for a larger monthly allowance.",
  },
  {
    question: 'Can I upgrade or cancel later?',
    answer:
      'Yes. Upgrade, downgrade, or cancel any time from your billing settings. Upgrades are prorated instantly. No long-term contracts on Pro or Business.',
  },
  {
    question: 'How is my data protected?',
    answer:
      'Wrayth uses zero-knowledge, device-local encryption for anything sensitive. Ray watches your security posture — not your files, photos, documents, camera, microphone, or keystrokes.',
  },
  {
    question: 'How does Business differ from Enterprise?',
    answer:
      'Business is the flagship plan for companies that want the full AI security teammate — organization memory, executive reporting, compliance, team collaboration. Enterprise is a governance layer on top: SSO, SCIM, API, multi-org, private AI models, compliance automation, and a dedicated success manager.',
  },
  {
    question: 'Do you offer student or nonprofit discounts?',
    answer:
      'Yes. We offer 50% off Pro for verified students and qualifying nonprofits. Contact support@wrayth.com from your institutional email to get started.',
  },
];

const TRUST_LINE = [
  { icon: Lock, label: 'Privacy by design' },
  { icon: Sparkles, label: 'AI-powered security' },
  { icon: Globe, label: 'Cross-platform' },
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
            Every plan includes unlimited monitoring, unlimited Ray conversations, and the full
            password vault. Ray Compute powers advanced AI workflows — investigations, executive
            reports, compliance, policy generation — so you only pay premium prices for premium work.
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
                  {/* Ray Compute allowance — the ONE meter, sold as a benefit */}
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5 flex items-start gap-2">
                    <Cpu className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground/90 leading-snug">{plan.rayCompute}</span>
                  </div>

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

        {/* Included with every plan */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8">
            <div className="flex items-center gap-2 mb-4">
              <InfinityIcon className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Included with every plan</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              You never count messages, passwords, or scans on Wrayth. Continuous protection is
              standard on Free, Pro, Business, and Enterprise.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {INCLUDED_EVERY_PLAN.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Powered by Ray Compute */}
        <div className="max-w-5xl mx-auto mt-8">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent p-8">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Powered by Ray Compute</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Ray Compute (RC) is the premium AI resource that runs Wrayth's most demanding
              workflows. Everyday Ray is always free and unlimited. RC is only used when Ray does
              substantial work on your behalf.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {RAY_COMPUTE_ACTION_LIST
                .slice()
                .sort((a, b) => a.cost - b.cost)
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {action.cost} RC
                    </Badge>
                  </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Monthly allowance: <strong className="text-foreground">Pro 25 RC</strong> ·{' '}
              <strong className="text-foreground">Business 100 RC / user</strong> · Enterprise
              custom pool. Top up anytime from your billing settings.
            </p>
          </div>
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
            Grouped by outcome — what's included everywhere, what Ray Compute unlocks, team
            capabilities, and enterprise governance.
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
            in seconds — without counting your interactions.
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
