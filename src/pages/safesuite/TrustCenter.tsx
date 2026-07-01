/**
 * Trust Center — how Ray works, in plain English.
 * App-owned content. Not a certification page.
 */
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PageMotion } from '@/components/ray/PageMotion';
import { ExplainThis } from '@/components/ray/ExplainThis';
import { Eye, EyeOff, Lock, KeyRound, Clock, Brain, ShieldCheck } from 'lucide-react';

function Section({
  icon: Icon, title, explain, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  explain?: { title: string; body?: string; bullets?: string[] };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> <span className="flex-1">{title}</span>
        {explain && <ExplainThis {...explain} />}
      </div>
      <div className="mt-3 text-sm text-foreground/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TrustCenter() {
  return (
    <PageMotion className="flex flex-col gap-6">
      <RayPageHeader
        title="Why you can trust Ray"
        subtitle="How Ray protects your data"
        description="Maintained by the Wrayth team to answer common security and privacy questions about how Ray operates. This is not an independent certification."
      />


      <div className="grid gap-3 md:grid-cols-2">
        <Section icon={Eye} title="What Ray can see">
          <ul className="list-disc pl-5 space-y-1">
            <li>Account metadata you ask Ray to monitor (emails, usernames, domain names).</li>
            <li>The health of credentials in your Vault (strength, age, reuse, breach exposure), computed from non-reversible hashes where possible.</li>
            <li>Findings Ray generates while scanning (weak passwords, missing MFA, exposed identities).</li>
            <li>Conversations you have with Ray, so it can remember context across sessions.</li>
          </ul>
        </Section>

        <Section icon={EyeOff} title="What Ray cannot see">
          <ul className="list-disc pl-5 space-y-1">
            <li>Your master password — Ray never receives it.</li>
            <li>The plaintext of any password stored in your Vault from the server. Decryption happens in your browser.</li>
            <li>The contents of your email or files — only the metadata you choose to share.</li>
          </ul>
        </Section>

        <Section
          icon={Lock}
          title="Encryption model"
          explain={{
            title: 'Why PBKDF2 with 600,000 iterations?',
            body: 'A slow key-derivation function makes brute-forcing your master password computationally expensive — the number Ray uses matches OWASP\'s current guidance.',
          }}
        >
          <p>
            Vault entries are encrypted in your browser using a key derived from your master password
            with PBKDF2 (600,000 iterations) before being uploaded. The server stores only ciphertext.
          </p>
          <p>
            Data in transit uses TLS 1.2 or higher. Data at rest is encrypted using AES-256 on the
            underlying database storage layer.
          </p>
        </Section>

        <Section icon={KeyRound} title="Zero-knowledge architecture">
          <p>
            Because keys are derived locally, Wrayth staff cannot read your stored credentials, and
            losing your master password means the data cannot be recovered. Save your recovery codes.
          </p>
        </Section>

        <Section
          icon={Brain}
          title="How Ray uses AI"
          explain={{
            title: 'What Ray shares with the AI model',
            bullets: [
              'Password strength, age, and reuse counts — never the passwords themselves.',
              'Breach exposure flags for accounts you asked Ray to watch.',
              'MFA coverage and admin role summaries from connected tenants.',
            ],
          }}
        >
          <p className="text-foreground">
            <strong>Ray never sends your passwords to an AI.</strong>
          </p>
          <p>
            Ray only sends security metadata — password age, reuse, breach status, strength scores,
            MFA coverage. Your actual passwords never leave your encrypted Vault.
          </p>
          <p>
            When Ray needs to explain something, it uses a large language model on that metadata only,
            and will tell you when it doesn't have enough information to answer rather than guess.
          </p>
        </Section>


        <Section icon={Clock} title="Data retention">
          <p>
            Timeline events, Morning Briefs, and conversations are retained while your account is active
            so Ray can remember your history. You can delete your account at any time, which removes
            all associated records within 30 days.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="Reporting a problem">
          <p>
            If you find a security issue, please email{' '}
            <a className="underline underline-offset-4" href="mailto:support@ultriumai.com">support@ultriumai.com</a>{' '}
            with details. We respond to verified reports within two business days.
          </p>
        </Section>
      </div>
    </PageMotion>
  );
}
