/**
 * Wrayth Landing Page
 * AI-powered cybersecurity platform, centered on Ray as the AI security analyst.
 * Product names (Vault / Scan / Watch) are gone from marketing — outcomes only.
 */

import { Link } from 'react-router-dom';
import Navigation from '@/components/safesuite/SafeSuiteNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SAFESUITE_TIERS } from '@/config/safeSuiteTiers';
import heroWrayth from '@/assets/hero-wrayth.jpg';
import wraythLogo from '@/assets/wrayth-brand-full.png.asset.json';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  ScanSearch,
  Globe,
  Star,
  Crown,
  MessageCircle,
  Brain,
  Wand2,
  MessagesSquare,
  EyeOff,
  Eye,
} from 'lucide-react';


// Ray's capabilities — not products. Each one is something Ray *does*.
const capabilities = [
  {
    icon: KeyRound,
    title: 'Ray protects your passwords.',
    blurb:
      "A complete zero-knowledge password manager, with Ray watching over it. Import from any browser or password manager, and Ray flags weak or reused passwords, checks each one against known breaches, and offers stronger replacements when you're ready.",
    bullets: [
      'Secure credential vault',
      'Weak-password detection',
      'Stronger password recommendations',
      'Ongoing password health monitoring',
    ],
  },
  {
    icon: ScanSearch,
    title: 'Ray analyzes suspicious content.',
    blurb:
      "Forward an email, drop in a document, paste a URL — Ray reads it, understands what it's doing, and explains the threat in plain English. No security degree required.",
    bullets: [
      'Emails, documents, URLs, QR codes, attachments',
      'AI threat analysis',
      'Plain-English explanations',
      'Calm guidance on what to do next',
    ],
  },
  {
    icon: Globe,
    title: 'Ray watches your digital exposure.',
    blurb:
      "Ray continuously monitors the dark web for your leaked credentials and identities, alerts you the moment something surfaces, and walks you through exactly how to respond.",
    bullets: [
      'Dark web monitoring',
      'Credential leak alerts',
      'Identity exposure tracking',
      'Step-by-step remediation',
    ],
  },
];

export default function WraythLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* HERO — Meet Ray */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src={heroWrayth}
            alt=""
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background" />

          {/* Ray "thinking" — intentional violet pulse + drifting particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 right-[12%] -translate-y-1/2 h-[480px] w-[480px] rounded-full bg-primary/[0.07] blur-[120px] animate-ray-pulse" />
            <div className="absolute top-1/2 right-[18%] -translate-y-1/2 h-[180px] w-[180px] rounded-full bg-primary/[0.12] blur-[60px] animate-ray-pulse-fast" />
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-primary/60 animate-ray-particle"
                style={{
                  top: `${30 + (i * 9) % 50}%`,
                  right: `${10 + (i * 7) % 22}%`,
                  animationDelay: `${i * 1.4}s`,
                  animationDuration: `${8 + (i % 3) * 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-24 md:py-36">
          <div className="max-w-3xl">
            <img
              src={wraythLogo.url}
              alt="Wrayth"
              className="h-16 md:h-20 w-auto mb-8 select-none"
              draggable={false}
            />
            <div className="flex items-center gap-2 mb-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Wrayth · AI security platform
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-8 leading-[1.05]">
              Meet <span className="text-primary">Ray</span>.
              <br />
              Your AI cybersecurity teammate.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Ray protects your passwords, analyzes suspicious emails and files,
              monitors the dark web for exposed credentials, and guides you through
              every security decision&mdash;in plain English.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth?tab=signup&return=safesuite&path=%2Fonboarding%2Fray">
                <Button size="lg" className="wrayth-chamfer-sm gap-2 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  Meet Ray
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="wrayth-chamfer-sm w-full sm:w-auto border-border text-foreground hover:bg-secondary"
              >
                See what Ray can do
              </Button>
            </div>

          </div>
        </div>
      </section>



      {/* PHILOSOPHY STRIP */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <p className="max-w-3xl text-xl md:text-2xl text-foreground font-light leading-snug">
            You don't need to become a cybersecurity expert.
            <span className="text-muted-foreground"> Ray already is.</span>
          </p>
        </div>
      </section>

      {/* CAPABILITIES — what Ray can do */}
      <section id="platform" className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-16">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              What Ray can do
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              One teammate. Every layer of your security.
            </h2>
          </div>

          <div className="grid gap-px bg-border border border-border wrayth-chamfer overflow-hidden">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-background p-8 md:p-10 grid md:grid-cols-[1fr_1.5fr] gap-6 md:gap-12"
              >
                <div>
                  <div className="inline-flex items-center justify-center h-11 w-11 border border-border wrayth-chamfer-sm mb-6">
                    <cap.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
                    {cap.title}
                  </h3>
                </div>
                <div className="space-y-5">
                  <p className="text-muted-foreground leading-relaxed">{cap.blurb}</p>
                  <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
                    {cap.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-muted-foreground max-w-2xl">
            Every new capability Wrayth adds becomes another thing Ray quietly handles on your behalf.
          </p>
        </div>
      </section>

      {/* PLAYBOOKS — what Ray actually does, in your hands */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80 mb-3">
              Ray runs the work
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Every recommendation becomes a conversation.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ray doesn't dump a checklist on you. It walks each fix with you, step by step, in plain English — and remembers what you've already handled.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: 'Protect your identity end-to-end', d: 'Add an email, verify it, scan for breaches, keep watch — Ray handles the whole chain.' },
              { t: 'Clean up every weak or reused password', d: 'Weak, reused, old, compromised — Ray sweeps the Vault one credential at a time.' },
              { t: 'Secure Microsoft 365', d: 'MFA enforced, Conditional Access set, legacy auth off, admins reviewed.' },
              { t: 'Secure Google Workspace', d: 'Passkeys, 2FA, recovery you control, backup codes saved.' },
              { t: 'Harden this device', d: 'Encryption verified, firewall on, OS patched, agent reporting in.' },
              { t: 'And more', d: 'Ray\'s playbook library grows every week. Browse the full catalog.' },
            ].map((p) => (
              <div key={p.t} className="rounded-sm border border-border/60 bg-card/30 p-5">
                <div className="text-base font-medium">{p.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="ghost" className="text-violet-300 hover:text-violet-200">
              <Link to="/resources">Browse every playbook <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 border-t border-border bg-background">

        <div className="container mx-auto px-4">
          <div className="max-w-2xl mb-14">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Hire Ray. Upgrade anytime.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border border border-border wrayth-chamfer overflow-hidden">
            {Object.values(SAFESUITE_TIERS).map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-secondary p-8 flex flex-col ${tier.popular ? 'ring-1 ring-primary/50' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-px left-0 right-0 flex justify-center">
                    <Badge className="rounded-none bg-primary text-primary-foreground gap-1 px-3 py-1 text-[10px] uppercase tracking-widest">
                      <Star className="h-3 w-3" />
                      Most popular
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {tier.id === 'business' && <Crown className="h-4 w-4 text-primary" />}
                  <span className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{tier.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
                <div className="mb-8">
                  <span className="text-5xl font-semibold text-foreground tabular-nums">
                    {tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(0)}`}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground ml-1">{tier.priceLabel || '/month'}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>Secure every password</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>Analyze suspicious emails &amp; files</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>Monitor for exposed credentials</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>AI guidance from Ray</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>Security score &amp; recommendations</span>
                  </li>
                  {tier.features.team?.enabled && (
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>Team collaboration</span>
                    </li>
                  )}
                  {tier.features.whitelabeling?.enabled && (
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>White-labeling</span>
                    </li>
                  )}
                </ul>

                <Link to="/auth?tab=signup" className="mt-auto">
                  <Button
                    variant={tier.popular ? 'default' : 'outline'}
                    className={`w-full wrayth-chamfer-sm ${
                      tier.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border-border text-foreground hover:bg-card'
                    }`}
                  >
                    {tier.price === 0 ? 'Start free' : `Start ${tier.name}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
            Stop managing security tools.
            <br />
            <span className="text-muted-foreground">Start working with Ray.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Stop juggling security software. Let Ray handle it for you.
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="wrayth-chamfer-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Experience Ray
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={wraythLogo.url} alt="Wrayth" className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Wrayth. Ray is always watching.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">

              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
