/**
 * Wrayth Enterprise — the operational deployment page.
 * Audience: IT directors, MSP owners, CISOs. Not for end-users.
 * Answers: "Can I actually deploy this across my org / my clients?"
 */

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Building2, Users, ShieldCheck, Network, ServerCog,
  KeyRound, FileKey, BarChart3, FileText, Terminal,
  Cloud, HardDrive, Server, Monitor, Apple, Smartphone, Chrome,
  ArrowRight, Check, Lock, Fingerprint, Share2, Brain,
  History, ScrollText, GaugeCircle, Rocket, Briefcase, ShieldOff,
  UserCheck, Layers, Webhook, Code2, Sparkles, Search, Radar, Eye, Puzzle,
} from "lucide-react";

// ─── Content data ───────────────────────────────────────────────────────────

const trustBadges = [
  { label: "SOC 2", note: "In progress" },
  { label: "Zero Knowledge", note: "Architected in" },
  { label: "AES-256", note: "End-to-end" },
  { label: "SSO", note: "SAML + OIDC" },
  { label: "SCIM", note: "Provisioning" },
  { label: "Multi-tenant", note: "Native" },
  { label: "GDPR", note: "Ready" },
  { label: "HIPAA", note: "Aligned" },
];

const designPartnerSegments = [
  "MSPs", "CPA & Accounting Firms", "Healthcare Practices", "Legal & Title", "K-12 & Higher Ed", "Financial Services",
];

const platformModules = [
  { icon: KeyRound, label: "Vault", description: "Zero-knowledge credentials & secrets" },
  { icon: Search, label: "Scan", description: "URL, file & attachment analysis" },
  { icon: Radar, label: "Watch", description: "Dark web & domain monitoring" },
  { icon: Fingerprint, label: "Identity", description: "SSO, SCIM & identity graph" },
];

const orgCapabilities = [
  { icon: Building2, title: "Unlimited Organizations", description: "Model your company, subsidiaries, and departments however you need." },
  { icon: Layers, title: "Multi-tenancy", description: "Hard tenant isolation at the database and encryption layer." },
  { icon: Briefcase, title: "Departments & Clients", description: "Group users by team, business unit, or managed client." },
  { icon: UserCheck, title: "Delegated Admins", description: "Scope admin power to specific orgs, departments, or clients." },
];

const identityProviders = [
  "Microsoft Entra ID", "Azure AD", "Google Workspace", "Okta", "JumpCloud", "OneLogin", "Ping Identity", "Any SAML 2.0 IdP",
];

const teamCapabilities = [
  { icon: Share2, title: "Shared Vaults", description: "Team-scoped credential collections with per-user visibility." },
  { icon: ShieldCheck, title: "Role-Based Access", description: "Least-privilege by default. Owner, Admin, Manager, Member, Guest." },
  { icon: Users, title: "Groups & Collections", description: "Assign access by group membership, not by hand." },
  { icon: KeyRound, title: "Emergency Access", description: "Break-glass workflow with quorum approvals and audit trail." },
  { icon: History, title: "Rotation Policies", description: "Force rotation on schedule, on breach, or on offboarding." },
  { icon: Lock, title: "Master Password Rules", description: "Complexity, MFA enforcement, and device trust policies." },
];

const auditCapabilities = [
  { icon: ScrollText, title: "Audit Logs", description: "Every unlock, share, rotation, and admin action, queryable forever." },
  { icon: History, title: "Password History", description: "Full version history per credential with restore." },
  { icon: FileText, title: "Access Reports", description: "Who can see what, exportable on demand." },
  { icon: GaugeCircle, title: "Security Dashboard", description: "Org-wide posture, MFA coverage, and breach exposure." },
  { icon: FileKey, title: "Compliance Reports", description: "One-click reports for SOC 2, ISO 27001, and HIPAA audits." },
  { icon: BarChart3, title: "SIEM Integration", description: "Stream events to Splunk, Sentinel, Datadog, or any SIEM." },
];

const mspCapabilities = [
  { icon: Building2, title: "Unlimited Clients", description: "Manage every client tenant from one MSP console." },
  { icon: Lock, title: "Client Isolation", description: "Cryptographic separation — one client's breach never bleeds to another." },
  { icon: KeyRound, title: "Per-seat Licensing", description: "Bill only what each client actually uses." },
  { icon: UserCheck, title: "Delegated Technicians", description: "Scope techs to the clients they actually own." },
  { icon: Sparkles, title: "Client Branding", description: "Whitelabel per client — logo, colors, and domain." },
  { icon: BarChart3, title: "Multi-tenant Dashboards", description: "See every client's posture side-by-side." },
];

const complianceFrameworks = [
  { code: "SOC 2", status: "In progress" },
  { code: "HIPAA", status: "Aligned" },
  { code: "PCI DSS", status: "Aligned" },
  { code: "ISO 27001", status: "Roadmap" },
  { code: "NIST 800-53", status: "Mapped" },
  { code: "CIS Controls", status: "Mapped" },
  { code: "GDPR", status: "Compliant" },
  { code: "CCPA", status: "Compliant" },
];

const deploymentModes = [
  { icon: Cloud, title: "Cloud", description: "Managed, multi-region, zero-touch. Available today." },
  { icon: Server, title: "Hybrid", description: "Your identity, our cloud vault sync. Available today." },
  { icon: HardDrive, title: "Self-hosted", description: "Deploy inside your own perimeter. On the roadmap." },
];

const platforms = [
  { icon: Monitor, label: "Windows" },
  { icon: Apple, label: "macOS" },
  { icon: Monitor, label: "Linux" },
  { icon: Smartphone, label: "iOS" },
  { icon: Smartphone, label: "Android" },
  { icon: Chrome, label: "Chrome" },
  { icon: Chrome, label: "Edge" },
  { icon: Chrome, label: "Firefox" },
  { icon: Apple, label: "Safari" },
];

const architectureLayers = [
  { label: "User", detail: "Master password never leaves the device." },
  { label: "Device Encryption", detail: "Argon2id → AES-256-GCM, per-device keys." },
  { label: "Zero-Knowledge Vault", detail: "Wrayth servers only ever see ciphertext." },
  { label: "Encrypted Sync", detail: "TLS 1.3 in transit, sealed envelope per record." },
  { label: "Threat Intelligence", detail: "HIBP, dark web feeds, malware IOC streams." },
  { label: "Ray AI", detail: "Operates on metadata + explicit user-unlocked context only." },
];

const apiCapabilities = [
  { icon: Code2, title: "REST API", description: "Full-surface API with scoped access tokens." },
  { icon: Webhook, title: "Webhooks", description: "Real-time events for audit, provisioning, and threats." },
  { icon: Terminal, title: "CLI", description: "Scriptable admin from any pipeline or shell." },
  { icon: ServerCog, title: "PowerShell", description: "Native modules for Windows admin automation." },
  { icon: Rocket, title: "Automation Recipes", description: "Onboard, offboard, and rotate at scale in one call." },
  { icon: Layers, title: "Terraform (roadmap)", description: "Manage Wrayth as code alongside the rest of your infra." },
];

// ─── Small components ───────────────────────────────────────────────────────

function SectionHeading({
  eyebrow, title, description, tone = "blue",
}: { eyebrow: string; title: string; description: string; tone?: "blue" | "violet" | "emerald" | "amber" | "rose" }) {
  const toneMap = {
    blue: "bg-blue-500/10 text-blue-400",
    violet: "bg-violet-500/10 text-violet-300",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
  } as const;
  return (
    <div className="mb-12 max-w-2xl">
      <Badge className={`mb-4 border-0 ${toneMap[tone]}`}>{eyebrow}</Badge>
      <h2 className="mb-3 text-4xl font-bold">{title}</h2>
      <p className="text-lg text-muted-foreground">{description}</p>
    </div>
  );
}

type Tone = "blue" | "violet" | "emerald" | "amber" | "rose";
const TONE_CARD: Record<Tone, string> = {
  blue: "hover:border-blue-500/40",
  violet: "hover:border-violet-500/40",
  emerald: "hover:border-emerald-500/40",
  amber: "hover:border-amber-500/40",
  rose: "hover:border-rose-500/40",
};
const TONE_ICON_BG: Record<Tone, string> = {
  blue: "bg-blue-500/10",
  violet: "bg-violet-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  rose: "bg-rose-500/10",
};
const TONE_ICON_FG: Record<Tone, string> = {
  blue: "text-blue-400",
  violet: "text-violet-300",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
};

function FeatureCard({
  icon: Icon, title, description, tone = "blue",
}: { icon: any; title: string; description: string; tone?: Tone }) {
  return (
    <Card className={`border-border/50 bg-card/40 transition-colors ${TONE_CARD[tone]}`}>
      <CardHeader>
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${TONE_ICON_BG[tone]}`}>
          <Icon className={`h-5 w-5 ${TONE_ICON_FG[tone]}`} />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WraythEnterprise() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center">
          <Badge variant="outline" className="mb-6 border-blue-500/40 text-blue-300">
            Wrayth for Enterprise & MSPs
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Enterprise Security.<br />Consumer Simplicity.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Deploy Wrayth across your organization — or across every client you manage — without sacrificing usability.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact?intent=sales">
              <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600">
                Talk to Sales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact?intent=demo">
              <Button size="lg" variant="outline">Book a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border py-12 px-4">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Built to meet the bar for
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {trustBadges.map((b) => (
              <div key={b.label} className="rounded-lg border border-border bg-card/40 p-3 text-center">
                <div className="text-sm font-semibold">{b.label}</div>
                <div className="text-xs text-muted-foreground">{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizations */}
      <section id="organizations" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Organizations"
            title="Structure your business, however it's structured"
            description="Wrayth is multi-tenant from the ground up. Departments, subsidiaries, and managed clients all live in the same admin surface."
            tone="blue"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {orgCapabilities.map((f) => (
              <FeatureCard key={f.title} {...f} tone="blue" />
            ))}
          </div>
        </div>
      </section>

      {/* Identity */}
      <section id="identity" className="border-b border-border bg-emerald-500/[0.02] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Identity"
            title="SSO and SCIM with the providers you already use"
            description="Provision users from your identity provider. Enforce MFA at the IdP. Deprovision on offboard — Wrayth revokes access and rotates shared secrets automatically."
            tone="emerald"
          />
          <div className="mb-8 flex flex-wrap gap-2">
            {identityProviders.map((p) => (
              <span key={p} className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-sm text-emerald-100">
                {p}
              </span>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/40 p-6">
              <Fingerprint className="mb-3 h-6 w-6 text-emerald-400" />
              <h3 className="mb-2 font-semibold">SAML 2.0 SSO</h3>
              <p className="text-sm text-muted-foreground">Point-and-click setup with any SAML IdP. Just-in-time user creation.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-6">
              <Users className="mb-3 h-6 w-6 text-emerald-400" />
              <h3 className="mb-2 font-semibold">SCIM 2.0 Provisioning</h3>
              <p className="text-sm text-muted-foreground">Automatic user and group sync. Offboard in your IdP, Wrayth follows.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-6">
              <ShieldCheck className="mb-3 h-6 w-6 text-emerald-400" />
              <h3 className="mb-2 font-semibold">Conditional Access</h3>
              <p className="text-sm text-muted-foreground">Trust your IdP's MFA, device posture, and location signals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section id="teams" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Teams"
            title="Share credentials without sharing risk"
            description="Group vaults, granular roles, and rotation policies that actually get enforced."
            tone="violet"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamCapabilities.map((f) => (
              <FeatureCard key={f.title} {...f} tone="violet" />
            ))}
          </div>
        </div>
      </section>

      {/* Audit */}
      <section id="audit" className="border-b border-border bg-amber-500/[0.02] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Audit & Reporting"
            title="Prove it, don't just claim it"
            description="Every action is logged. Every log is queryable. Every report is one click away."
            tone="amber"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auditCapabilities.map((f) => (
              <FeatureCard key={f.title} {...f} tone="amber" />
            ))}
          </div>
        </div>
      </section>

      {/* MSP */}
      <section id="msp" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <Badge className="mb-4 border-0 bg-rose-500/10 text-rose-400">Built for MSPs</Badge>
            <h2 className="mb-3 text-4xl font-bold">Run every client's security from one console</h2>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Wrayth was designed with MSPs in mind. Unlimited client tenants, cryptographic isolation, per-seat billing,
              delegated technicians, and full whitelabel — so your brand stays front and center.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mspCapabilities.map((f) => (
              <FeatureCard key={f.title} {...f} tone="rose" />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="mb-2 text-xl font-semibold">Ready to add Wrayth to your stack?</h3>
                <p className="text-sm text-muted-foreground">
                  Special pricing, co-marketing, and a partner portal for qualified MSPs.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link to="/contact?intent=partner">
                  <Button className="bg-rose-500 text-white hover:bg-rose-600">Become a Partner</Button>
                </Link>
                <Link to="/contact?intent=sales">
                  <Button variant="outline">Talk to Sales</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="border-b border-border bg-emerald-500/[0.02] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Compliance"
            title="Frameworks we build to"
            description="We're transparent about where we are with each framework. If a certification matters to your procurement team, ask us — we'll share our current attestations and roadmap."
            tone="emerald"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {complianceFrameworks.map((c) => (
              <div key={c.code} className="rounded-xl border border-border bg-card/40 p-5 text-center">
                <div className="text-lg font-bold">{c.code}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment */}
      <section id="deployment" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Deployment"
            title="Deploy the way your environment demands"
            description="Cloud today. Hybrid today. Self-hosted on the roadmap. Wrayth runs everywhere your people work."
            tone="blue"
          />
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {deploymentModes.map((d) => (
              <FeatureCard key={d.title} {...d} tone="blue" />
            ))}
          </div>

          <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">Platforms</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {platforms.map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card/40 p-3 text-xs">
                <p.icon className="h-5 w-5 text-muted-foreground" />
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security architecture */}
      <section id="architecture" className="border-b border-border bg-violet-500/[0.03] py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Security Architecture"
            title="Zero-knowledge, end-to-end, by design"
            description="Wrayth servers never hold plaintext. Ray never sees credentials until you unlock them. Here's the flow, layer by layer."
            tone="violet"
          />

          <div className="rounded-2xl border border-violet-500/20 bg-card/40 p-6 md:p-10">
            <div className="space-y-3">
              {architectureLayers.map((layer, i) => (
                <div key={layer.label}>
                  <div className="flex items-start gap-4 rounded-lg border border-border bg-background/60 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{layer.label}</div>
                      <div className="text-sm text-muted-foreground">{layer.detail}</div>
                    </div>
                  </div>
                  {i < architectureLayers.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="h-4 w-px bg-violet-500/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/security" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Read the full security whitepaper →
            </Link>
          </div>
        </div>
      </section>

      {/* API & Automation */}
      <section id="api" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="API & Automation"
            title="Automate everything"
            description="Wrayth is API-first. If you can script it, you can automate it — onboarding, offboarding, rotation, and reporting."
            tone="blue"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apiCapabilities.map((f) => (
              <FeatureCard key={f.title} {...f} tone="blue" />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Network className="mx-auto mb-4 h-8 w-8 text-blue-400" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to deploy Wrayth?</h2>
          <p className="mb-8 text-muted-foreground">
            Let's talk about your org, your compliance needs, and what enterprise pricing looks like for your team.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact?intent=sales">
              <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600">
                Talk to Sales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact?intent=demo">
              <Button size="lg" variant="outline">Book a Demo</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="ghost">See Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
