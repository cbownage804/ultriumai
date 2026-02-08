import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVanguardSub } from '@/contexts/VanguardSubscriptionContext';
import { toast } from 'sonner';

export interface SyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  results: {
    clients_to_orgs: number;
    devices_to_configs: number;
    tickets_to_activity: number;
    errors: string[];
  } | null;
}

export function useCrossModuleSync() {
  const { user } = useAuth();
  const { loading: subLoading } = useVanguardSub();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    isSyncing: false,
    results: null,
  });
  const hasAutoSynced = useRef(false);

  const runSync = useCallback(async (action: string = 'full_sync') => {
    if (!user) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const { data, error } = await supabase.functions.invoke('cross-module-sync', {
        body: { action },
      });

      if (error) throw error;

      setSyncStatus({
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        results: data.results,
      });

      const total = (data.results.clients_to_orgs || 0) +
        (data.results.devices_to_configs || 0) +
        (data.results.tickets_to_activity || 0);

      if (total > 0) {
        toast.success(`Synced ${total} records across modules`);
      }

      return data.results;
    } catch (error) {
      console.error('Cross-module sync error:', error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      toast.error('Cross-module sync failed');
    }
  }, [user]);

  // Auto-sync when user is authenticated and subscription check is done
  useEffect(() => {
    if (subLoading || !user || hasAutoSynced.current) return;
    hasAutoSynced.current = true;
    runSync();
  }, [subLoading, user, runSync]);

  return {
    ...syncStatus,
    runSync,
    syncClients: () => runSync('sync_clients'),
    syncDevices: () => runSync('sync_devices'),
    syncTickets: () => runSync('sync_tickets'),
  };
}
