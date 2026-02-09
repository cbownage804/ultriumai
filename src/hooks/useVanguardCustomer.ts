/**
 * Hook for fetching real Vanguard customer data from the database
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface VanguardCustomer {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  domain: string | null;
  business_size: string | null;
  health_status: string | null;
  monthly_rate: number;
  endpoints: number | null;
  alerts: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
}

export interface CustomerDevice {
  id: string;
  hostname: string;
  device_type: string | null;
  status: string;
  ip_address: string | null;
}

interface UseVanguardCustomerResult {
  customer: VanguardCustomer | null;
  contacts: CustomerContact[];
  devices: CustomerDevice[];
  ticketCount: number;
  endpointCount: number;
  alertCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVanguardCustomer(customerId: string | undefined): UseVanguardCustomerResult {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<VanguardCustomer | null>(null);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [endpointCount, setEndpointCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user || !customerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch customer details
        const { data: customerData, error: customerError } = await supabase
          .from('msp_clients')
          .select('id, company_name, contact_name, contact_email, phone, domain, business_size, health_status, monthly_rate, endpoints, alerts, is_active, created_at, updated_at')
          .eq('id', customerId)
          .single();

        if (customerError) throw customerError;

        if (customerData) {
          setCustomer({
            id: customerData.id,
            company_name: customerData.company_name,
            contact_name: customerData.contact_name,
            contact_email: customerData.contact_email,
            phone: customerData.phone,
            domain: customerData.domain,
            business_size: customerData.business_size,
            health_status: customerData.health_status,
            monthly_rate: customerData.monthly_rate,
            endpoints: customerData.endpoints,
            alerts: customerData.alerts,
            is_active: customerData.is_active,
            created_at: customerData.created_at,
            updated_at: customerData.updated_at,
          });
        }

        // Fetch contacts for this customer
        const { data: contactsData } = await supabase
          .from('client_contacts')
          .select('id, contact_name, email, phone, role, is_primary')
          .eq('client_id', customerId);

        if (contactsData) {
          setContacts(contactsData.map(c => ({
            ...c,
            is_primary: c.is_primary ?? false,
          })));
        }

        // Fetch devices linked to this customer using vanguard_agents table
        const { data: agentsData, count: agentCount } = await supabase
          .from('vanguard_agents')
          .select('id, name, agent_type, status, ip_address', { count: 'exact' })
          .eq('client_id', customerId);

        if (agentsData) {
          setDevices(agentsData.slice(0, 10).map(a => ({
            id: a.id,
            hostname: a.name,
            device_type: a.agent_type,
            status: a.status,
            ip_address: a.ip_address ? String(a.ip_address) : null,
          })));
        }
        setEndpointCount(agentCount || 0);

        // Count tickets for this customer (all tickets, not filtered by user_id for MSP view)
        const { count: ticketCountResult } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', customerId);

        setTicketCount(ticketCountResult || 0);

        // Count active alerts for this customer from rmm_alerts
        let alertTotal = 0;
        
        try {
          const { count: alertsCount } = await supabase
            .from('rmm_alerts')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', customerId)
            .in('status', ['active', 'triggered']);
          alertTotal = alertsCount || 0;
        } catch {
          // Fallback to 0
        }

        setAlertCount(alertTotal);

      } catch (err) {
        console.error('Error fetching customer:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [user, customerId, refetchTrigger]);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  return { customer, contacts, devices, ticketCount, endpointCount, alertCount, isLoading, error, refetch };
}
