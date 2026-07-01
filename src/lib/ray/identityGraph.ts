/**
 * Identity graph — Ray's cross-reasoning between identifiers, vault accounts,
 * and exposure signals. Pure functions; no I/O. The caller supplies decrypted
 * usernames and asset metadata; this file turns them into a structured graph
 * with human-readable reasoning strings Ray can quote in the UI.
 */

export interface GraphAsset {
  id: string;
  asset_type: string; // 'email' | 'domain' | 'brand' | ...
  asset_value: string;
  threats_found?: number;
}

export interface GraphVaultEntry {
  id: string;
  title: string;
  username: string; // already decrypted, lowercased
}

export interface IdentifierNode {
  id: string;
  kind: 'email' | 'domain';
  value: string;
  exposures: number;
  accounts: { id: string; title: string }[];
  reasoning: string;
  severity: 'critical' | 'warning' | 'stable';
}

export interface IdentityGraph {
  primaryEmail: string | null;
  identifiers: IdentifierNode[];
  orphanAccounts: { id: string; title: string; username: string }[];
  totals: {
    identifiers: number;
    accountsLinked: number;
    exposedIdentifiers: number;
    accountsAtRisk: number;
  };
}

function severityFor(exposures: number, accounts: number): IdentifierNode['severity'] {
  if (exposures > 0 && accounts > 0) return 'critical';
  if (exposures > 0 || accounts >= 3) return 'warning';
  return 'stable';
}

function reasoningFor(node: Omit<IdentifierNode, 'reasoning' | 'severity'>): string {
  const { exposures, accounts, value, kind } = node;
  const label = kind === 'email' ? 'email' : 'domain';
  if (exposures > 0 && accounts.length > 0) {
    return `This ${label} shows up in ${exposures} breach${exposures === 1 ? '' : 'es'} and protects ${accounts.length} vault account${accounts.length === 1 ? '' : 's'}. Rotate those first.`;
  }
  if (exposures > 0) {
    return `Ray has ${exposures} exposure${exposures === 1 ? '' : 's'} tied to ${value}, but no vault accounts use it. Watching.`;
  }
  if (accounts.length >= 3) {
    return `${accounts.length} vault accounts depend on this ${label}. A single breach here would ripple.`;
  }
  if (accounts.length > 0) {
    return `Used by ${accounts.length} vault account${accounts.length === 1 ? '' : 's'}. Ray is watching.`;
  }
  return `Nothing tied to this ${label} yet. Ray will keep watching.`;
}

export function buildIdentityGraph(
  assets: GraphAsset[],
  vault: GraphVaultEntry[],
  primaryEmail: string | null,
): IdentityGraph {
  const norm = (s: string) => s.toLowerCase().trim();

  // Map every vault entry to its email (if any) and its domain.
  const accountsByEmail = new Map<string, { id: string; title: string }[]>();
  const accountsByDomain = new Map<string, { id: string; title: string }[]>();
  const orphanAccounts: { id: string; title: string; username: string }[] = [];

  for (const entry of vault) {
    const u = norm(entry.username);
    if (!u) {
      orphanAccounts.push({ id: entry.id, title: entry.title, username: '' });
      continue;
    }
    if (u.includes('@')) {
      const arr = accountsByEmail.get(u) ?? [];
      arr.push({ id: entry.id, title: entry.title });
      accountsByEmail.set(u, arr);
      const domain = u.split('@')[1];
      if (domain) {
        const darr = accountsByDomain.get(domain) ?? [];
        darr.push({ id: entry.id, title: entry.title });
        accountsByDomain.set(domain, darr);
      }
    } else {
      orphanAccounts.push({ id: entry.id, title: entry.title, username: u });
    }
  }

  const identifierNodes: IdentifierNode[] = [];
  const seen = new Set<string>();

  // Start with what Ray is explicitly watching.
  for (const asset of assets) {
    const kind = asset.asset_type === 'email' ? 'email' : asset.asset_type === 'domain' ? 'domain' : null;
    if (!kind) continue;
    const value = norm(asset.asset_value);
    if (seen.has(`${kind}:${value}`)) continue;
    seen.add(`${kind}:${value}`);
    const accounts = kind === 'email' ? accountsByEmail.get(value) ?? [] : accountsByDomain.get(value) ?? [];
    const base = {
      id: asset.id,
      kind,
      value,
      exposures: asset.threats_found ?? 0,
      accounts,
    };
    identifierNodes.push({
      ...base,
      reasoning: reasoningFor(base),
      severity: severityFor(base.exposures, base.accounts.length),
    });
  }

  // Surface unwatched identifiers Ray can see from the vault itself so users
  // can promote them into monitored assets. Only include those with real reach.
  for (const [email, accounts] of accountsByEmail.entries()) {
    if (seen.has(`email:${email}`)) continue;
    if (accounts.length < 2) continue; // don't spam every one-off
    seen.add(`email:${email}`);
    const base = { id: `vault:${email}`, kind: 'email' as const, value: email, exposures: 0, accounts };
    identifierNodes.push({
      ...base,
      reasoning: reasoningFor(base),
      severity: severityFor(0, accounts.length),
    });
  }

  // Sort: criticals first, then warnings, then by account fan-out.
  const rank = { critical: 0, warning: 1, stable: 2 } as const;
  identifierNodes.sort((a, b) => rank[a.severity] - rank[b.severity] || b.accounts.length - a.accounts.length);

  const totals = {
    identifiers: identifierNodes.length,
    accountsLinked: identifierNodes.reduce((s, n) => s + n.accounts.length, 0),
    exposedIdentifiers: identifierNodes.filter((n) => n.exposures > 0).length,
    accountsAtRisk: identifierNodes.filter((n) => n.exposures > 0).reduce((s, n) => s + n.accounts.length, 0),
  };

  return {
    primaryEmail: primaryEmail ? norm(primaryEmail) : null,
    identifiers: identifierNodes,
    orphanAccounts,
    totals,
  };
}
