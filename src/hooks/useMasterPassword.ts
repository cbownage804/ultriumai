import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { generateSecureRandom, validateMasterPassword, PBKDF2_ITERATIONS } from '@/utils/crypto';
import { supabase } from '@/integrations/supabase/client';

interface MasterPasswordState {
  isUnlocked: boolean;
  masterPassword: string | null;
  passwordHash: string | null;
  unlockAttempts: number;
  isLocked: boolean;
  lockoutUntil: number | null;
  hasServerPassword: boolean;
  isLoading: boolean;
}

// NOTE: This hook is used in many places. If it keeps its own local state per
// component instance, the app can get into a split-brain situation where the UI
// says “unlocked” but the data layer (useVault) still thinks it’s locked.
//
// To avoid that, we keep one shared store per active user session.
type Listener = (state: MasterPasswordState) => void;

const createInitialState = (overrides: Partial<MasterPasswordState> = {}): MasterPasswordState => ({
  isUnlocked: false,
  masterPassword: null,
  passwordHash: null,
  unlockAttempts: 0,
  isLocked: false,
  lockoutUntil: null,
  hasServerPassword: false,
  isLoading: true,
  ...overrides,
});

let sharedUserId: string | null = null;
let sharedState: MasterPasswordState = createInitialState();
const listeners = new Set<Listener>();

const emit = () => {
  for (const l of listeners) l(sharedState);
};

const setSharedState = (updater: MasterPasswordState | ((prev: MasterPasswordState) => MasterPasswordState)) => {
  sharedState = typeof updater === 'function' ? (updater as (p: MasterPasswordState) => MasterPasswordState)(sharedState) : updater;
  emit();
};

const MAX_UNLOCK_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity

export const useMasterPassword = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MasterPasswordState>(() => sharedState);
  
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Subscribe this hook instance to the shared store
  useEffect(() => {
    const listener: Listener = (s) => setState(s);
    listeners.add(listener);
    // sync immediately
    setState(sharedState);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Reset shared state when the authenticated user changes
  useEffect(() => {
    if (!user) {
      sharedUserId = null;
      setSharedState(createInitialState({ isLoading: false }));
      return;
    }

    if (sharedUserId !== user.id) {
      sharedUserId = user.id;
      // Start fresh for the new user session
      setSharedState(createInitialState({ isLoading: true }));
    }
  }, [user]);

  // Generate cryptographically secure salt
  const generateSalt = (): string => {
    const saltBytes = generateSecureRandom(32);
    return btoa(String.fromCharCode(...saltBytes));
  };

  // Hash password with salt using PBKDF2 for server storage (much stronger than SHA-256)
  const hashPasswordWithSalt = async (password: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBits = await crypto.subtle.deriveBits(
      { 
        name: 'PBKDF2', 
        salt: saltBytes, 
        iterations: PBKDF2_ITERATIONS, 
        hash: 'SHA-256' 
      },
      keyMaterial,
      256
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(hashBits)));
  };

  // Load server-side password state
  useEffect(() => {
    const loadServerState = async () => {
      if (!user) {
        setSharedState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Check if user has master password set on server
        const { data: masterPasswordData, error: mpError } = await supabase
          .from('safepass_master_passwords')
          .select('password_hash, salt')
          .eq('user_id', user.id)
          .maybeSingle();

        if (mpError && mpError.code !== 'PGRST116') {
          console.error('Error loading master password state:', mpError);
        }

        // Load lockout state from server
        const { data: lockoutData, error: lockoutError } = await supabase
          .from('safepass_unlock_attempts')
          .select('attempt_count, locked_until')
          .eq('user_id', user.id)
          .maybeSingle();

        if (lockoutError && lockoutError.code !== 'PGRST116') {
          console.error('Error loading lockout state:', lockoutError);
        }

        const now = Date.now();
        const lockedUntil = lockoutData?.locked_until ? new Date(lockoutData.locked_until).getTime() : null;
        const isLocked = lockedUntil ? lockedUntil > now : false;

        setSharedState(prev => ({
          ...prev,
          hasServerPassword: !!masterPasswordData,
          passwordHash: masterPasswordData?.password_hash || null,
          unlockAttempts: isLocked ? (lockoutData?.attempt_count || 0) : 0,
          isLocked,
          lockoutUntil: isLocked ? lockedUntil : null,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading master password state:', error);
        setSharedState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadServerState();
  }, [user]);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!state.isUnlocked) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
      autoLockTimerRef.current = setTimeout(() => {
        lock();
      }, AUTO_LOCK_TIMEOUT);
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Lock when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Lock after 30 seconds of tab being hidden
        autoLockTimerRef.current = setTimeout(() => {
          lock();
        }, 30000);
      } else {
        resetTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isUnlocked]);

  // Check if lockout period has expired
  useEffect(() => {
    if (state.isLocked && state.lockoutUntil) {
      const now = Date.now();
      if (now >= state.lockoutUntil) {
        // Lockout expired
        clearLockout();
      } else {
        // Set timer to unlock when lockout expires
        const timeout = setTimeout(() => {
          clearLockout();
        }, state.lockoutUntil - now);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [state.isLocked, state.lockoutUntil]);

  const clearLockout = async () => {
    setSharedState(prev => ({
      ...prev,
      isLocked: false,
      lockoutUntil: null,
      unlockAttempts: 0
    }));
    
    if (user) {
      // Clear server-side lockout
      await supabase
        .from('safepass_unlock_attempts')
        .delete()
        .eq('user_id', user.id);
    }
  };

  const setMasterPassword = async (password: string): Promise<{ success: boolean; errors?: string[] }> => {
    if (!user) return { success: false, errors: ['Not authenticated'] };
    
    // Validate password strength
    const validation = validateMasterPassword(password);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    
    try {
      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(password, salt);
      
      // Store hash on server (not in localStorage!)
      const { error } = await supabase
        .from('safepass_master_passwords')
        .upsert({
          user_id: user.id,
          password_hash: hash,
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error storing master password:', error);
        return { success: false, errors: ['Failed to save master password'] };
      }
      
      setSharedState(prev => ({
        ...prev,
        isUnlocked: true,
        masterPassword: password,
        passwordHash: hash,
        hasServerPassword: true,
        unlockAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      }));
      
      // Clear any lockout state
      await supabase
        .from('safepass_unlock_attempts')
        .delete()
        .eq('user_id', user.id);
      
      return { success: true };
    } catch (error) {
      console.error('Error setting master password:', error);
      return { success: false, errors: ['An error occurred while setting master password'] };
    }
  };

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    if (state.isLocked) {
      const remainingTime = state.lockoutUntil ? Math.ceil((state.lockoutUntil - Date.now()) / 1000 / 60) : 0;
      return { 
        success: false, 
        error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` 
      };
    }
    
    try {
      // Fetch stored hash and salt from server
      const { data: masterPasswordData, error: fetchError } = await supabase
        .from('safepass_master_passwords')
        .select('password_hash, salt')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !masterPasswordData) {
        return { success: false, error: 'No master password set' };
      }

      const hash = await hashPasswordWithSalt(password, masterPasswordData.salt);
      
      if (hash === masterPasswordData.password_hash) {
        // Successful unlock
        setSharedState(prev => ({
          ...prev,
          isUnlocked: true,
          masterPassword: password,
          passwordHash: hash,
          unlockAttempts: 0,
          isLocked: false,
          lockoutUntil: null
        }));
        
        // Clear lockout state on server
        await supabase
          .from('safepass_unlock_attempts')
          .delete()
          .eq('user_id', user.id);
        
        return { success: true };
      } else {
        // Failed unlock attempt
        const newAttempts = state.unlockAttempts + 1;
        
        if (newAttempts >= MAX_UNLOCK_ATTEMPTS) {
          // Lock account
          const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
          
          setSharedState(prev => ({
            ...prev,
            unlockAttempts: newAttempts,
            isLocked: true,
            lockoutUntil: lockoutUntil.getTime()
          }));
          
          // Store lockout on server
          await supabase
            .from('safepass_unlock_attempts')
            .upsert({
              user_id: user.id,
              attempt_count: newAttempts,
              last_attempt_at: new Date().toISOString(),
              locked_until: lockoutUntil.toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          return { 
            success: false, 
            error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION / 1000 / 60} minutes.` 
          };
        } else {
          // Increment attempts
          setSharedState(prev => ({
            ...prev,
            unlockAttempts: newAttempts
          }));
          
          // Track attempts on server
          await supabase
            .from('safepass_unlock_attempts')
            .upsert({
              user_id: user.id,
              attempt_count: newAttempts,
              last_attempt_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });
          
          const remaining = MAX_UNLOCK_ATTEMPTS - newAttempts;
          return { 
            success: false, 
            error: `Incorrect master password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
          };
        }
      }
    } catch (error) {
      console.error('Error unlocking vault');
      return { success: false, error: 'An error occurred while unlocking the vault' };
    }
  };

  const lock = useCallback(() => {
    // Clear sensitive data from memory
    setSharedState(prev => ({
      ...prev,
      isUnlocked: false,
      masterPassword: null
    }));
    
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
  }, []);

  const changeMasterPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Validate new password strength
    const validation = validateMasterPassword(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join('. ') };
    }
    
    // Verify current password
    const unlockResult = await unlockWithPassword(currentPassword);
    if (!unlockResult.success) {
      return { success: false, error: 'Current master password is incorrect' };
    }
    
    // Set new password
    const result = await setMasterPassword(newPassword);
    return { success: result.success, error: result.errors?.join('. ') };
  };

  const resetMasterPassword = async () => {
    if (!user) return;
    
    // Clear server-side data
    await supabase
      .from('safepass_master_passwords')
      .delete()
      .eq('user_id', user.id);
    
    await supabase
      .from('safepass_unlock_attempts')
      .delete()
      .eq('user_id', user.id);
    
    setSharedState(createInitialState({ isLoading: false }));
  };

  const hasUserSetMasterPassword = (): boolean => {
    return state.hasServerPassword;
  };

  const getRemainingLockoutTime = (): number => {
    if (!state.isLocked || !state.lockoutUntil) return 0;
    return Math.max(0, state.lockoutUntil - Date.now());
  };

  return {
    // State
    isUnlocked: state.isUnlocked,
    isLocked: state.isLocked,
    isLoading: state.isLoading,
    unlockAttempts: state.unlockAttempts,
    maxAttempts: MAX_UNLOCK_ATTEMPTS,
    masterPassword: state.masterPassword,
    
    // Actions
    setMasterPassword,
    unlockWithPassword,
    lock,
    changeMasterPassword,
    resetMasterPassword,
    
    // Utilities
    hasUserSetMasterPassword,
    getRemainingLockoutTime,
    
    // Security info
    lockoutDuration: LOCKOUT_DURATION,
    autoLockTimeout: AUTO_LOCK_TIMEOUT
  };
};
