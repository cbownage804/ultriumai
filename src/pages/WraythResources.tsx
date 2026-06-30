/**
 * Wrayth Resources — Track 2: Marketing surface for Ray's playbook library.
 *
 * Public-facing page that teases the security playbooks Ray runs for users,
 * organized by category. No auth required; CTA pushes visitors to /auth.
 */
import { Link } from "react-router-dom";
import Navigation from "@/components/safesuite/SafeSuiteNav";
import { Button } from "@/components/ui/button";
import { PLAYBOOK_TEMPLATES } from "@/lib/ray/playbooks";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  account: "Accounts",
  credential: "Passwords & breaches",
  identity: "Identity",
  device: "Devices",
  exposure: "Exposure",
  mfa: "MFA",
  passkey: "Passkeys",
};

export default function WraythResources() {
  const grouped = PLAYBOOK_TEMPLATES.reduce<Record<string, typeof PLAYBOOK_TEMPLATES>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <header className="border-b border-border/40 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-[11px] uppercase tracking-[0.24em] text-violet-300 inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-3 w-3" /> Ray playbooks
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Every fix is a conversation, not a checklist.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Ray runs these playbooks with you — one step at a time, in plain English. Browse what
            Ray can handle, then meet Ray and let it pick the right one for your situation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth">Meet Ray <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        {Object.entries(grouped).map(([cat, list]) => (
          <section key={cat}>
            <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">
              {CATEGORY_LABEL[cat] ?? cat}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((t) => (
                <li
                  key={t.slug}
                  className="rounded-sm border border-border/60 bg-card/40 p-5"
                >
                  <div className="text-base font-medium">{t.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{t.description}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t.estimated_minutes} min
                    </span>
                    <span className="text-violet-300">+{t.reward_score} score</span>
                    <span>· {t.steps.length} steps</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="border-t border-border/40 pt-12 text-center">
          <h2 className="text-2xl font-semibold">Ready when you are.</h2>
          <p className="mt-2 text-muted-foreground">Ray will pick the right playbook the moment you sign in.</p>
          <Button asChild className="mt-6">
            <Link to="/auth">Meet Ray <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
