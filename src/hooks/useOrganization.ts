import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrgTeam {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  billing_email: string | null;
  max_members: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
}

export interface OrgLicense {
  id: string;
  organization_id: string;
  product: 'ai_studio' | 'safesuite' | 'vanguard';
  access_level: 'pro' | 'business' | 'enterprise';
  total_seats: number;
  used_seats: number;
  stripe_subscription_id: string | null;
  billing_cycle: 'monthly' | 'yearly';
  started_at: string;
  expires_at: string | null;
}

export interface OrgLicenseAssignment {
  id: string;
  license_id: string;
  member_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<OrgTeam | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [licenses, setLicenses] = useState<OrgLicense[]>([]);
  const [assignments, setAssignments] = useState<OrgLicenseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setMembers([]);
      setLicenses([]);
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Find the user's org via membership
      const { data: memberRows } = await supabase
        .from('org_team_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (!memberRows || memberRows.length === 0) {
        // Also check if they own an org directly
        const { data: ownedOrgs } = await supabase
          .from('org_teams')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1);

        if (ownedOrgs && ownedOrgs.length > 0) {
          const org = ownedOrgs[0] as unknown as OrgTeam;
          setOrganization(org);
          setIsAdmin(true);
          await fetchOrgDetails(org.id);
        } else {
          setOrganization(null);
          setIsAdmin(false);
        }
        setLoading(false);
        return;
      }

      const membership = memberRows[0];
      setIsAdmin(membership.role === 'owner' || membership.role === 'admin');

      const { data: orgData } = await supabase
        .from('org_teams')
        .select('*')
        .eq('id', membership.organization_id)
        .single();

      if (orgData) {
        setOrganization(orgData as unknown as OrgTeam);
        await fetchOrgDetails(membership.organization_id);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchOrgDetails = async (orgId: string) => {
    const [membersRes, licensesRes, assignmentsRes] = await Promise.all([
      supabase.from('org_team_members').select('*').eq('organization_id', orgId).order('created_at'),
      supabase.from('org_team_licenses').select('*').eq('organization_id', orgId),
      supabase.from('org_team_license_assignments').select('*'),
    ]);

    setMembers((membersRes.data || []) as unknown as OrgMember[]);
    setLicenses((licensesRes.data || []) as unknown as OrgLicense[]);
    
    // Filter assignments to only those belonging to our licenses
    const licenseIds = new Set((licensesRes.data || []).map((l: any) => l.id));
    const filteredAssignments = (assignmentsRes.data || []).filter((a: any) => licenseIds.has(a.license_id));
    setAssignments(filteredAssignments as unknown as OrgLicenseAssignment[]);
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const createOrganization = async (name: string, billingEmail?: string) => {
    if (!user) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data, error } = await supabase
      .from('org_teams')
      .insert({
        name,
        slug: `${slug}-${Date.now().toString(36)}`,
        owner_id: user.id,
        billing_email: billingEmail || user.email,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }

    toast({ title: 'Organization created', description: `${name} is ready.` });
    await fetchOrganization();
    return data as unknown as OrgTeam;
  };

  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    if (!organization || !user) return false;

    try {
      // Call the edge function which creates the member row, generates token, and sends email
      const { data, error } = await supabase.functions.invoke('org-invite-send', {
        body: {
          email,
          organizationId: organization.id,
          role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Invitation sent', description: `An invite email has been sent to ${email}.` });
      await fetchOrgDetails(organization.id);
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organization) return false;

    const { error } = await supabase
      .from('org_team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Member removed' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!organization) return false;

    const { error } = await supabase
      .from('org_team_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Role updated' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const assignLicense = async (licenseId: string, memberId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('org_team_license_assignments')
      .insert({
        license_id: licenseId,
        member_id: memberId,
        assigned_by: user.id,
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    // Increment used_seats
    const license = licenses.find(l => l.id === licenseId);
    if (license) {
      await supabase
        .from('org_team_licenses')
        .update({ used_seats: license.used_seats + 1 })
        .eq('id', licenseId);
    }

    toast({ title: 'License assigned' });
    if (organization) await fetchOrgDetails(organization.id);
    return true;
  };

  const unassignLicense = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    
    const { error } = await supabase
      .from('org_team_license_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    // Decrement used_seats
    if (assignment) {
      const license = licenses.find(l => l.id === assignment.license_id);
      if (license) {
        await supabase
          .from('org_team_licenses')
          .update({ used_seats: Math.max(0, license.used_seats - 1) })
          .eq('id', license.id);
      }
    }

    toast({ title: 'License unassigned' });
    if (organization) await fetchOrgDetails(organization.id);
    return true;
  };

  const updateOrganization = async (updates: Partial<Pick<OrgTeam, 'name' | 'billing_email' | 'max_members'>>) => {
    if (!organization) return false;

    const { error } = await supabase
      .from('org_teams')
      .update(updates)
      .eq('id', organization.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Organization updated' });
    await fetchOrganization();
    return true;
  };

  const deleteOrganization = async () => {
    if (!organization) return false;

    const { error } = await supabase
      .from('org_teams')
      .delete()
      .eq('id', organization.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Organization deleted' });
    setOrganization(null);
    setMembers([]);
    setLicenses([]);
    setAssignments([]);
    return true;
  };

  return {
    organization,
    members,
    licenses,
    assignments,
    loading,
    isAdmin,
    createOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
    assignLicense,
    unassignLicense,
    updateOrganization,
    deleteOrganization,
    refetch: fetchOrganization,
  };
};
