import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { encryptData, decryptData, EncryptedData } from '@/utils/crypto';

export interface PasswordVault {
  id: string;
  user_id: string;
  vault_name: string;
  description?: string;
  is_shared: boolean;
  is_active: boolean;
  msp_org_id?: string;
  client_id?: string;
  encryption_key_hash?: string;
  access_policies?: any;
  shared_with?: any;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PasswordEntry {
  id: string;
  vault_id: string;
  user_id: string;
  entry_type: string;
  title: string;
  encrypted_data: any;
  tags: string[];
  category: string;
  url?: string;
  notes?: string;
  is_favorite: boolean;
  last_used_at?: string;
  password_strength_score: number;
  is_compromised: boolean;
  compromise_details?: any;
  client_id?: string;
  msp_id?: string;
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
  const masterPassword = useMasterPassword();

  // Load vaults
  const loadVaults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safepass_vaults')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
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
        .from('safepass_entries')
        .select('*')
        .eq('vault_id', vaultId)
        .eq('user_id', user.id)
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
    client_id?: string;
  }) => {
    if (!user) return null;

    try {
      // Generate a simple encryption key hash for demo purposes
      const encryptionKeyHash = btoa(`vault_${Date.now()}_${user.id}`);
      
      const { data, error } = await supabase
        .from('safepass_vaults')
        .insert({
          user_id: user.id,
          vault_name: vaultData.name,
          description: vaultData.description,
          is_shared: vaultData.is_shared || false,
          is_active: true,
          client_id: vaultData.client_id,
          encryption_key_hash: encryptionKeyHash,
          access_policies: {},
          shared_with: {}
        })
        .select()
        .single();

      if (error) {
        // Ignore duplicate constraint errors (vault already exists)
        const isDuplicate =
          error.code === '23505' ||
          (typeof (error as any).message === 'string' && (error as any).message.includes('idx_safepass_vaults_user_name'));

        if (isDuplicate) {
          console.log('Vault already exists, skipping creation');
          return null;
        }
        throw error;
      }

      setVaults(prev => [data, ...prev]);
      // Only show toast for manually created vaults, not auto-created ones
      if (vaultData.name !== 'My Vault') {
        toast({
          title: "Success",
          description: "Password vault created successfully",
        });
      }

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
    title: string;
    username?: string;
    password: string;
    website?: string;
    category?: string;
    notes?: string;
    tags?: string[];
  }) => {
    if (!user || !masterPassword.isUnlocked) return null;

    try {
      // Calculate password strength
      const strength = calculatePasswordStrength(entryData.password);
      
      // Encrypt password data using master password
      const dataToEncrypt = JSON.stringify({
        username: entryData.username || '',
        password: entryData.password,
        website: entryData.website || '',
        notes: entryData.notes || ''
      });
      
      const encryptedData = await encryptData(dataToEncrypt, masterPassword.masterPassword!);

      const { data, error } = await supabase
        .from('safepass_entries')
        .insert({
          user_id: user.id,
          vault_id: entryData.vault_id,
          entry_type: 'password',
          title: entryData.title,
          encrypted_data: encryptedData as any,
          url: entryData.website,
          category: entryData.category || 'General',
          notes: entryData.notes,
          password_strength_score: strength,
          tags: entryData.tags || [],
          is_favorite: false,
          is_compromised: false
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      
      // Log the action
      await logAction('created', data.id, { title: data.title });
      
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
      const { data, error } = await supabase
        .from('safepass_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
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
        .from('safepass_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== id));
      await logAction('deleted', id, { title: entry?.title });

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
        .from('audit_logs')
        .insert({
          user_id: user.id,
          resource_id: entryId,
          resource_type: 'password_entry',
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
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('resource_type', 'password_entry')
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
    let cancelled = false;

    const init = async () => {
      // No user: nothing to load
      if (!user) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (!cancelled) setIsLoading(true);
      await Promise.all([loadVaults(), loadAuditLogs()]);
      if (!cancelled) setIsLoading(false);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Load entries when vault is selected
  useEffect(() => {
    if (selectedVault) {
      loadEntries(selectedVault);
    } else {
      setEntries([]);
    }
  }, [selectedVault]);

  // Helper functions for backward compatibility with encryption/decryption
  const getEntryName = (entry: PasswordEntry) => entry.title;
  
  const getEntryUsername = async (entry: PasswordEntry) => {
    if (!masterPassword.isUnlocked) return '[Locked]';
    try {
      if (typeof entry.encrypted_data === 'object' && 'ciphertext' in entry.encrypted_data) {
        const decryptedData = await decryptData(entry.encrypted_data as EncryptedData, masterPassword.masterPassword!);
        const parsed = JSON.parse(decryptedData);
        return parsed.username || '';
      }
      return entry.encrypted_data?.username || '';
    } catch {
      return '[Decryption Error]';
    }
  };
  
  const getEntryWebsite = async (entry: PasswordEntry) => {
    if (!masterPassword.isUnlocked) return '[Locked]';
    try {
      if (typeof entry.encrypted_data === 'object' && 'ciphertext' in entry.encrypted_data) {
        const decryptedData = await decryptData(entry.encrypted_data as EncryptedData, masterPassword.masterPassword!);
        const parsed = JSON.parse(decryptedData);
        return parsed.website || entry.url || '';
      }
      return entry.url || entry.encrypted_data?.website || '';
    } catch {
      return '[Decryption Error]';
    }
  };
  
  const getEntryPassword = async (entry: PasswordEntry) => {
    if (!masterPassword.isUnlocked) return '[Locked]';
    try {
      if (typeof entry.encrypted_data === 'object' && 'ciphertext' in entry.encrypted_data) {
        const decryptedData = await decryptData(entry.encrypted_data as EncryptedData, masterPassword.masterPassword!);
        const parsed = JSON.parse(decryptedData);
        return parsed.password || '';
      }
      return atob(entry.encrypted_data?.password || '');
    } catch {
      return '[Decryption Error]';
    }
  };
  
  const getEntryNotes = async (entry: PasswordEntry) => {
    if (!masterPassword.isUnlocked) return '[Locked]';
    try {
      if (typeof entry.encrypted_data === 'object' && 'ciphertext' in entry.encrypted_data) {
        const decryptedData = await decryptData(entry.encrypted_data as EncryptedData, masterPassword.masterPassword!);
        const parsed = JSON.parse(decryptedData);
        return parsed.notes || '';
      }
      return entry.notes || '';
    } catch {
      return '[Decryption Error]';
    }
  };
  
  const getEntryStrengthScore = (entry: PasswordEntry) => entry.password_strength_score;
  const isEntryShared = (entry: PasswordEntry) => false; // Not implemented in current schema
  const getVaultName = (vault: PasswordVault) => vault.vault_name;

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
    loadAuditLogs,
    // Master password integration
    masterPassword,
    // Helper functions
    getEntryName,
    getEntryUsername,
    getEntryWebsite,
    getEntryPassword,
    getEntryNotes,
    getEntryStrengthScore,
    isEntryShared,
    getVaultName
  };
};