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
  /** True when Ray can see the vault contents (unlocked). Drives confidence copy. */
  vaultUnlocked?: boolean;
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
    vaultUnlocked = true,
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
        "I can't recommend rotations, spot reuse, or link breaches to real accounts until your vault has saved passwords in it. Import from your browser or manager — five minutes and I take over from there.",
      cta: { label: 'Import passwords', to: '/app/passwords/import' },
    };
  }

  if (breachedEmailCount > 0) {
    const leadsWithName = named && topAccountReason === 'breach';
    // Confidence-aware copy: when the vault is sealed, Ray explicitly says
    // he can't yet confirm whether any *saved* passwords are affected.
    // When unlocked, he speaks with certainty about the matches he can see.
    const headline = leadsWithName
      ? `${named} appears in a breach — start there.`
      : breachedEmailCount === 1
        ? 'I found 1 breached identity.'
        : `I found ${breachedEmailCount} breached identities.`;

    const rationale = vaultUnlocked
      ? "These identities appear in known data breaches. I can now check which of your saved passwords are affected and rank the rotations for you."
      : "These identities appear in known data breaches — not necessarily passwords saved in your Vault. I can't yet determine whether any saved passwords are affected because your Vault is locked.";

    const cta = vaultUnlocked
      ? { label: 'Review affected accounts', to: '/app/passwords' }
      : { label: 'Unlock to verify affected saved passwords', to: '/app/exposure' };

    return {
      id: 'exposed_identities',
      tone: 'critical',
      headline,
      rationale,
      cta,
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
    // Ray shows inventory awareness — he speaks to what he already has,
    // then names the exact next step and the payoff.
    const inventoryLine =
      vaultCount === 1
        ? "I can see 1 saved password"
        : `I can see ${vaultCount} saved passwords`;
    return {
      id: 'watch_identity',
      tone: 'warn',
      headline: 'Tell me which emails matter and I can watch for breaches.',
      rationale: `${inventoryLine}, but no identities to watch yet. Add the emails you use most and I'll flag new breaches the moment they appear${vaultUnlocked ? ' and match them against your saved passwords' : ' — unlock the Vault later and I can match them against saved passwords too'}. Takes under a minute.`,
      cta: { label: 'Set up identity monitoring', to: '/app/exposure' },
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
