import { devLog } from '@/lib/logger';
/**
 * useRayLiveSignals — Track 1: Real Data Hardening.
 *
 * On mount, asks the `ray-sync-signals` edge function to refresh Ray's
 * unified findings from Vault, Scan, and Watch. Cheap, idempotent.
 * Surfaces { synced, breakdown, isSyncing } so callers can show a
 * "Ray just checked" affordance if they want.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type SyncResult = {
  ok: boolean;
  synced: number;
  breakdown: { vault: number; scan: number; watch: number };
};

const SYNC_TTL_MS = 5 * 60 * 1000; // 5 min — don't hammer on every nav

export function useRayLiveSignals(options?: { auto?: boolean }) {
  const auto = options?.auto !== false;
  const { user } = useAuth();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastRunRef = useRef<number>(0);

  const sync = useCallback(async () => {
    if (!user || isSyncing) return null;
    if (Date.now() - lastRunRef.current < SYNC_TTL_MS) return result;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ray-sync-signals", { body: {} });
      if (error) {
        devLog.warn("[useRayLiveSignals] sync failed", error);
        return null;
      }
      lastRunRef.current = Date.now();
      setResult(data as SyncResult);
      return data as SyncResult;
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, result]);

  useEffect(() => {
    if (auto) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, user?.id]);

  return { result, isSyncing, sync };
}
