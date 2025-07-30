import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { hashData } from '@/utils/crypto';

interface MasterPasswordState {
  isUnlocked: boolean;
  masterPassword: string | null;
  passwordHash: string | null;
  unlockAttempts: number;
  isLocked: boolean;
  lockoutUntil: number | null;
}

const MAX_UNLOCK_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const useMasterPassword = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MasterPasswordState>({
    isUnlocked: false,
    masterPassword: null,
    passwordHash: null,
    unlockAttempts: 0,
    isLocked: false,
    lockoutUntil: null
  });

  // Load stored password hash from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`safepass_master_hash_${user.id}`);
      const attempts = parseInt(localStorage.getItem(`safepass_unlock_attempts_${user.id}`) || '0');
      const lockoutUntil = parseInt(localStorage.getItem(`safepass_lockout_until_${user.id}`) || '0');
      
      const now = Date.now();
      const isLocked = lockoutUntil > now;
      
      setState(prev => ({
        ...prev,
        passwordHash: stored,
        unlockAttempts: isLocked ? attempts : 0,
        isLocked,
        lockoutUntil: isLocked ? lockoutUntil : null
      }));
    }
  }, [user]);

  // Check if lockout period has expired
  useEffect(() => {
    if (state.isLocked && state.lockoutUntil) {
      const now = Date.now();
      if (now >= state.lockoutUntil) {
        // Lockout expired
        setState(prev => ({
          ...prev,
          isLocked: false,
          lockoutUntil: null,
          unlockAttempts: 0
        }));
        
        if (user) {
          localStorage.removeItem(`safepass_unlock_attempts_${user.id}`);
          localStorage.removeItem(`safepass_lockout_until_${user.id}`);
        }
      } else {
        // Set timer to unlock when lockout expires
        const timeout = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isLocked: false,
            lockoutUntil: null,
            unlockAttempts: 0
          }));
          
          if (user) {
            localStorage.removeItem(`safepass_unlock_attempts_${user.id}`);
            localStorage.removeItem(`safepass_lockout_until_${user.id}`);
          }
        }, state.lockoutUntil - now);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [state.isLocked, state.lockoutUntil, user]);

  const setMasterPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const hash = await hashData(password);
      
      // Store hash in localStorage
      localStorage.setItem(`safepass_master_hash_${user.id}`, hash);
      
      setState(prev => ({
        ...prev,
        isUnlocked: true,
        masterPassword: password,
        passwordHash: hash,
        unlockAttempts: 0,
        isLocked: false,
        lockoutUntil: null
      }));
      
      // Clear any stored attempts or lockout
      localStorage.removeItem(`safepass_unlock_attempts_${user.id}`);
      localStorage.removeItem(`safepass_lockout_until_${user.id}`);
      
      return true;
    } catch (error) {
      console.error('Error setting master password:', error);
      return false;
    }
  };

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !state.passwordHash) {
      return { success: false, error: 'No master password set' };
    }
    
    if (state.isLocked) {
      const remainingTime = state.lockoutUntil ? Math.ceil((state.lockoutUntil - Date.now()) / 1000 / 60) : 0;
      return { 
        success: false, 
        error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` 
      };
    }
    
    try {
      const hash = await hashData(password);
      
      if (hash === state.passwordHash) {
        // Successful unlock
        setState(prev => ({
          ...prev,
          isUnlocked: true,
          masterPassword: password,
          unlockAttempts: 0,
          isLocked: false,
          lockoutUntil: null
        }));
        
        // Clear stored attempts
        localStorage.removeItem(`safepass_unlock_attempts_${user.id}`);
        localStorage.removeItem(`safepass_lockout_until_${user.id}`);
        
        return { success: true };
      } else {
        // Failed unlock attempt
        const newAttempts = state.unlockAttempts + 1;
        
        if (newAttempts >= MAX_UNLOCK_ATTEMPTS) {
          // Lock account
          const lockoutUntil = Date.now() + LOCKOUT_DURATION;
          
          setState(prev => ({
            ...prev,
            unlockAttempts: newAttempts,
            isLocked: true,
            lockoutUntil
          }));
          
          localStorage.setItem(`safepass_unlock_attempts_${user.id}`, newAttempts.toString());
          localStorage.setItem(`safepass_lockout_until_${user.id}`, lockoutUntil.toString());
          
          return { 
            success: false, 
            error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION / 1000 / 60} minutes.` 
          };
        } else {
          // Increment attempts
          setState(prev => ({
            ...prev,
            unlockAttempts: newAttempts
          }));
          
          localStorage.setItem(`safepass_unlock_attempts_${user.id}`, newAttempts.toString());
          
          const remaining = MAX_UNLOCK_ATTEMPTS - newAttempts;
          return { 
            success: false, 
            error: `Incorrect master password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
          };
        }
      }
    } catch (error) {
      console.error('Error unlocking vault:', error);
      return { success: false, error: 'An error occurred while unlocking the vault' };
    }
  };

  const lock = () => {
    setState(prev => ({
      ...prev,
      isUnlocked: false,
      masterPassword: null
    }));
  };

  const changeMasterPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !state.passwordHash) {
      return { success: false, error: 'No master password set' };
    }
    
    // Verify current password
    const unlockResult = await unlockWithPassword(currentPassword);
    if (!unlockResult.success) {
      return { success: false, error: 'Current master password is incorrect' };
    }
    
    // Set new password
    const success = await setMasterPassword(newPassword);
    return { success, error: success ? undefined : 'Failed to update master password' };
  };

  const resetMasterPassword = () => {
    if (!user) return;
    
    // Clear all stored data
    localStorage.removeItem(`safepass_master_hash_${user.id}`);
    localStorage.removeItem(`safepass_unlock_attempts_${user.id}`);
    localStorage.removeItem(`safepass_lockout_until_${user.id}`);
    
    setState({
      isUnlocked: false,
      masterPassword: null,
      passwordHash: null,
      unlockAttempts: 0,
      isLocked: false,
      lockoutUntil: null
    });
  };

  const hasUserSetMasterPassword = (): boolean => {
    return !!state.passwordHash;
  };

  const getRemainingLockoutTime = (): number => {
    if (!state.isLocked || !state.lockoutUntil) return 0;
    return Math.max(0, state.lockoutUntil - Date.now());
  };

  return {
    // State
    isUnlocked: state.isUnlocked,
    isLocked: state.isLocked,
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
    lockoutDuration: LOCKOUT_DURATION
  };
};