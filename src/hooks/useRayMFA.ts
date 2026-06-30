/**
 * useRayMFA — data hook for Ray's 2FA Vault.
 *
 * Owns the encrypted TOTP secrets, the recommendation queue, the live
 * 2FA Health score, and the conversational tone strings Ray uses.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  decryptString,
  encryptString,
  generateTOTP,
  getCachedMasterPassword,
  cacheMasterPassword,
} from '@/lib/ray/totpCrypto';
import { computeMFAHealth, type MFAHealthBreakdown, scoreVerdict } from '@/lib/ray/mfaHealth';
import { canonicalDomain, lookupCatalog, MFA_CATALOG, priorityWeight, type MFACatalogEntry, type MFAPriority } from '@/lib/ray/mfaCatalog';

const TOTP_TABLE = 'vault_totp_secrets' as const;
const REC_TABLE = 'vault_mfa_recommendations' as const;
const HEALTH_TABLE = 'vault_mfa_health_snapshots' as const;

type AnyTable = any; // table names not in the generated Database type yet

export interface TOTPSecretRow {
  id: string;
  service_name: string;
  service_domain: string | null;
  account_label: string | null;
  issuer: string | null;
  password_entry_id: string | null;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  secret_ciphertext: string;
  secret_iv: string;
  secret_salt: string;
  backup_codes_ciphertext: string | null;
  backup_codes_iv: string | null;
  recovery_method: string;
  notes: string | null;
  last_used_at: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface RecommendationRow {
  id: string;
  service_name: string;
  service_domain: string | null;
  priority: MFAPriority;
  reason: string | null;
  mfa_methods: string[];
  setup_url: string | null;
  status: 'pending' | 'dismissed' | 'enabled';
  password_entry_id: string | null;
  dismissed_until: string | null;
}

interface VaultEntryRow {
  id: string;
  title: string | null;
  url: string | null;
}

export function useRayMFA() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<TOTPSecretRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRow[]>([]);
  const [vaultEntries, setVaultEntries] = useState<VaultEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState<string | null>(getCachedMasterPassword());
  const [livecodes, setLivecodes] = useState<Record<string, { code: string; remaining: number }>>({});
  const tickRef = useRef<number | null>(null);

  /* ------------------------------ session ------------------------------ */
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  /* ------------------------------ loaders ------------------------------ */
  const refresh = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const [secretsRes, recRes, entriesRes] = await Promise.all([
      (supabase.from(TOTP_TABLE as AnyTable) as AnyTable)
        .select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      (supabase.from(REC_TABLE as AnyTable) as AnyTable)
        .select('*').eq('user_id', userId).neq('status', 'dismissed'),
      (supabase.from('safepass_entries' as AnyTable) as AnyTable)
        .select('id,title,url').eq('user_id', userId),
    ]);
    if (!secretsRes.error) setSecrets((secretsRes.data ?? []) as TOTPSecretRow[]);
    if (!recRes.error) setRecommendations((recRes.data ?? []) as RecommendationRow[]);
    if (!entriesRes.error) setVaultEntries((entriesRes.data ?? []) as VaultEntryRow[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  /* ------------------------------ health ------------------------------ */
  const health: MFAHealthBreakdown = useMemo(() => {
    const entriesForHealth = vaultEntries.map((e) => ({
      id: e.id, url: e.url, name: e.title, service_name: e.title,
    }));
    const protectedRows = secrets.map((s) => ({
      service_domain: s.service_domain,
      password_entry_id: s.password_entry_id,
    }));
    return computeMFAHealth(entriesForHealth, protectedRows);
  }, [vaultEntries, secrets]);

  const verdict = useMemo(() => scoreVerdict(health.score), [health.score]);

  /* ----------------------------- live codes ----------------------------- */
  useEffect(() => {
    if (!masterPassword || secrets.length === 0) {
      setLivecodes({});
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const next: Record<string, { code: string; remaining: number }> = {};
      for (const s of secrets) {
        try {
          const plain = await decryptString(
            { ciphertext: s.secret_ciphertext, iv: s.secret_iv, salt: s.secret_salt },
            masterPassword,
          );
          const code = await generateTOTP(plain, {
            algorithm: s.algorithm, digits: s.digits, period: s.period,
          });
          const remaining = s.period - Math.floor((Date.now() / 1000) % s.period);
          next[s.id] = { code, remaining };
        } catch {
          next[s.id] = { code: '------', remaining: s.period };
        }
      }
      if (!cancelled) setLivecodes(next);
    };
    void tick();
    tickRef.current = window.setInterval(tick, 1000) as unknown as number;
    return () => {
      cancelled = true;
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [masterPassword, secrets]);

  /* ---------------------------- unlock / lock --------------------------- */
  const unlock = useCallback((pw: string) => {
    if (!pw) return;
    cacheMasterPassword(pw);
    setMasterPassword(pw);
  }, []);

  /* --------------------------- recommendations -------------------------- */
  /** Scan the vault and persist a fresh recommendation list. */
  const rescanVault = useCallback(async (): Promise<RecommendationRow[]> => {
    if (!userId) return [];
    // Recompute candidates from vault entries.
    const seen = new Set<string>();
    const candidates: Array<{ entry: VaultEntryRow; catalog: MFACatalogEntry }> = [];
    for (const entry of vaultEntries) {
      const catalog = lookupCatalog(entry.url || entry.title);
      if (!catalog) continue;
      const key = `${catalog.domain}|${entry.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ entry, catalog });
    }

    const protectedKeys = new Set(
      secrets.map((s) => `${(s.service_domain || '').toLowerCase()}|${s.password_entry_id ?? ''}`),
    );

    // Upsert one row per candidate that isn't already protected.
    const inserts = candidates
      .filter(({ entry, catalog }) =>
        !protectedKeys.has(`${catalog.domain}|${entry.id}`) &&
        !secrets.some((s) => (s.service_domain || '').toLowerCase() === catalog.domain),
      )
      .map(({ entry, catalog }) => ({
        user_id: userId,
        password_entry_id: entry.id,
        service_name: catalog.name,
        service_domain: catalog.domain,
        priority: catalog.priority,
        reason: catalog.reason,
        mfa_methods: catalog.methods,
        setup_url: catalog.setupUrl,
        status: 'pending',
      }));

    if (inserts.length) {
      await (supabase.from(REC_TABLE as AnyTable) as AnyTable).upsert(inserts, {
        onConflict: 'user_id,service_domain,password_entry_id',
        ignoreDuplicates: false,
      });
    }
    await refresh();
    return inserts as unknown as RecommendationRow[];
  }, [userId, vaultEntries, secrets, refresh]);

  const dismissRecommendation = useCallback(async (id: string) => {
    await (supabase.from(REC_TABLE as AnyTable) as AnyTable)
      .update({ status: 'dismissed' }).eq('id', id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* ------------------------------- secrets ------------------------------ */
  const addSecret = useCallback(async (input: {
    serviceName: string;
    serviceDomain?: string | null;
    accountLabel?: string | null;
    issuer?: string | null;
    secret: string;
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
    digits?: number;
    period?: number;
    backupCodes?: string[];
    recoveryMethod?: string;
    passwordEntryId?: string | null;
  }) => {
    if (!userId) throw new Error('Not signed in');
    if (!masterPassword) throw new Error('Vault locked — enter your master password.');

    const enc = await encryptString(input.secret.replace(/\s+/g, '').toUpperCase(), masterPassword);
    let backupEnc: { ciphertext: string; iv: string } | null = null;
    if (input.backupCodes && input.backupCodes.length > 0) {
      const b = await encryptString(input.backupCodes.join('\n'), masterPassword);
      // share the same salt as secret? we keep separate fields, but the schema only stores
      // iv/ciphertext for backup codes; reuse the secret's salt for decryption.
      backupEnc = { ciphertext: b.ciphertext, iv: b.iv };
      // re-encrypt using the secret's salt so a single derived key works:
      const reuse = await encryptString(input.backupCodes.join('\n'), masterPassword);
      backupEnc = { ciphertext: reuse.ciphertext, iv: reuse.iv };
      // Keep using the new salt by storing it in notes? No — we instead store its own salt
      // by reusing the secret's salt via a second derivation path. For simplicity, we
      // re-encrypt the backup codes using the *secret salt* directly.
    }

    // For simplicity, re-encrypt backup codes with the secret's salt so we
    // only have one salt per row.
    let backupCt: string | null = null;
    let backupIv: string | null = null;
    if (input.backupCodes && input.backupCodes.length > 0) {
      // Reuse salt: do a fresh encryptString just for IV randomness, then
      // overwrite by deriving with the secret salt.
      const { deriveKey, bufToB64, b64ToBuf } = await import('@/lib/ray/totpCrypto');
      const key = await deriveKey(masterPassword, b64ToBuf(enc.salt));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        new TextEncoder().encode(input.backupCodes.join('\n')) as BufferSource,
      );
      backupCt = bufToB64(ct);
      backupIv = bufToB64(iv);
    }

    const domain = canonicalDomain(input.serviceDomain || input.serviceName);
    const row = {
      user_id: userId,
      password_entry_id: input.passwordEntryId ?? null,
      service_name: input.serviceName,
      service_domain: domain,
      account_label: input.accountLabel ?? null,
      issuer: input.issuer ?? null,
      secret_ciphertext: enc.ciphertext,
      secret_iv: enc.iv,
      secret_salt: enc.salt,
      algorithm: input.algorithm ?? 'SHA1',
      digits: input.digits ?? 6,
      period: input.period ?? 30,
      backup_codes_ciphertext: backupCt,
      backup_codes_iv: backupIv,
      recovery_method: input.recoveryMethod ?? 'none',
    };
    const { data, error } = await (supabase.from(TOTP_TABLE as AnyTable) as AnyTable)
      .insert(row).select('*').single();
    if (error) throw error;

    // Mark matching recommendation as enabled
    if (domain) {
      await (supabase.from(REC_TABLE as AnyTable) as AnyTable)
        .update({ status: 'enabled' })
        .eq('user_id', userId)
        .eq('service_domain', domain);
    }

    await refresh();
    return data as TOTPSecretRow;
  }, [userId, masterPassword, refresh]);

  const verifySecret = useCallback(async (
    secretId: string,
    userCode: string,
  ): Promise<boolean> => {
    if (!masterPassword) return false;
    const row = secrets.find((s) => s.id === secretId);
    if (!row) return false;
    const plain = await decryptString(
      { ciphertext: row.secret_ciphertext, iv: row.secret_iv, salt: row.secret_salt },
      masterPassword,
    );
    const now = Date.now();
    const candidates = await Promise.all(
      [-1, 0, 1].map((step) => generateTOTP(plain, {
        algorithm: row.algorithm, digits: row.digits, period: row.period,
        timestamp: now + step * row.period * 1000,
      })),
    );
    const matched = candidates.includes(userCode.replace(/\s+/g, ''));
    if (matched) {
      await (supabase.from(TOTP_TABLE as AnyTable) as AnyTable)
        .update({ verified_at: new Date().toISOString() }).eq('id', row.id);
      await refresh();
    }
    return matched;
  }, [masterPassword, secrets, refresh]);

  const deleteSecret = useCallback(async (id: string) => {
    await (supabase.from(TOTP_TABLE as AnyTable) as AnyTable).delete().eq('id', id);
    setSecrets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const revealBackupCodes = useCallback(async (id: string): Promise<string[] | null> => {
    if (!masterPassword) return null;
    const row = secrets.find((s) => s.id === id);
    if (!row || !row.backup_codes_ciphertext || !row.backup_codes_iv) return null;
    try {
      const text = await decryptString(
        { ciphertext: row.backup_codes_ciphertext, iv: row.backup_codes_iv, salt: row.secret_salt },
        masterPassword,
      );
      return text.split('\n').map((c) => c.trim()).filter(Boolean);
    } catch {
      return null;
    }
  }, [masterPassword, secrets]);

  /* ---------------------------- health snapshot --------------------------- */
  const captureSnapshot = useCallback(async () => {
    if (!userId) return;
    await (supabase.from(HEALTH_TABLE as AnyTable) as AnyTable).insert({
      user_id: userId,
      score: health.score,
      protected_count: health.protectedCount,
      unprotected_count: health.unprotectedCount,
      critical_unprotected: health.criticalUnprotected,
      details: {
        eligible: health.eligible,
        verdict: verdict.label,
      },
    });
  }, [userId, health, verdict]);

  return {
    userId,
    loading,
    secrets,
    recommendations,
    vaultEntries,
    health,
    verdict,
    livecodes,
    masterPassword,
    isLocked: !masterPassword,
    unlock,
    rescanVault,
    dismissRecommendation,
    addSecret,
    verifySecret,
    deleteSecret,
    revealBackupCodes,
    captureSnapshot,
    catalog: MFA_CATALOG,
    priorityWeight,
    toast,
  };
}
