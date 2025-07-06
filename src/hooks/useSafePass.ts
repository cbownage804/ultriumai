import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PasswordVault {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_shared: boolean;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PasswordEntry {
  id: string;
  vault_id: string;
  user_id: string;
  name: string;
  username?: string;
  password_encrypted: string;
  website?: string;
  category: string;
  notes?: string;
  strength_score: number;
  last_used_at?: string;
  is_shared: boolean;
  shared_with: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PasswordAuditLog {
  id: string;
  user_id: string;
  password_entry_id?: string | null;
  action: string;
  details: any;
  ip_address?: unknown;
  user_agent?: string | null;
  created_at: string;
}

export const useSafePass = () => {
  const [vaults, setVaults] = useState<PasswordVault[]>([]);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<PasswordAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load vaults
  const loadVaults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVaults(data || []);
    } catch (error) {
      console.error('Error loading vaults:', error);
      toast({
        title: "Error",
        description: "Failed to load password vaults",
        variant: "destructive",
      });
    }
  };

  // Load entries for a specific vault
  const loadEntries = async (vaultId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('password_entries')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error",
        description: "Failed to load password entries",
        variant: "destructive",
      });
    }
  };

  // Create vault
  const createVault = async (vaultData: {
    name: string;
    description?: string;
    is_shared?: boolean;
    team_id?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .insert({
          user_id: user.id,
          ...vaultData
        })
        .select()
        .single();

      if (error) throw error;

      setVaults(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Password vault created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating vault:', error);
      toast({
        title: "Error",
        description: "Failed to create password vault",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create password entry
  const createEntry = async (entryData: {
    vault_id: string;
    name: string;
    username?: string;
    password: string;
    website?: string;
    category?: string;
    notes?: string;
    tags?: string[];
  }) => {
    if (!user) return null;

    try {
      // Calculate password strength
      const strength = calculatePasswordStrength(entryData.password);
      
      // Encrypt password (in real implementation, this would be done server-side)
      const encryptedPassword = btoa(entryData.password); // Simple base64 for demo

      const { data, error } = await supabase
        .from('password_entries')
        .insert({
          user_id: user.id,
          vault_id: entryData.vault_id,
          name: entryData.name,
          username: entryData.username,
          password_encrypted: encryptedPassword,
          website: entryData.website,
          category: entryData.category || 'General',
          notes: entryData.notes,
          strength_score: strength,
          tags: entryData.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      
      // Log the action
      await logAction('created', data.id, { name: data.name });
      
      toast({
        title: "Success",
        description: "Password entry created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: "Failed to create password entry",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update password entry
  const updateEntry = async (id: string, updates: Partial<PasswordEntry>) => {
    if (!user) return null;

    try {
      if (updates.password_encrypted) {
        updates.strength_score = calculatePasswordStrength(atob(updates.password_encrypted));
      }

      const { data, error } = await supabase
        .from('password_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => prev.map(entry => entry.id === id ? data : entry));
      await logAction('updated', id, { changes: Object.keys(updates) });

      toast({
        title: "Success",
        description: "Password entry updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update password entry",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!user) return false;

    try {
      const entry = entries.find(e => e.id === id);
      
      const { error } = await supabase
        .from('password_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== id));
      await logAction('deleted', id, { name: entry?.name });

      toast({
        title: "Success",
        description: "Password entry deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete password entry",
        variant: "destructive",
      });
      return false;
    }
  };

  // Generate secure password
  const generatePassword = (length: number = 16, options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}) => {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true
    } = options;

    let charset = '';
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    
    // Length
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Character types
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    return Math.min(score, 100);
  };

  // Log action
  const logAction = async (action: string, entryId?: string, details: any = {}) => {
    if (!user) return;

    try {
      await supabase
        .from('password_audit_logs')
        .insert({
          user_id: user.id,
          password_entry_id: entryId,
          action,
          details,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('password_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  // Initialize
  useEffect(() => {
    if (user) {
      loadVaults();
      loadAuditLogs();
    }
    setIsLoading(false);
  }, [user]);

  // Load entries when vault is selected
  useEffect(() => {
    if (selectedVault) {
      loadEntries(selectedVault);
    } else {
      setEntries([]);
    }
  }, [selectedVault]);

  return {
    vaults,
    entries,
    auditLogs,
    isLoading,
    selectedVault,
    setSelectedVault,
    createVault,
    createEntry,
    updateEntry,
    deleteEntry,
    generatePassword,
    calculatePasswordStrength,
    loadVaults,
    loadEntries,
    loadAuditLogs
  };
};