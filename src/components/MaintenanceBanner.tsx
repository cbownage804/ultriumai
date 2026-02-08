import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MaintenanceBanner = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceMode();
    checkAdmin();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('maintenance-flag')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
          filter: "flag_key=eq.maintenance_mode",
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'is_enabled' in payload.new) {
            setIsMaintenanceMode(payload.new.is_enabled as boolean);
            if (payload.new.is_enabled) setDismissed(false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('flag_key', 'maintenance_mode')
        .maybeSingle();

      if (!error && data) {
        setIsMaintenanceMode(data.is_enabled);
      }
    } catch (e) {
      // Silently fail — don't block the app
    }
  };

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    } catch (e) { /* ignore */ }
  };

  if (!isMaintenanceMode || dismissed) return null;

  return (
    <div className="relative z-[100] bg-amber-500 text-amber-950 px-4 py-2">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          {isAdmin
            ? '⚠️ Maintenance mode is ACTIVE — this banner is visible to all users.'
            : 'We\'re currently performing scheduled maintenance. Some features may be temporarily unavailable.'}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-amber-950 hover:bg-amber-600/50"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
