/**
 * Ray's CISO synthesis — the single most important thing to do next.
 *
 * Given the same signals the dashboard already has (vault stats, monitored
 * assets, breach hits), produce ONE directive framed as advice from a
 * personal security officer. Deterministic, ranked, no invented data.
 *
 * The rule: if I were your CISO, what would I tell you to do next?
 */

export type CisoTone = 'critical' | 'warn' | 'good';

export interface CisoDirective {
  /** Stable id so the UI can suppress repeats. */
  id: string;
  tone: CisoTone;
  /** Single-sentence directive, first-person from Ray. */
  headline: string;
  /** One short paragraph of "why this, why now". */
  rationale: string;
  /** Optional CTA. Ray only proposes an action when there is a real one. */
  cta?: { label: string; to: string };
}

export interface CisoInput {
  vaultCount: number;
  weakCount: number;
  strongCount: number;
  breachedEmailCount: number;
  monitoredEmailsWithoutVaultLink: number;
  monitoredAssets: number;
  mfaMissingCount?: number;
  reusedPasswordCount?: number;
  /**
   * Optional: the single most urgent account, if the caller already ranked
   * one. When present, Ray names it in the directive so the advice is
   * concrete ("start with Dropbox") instead of generic ("rotate weak ones").
   */
  topAccountTitle?: string;
  topAccountReason?: 'breach' | 'weak' | 'reuse' | 'mfa';
}

/**
 * Rank the possible next actions and return the single winner. Order of
 * evaluation IS the priority — breaches beat weak passwords, weak beats MFA,
 * MFA beats "add monitoring", monitoring beats "add first password", and a
 * healthy state gets a real "you're good" note instead of silence.
 */
export function nextBestAction(input: CisoInput): CisoDirective {
  const {
    vaultCount,
    weakCount,
    strongCount,
    breachedEmailCount,
    monitoredEmailsWithoutVaultLink,
    monitoredAssets,
    mfaMissingCount = 0,
    reusedPasswordCount = 0,
    topAccountTitle,
    topAccountReason,
  } = input;

  const named = topAccountTitle?.trim();

  if (vaultCount === 0) {
    return {
      id: 'seed_vault',
      tone: 'warn',
      headline: "Start by giving me something to protect.",
      rationale:
        "I can't recommend rotations, spot reuse, or link exposures to real accounts until your vault has passwords in it. Import from your browser or manager — five minutes and I take over from there.",
      cta: { label: 'Import passwords', to: '/app/passwords/import' },
    };
  }

  if (breachedEmailCount > 0) {
    const leadsWithName = named && topAccountReason === 'breach';
    return {
      id: 'exposed_identities',
      tone: 'critical',
      headline: leadsWithName
        ? `${named} appears in a breach — start there.`
        : breachedEmailCount === 1
          ? 'I found 1 breach exposure on a monitored identity.'
          : `I found ${breachedEmailCount} breach exposures on monitored identities.`,
      rationale:
        "These are exposures tied to identities I'm watching — not confirmed saved passwords. Review the exposures on the Exposure page, then unlock Vault if you want me to check whether any saved passwords are reused or affected.",
      cta: { label: 'View exposures', to: '/app/exposure' },
    };
  }


  if (weakCount >= Math.max(3, Math.ceil(vaultCount * 0.25))) {
    const leadsWithName = named && topAccountReason === 'weak';
    return {
      id: 'strengthen_batch',
      tone: 'warn',
      headline: leadsWithName
        ? `Start with ${named} — it's the weakest one I see.`
        : `Let me help you rewrite ${weakCount} weak passwords this week.`,
      rationale: leadsWithName
        ? `A quarter of your vault is below the strength I'd sign off on, and ${named} is at the bottom. We'll do them in one sitting — I generate, you approve, we move on.`
        : "A quarter of your vault is below the strength I'd sign off on. We'll do them in one sitting — I generate, you approve, we move on.",
      cta: { label: 'Review Health', to: '/app/passwords' },
    };
  }

  if (reusedPasswordCount >= 2) {
    const leadsWithName = named && topAccountReason === 'reuse';
    return {
      id: 'break_reuse',
      tone: 'warn',
      headline: leadsWithName
        ? `Break the chain at ${named} first.`
        : `Break the ${reusedPasswordCount} reused passwords before one leak becomes many.`,
      rationale:
        "Reuse turns a single breach into a domino. Give me a few minutes and I'll give each account its own strong credential.",
      cta: { label: 'Review Health', to: '/app/passwords' },
    };
  }

  if (mfaMissingCount >= 3) {
    return {
      id: 'add_mfa',
      tone: 'warn',
      headline: `Add MFA to your ${mfaMissingCount} highest-value accounts.`,
      rationale:
        "MFA is the cheapest security upgrade you'll ever make. Even if a password leaks, a second factor keeps the door shut.",
      cta: { label: 'Open Vault', to: '/app/passwords/list' },
    };
  }

  if (monitoredAssets === 0) {
    return {
      id: 'watch_identity',
      tone: 'warn',
      headline: "Tell me which emails matter so I can watch them for you.",
      rationale:
        "Without an identity to watch, I can only react to what lands in your vault. Add the emails you use most and I'll flag new exposures the moment they appear.",
      cta: { label: 'Set up Watch', to: '/app/exposure' },
    };
  }

  if (monitoredEmailsWithoutVaultLink > 0) {
    return {
      id: 'link_monitored',
      tone: 'good',
      headline:
        'Connect your monitored emails to the accounts they protect.',
      rationale:
        "You're watching identities, but I don't yet know which vault entries share those emails. Link them and a future breach becomes a one-click rotation instead of a hunt.",
      cta: { label: 'Open Vault', to: '/app/passwords/list' },
    };
  }

  if (strongCount === vaultCount && vaultCount >= 5) {
    return {
      id: 'holding_the_line',
      tone: 'good',
      headline: "You're in the safest 5% of vaults I've seen — keep it there.",
      rationale:
        "Every password is strong, nothing's exposed, and I'm watching your identities. My advice: check in weekly, and let me know the moment anything feels off.",
    };
  }

  return {
    id: 'steady_state',
    tone: 'good',
    headline: "Nothing urgent — a good week to add one more account to the vault.",
    rationale:
      "No breaches, no weak items I'd rewrite today. If there's an account you still log into from memory, that's the next one worth handing me.",
    cta: { label: 'Open Vault', to: '/app/passwords/list' },
  };
}
