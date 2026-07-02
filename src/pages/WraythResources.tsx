/**
 * Wrayth Resources — Ray's action library.
 *
 * Not a knowledge base. A library of missions Ray runs with you.
 * Emergency playbooks up top, then categorized library, then a look at what's next.
 */
import { Link } from "react-router-dom";
import Navigation from "@/components/safesuite/SafeSuiteNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAYBOOK_TEMPLATES } from "@/lib/ray/playbooks";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock,
  Flame,
  Hand,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  account: "Accounts",
  credential: "Passwords & Breaches",
  identity: "Identity",
  device: "Devices",
  exposure: "Exposure",
  mfa: "MFA",
  passkey: "Passkeys",
};

// Playbooks Ray can run end-to-end without user leaving the app.
const AUTOMATED_SLUGS = new Set([
  "password-replacement",
  "resolve-credential-exposure",
  "passkey-upgrade",
  "oauth-app-audit",
  "verify-devices",
]);

// Marketing "most used" — surfaced up top like Popular on Netflix.
const POPULAR_SLUGS = [
  "secure-microsoft",
  "mfa-setup",
  "password-replacement",
  "protect-identity",
  "passkey-upgrade",
];

const EMERGENCY = [
  { emoji: "🚨", title: "My account was hacked", desc: "Lock intruders out, rotate credentials, revoke sessions." },
  { emoji: "🎣", title: "I clicked a phishing link", desc: "Contain exposure, scan the target, rotate what was typed." },
  { emoji: "🦠", title: "I installed malware", desc: "Isolate the device, capture indicators, rotate sensitive accounts." },
  { emoji: "📱", title: "My phone was stolen", desc: "Kill sessions, revoke passkeys, freeze SIM & payment methods." },
  { emoji: "🔓", title: "My password leaked", desc: "Find every place it's reused and replace it in order of risk." },
  { emoji: "📨", title: "Someone logged into my email", desc: "Rebuild trust from the inbox out — email is the master key." },
  { emoji: "🧊", title: "Ransomware response", desc: "Isolate, preserve evidence, and walk the recovery path." },
  { emoji: "📞", title: "SIM swap recovery", desc: "Reclaim your number and cut SMS out of the loop." },
];

const COMING_SOON: { group: string; items: string[] }[] = [
  { group: "Home", items: ["Secure Ring", "Secure Nest", "Secure Alexa", "Home Assistant hardening"] },
  { group: "Business", items: ["Secure Entra ID", "Google Workspace", "Salesforce", "GitHub org"] },
  { group: "Privacy", items: ["Data broker removal", "Freeze credit (all bureaus)", "IRS Identity PIN", "SSA lock"] },
  { group: "Devices", items: ["Windows", "macOS", "Linux", "iPhone", "Android"] },
  { group: "Cloud", items: ["AWS", "Azure", "GCP", "Cloudflare"] },
];

type PB = (typeof PLAYBOOK_TEMPLATES)[number];

function difficultyOf(t: PB): { label: string; tone: string } {
  const m = t.estimated_minutes;
  if (m <= 4) return { label: "Easy", tone: "text-emerald-400 border-emerald-400/30" };
  if (m <= 8) return { label: "Intermediate", tone: "text-amber-300 border-amber-300/30" };
  return { label: "Advanced", tone: "text-rose-300 border-rose-300/30" };
}

function starsOf(t: PB): number {
  // Higher score/step ratio → more impactful → more stars.
  const impact = t.reward_score / Math.max(1, t.steps.length);
  if (impact >= 2.5) return 5;
  if (impact >= 2) return 4;
  if (impact >= 1.5) return 3;
  return 2;
}

function PlaybookCard({ t, highlight }: { t: PB; highlight?: boolean }) {
  const diff = difficultyOf(t);
  const stars = starsOf(t);
  const automated = AUTOMATED_SLUGS.has(t.slug);

  return (
    <li
      className={
        "group relative rounded-lg border p-5 transition-colors " +
        (highlight
          ? "border-violet-400/40 bg-gradient-to-br from-violet-500/[0.08] to-transparent"
          : "border-border/60 bg-card/40 hover:border-border")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-medium leading-snug">{t.title}</div>
        <span
          className={
            "shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide " +
            (automated
              ? "border-violet-400/40 text-violet-300"
              : "border-border/60 text-muted-foreground")
          }
        >
          {automated ? <Bot className="h-3 w-3" /> : <Hand className="h-3 w-3" />}
          {automated ? "Ray automates" : "Ray walks you through"}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{t.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {t.estimated_minutes} min
        </span>
        <span className="text-violet-300">+{t.reward_score} score</span>
        <span>· {t.steps.length} steps</span>
        <span className={"inline-flex items-center rounded-full border px-2 py-0.5 " + diff.tone}>
          {diff.label}
        </span>
        <span className="ml-auto inline-flex items-center gap-0.5 text-amber-300/90" aria-label={`${stars} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={"h-3 w-3 " + (i < stars ? "fill-current" : "opacity-25")} />
          ))}
        </span>
      </div>
    </li>
  );
}

export default function WraythResources() {
  const grouped = PLAYBOOK_TEMPLATES.reduce<Record<string, PB[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  const popular = POPULAR_SLUGS
    .map((s) => PLAYBOOK_TEMPLATES.find((t) => t.slug === s))
    .filter(Boolean) as PB[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero */}
      <header className="border-b border-border/40 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-violet-300 inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-3 w-3" /> Ray's action library
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Every fix is a conversation, not a checklist.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Tell Ray what happened. Ray runs the right playbook with you — one step at a time,
            in plain English. Every mission raises your security score.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth">Meet Ray <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>

          {/* Progression teaser */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Trophy, label: "Security Score", value: "42 → 91", sub: "Real progress, not badges" },
              { icon: Bot, label: "Ray-automated", value: `${AUTOMATED_SLUGS.size} playbooks`, sub: "Ray handles it for you" },
              { icon: Flame, label: "Library", value: `${PLAYBOOK_TEMPLATES.length} today, 300+ coming`, sub: "Personal · Business · Cloud" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/50 bg-card/30 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </div>
                <div className="mt-2 text-xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 space-y-20">
        {/* Emergency */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" /> Emergency playbooks
              </div>
              <h2 className="mt-2 text-2xl font-semibold">Something's wrong right now.</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pinned so you never have to search when you're panicking. Ray takes it from here.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Talk to Ray <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EMERGENCY.map((e) => (
              <li
                key={e.title}
                className="rounded-lg border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.06] to-transparent p-4"
              >
                <div className="text-lg leading-none">{e.emoji}</div>
                <div className="mt-2 text-sm font-medium">{e.title}</div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Popular */}
        <section>
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300 inline-flex items-center gap-2">
              <Star className="h-3.5 w-3.5" /> Most used
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Where most people start.</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((t) => (
              <PlaybookCard key={t.slug} t={t} highlight />
            ))}
          </ul>
        </section>

        {/* Categorized library */}
        <section className="space-y-12">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">The library</div>
            <h2 className="mt-2 text-2xl font-semibold">Organized how you actually think.</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Not "Credential Lifecycle Management." Just — Accounts. Passwords. MFA. Devices.
            </p>
          </div>

          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">
                {CATEGORY_LABEL[cat] ?? cat}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {list.map((t) => (
                  <PlaybookCard key={t.slug} t={t} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Coming soon */}
        <section className="rounded-xl border border-border/50 bg-card/30 p-8">
          <div className="text-xs uppercase tracking-[0.22em] text-violet-300 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Expanding fast
          </div>
          <h2 className="mt-2 text-2xl font-semibold">One library. Personal to cloud.</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Nobody else has an AI-run playbook library that spans your smart home, your business
            identity, your credit, and your cloud footprint — in one conversation with Ray.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {COMING_SOON.map((g) => (
              <div key={g.group}>
                <div className="text-sm font-semibold">{g.group}</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 pt-12 text-center">
          <h2 className="text-3xl font-semibold">Ray picks the right one for you.</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            The moment you sign in, Ray looks at your accounts, exposure, and devices — and
            recommends the playbook that raises your score the most.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/auth">Meet Ray <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
