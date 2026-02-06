import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ResellerPartner {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  website: string | null;
  tier: 'silver' | 'gold' | 'platinum';
  status: 'pending' | 'active' | 'suspended' | 'churned';
  discount_percent: number;
  logo_url: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerTheme {
  id: string;
  partner_id: string;
  theme_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  custom_domain: string | null;
  company_name_override: string | null;
  tagline: string | null;
  hide_ultrium_branding: boolean;
  powered_by_text: string | null;
  custom_css: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResellerClientTenant {
  id: string;
  partner_id: string;
  client_name: string;
  client_email: string;
  client_domain: string | null;
  seat_count: number;
  enabled_modules: string[];
  monthly_price_per_seat: number;
  resale_price_per_seat: number;
  status: 'active' | 'suspended' | 'churned' | 'trial';
  provisioned_at: string;
  trial_ends_at: string | null;
  msp_client_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerBillingRecord {
  id: string;
  partner_id: string;
  tenant_id: string | null;
  period_start: string;
  period_end: string;
  wholesale_amount: number;
  resale_amount: number;
  margin_amount: number;
  seat_count: number;
  modules: string[];
  status: 'pending' | 'paid' | 'overdue' | 'void';
  invoice_url: string | null;
  stripe_invoice_id: string | null;
  created_at: string;
}

export interface ResellerMarketingAsset {
  id: string;
  partner_id: string;
  asset_type: 'proposal' | 'one_pager' | 'slide_deck' | 'email_template' | 'case_study';
  title: string;
  description: string | null;
  file_url: string | null;
  is_co_branded: boolean;
  generated_at: string;
  metadata: Record<string, any>;
}

// ── Partner Hook ────────────────────────────────────────────
export function useResellerPartner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const partnerQuery = useQuery({
    queryKey: ['reseller-partner', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_partners')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ResellerPartner | null;
    },
    enabled: !!user,
  });

  const createPartner = useMutation({
    mutationFn: async (input: { company_name: string; contact_name: string; contact_email: string; phone?: string; website?: string }) => {
      const { data, error } = await supabase
        .from('reseller_partners')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-partner'] });
      toast({ title: 'Application Submitted', description: 'Your partner application is under review.' });
    },
  });

  const updatePartner = useMutation({
    mutationFn: async (input: Partial<ResellerPartner>) => {
      const { data, error } = await supabase
        .from('reseller_partners')
        .update(input)
        .eq('id', partnerQuery.data!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller-partner'] }),
  });

  return { partner: partnerQuery.data, isLoading: partnerQuery.isLoading, createPartner, updatePartner };
}

// ── Themes Hook ─────────────────────────────────────────────
export function useResellerThemes(partnerId?: string) {
  const queryClient = useQueryClient();

  const themesQuery = useQuery({
    queryKey: ['reseller-themes', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_themes')
        .select('*')
        .eq('partner_id', partnerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResellerTheme[];
    },
    enabled: !!partnerId,
  });

  const upsertTheme = useMutation({
    mutationFn: async (input: Partial<ResellerTheme> & { partner_id: string }) => {
      const { data, error } = await supabase
        .from('reseller_themes')
        .upsert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller-themes'] }),
  });

  return { themes: themesQuery.data || [], isLoading: themesQuery.isLoading, upsertTheme };
}

// ── Client Tenants Hook ─────────────────────────────────────
export function useResellerTenants(partnerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tenantsQuery = useQuery({
    queryKey: ['reseller-tenants', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_client_tenants')
        .select('*')
        .eq('partner_id', partnerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ResellerClientTenant[];
    },
    enabled: !!partnerId,
  });

  const createTenant = useMutation({
    mutationFn: async (input: Omit<ResellerClientTenant, 'id' | 'created_at' | 'updated_at' | 'provisioned_at'>) => {
      const { data, error } = await supabase
        .from('reseller_client_tenants')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-tenants'] });
      toast({ title: 'Client Provisioned', description: 'New client tenant created successfully.' });
    },
  });

  const updateTenant = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ResellerClientTenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('reseller_client_tenants')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reseller-tenants'] }),
  });

  return { tenants: tenantsQuery.data || [], isLoading: tenantsQuery.isLoading, createTenant, updateTenant };
}

// ── Billing Records Hook ────────────────────────────────────
export function useResellerBilling(partnerId?: string) {
  const billingQuery = useQuery({
    queryKey: ['reseller-billing', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_billing_records')
        .select('*')
        .eq('partner_id', partnerId!)
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data as ResellerBillingRecord[];
    },
    enabled: !!partnerId,
  });

  return { billing: billingQuery.data || [], isLoading: billingQuery.isLoading };
}

// ── Marketing Assets Hook ───────────────────────────────────
export function useResellerMarketing(partnerId?: string) {
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ['reseller-marketing', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_marketing_assets')
        .select('*')
        .eq('partner_id', partnerId!)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data as ResellerMarketingAsset[];
    },
    enabled: !!partnerId,
  });

  return { assets: assetsQuery.data || [], isLoading: assetsQuery.isLoading };
}

// ── Revenue Metrics Helper ──────────────────────────────────
export function useResellerMetrics(partnerId?: string) {
  const { tenants } = useResellerTenants(partnerId);
  const { billing } = useResellerBilling(partnerId);

  const activeTenants = tenants.filter(t => t.status === 'active');
  const totalSeats = activeTenants.reduce((sum, t) => sum + t.seat_count, 0);
  const totalMRR = activeTenants.reduce((sum, t) => sum + (t.resale_price_per_seat * t.seat_count), 0);
  const totalWholesale = activeTenants.reduce((sum, t) => sum + (t.monthly_price_per_seat * t.seat_count), 0);
  const totalMargin = totalMRR - totalWholesale;
  const churnedCount = tenants.filter(t => t.status === 'churned').length;

  return {
    activeTenants: activeTenants.length,
    totalTenants: tenants.length,
    totalSeats,
    totalMRR,
    totalWholesale,
    totalMargin,
    annualRevenue: totalMRR * 12,
    churnedCount,
    churnRate: tenants.length > 0 ? Math.round((churnedCount / tenants.length) * 100) : 0,
    marginPercent: totalMRR > 0 ? Math.round((totalMargin / totalMRR) * 100) : 0,
  };
}
