import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AuditLogParams {
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAdminAction = async (params: AuditLogParams) => {
    if (!user?.email) return;

    try {
      await supabase.functions.invoke('admin-audit-logger', {
        body: {
          admin_user_id: user.id,
          admin_email: user.email,
          ...params
        }
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking admin operations
    }
  };

  return { logAdminAction };
};