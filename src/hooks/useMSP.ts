import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MSP {
  id: string;
  user_id: string;
  company_name: string;
  domain: string;
  brand_name: string;
  brand_color: string;
  secondary_color: string;
  logo_url?: string;
  contact_email: string;
  phone?: string;
  address?: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  max_clients: number;
  monthly_rate_per_user: number;
  commission_rate: number;
  is_active: boolean;
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
}

export interface MSPClient {
  id: string;
  msp_id: string;
  company_name: string;
  domain?: string;
  contact_name: string;
  contact_email: string;
  phone?: string;
  max_users: number;
  current_users: number;
  monthly_rate: number;
  billing_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: string;
  last_billed_at?: string;
  widget_enabled: boolean;
  webapp_enabled: boolean;
  api_enabled: boolean;
  custom_branding: any;
  integration_settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tier?: 'basic' | 'premium' | 'enterprise';
  tool_access?: {
    rmm: boolean;
    helpdesk: boolean;
    asset_management: boolean;
    compliance: boolean;
    security_scanner: boolean;
  };
  endpoints?: number;
  alerts?: number;
}

export interface MSPRevenue {
  id: string;
  msp_id: string;
  client_id: string;
  billing_period_start: string;
  billing_period_end: string;
  users_count: number;
  client_charge: number;
  ultrium_fee: number;
  msp_profit: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MSPUsage {
  id: string;
  msp_id: string;
  client_id: string;
  user_email: string;
  action: string;
  widget_type?: string;
  metadata: any;
  created_at: string;
}

export interface MSPLicensePool {
  id: string;
  msp_id: string;
  tier: 'basic' | 'premium' | 'enterprise';
  total_licenses: number;
  assigned_licenses: number;
  available_licenses: number;
  price_per_license: number;
  created_at: string;
  updated_at: string;
}

export interface MSPClientLicenseAssignment {
  id: string;
  client_id: string;
  tier: 'basic' | 'premium' | 'enterprise';
  assigned_users: number;
  price_per_user: number;
  created_at: string;
  updated_at: string;
}

export interface MSPUserLicenseAssignment {
  id: string;
  client_id: string;
  user_email: string;
  user_name?: string;
  tier: 'basic' | 'premium' | 'enterprise';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMSP = () => {
  const [msp, setMSP] = useState<MSP | null>(null);
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [revenue, setRevenue] = useState<MSPRevenue[]>([]);
  const [usage, setUsage] = useState<MSPUsage[]>([]);
  const [licensePools, setLicensePools] = useState<MSPLicensePool[]>([]);
  const [clientLicenseAssignments, setClientLicenseAssignments] = useState<MSPClientLicenseAssignment[]>([]);
  const [userLicenseAssignments, setUserLicenseAssignments] = useState<MSPUserLicenseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to safely parse tool_access
  const parseToolAccess = (toolAccess: any) => {
    if (!toolAccess) {
      return {
        rmm: false,
        helpdesk: false,
        asset_management: false,
        compliance: false,
        security_scanner: false,
      };
    }
    
    if (typeof toolAccess === 'object' && toolAccess !== null) {
      return {
        rmm: Boolean(toolAccess.rmm),
        helpdesk: Boolean(toolAccess.helpdesk),
        asset_management: Boolean(toolAccess.asset_management),
        compliance: Boolean(toolAccess.compliance),
        security_scanner: Boolean(toolAccess.security_scanner),
      };
    }
    
    return {
      rmm: false,
      helpdesk: false,
      asset_management: false,
      compliance: false,
      security_scanner: false,
    };
  };

  // Load MSP profile
  const loadMSP = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('msps')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setMSP(data as MSP | null);
    } catch (error) {
      console.error('Error loading MSP:', error);
    }
  };

  // Load MSP clients (relies on RLS to scope visibility — includes Ultrium employee access)
  const loadClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('msp_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedClients = (data || []).map(client => ({
        ...client,
        tool_access: parseToolAccess(client.tool_access),
        endpoints: client.endpoints || 0,
        alerts: client.alerts || 0,
      })) as MSPClient[];
      
      setClients(transformedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    }
  };

  // Load revenue data
  const loadRevenue = async () => {
    if (!msp) return;

    try {
      const { data, error } = await supabase
        .from('msp_revenue')
        .select('*')
        .eq('msp_id', msp.id)
        .order('billing_period_start', { ascending: false })
        .limit(12); // Last 12 months

      if (error) throw error;
      setRevenue((data || []) as MSPRevenue[]);
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  // Load usage analytics
  const loadUsage = async () => {
    if (!msp) return;

    try {
      const { data, error } = await supabase
        .from('msp_usage_logs')
        .select('*')
        .eq('msp_id', msp.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsage(data || []);
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  // Load license pools
  const loadLicensePools = async () => {
    if (!msp) return;

    try {
      const { data, error } = await supabase
        .from('msp_license_pools')
        .select('*')
        .eq('msp_id', msp.id)
        .order('tier');

      if (error) throw error;
      setLicensePools((data || []) as MSPLicensePool[]);
    } catch (error) {
      console.error('Error loading license pools:', error);
    }
  };

  // Load client license assignments
  const loadClientLicenseAssignments = async () => {
    if (!msp) return;

    try {
      const { data, error } = await supabase
        .from('msp_client_license_assignments')
        .select(`
          *,
          msp_clients!inner(company_name)
        `)
        .eq('msp_clients.msp_id', msp.id);

      if (error) throw error;
      setClientLicenseAssignments((data || []) as MSPClientLicenseAssignment[]);
    } catch (error) {
      console.error('Error loading client license assignments:', error);
    }
  };

  // Load user license assignments
  const loadUserLicenseAssignments = async () => {
    if (!msp) return;

    try {
      const { data, error } = await supabase
        .from('msp_user_license_assignments')
        .select(`
          *,
          msp_clients!inner(company_name)
        `)
        .eq('msp_clients.msp_id', msp.id);

      if (error) throw error;
      setUserLicenseAssignments((data || []) as MSPUserLicenseAssignment[]);
    } catch (error) {
      console.error('Error loading user license assignments:', error);
    }
  };

  // Assign tier to client
  const assignClientTier = async (clientId: string, tier: 'basic' | 'premium' | 'enterprise', assignedUsers: number, pricePerUser: number) => {
    if (!msp) return null;

    // Check if MSP has enough available licenses
    const pool = licensePools.find(p => p.tier === tier);
    if (!pool || pool.available_licenses < assignedUsers) {
      toast({
        title: "Error",
        description: `Not enough ${tier} licenses available. You have ${pool?.available_licenses || 0} licenses left.`,
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('msp_client_license_assignments')
        .upsert({
          client_id: clientId,
          tier,
          assigned_users: assignedUsers,
          price_per_user: pricePerUser
        })
        .select()
        .single();

      if (error) throw error;

      await loadLicensePools(); // Refresh license pools
      await loadClientLicenseAssignments(); // Refresh assignments
      
      toast({
        title: "Success",
        description: `Assigned ${assignedUsers} ${tier} licenses to client`,
      });

      return data;
    } catch (error) {
      console.error('Error assigning client tier:', error);
      toast({
        title: "Error",
        description: "Failed to assign client tier",
        variant: "destructive",
      });
      return null;
    }
  };

  // Assign tier to individual user
  const assignUserTier = async (clientId: string, userEmail: string, userName: string, tier: 'basic' | 'premium' | 'enterprise') => {
    if (!msp) return null;

    try {
      const { data, error } = await supabase
        .from('msp_user_license_assignments')
        .upsert({
          client_id: clientId,
          user_email: userEmail,
          user_name: userName,
          tier,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await loadLicensePools(); // Refresh license pools
      await loadUserLicenseAssignments(); // Refresh assignments
      
      toast({
        title: "Success",
        description: `Assigned ${tier} license to ${userEmail}`,
      });

      return data;
    } catch (error) {
      console.error('Error assigning user tier:', error);
      toast({
        title: "Error",
        description: "Failed to assign user tier",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create MSP profile
  const createMSP = async (mspData: {
    company_name: string;
    domain: string;
    contact_email: string;
    phone?: string;
    brand_name?: string;
    brand_color?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('msps')
        .insert({
          user_id: user.id,
          company_name: mspData.company_name,
          domain: mspData.domain,
          contact_email: mspData.contact_email,
          phone: mspData.phone,
          brand_name: mspData.brand_name || 'Vault',
          brand_color: mspData.brand_color || '#3b82f6'
        })
        .select()
        .single();

      if (error) throw error;

      setMSP(data as MSP);
      toast({
        title: "Success",
        description: "MSP profile created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating MSP:', error);
      toast({
        title: "Error",
        description: "Failed to create MSP profile",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create MSP client
  const createClient = async (clientData: {
    company_name: string;
    contact_name: string;
    contact_email: string;
    domain?: string;
    phone?: string;
    max_users?: number;
    monthly_rate: number;
    business_size?: string;
    onboarding_fee_amount?: number;
    tier?: 'basic' | 'premium' | 'enterprise';
  }) => {
    if (!msp) return null;

    try {
      const { data, error } = await supabase
        .from('msp_clients')
        .insert({
          msp_id: msp.id,
          company_name: clientData.company_name,
          contact_name: clientData.contact_name,
          contact_email: clientData.contact_email,
          domain: clientData.domain,
          phone: clientData.phone,
          max_users: clientData.max_users || 5,
          monthly_rate: clientData.monthly_rate,
          business_size: clientData.business_size || 'small',
          onboarding_fee_amount: clientData.onboarding_fee_amount || 500,
          onboarding_fee_paid: false,
          tier: clientData.tier || 'basic'
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to match our interface
      const transformedClient = {
        ...data,
        tool_access: parseToolAccess(data.tool_access),
        endpoints: data.endpoints || 0,
        alerts: data.alerts || 0,
      } as MSPClient;

      setClients(prev => [transformedClient, ...prev]);
      toast({
        title: "Success",
        description: `Client ${clientData.company_name} added successfully`,
      });

      return transformedClient;
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update MSP client
  const updateClient = async (clientId: string, updates: Partial<MSPClient>) => {
    try {
      const { data, error } = await supabase
        .from('msp_clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to match our interface
      const transformedClient = {
        ...data,
        tool_access: parseToolAccess(data.tool_access),
        endpoints: data.endpoints || 0,
        alerts: data.alerts || 0,
      } as MSPClient;

      setClients(prev => prev.map(client => 
        client.id === clientId ? transformedClient : client
      ));

      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      return transformedClient;
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
      return null;
    }
  };

  // Generate widget embed code
  const generateEmbedCode = (client: MSPClient) => {
    const embedUrl = `${window.location.origin}/embed/safepass`;
    const config = {
      tenantId: client.id,
      brandName: msp?.brand_name || 'Vault',
      primaryColor: msp?.brand_color || '#3b82f6',
      apiEndpoint: `${window.location.origin}/api/safepass`
    };

    return `<!-- ${msp?.brand_name || 'Vault'} Widget -->
<script>
(function() {
  var config = ${JSON.stringify(config, null, 2)};
  var script = document.createElement('script');
  script.src = '${embedUrl}/widget.js';
  script.async = true;
  script.onload = function() {
    VaultWidget.init(config);
  };
  document.head.appendChild(script);
})();
</script>`;
  };

  // Calculate MSP metrics
  const calculateMetrics = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.billing_status === 'active').length;
    const totalUsers = clients.reduce((sum, c) => sum + c.current_users, 0);
    const monthlyRevenue = clients.reduce((sum, c) => {
      if (c.billing_status === 'active') {
        return sum + (c.current_users * c.monthly_rate);
      }
      return sum;
    }, 0);
    const monthlyProfit = monthlyRevenue * (msp?.commission_rate || 0.6667);

    return {
      totalClients,
      activeClients,
      totalUsers,
      monthlyRevenue,
      monthlyProfit,
      averageRevenuePerClient: activeClients > 0 ? monthlyRevenue / activeClients : 0
    };
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadMSP();
    }
    setIsLoading(false);
  }, [user]);

  // Load data when MSP is loaded
  useEffect(() => {
    if (msp) {
      loadClients();
      loadRevenue();
      loadUsage();
      loadLicensePools();
      loadClientLicenseAssignments();
      loadUserLicenseAssignments();
    }
  }, [msp]);

  return {
    msp,
    clients,
    revenue,
    usage,
    licensePools,
    clientLicenseAssignments,
    userLicenseAssignments,
    isLoading,
    createMSP,
    createClient,
    updateClient,
    generateEmbedCode,
    calculateMetrics,
    loadMSP,
    loadClients,
    loadRevenue,
    loadUsage,
    loadLicensePools,
    loadClientLicenseAssignments,
    loadUserLicenseAssignments,
    assignClientTier,
    assignUserTier,
    setClients
  };
};
