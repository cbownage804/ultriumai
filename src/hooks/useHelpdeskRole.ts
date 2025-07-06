import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type HelpdeskRole = 'msp_admin' | 'msp_staff' | 'client_admin' | 'client_staff';

export interface HelpdeskUser {
  id: string;
  user_id: string;
  role: HelpdeskRole;
  is_active: boolean;
  client_id?: string;
  msp_id?: string;
}

export const useHelpdeskRole = () => {
  const [currentRole, setCurrentRole] = useState<HelpdeskRole | null>(null);
  const [userContext, setUserContext] = useState<HelpdeskUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadUserRole = async () => {
    if (!user) {
      setCurrentRole(null);
      setUserContext(null);
      setLoading(false);
      return;
    }

    try {
      // Check if user is MSP owner
      const { data: mspData } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (mspData) {
        setCurrentRole('msp_admin');
        setUserContext({
          id: mspData.id,
          user_id: user.id,
          role: 'msp_admin',
          is_active: true,
          msp_id: mspData.id
        });
        setLoading(false);
        return;
      }

      // Check if user is MSP staff
      const { data: staffData } = await supabase
        .from('msp_staff')
        .select('*, msps(id)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffData) {
        setCurrentRole(staffData.role);
        setUserContext({
          id: staffData.id,
          user_id: user.id,
          role: staffData.role,
          is_active: staffData.is_active,
          msp_id: staffData.msp_id
        });
        setLoading(false);
        return;
      }

      // Check if user is client user
      const { data: clientData } = await supabase
        .from('client_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (clientData) {
        // Get MSP ID from client
        const { data: mspClientData } = await supabase
          .from('msp_clients')
          .select('msp_id')
          .eq('id', clientData.client_id)
          .single();

        setCurrentRole(clientData.role);
        setUserContext({
          id: clientData.id,
          user_id: user.id,
          role: clientData.role,
          is_active: clientData.is_active,
          client_id: clientData.client_id,
          msp_id: mspClientData?.msp_id
        });
        setLoading(false);
        return;
      }

      // No role found
      setCurrentRole(null);
      setUserContext(null);
    } catch (error) {
      console.error('Error loading user role:', error);
      setCurrentRole(null);
      setUserContext(null);
    } finally {
      setLoading(false);
    }
  };

  const canViewInternalNotes = () => {
    return currentRole === 'msp_admin' || currentRole === 'msp_staff';
  };

  const canCreateInternalComments = () => {
    return currentRole === 'msp_admin' || currentRole === 'msp_staff';
  };

  const canAssignTickets = () => {
    return currentRole === 'msp_admin' || currentRole === 'msp_staff';
  };

  const canViewAllTickets = () => {
    return currentRole === 'msp_admin' || currentRole === 'msp_staff';
  };

  const isMSPUser = () => {
    return currentRole === 'msp_admin' || currentRole === 'msp_staff';
  };

  const isClientUser = () => {
    return currentRole === 'client_admin' || currentRole === 'client_staff';
  };

  useEffect(() => {
    loadUserRole();
  }, [user]);

  return {
    currentRole,
    userContext,
    loading,
    canViewInternalNotes,
    canCreateInternalComments,
    canAssignTickets,
    canViewAllTickets,
    isMSPUser,
    isClientUser,
    loadUserRole
  };
};