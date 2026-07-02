/**
 * Wrayth Features — Platform overview page.
 * Tells the story: Wrayth is the platform. Vault, Scan, Watch, Identity,
 * and Ray are the pillars. Not a landing page. Not pricing. A product tour.
 */

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield, Key, Mail, FileText, Link as LinkIcon, Globe,
  ArrowRight, Check, Minus,
  Brain, Eye, Fingerprint, AlertTriangle, History,
  Lock, ScanLine, Users, Search, Clock, BarChart3,
  Share2, KeyRound, QrCode, HardDrive, ServerCog,
  Building2, ShieldCheck, FileKey, Network, Puzzle,
  Chrome, Monitor, Apple, Smartphone, MessageSquareText,
  Sparkles, Activity, Bug, Radar,
} from "lucide-react";

// ─── Platform pillars ───────────────────────────────────────────────────────

const vaultFeatures = [
  { icon: Lock, title: "Zero-Knowledge Encryption", description: "Passwords are encrypted on-device before they ever leave." },
  { icon: Share2, title: "Secure Sharing", description: "Share credentials with people, not with the internet." },
  { icon: KeyRound, title: "Password Generator", description: "Cryptographically strong passwords, one click away." },
  { icon: AlertTriangle, title: "Breach Monitoring", description: "Ray tells you the moment a password shows up in a leak." },
  { icon: Fingerprint, title: "Passkeys & Biometrics", description: "Face ID, fingerprint, and WebAuthn passkeys built in." },
  { icon: History, title: "Password History", description: "Every rotation kept, every old secret recoverable." },
  { icon: Puzzle, title: "Browser Extension", description: "Autofill across Chrome, Edge, Firefox, and Safari." },
  { icon: HardDrive, title: "Offline Vault", description: "Your vault works even when the network doesn't." },
];

const scanTargets = [
  "URLs", "Downloads", "Email attachments", "QR codes",
  "Hashes", "Domains", "IP addresses", "Executables",
];

const scanCapabilities = [
  { icon: Radar, title: "Threat Breakdown", description: "Every signal, every reason, laid out plainly." },
  { icon: ShieldCheck, title: "MITRE ATT&CK Mapping", description: "See exactly which techniques a file or URL exhibits." },
  { icon: Bug, title: "IOC Detection", description: "Hashes, domains, and infrastructure tied to known actors." },
  { icon: Sparkles, title: "AI Explanation", description: "Ray narrates the verdict in language a human can act on." },
];

const watchFeatures = [
  { icon: Search, title: "Breach Monitoring", description: "Continuous scanning for your emails and identifiers." },
  { icon: Globe, title: "Domain Monitoring", description: "Watch your business domain for leaks and typosquats." },
  { icon: Users, title: "Identity Monitoring", description: "Track exposure of names, phones, and personal data." },
  { icon: Key, title: "Credential Exposure", description: "Ray flags reused or leaked credentials before they're used." },
  { icon: Eye, title: "Dark Web Monitoring", description: "24/7 sweeps of forums, markets, and paste sites." },
  { icon: AlertTriangle, title: "Threat Alerts", description: "Real-time notifications the moment something changes." },
];

const rayExamples = [
  {
    q: "Why is this website dangerous?",
    a: "This domain was registered 4 hours ago, uses a Let's Encrypt cert issued 12 minutes ago, and its login page is a pixel-for-pixel clone of Microsoft 365. I'd treat it as active phishing.",
  },
  {
    q: "Is this installer safe to run?",
    a: "The executable is signed, but the signing certificate is 6 days old and belongs to a shell company we've seen in three malware campaigns this month. Don't run it.",
  },
  {
    q: "Should I rotate this password?",
    a: "Yes. You've reused it across 4 accounts, and it appeared in the 2024 combolist dump last week. I can rotate it now and update the vault for you.",
  },
  {
    q: "What was that alert about?",
    a: "Your work email showed up in a credential-stuffing list on a Telegram channel this morning. The password is old — you rotated it in March — but the exposure is worth monitoring.",
  },
];

const enterpriseFeatures = [
  { icon: Building2, title: "Organizations", description: "Multi-tenant workspaces for teams and MSPs." },
  { icon: ShieldCheck, title: "Role-Based Access", description: "Granular roles, least-privilege by default." },
  { icon: Users, title: "Teams & Shared Vaults", description: "Group credentials by team, project, or client." },
  { icon: FileKey, title: "Audit Logs", description: "Every unlock, share, and rotation, forever queryable." },
  { icon: ServerCog, title: "SSO & SCIM", description: "Okta, Azure AD, Google Workspace, JumpCloud." },
  { icon: Network, title: "MSP Ready", description: "Manage clients, seats, and billing from one pane." },
];

const integrations = {
  browser: [
    { icon: Chrome, label: "Chrome" },
    { icon: Chrome, label: "Edge" },
    { icon: Chrome, label: "Firefox" },
    { icon: Chrome, label: "Safari" },
  ],
  os: [
    { icon: Monitor, label: "Windows" },
    { icon: Apple, label: "macOS" },
    { icon: Monitor, label: "Linux" },
    { icon: Smartphone, label: "Android" },
    { icon: Smartphone, label: "iOS" },
  ],
};

const compareRows: { label: string; free: boolean | string; pro: boolean | string; business: boolean | string }[] = [
  { label: "Vault", free: true, pro: true, business: true },
  { label: "Scan", free: "Limited", pro: true, business: true },
  { label: "Watch", free: "Basic", pro: true, business: true },
  { label: "Ray AI", free: "Limited", pro: true, business: true },
  { label: "Identity Monitoring", free: false, pro: true, business: true },
  { label: "Dark Web Monitoring", free: false, pro: true, business: true },
  { label: "Unlimited Passwords", free: false, pro: true, business: true },
  { label: "Unlimited Scans", free: false, pro: true, business: true },
  { label: "Shared Vaults", free: false, pro: false, business: true },
  { label: "Admin Portal & Audit Logs", free: false, pro: false, business: true },
  { label: "SSO / SCIM", free: false, pro: false, business: true },
];

// ─── Small components ───────────────────────────────────────────────────────

function PillarChip({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={`rounded-lg border ${tone} bg-black/40 px-4 py-3 text-center text-sm font-medium`}>
      {label}
    </div>
  );
}

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-green-500" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-muted-foreground/40" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WraythFeatures() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero — no duplicate landing, no pricing button */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center">
          <Badge variant="outline" className="mb-6 border-violet-500/40 text-violet-300">
            The Wrayth Platform
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Everything Wrayth Protects
          </h1>
          <p className="mx-auto mb-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            One platform. One AI teammate. Complete digital protection.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground">
            <span className="text-foreground">Vault.</span>{" "}
            <span className="text-foreground">Scan.</span>{" "}
            <span className="text-foreground">Watch.</span>{" "}
            <span className="text-foreground">Identity.</span>{" "}
            <span className="text-foreground">Ray.</span>
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="bg-green-500 text-black hover:bg-green-600">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Platform Overview — Ray sits across everything */}
      <section className="border-b border-border py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">One Platform. Every Layer.</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Wrayth is the platform. Ray is the intelligence that runs across all of it.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-8 md:p-12">
            <div className="mb-8 text-center">
              <div className="mb-6 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Wrayth
              </div>
              <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-6 py-3">
                <Brain className="h-5 w-5 text-violet-300" />
                <span className="font-semibold text-violet-200">Ray</span>
                <span className="text-sm text-violet-300/70">— across everything</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <PillarChip label="Vault" tone="border-yellow-500/30" />
              <PillarChip label="Scan" tone="border-red-500/30" />
              <PillarChip label="Watch" tone="border-purple-500/30" />
              <PillarChip label="Identity Monitoring" tone="border-blue-500/30" />
              <PillarChip label="Browser Extension" tone="border-emerald-500/30" />
              <PillarChip label="Threat Intelligence" tone="border-orange-500/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Vault */}
      <section id="vault" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <Badge className="mb-4 bg-yellow-500/10 text-yellow-500 border-0">Vault</Badge>
            <h2 className="mb-3 text-4xl font-bold">Vault</h2>
            <p className="text-lg text-muted-foreground">
              Your passwords never leave your device. Ray only sees them after
              <span className="text-foreground"> you </span> unlock the Vault.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vaultFeatures.map((f) => (
              <Card key={f.title} className="border-border/50 bg-card/40 transition-colors hover:border-yellow-500/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                    <f.icon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Scan */}
      <section id="scan" className="border-b border-border bg-red-500/[0.02] py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <Badge className="mb-4 bg-red-500/10 text-red-500 border-0">Scan</Badge>
            <h2 className="mb-3 text-4xl font-bold">Scan</h2>
            <p className="text-lg text-muted-foreground">
              Instantly analyze anything suspicious. Get a verdict, an explanation, and a next step.
            </p>
          </div>

          <div className="mb-10">
            <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">Analyze</p>
            <div className="flex flex-wrap gap-2">
              {scanTargets.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-sm text-red-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-10 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
              <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="text-sm font-semibold text-green-400">Safe</div>
            </div>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-sm font-semibold text-yellow-400">Suspicious</div>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
              <Bug className="mx-auto mb-2 h-6 w-6 text-red-500" />
              <div className="text-sm font-semibold text-red-400">Malicious</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scanCapabilities.map((f) => (
              <Card key={f.title} className="border-border/50 bg-card/40 transition-colors hover:border-red-500/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                    <f.icon className="h-5 w-5 text-red-500" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Watch */}
      <section id="watch" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-0">Watch</Badge>
            <h2 className="mb-3 text-4xl font-bold">Watch</h2>
            <p className="text-lg text-muted-foreground">
              Continuous monitoring. Not periodic scanning. Real-time awareness of your exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {watchFeatures.map((f) => (
              <Card key={f.title} className="border-border/50 bg-card/40 transition-colors hover:border-purple-500/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <f.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ray */}
      <section id="ray" className="border-b border-border bg-violet-500/[0.03] py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-0">Ray</Badge>
            <h2 className="mb-3 text-4xl font-bold">Meet Ray</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Your cybersecurity teammate. Ray watches Vault, Scan, and Watch so you don't have to.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rayExamples.map((ex) => (
              <div
                key={ex.q}
                className="rounded-xl border border-violet-500/20 bg-card/40 p-5"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="pt-1 text-sm font-medium text-foreground">{ex.q}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                    <Brain className="h-4 w-4 text-violet-300" />
                  </div>
                  <p className="pt-1 text-sm text-muted-foreground">
                    <span className="mr-1 font-semibold text-violet-300">Ray:</span>
                    {ex.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-0">Enterprise</Badge>
            <h2 className="mb-3 text-4xl font-bold">Built for Teams and MSPs</h2>
            <p className="text-lg text-muted-foreground">
              Roll Wrayth out to an org, a client, or a fleet — with the controls you need to sleep at night.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enterpriseFeatures.map((f) => (
              <Card key={f.title} className="border-border/50 bg-card/40 transition-colors hover:border-blue-500/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <f.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{f.description}</CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {["Azure AD", "Google Workspace", "Okta", "M365", "Slack", "JumpCloud"].map((tag) => (
              <span key={tag} className="rounded-md border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-b border-border py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Everywhere You Work</h2>
            <p className="text-muted-foreground">Wrayth follows you across browsers and devices.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">Browsers</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {integrations.browser.map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card/40 p-4 text-sm">
                    <b.icon className="h-6 w-6 text-muted-foreground" />
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">Devices</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {integrations.os.map((o) => (
                  <div key={o.label} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card/40 p-4 text-sm">
                    <o.icon className="h-6 w-6 text-muted-foreground" />
                    {o.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="border-b border-border py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-bold">Compare Plans</h2>
            <p className="text-muted-foreground">Every plan includes the full platform. Higher tiers unlock scale and control.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-center font-semibold">Free</th>
                  <th className="p-4 text-center font-semibold">Pro</th>
                  <th className="p-4 text-center font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-card/20"}>
                    <td className="p-4 font-medium">{row.label}</td>
                    <td className="p-4 text-center"><CompareCell value={row.free} /></td>
                    <td className="p-4 text-center"><CompareCell value={row.pro} /></td>
                    <td className="p-4 text-center"><CompareCell value={row.business} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
              See full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Activity className="mx-auto mb-4 h-8 w-8 text-violet-400" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to secure your digital life?</h2>
          <p className="mb-8 text-muted-foreground">
            Start free. Upgrade when Ray earns it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="bg-green-500 text-black hover:bg-green-600">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
