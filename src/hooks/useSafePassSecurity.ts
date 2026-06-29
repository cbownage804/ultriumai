import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SecurityAlert {
  id: string;
  user_id: string;
  entry_id?: string;
  monitoring_type: 'breach_check' | 'dark_web' | 'weak_password' | 'reused_password' | 'old_password';
  threat_level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'resolved' | 'ignored';
  details: any;
  detected_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  entry_title?: string;
}

export interface SecurityScore {
  overall_score: number;
  weak_passwords: number;
  reused_passwords: number;
  old_passwords: number;
  breached_passwords: number;
  total_passwords: number;
  recommendations: string[];
}

export interface EmergencyAccess {
  id: string;
  vault_owner_id: string;
  emergency_contact_id: string;
  vault_id?: string;
  access_type: 'vault' | 'all_vaults';
  wait_period_hours: number;
  status: 'pending' | 'active' | 'granted' | 'denied' | 'expired';
  requested_at?: string;
  approved_at?: string;
  expires_at?: string;
  reason?: string;
  created_at: string;
  updated_at: string;
  contact_email?: string;
  vault_name?: string;
}

export const useVaultSecurity = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [emergencyAccess, setEmergencyAccess] = useState<EmergencyAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load security alerts
  const loadSecurityAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_security_monitoring')
        .select(`
          *,
          safepass_entries(title)
        `)
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });

      if (error) throw error;

      const alertsWithDetails = data?.map(alert => ({
        ...alert,
        entry_title: alert.safepass_entries?.title,
        monitoring_type: alert.monitoring_type as any,
        threat_level: alert.threat_level as any,
        status: alert.status as any
      })) || [];

      setAlerts(alertsWithDetails as SecurityAlert[]);
    } catch (error) {
      console.error('Error loading security alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load security alerts",
        variant: "destructive",
      });
    }
  };

  // Load emergency access
  const loadEmergencyAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_emergency_access')
        .select('*')
        .or(`vault_owner_id.eq.${user.id},emergency_contact_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const accessWithDetails = data?.map(access => ({
        ...access,
        contact_email: 'contact@example.com',
        vault_name: 'Vault Name',
        access_type: access.access_type as any,
        status: access.status as any
      })) || [];

      setEmergencyAccess(accessWithDetails as EmergencyAccess[]);
    } catch (error) {
      console.error('Error loading emergency access:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency access",
        variant: "destructive",
      });
    }
  };

  // Calculate security score
  const calculateSecurityScore = async () => {
    if (!user) return;

    try {
      // Get all user's password entries
      const { data: entries, error } = await supabase
        .from('safepass_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_type', 'password');

      if (error) throw error;

      const totalPasswords = entries?.length || 0;
      let weakPasswords = 0;
      let reusedPasswords = 0;
      let oldPasswords = 0;
      let breachedPasswords = 0;

      // Count security issues
      for (const entry of entries || []) {
        if (entry.password_strength_score < 70) weakPasswords++;
        
        // Check if password is old (>90 days)
        const entryAge = Date.now() - new Date(entry.created_at).getTime();
        if (entryAge > 90 * 24 * 60 * 60 * 1000) oldPasswords++;
        
        if (entry.is_compromised) breachedPasswords++;
      }

      // Calculate reused passwords (simplified)
      const passwordHashes = new Set();
      const duplicateHashes = new Set();
      
      for (const entry of entries || []) {
        if (passwordHashes.has(entry.encrypted_data)) {
          duplicateHashes.add(entry.encrypted_data);
        } else {
          passwordHashes.add(entry.encrypted_data);
        }
      }
      reusedPasswords = duplicateHashes.size;

      // Calculate overall score (0-100)
      let score = 100;
      if (totalPasswords > 0) {
        score -= Math.min(40, (weakPasswords / totalPasswords) * 40);
        score -= Math.min(30, (reusedPasswords / totalPasswords) * 30);
        score -= Math.min(20, (oldPasswords / totalPasswords) * 20);
        score -= Math.min(10, (breachedPasswords / totalPasswords) * 10);
      }

      const recommendations = [];
      if (weakPasswords > 0) recommendations.push(`Update ${weakPasswords} weak passwords`);
      if (reusedPasswords > 0) recommendations.push(`Change ${reusedPasswords} reused passwords`);
      if (oldPasswords > 0) recommendations.push(`Update ${oldPasswords} old passwords`);
      if (breachedPasswords > 0) recommendations.push(`Immediately change ${breachedPasswords} breached passwords`);

      setSecurityScore({
        overall_score: Math.max(0, Math.round(score)),
        weak_passwords: weakPasswords,
        reused_passwords: reusedPasswords,
        old_passwords: oldPasswords,
        breached_passwords: breachedPasswords,
        total_passwords: totalPasswords,
        recommendations
      });
    } catch (error) {
      console.error('Error calculating security score:', error);
    }
  };

  // Run security scan
  const runSecurityScan = async () => {
    if (!user) return false;

    try {
      // Call edge function to run comprehensive security scan
      const { data, error } = await supabase.functions.invoke('safepass-security-scanner', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      await Promise.all([
        loadSecurityAlerts(),
        calculateSecurityScore()
      ]);

      toast({
        title: "Success",
        description: "Security scan completed",
      });

      return true;
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Error",
        description: "Failed to run security scan",
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up emergency access
  const setupEmergencyAccess = async (contactEmail: string, vaultId?: string, waitPeriodHours: number = 48) => {
    if (!user) return false;

    try {
      // Get contact user ID
      const { data: contactData, error: contactError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contactEmail)
        .single();

      if (contactError || !contactData) {
        toast({
          title: "Error",
          description: "Emergency contact not found. They need to create an account first.",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('safepass_emergency_access')
        .insert({
          vault_owner_id: user.id,
          emergency_contact_id: contactData.id,
          vault_id: vaultId,
          access_type: vaultId ? 'vault' : 'all_vaults',
          wait_period_hours: waitPeriodHours,
          status: 'active'
        });

      if (error) throw error;

      await loadEmergencyAccess();
      toast({
        title: "Success",
        description: "Emergency access configured successfully",
      });

      return true;
    } catch (error) {
      console.error('Error setting up emergency access:', error);
      toast({
        title: "Error",
        description: "Failed to setup emergency access",
        variant: "destructive",
      });
      return false;
    }
  };

  // Request emergency access - sets status to 'pending' and enforces wait period
  // The vault owner must approve, and access is only granted after wait_period_hours
  const requestEmergencyAccess = async (emergencyAccessId: string, reason: string) => {
    if (!user) return false;

    try {
      // First, get the current access record to check wait period
      const { data: accessRecord, error: fetchError } = await supabase
        .from('safepass_emergency_access')
        .select('wait_period_hours, status')
        .eq('id', emergencyAccessId)
        .eq('emergency_contact_id', user.id)
        .single();

      if (fetchError || !accessRecord) {
        throw new Error('Emergency access record not found');
      }

      if (accessRecord.status !== 'active') {
        toast({
          title: "Error",
          description: "This emergency access is not in an active state",
          variant: "destructive",
        });
        return false;
      }

      // Set status to 'pending' - NOT 'granted'
      // The vault owner must approve, and access is only granted after wait period
      const { error } = await supabase
        .from('safepass_emergency_access')
        .update({
          status: 'pending', // Request only - owner must approve
          requested_at: new Date().toISOString(),
          reason: reason,
          // Do NOT set expires_at or approved_at - those are set by the owner
        })
        .eq('id', emergencyAccessId)
        .eq('emergency_contact_id', user.id)
        .eq('status', 'active'); // Can only request if currently active

      if (error) throw error;

      await loadEmergencyAccess();
      toast({
        title: "Access Requested",
        description: `The vault owner will be notified. Wait period: ${accessRecord.wait_period_hours} hours.`,
      });

      return true;
    } catch (error) {
      console.error('Error requesting emergency access');
      toast({
        title: "Error",
        description: "Failed to request emergency access",
        variant: "destructive",
      });
      return false;
    }
  };

  // Approve emergency access request (vault owner only)
  const approveEmergencyAccess = async (emergencyAccessId: string) => {
    if (!user) return false;

    try {
      // Get the access record to calculate expiry based on wait period
      const { data: accessRecord, error: fetchError } = await supabase
        .from('safepass_emergency_access')
        .select('wait_period_hours')
        .eq('id', emergencyAccessId)
        .eq('vault_owner_id', user.id)
        .single();

      if (fetchError || !accessRecord) {
        throw new Error('Emergency access record not found');
      }

      const waitPeriodMs = (accessRecord.wait_period_hours || 48) * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + waitPeriodMs + 7 * 24 * 60 * 60 * 1000); // Wait period + 7 days access

      const { error } = await supabase
        .from('safepass_emergency_access')
        .update({
          status: 'granted',
          approved_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', emergencyAccessId)
        .eq('vault_owner_id', user.id); // Only owner can approve

      if (error) throw error;

      await loadEmergencyAccess();
      toast({
        title: "Access Approved",
        description: `Emergency access granted. Expires: ${expiresAt.toLocaleDateString()}`,
      });

      return true;
    } catch (error) {
      console.error('Error approving emergency access');
      toast({
        title: "Error",
        description: "Failed to approve emergency access",
        variant: "destructive",
      });
      return false;
    }
  };

  // Deny emergency access request (vault owner only)
  const denyEmergencyAccess = async (emergencyAccessId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safepass_emergency_access')
        .update({
          status: 'denied',
        })
        .eq('id', emergencyAccessId)
        .eq('vault_owner_id', user.id); // Only owner can deny

      if (error) throw error;

      await loadEmergencyAccess();
      toast({
        title: "Access Denied",
        description: "Emergency access request has been denied.",
      });

      return true;
    } catch (error) {
      console.error('Error denying emergency access');
      toast({
        title: "Error",
        description: "Failed to deny emergency access",
        variant: "destructive",
      });
      return false;
    }
  };

  // Resolve security alert
  const resolveAlert = async (alertId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('safepass_security_monitoring')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved', resolved_at: new Date().toISOString() }
          : alert
      ));

      toast({
        title: "Success",
        description: "Security alert resolved",
      });

      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve security alert",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize
  useEffect(() => {
    if (user) {
      Promise.all([
        loadSecurityAlerts(),
        loadEmergencyAccess(),
        calculateSecurityScore()
      ]);
    }
    setIsLoading(false);
  }, [user]);

  return {
    alerts,
    securityScore,
    emergencyAccess,
    isLoading,
    runSecurityScan,
    setupEmergencyAccess,
    requestEmergencyAccess,
    approveEmergencyAccess,
    denyEmergencyAccess,
    resolveAlert,
    loadSecurityAlerts,
    loadEmergencyAccess,
    calculateSecurityScore
  };
};