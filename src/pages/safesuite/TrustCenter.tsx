/**
 * Trust Center — how Ray works, in plain English.
 * App-owned content. Not a certification page.
 */
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { Eye, EyeOff, Lock, KeyRound, Clock, Brain, ShieldCheck } from 'lucide-react';

function Section({
  icon: Icon, title, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="mt-3 text-sm text-foreground/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TrustCenter() {
  return (
    <div className="flex flex-col gap-6">
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

        <Section icon={Lock} title="Encryption model">
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

        <Section icon={Brain} title="How Ray uses AI">
          <p>
            Ray uses large language models to summarize your security state and generate conversational
            guidance. Prompts include only the structured metrics needed to answer the question — not
            the contents of your Vault entries, files, or messages.
          </p>
          <p>
            Model outputs are reviewed against your own data before being shown to you. Ray will tell
            you when it does not have enough information to answer rather than guess.
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
    </div>
  );
}
