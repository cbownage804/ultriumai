import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type NotificationType = 'suspended' | 'reactivated' | 'removed' | 'role_changed';

const sendMemberNotification = async (type: NotificationType, memberEmail: string, organizationId: string, newRole?: string) => {
  try {
    await supabase.functions.invoke('org-member-notify', {
      body: { type, memberEmail, organizationId, newRole },
    });
  } catch (err) {
    console.warn('Failed to send member notification:', err);
  }
};

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
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [isMSPAdmin, setIsMSPAdmin] = useState(false);

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'owner' || userRole === 'admin' || isMSPAdmin;

  const fetchOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null);
      setMembers([]);
      setLicenses([]);
      setAssignments([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user has msp_admin role in user_roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'msp_admin')
        .maybeSingle();
      setIsMSPAdmin(!!roleData);

      // Find the user's org via membership
      const { data: memberRows } = await supabase
        .from('org_team_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (!memberRows || memberRows.length === 0) {
        // Check if they own an org directly
        const { data: ownedOrgs } = await supabase
          .from('org_teams')
          .select('*')
          .eq('owner_id', user.id)
          .limit(1);

        if (ownedOrgs && ownedOrgs.length > 0) {
          const org = ownedOrgs[0] as unknown as OrgTeam;
          setOrganization(org);
          setUserRole('owner');
          await fetchOrgDetails(org.id);
        } else {
          setOrganization(null);
          setUserRole(null);
        }
        setLoading(false);
        return;
      }

      const membership = memberRows[0];
      setUserRole(membership.role as 'owner' | 'admin' | 'member');

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
    const [membersRes, licensesRes] = await Promise.all([
      supabase.from('org_team_members').select('*').eq('organization_id', orgId).order('created_at'),
      supabase.from('org_team_licenses').select('*').eq('organization_id', orgId),
    ]);

    setMembers((membersRes.data || []) as unknown as OrgMember[]);
    setLicenses((licensesRes.data || []) as unknown as OrgLicense[]);

    // Fetch assignments scoped to this org's licenses only
    const licenseIds = (licensesRes.data || []).map((l: any) => l.id);
    if (licenseIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from('org_team_license_assignments')
        .select('*')
        .in('license_id', licenseIds);
      setAssignments((assignmentsData || []) as unknown as OrgLicenseAssignment[]);
    } else {
      setAssignments([]);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  // Permission helpers
  const canManageMember = (targetMember: OrgMember): boolean => {
    if (!isAdmin) return false;
    if (targetMember.role === 'owner') return false; // Nobody can manage owner
    if (targetMember.role === 'admin' && !isOwner) return false; // Only owner can manage admins
    return true;
  };

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
    if (!organization || !user || !isAdmin) return false;

    try {
      const { data, error } = await supabase.functions.invoke('org-invite-send', {
        body: { email, organizationId: organization.id, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Invitation sent', description: `An invite email has been sent to ${email}.` });
      await fetchOrgDetails(organization.id);
      return true;
    } catch (err: unknown) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organization) return false;
    const target = members.find(m => m.id === memberId);
    if (target && !canManageMember(target)) {
      toast({ title: 'Permission denied', description: 'You cannot remove this member.', variant: 'destructive' });
      return false;
    }

    // Remove license assignments first
    const memberAssignments = assignments.filter(a => a.member_id === memberId);
    for (const a of memberAssignments) {
      await supabase.from('org_team_license_assignments').delete().eq('id', a.id);
      const license = licenses.find(l => l.id === a.license_id);
      if (license) {
        await supabase.from('org_team_licenses').update({ used_seats: Math.max(0, license.used_seats - 1) }).eq('id', license.id);
      }
    }

    const { error } = await supabase.from('org_team_members').delete().eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    if (target) sendMemberNotification('removed', target.email, organization.id);
    toast({ title: 'Member removed' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const suspendMember = async (memberId: string) => {
    if (!organization) return false;
    const target = members.find(m => m.id === memberId);
    if (target && !canManageMember(target)) {
      toast({ title: 'Permission denied', variant: 'destructive' });
      return false;
    }

    const { error } = await supabase.from('org_team_members').update({ status: 'suspended' }).eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    if (target) sendMemberNotification('suspended', target.email, organization.id);
    toast({ title: 'Member suspended' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const reactivateMember = async (memberId: string) => {
    if (!organization || !isAdmin) return false;

    const { error } = await supabase.from('org_team_members').update({ status: 'active' }).eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    const target = members.find(m => m.id === memberId);
    if (target) sendMemberNotification('reactivated', target.email, organization.id);
    toast({ title: 'Member reactivated' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (!organization) return false;
    const target = members.find(m => m.id === memberId);
    if (target && !canManageMember(target)) {
      toast({ title: 'Permission denied', description: 'Only the owner can change admin roles.', variant: 'destructive' });
      return false;
    }

    const { error } = await supabase.from('org_team_members').update({ role }).eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    if (target) sendMemberNotification('role_changed', target.email, organization.id, role);
    toast({ title: 'Role updated' });
    await fetchOrgDetails(organization.id);
    return true;
  };

  const transferOwnership = async (memberId: string) => {
    if (!organization || !isOwner || !user) return false;

    const target = members.find(m => m.id === memberId);
    if (!target || !target.user_id || target.status !== 'active') {
      toast({ title: 'Error', description: 'Can only transfer to an active member.', variant: 'destructive' });
      return false;
    }

    // Update org owner_id
    const { error: orgErr } = await supabase
      .from('org_teams')
      .update({ owner_id: target.user_id })
      .eq('id', organization.id);
    if (orgErr) {
      toast({ title: 'Error', description: orgErr.message, variant: 'destructive' });
      return false;
    }

    // Set new owner role
    await supabase.from('org_team_members').update({ role: 'owner' }).eq('id', memberId);
    // Demote current owner to admin
    const currentOwnerMember = members.find(m => m.user_id === user.id);
    if (currentOwnerMember) {
      await supabase.from('org_team_members').update({ role: 'admin' }).eq('id', currentOwnerMember.id);
    }

    toast({ title: 'Ownership transferred', description: `${target.email} is now the owner.` });
    await fetchOrganization();
    return true;
  };

  const syncMemberProductAccess = async (memberId: string, product: string, accessLevel: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member?.user_id) return;
    await supabase.from('user_product_access').upsert({
      user_id: member.user_id,
      product,
      access_level: accessLevel,
      granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,product' });
  };

  const revokeMemberProductAccess = async (memberId: string, product: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member?.user_id) return;
    // Only revoke if no other org license for same product is assigned to this member
    const otherAssignments = assignments.filter(a => a.member_id === memberId);
    const hasOtherLicenseForProduct = otherAssignments.some(a => {
      const lic = licenses.find(l => l.id === a.license_id);
      return lic && lic.product === product;
    });
    if (!hasOtherLicenseForProduct) {
      await supabase.from('user_product_access').upsert({
        user_id: member.user_id,
        product,
        access_level: 'free',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,product' });
    }
  };

  const assignLicense = async (licenseId: string, memberId: string) => {
    if (!user || !isAdmin) return false;

    const { error } = await supabase
      .from('org_team_license_assignments')
      .insert({ license_id: licenseId, member_id: memberId, assigned_by: user.id });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    const license = licenses.find(l => l.id === licenseId);
    if (license) {
      await supabase.from('org_team_licenses').update({ used_seats: license.used_seats + 1 }).eq('id', licenseId);
      // Sync product access for the member
      await syncMemberProductAccess(memberId, license.product, license.access_level);
    }

    toast({ title: 'License assigned' });
    if (organization) await fetchOrgDetails(organization.id);
    return true;
  };

  const unassignLicense = async (assignmentId: string) => {
    if (!isAdmin) return false;
    const assignment = assignments.find(a => a.id === assignmentId);
    
    const { error } = await supabase.from('org_team_license_assignments').delete().eq('id', assignmentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    if (assignment) {
      const license = licenses.find(l => l.id === assignment.license_id);
      if (license) {
        await supabase.from('org_team_licenses').update({ used_seats: Math.max(0, license.used_seats - 1) }).eq('id', license.id);
        // Revoke product access if no other license covers it
        await revokeMemberProductAccess(assignment.member_id, license.product);
      }
    }

    toast({ title: 'License unassigned' });
    if (organization) await fetchOrgDetails(organization.id);
    return true;
  };

  const updateOrganization = async (updates: Partial<Pick<OrgTeam, 'name' | 'billing_email' | 'max_members'>>) => {
    if (!organization || !isAdmin) return false;

    const { error } = await supabase.from('org_teams').update(updates).eq('id', organization.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Organization updated' });
    await fetchOrganization();
    return true;
  };

  const deleteOrganization = async () => {
    if (!organization || !isOwner) {
      toast({ title: 'Permission denied', description: 'Only the owner can delete the organization.', variant: 'destructive' });
      return false;
    }

    const { error } = await supabase.from('org_teams').delete().eq('id', organization.id);
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

  const offboardMember = async (memberId: string) => {
    if (!organization || !isAdmin) return false;
    const target = members.find(m => m.id === memberId);
    if (!target || target.role === 'owner') {
      toast({ title: 'Cannot offboard', description: 'Cannot offboard the organization owner.', variant: 'destructive' });
      return false;
    }

    // 1. Revoke all license assignments
    const memberAssignments = assignments.filter(a => a.member_id === memberId);
    for (const a of memberAssignments) {
      await supabase.from('org_team_license_assignments').delete().eq('id', a.id);
      const license = licenses.find(l => l.id === a.license_id);
      if (license) {
        await supabase.from('org_team_licenses').update({ used_seats: Math.max(0, license.used_seats - 1) }).eq('id', license.id);
        // Revoke product access
        await revokeMemberProductAccess(memberId, license.product);
      }
    }

    // 2. Suspend the member
    await supabase.from('org_team_members').update({ status: 'suspended' }).eq('id', memberId);

    if (target) sendMemberNotification('suspended', target.email, organization.id);
    toast({ title: 'Employee offboarded', description: `${target.email} has been suspended and all licenses revoked.` });
    await fetchOrgDetails(organization.id);
    return true;
  };

  // Wrayth team migration
  const migrateWraythTeam = async () => {
    if (!organization || !isOwner || !user) return false;

    try {
      // Fetch user's safesuite teams
      const { data: teams, error: teamErr } = await supabase
        .from('safesuite_teams')
        .select('id, name')
        .eq('owner_id', user.id);

      if (teamErr || !teams?.length) {
        toast({ title: 'No Wrayth teams found', description: 'You don\'t have any Wrayth teams to migrate.', variant: 'destructive' });
        return false;
      }

      // Get members from all teams
      const teamIds = teams.map(t => t.id);
      const { data: teamMembers } = await supabase
        .from('safesuite_team_members')
        .select('user_id, email, role')
        .in('team_id', teamIds);

      if (!teamMembers?.length) {
        toast({ title: 'No team members found', description: 'Your Wrayth teams have no members to migrate.' });
        return false;
      }

      // Import members that aren't already in the org
      const existingEmails = new Set(members.map(m => m.email.toLowerCase()));
      let imported = 0;

      for (const tm of teamMembers) {
        const email = (tm.email || '').toLowerCase();
        if (!email || existingEmails.has(email)) continue;

        await supabase.from('org_team_members').insert({
          organization_id: organization.id,
          user_id: tm.user_id || null,
          email,
          role: tm.role === 'admin' ? 'admin' : 'member',
          status: tm.user_id ? 'active' : 'pending',
          invited_by: user.id,
        });
        imported++;
      }

      toast({
        title: 'Migration complete',
        description: `Imported ${imported} member${imported !== 1 ? 's' : ''} from ${teams.length} Wrayth team${teams.length !== 1 ? 's' : ''}.`,
      });
      await fetchOrgDetails(organization.id);
      return true;
    } catch (err: unknown) {
      toast({ title: 'Migration error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    organization,
    members,
    licenses,
    assignments,
    loading,
    isAdmin,
    isOwner,
    isMSPAdmin,
    userRole,
    canManageMember,
    createOrganization,
    inviteMember,
    removeMember,
    suspendMember,
    reactivateMember,
    updateMemberRole,
    transferOwnership,
    assignLicense,
    unassignLicense,
    updateOrganization,
    deleteOrganization,
    migrateWraythTeam,
    offboardMember,
    refetch: fetchOrganization,
  };
};
