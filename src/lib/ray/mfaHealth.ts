/**
 * 2FA Health Score — Ray's measure of how thoroughly your vault is protected
 * with two-factor authentication.
 */

import { lookupCatalog, priorityWeight, type MFACatalogEntry } from './mfaCatalog';

export interface VaultLikeEntry {
  id: string;
  url?: string | null;
  name?: string | null;
  service_name?: string | null;
}

export interface ProtectedRow {
  service_domain?: string | null;
  password_entry_id?: string | null;
}

export interface MFAHealthBreakdown {
  score: number;
  protectedCount: number;
  unprotectedCount: number;
  criticalUnprotected: number;
  eligible: number;
  protected: Array<{ entry: VaultLikeEntry; catalog: MFACatalogEntry }>;
  unprotected: Array<{ entry: VaultLikeEntry; catalog: MFACatalogEntry }>;
}

export function computeMFAHealth(
  entries: VaultLikeEntry[],
  protectedRows: ProtectedRow[],
): MFAHealthBreakdown {
  const protectedDomains = new Set(
    protectedRows
      .map((r) => (r.service_domain || '').toLowerCase())
      .filter(Boolean),
  );
  const protectedEntryIds = new Set(
    protectedRows.map((r) => r.password_entry_id).filter(Boolean) as string[],
  );

  const protectedList: MFAHealthBreakdown['protected'] = [];
  const unprotectedList: MFAHealthBreakdown['unprotected'] = [];

  let earned = 0;
  let possible = 0;
  let criticalUnprotected = 0;

  for (const entry of entries) {
    const catalog = lookupCatalog(entry.url || entry.service_name || entry.name);
    if (!catalog) continue;
    const weight = priorityWeight(catalog.priority);
    possible += weight;
    const isProtected =
      protectedDomains.has(catalog.domain) ||
      (entry.id && protectedEntryIds.has(entry.id));
    if (isProtected) {
      earned += weight;
      protectedList.push({ entry, catalog });
    } else {
      unprotectedList.push({ entry, catalog });
      if (catalog.priority === 'critical') criticalUnprotected += 1;
    }
  }

  const score = possible === 0 ? 100 : Math.round((earned / possible) * 100);
  return {
    score,
    protectedCount: protectedList.length,
    unprotectedCount: unprotectedList.length,
    criticalUnprotected,
    eligible: protectedList.length + unprotectedList.length,
    protected: protectedList,
    unprotected: unprotectedList.sort(
      (a, b) => priorityWeight(b.catalog.priority) - priorityWeight(a.catalog.priority),
    ),
  };
}

export function scoreVerdict(score: number): { label: string; tone: 'good' | 'warn' | 'critical'; line: string } {
  if (score >= 85) return { label: 'Strong', tone: 'good', line: "Most of your important accounts are protected. I'll keep watching." };
  if (score >= 60) return { label: 'Improving', tone: 'warn', line: "You're past halfway. A few more accounts and you'll be in great shape." };
  if (score >= 30) return { label: 'Exposed', tone: 'warn', line: "Several high-value accounts still don't have 2FA. Let me help you fix that." };
  return { label: 'At risk', tone: 'critical', line: "Almost nothing in your vault is protected by 2FA yet. Let's start with the most important account." };
}
