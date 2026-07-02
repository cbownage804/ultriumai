/**
 * Wrayth Resources — Ray's action library.
 *
 * Not a knowledge base. A library of missions Ray runs with you.
 * Emergency playbooks up top, then filterable/searchable library.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/safesuite/SafeSuiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAYBOOK_TEMPLATES } from "@/lib/ray/playbooks";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock,
  Flame,
  Hand,
  Search,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
const POPULAR_SET = new Set(POPULAR_SLUGS);

// Everything currently in the library is personal-scope. As Business/Cloud
// playbooks ship, tag them here.
const BUSINESS_SLUGS = new Set<string>([]);
const CLOUD_SLUGS = new Set<string>([]);

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

type Difficulty = "easy" | "intermediate" | "advanced";
type Scope = "personal" | "business" | "cloud";
type Sort = "popular" | "recent" | "impact" | "quickest";
type TimeCap = 0 | 5 | 10 | 15;

function difficultyKey(t: PB): Difficulty {
  const m = t.estimated_minutes;
  if (m <= 4) return "easy";
  if (m <= 8) return "intermediate";
  return "advanced";
}

function difficultyOf(t: PB): { label: string; tone: string } {
  const d = difficultyKey(t);
  if (d === "easy") return { label: "Easy", tone: "text-emerald-400 border-emerald-400/30" };
  if (d === "intermediate") return { label: "Intermediate", tone: "text-amber-300 border-amber-300/30" };
  return { label: "Advanced", tone: "text-rose-300 border-rose-300/30" };
}

function scopeOf(t: PB): Scope {
  if (CLOUD_SLUGS.has(t.slug)) return "cloud";
  if (BUSINESS_SLUGS.has(t.slug)) return "business";
  return "personal";
}

function starsOf(t: PB): number {
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

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border transition-colors",
        active
          ? "border-violet-400/60 text-violet-200 bg-violet-500/10"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function WraythResources() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [scope, setScope] = useState<Scope | "all">("all");
  const [automatedOnly, setAutomatedOnly] = useState(false);
  const [timeCap, setTimeCap] = useState<TimeCap>(0);
  const [sort, setSort] = useState<Sort>("popular");

  const anyFilter =
    query.trim() !== "" ||
    difficulty !== "all" ||
    scope !== "all" ||
    automatedOnly ||
    timeCap !== 0 ||
    sort !== "popular";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PLAYBOOK_TEMPLATES.filter((t) => {
      if (difficulty !== "all" && difficultyKey(t) !== difficulty) return false;
      if (scope !== "all" && scopeOf(t) !== scope) return false;
      if (automatedOnly && !AUTOMATED_SLUGS.has(t.slug)) return false;
      if (timeCap !== 0 && t.estimated_minutes > timeCap) return false;
      if (q) {
        const hay = `${t.title} ${t.description} ${CATEGORY_LABEL[t.category] ?? t.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const originalIndex = new Map(PLAYBOOK_TEMPLATES.map((t, i) => [t.slug, i]));
    list = [...list].sort((a, b) => {
      if (sort === "popular") {
        const ap = POPULAR_SET.has(a.slug) ? 0 : 1;
        const bp = POPULAR_SET.has(b.slug) ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return b.reward_score - a.reward_score;
      }
      if (sort === "recent") {
        return (originalIndex.get(b.slug) ?? 0) - (originalIndex.get(a.slug) ?? 0);
      }
      if (sort === "impact") return b.reward_score - a.reward_score;
      if (sort === "quickest") return a.estimated_minutes - b.estimated_minutes;
      return 0;
    });
    return list;
  }, [query, difficulty, scope, automatedOnly, timeCap, sort]);

  const grouped = useMemo(() => {
    return PLAYBOOK_TEMPLATES.reduce<Record<string, PB[]>>((acc, t) => {
      (acc[t.category] ||= []).push(t);
      return acc;
    }, {});
  }, []);

  const popular = POPULAR_SLUGS
    .map((s) => PLAYBOOK_TEMPLATES.find((t) => t.slug === s))
    .filter(Boolean) as PB[];

  const clearFilters = () => {
    setQuery("");
    setDifficulty("all");
    setScope("all");
    setAutomatedOnly(false);
    setTimeCap(0);
    setSort("popular");
  };

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

        {/* Search + Filters */}
        <section>
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300 inline-flex items-center gap-2">
              <Search className="h-3.5 w-3.5" /> Find the right playbook
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Search the library.</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Try <span className="text-foreground">"gmail hacked"</span>,{" "}
              <span className="text-foreground">"password leaked"</span>, or{" "}
              <span className="text-foreground">"passkeys"</span>. Ray will surface every playbook that helps.
            </p>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search playbooks…"
              className="pl-9 h-11 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Difficulty</span>
              {(["all", "easy", "intermediate", "advanced"] as const).map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d === "all" ? "All" : d[0].toUpperCase() + d.slice(1)}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Scope</span>
              {(["all", "personal", "business", "cloud"] as const).map((s) => (
                <Chip key={s} active={scope === s} onClick={() => setScope(s)}>
                  {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                  {(s === "business" || s === "cloud") && (
                    <span className="ml-1 text-[9px] uppercase tracking-wide text-muted-foreground/70">soon</span>
                  )}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Time</span>
              {([0, 5, 10, 15] as const).map((m) => (
                <Chip key={m} active={timeCap === m} onClick={() => setTimeCap(m)}>
                  {m === 0 ? "Any" : `≤ ${m} min`}
                </Chip>
              ))}
              <Chip active={automatedOnly} onClick={() => setAutomatedOnly(!automatedOnly)}>
                <Bot className="h-3 w-3 inline mr-1" /> Ray-automated
              </Chip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Sort</span>
              {([
                ["popular", "Most popular"],
                ["recent", "Recently added"],
                ["impact", "Highest impact"],
                ["quickest", "Quickest"],
              ] as const).map(([id, label]) => (
                <Chip key={id} active={sort === id} onClick={() => setSort(id)}>
                  {label}
                </Chip>
              ))}
              {anyFilter && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          </div>

          {anyFilter && (
            <div className="mt-6">
              <div className="text-xs text-muted-foreground mb-3">
                {results.length} {results.length === 1 ? "playbook" : "playbooks"} match
              </div>
              {results.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {results.map((t) => (
                    <PlaybookCard key={t.slug} t={t} />
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nothing matches yet. Ray can still help — just{" "}
                    <Link to="/auth" className="text-violet-300 hover:underline">tell Ray what happened</Link>.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {!anyFilter && (
          <>
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
          </>
        )}

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
