import { useState, useCallback } from 'react';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  environment: 'all' | 'production' | 'staging' | 'development';
  rolloutPercentage: number;
  targetSegments: string[];
  variants: FlagVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagVariant {
  id: string;
  key: string;
  value: string;
  weight: number;
}

export interface FlagEvaluation {
  flagKey: string;
  result: boolean | string;
  variant?: string;
  reason: 'enabled' | 'disabled' | 'rollout' | 'segment' | 'default';
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [activeFlagId, setActiveFlagId] = useState<string | null>(null);

  const createFlag = useCallback((key: string, name: string) => {
    const flag: FeatureFlag = {
      id: crypto.randomUUID(), key: key.toLowerCase().replace(/\s+/g, '_'),
      name, description: '', isEnabled: false, environment: 'all',
      rolloutPercentage: 100, targetSegments: [], variants: [],
      createdAt: new Date(), updatedAt: new Date(),
    };
    setFlags(prev => [...prev, flag]);
    setActiveFlagId(flag.id);
    return flag;
  }, []);

  const updateFlag = useCallback((id: string, update: Partial<FeatureFlag>) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, ...update, updatedAt: new Date() } : f));
  }, []);

  const removeFlag = useCallback((id: string) => {
    setFlags(prev => prev.filter(f => f.id !== id));
  }, []);

  const addVariant = useCallback((flagId: string, key: string, value: string) => {
    const variant: FlagVariant = { id: crypto.randomUUID(), key, value, weight: 50 };
    setFlags(prev => prev.map(f => f.id === flagId ? { ...f, variants: [...f.variants, variant] } : f));
  }, []);

  const removeVariant = useCallback((flagId: string, variantId: string) => {
    setFlags(prev => prev.map(f => f.id === flagId ? { ...f, variants: f.variants.filter(v => v.id !== variantId) } : f));
  }, []);

  const evaluateFlag = useCallback((flagKey: string, userId?: string): FlagEvaluation => {
    const flag = flags.find(f => f.key === flagKey);
    if (!flag) return { flagKey, result: false, reason: 'default' };
    if (!flag.isEnabled) return { flagKey, result: false, reason: 'disabled' };
    if (flag.rolloutPercentage < 100) {
      const hash = userId ? userId.charCodeAt(0) % 100 : Math.random() * 100;
      if (hash >= flag.rolloutPercentage) return { flagKey, result: false, reason: 'rollout' };
    }
    if (flag.variants.length > 0) {
      const variant = flag.variants[Math.floor(Math.random() * flag.variants.length)];
      return { flagKey, result: variant.value, variant: variant.key, reason: 'enabled' };
    }
    return { flagKey, result: true, reason: 'enabled' };
  }, [flags]);

  const getActiveFlag = useCallback(() => flags.find(f => f.id === activeFlagId) || null, [flags, activeFlagId]);

  const generateHookCode = useCallback((): string => {
    return `import { createContext, useContext, useState, useEffect } from 'react';

interface FeatureFlagsContextType {
  isEnabled: (key: string) => boolean;
  getVariant: (key: string) => string | null;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({ isEnabled: () => false, getVariant: () => null });

const FLAGS: Record<string, { enabled: boolean; rollout: number; variants?: Record<string, string> }> = {
${flags.map(f => `  '${f.key}': { enabled: ${f.isEnabled}, rollout: ${f.rolloutPercentage} },`).join('\n')}
};

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const isEnabled = (key: string) => {
    const flag = FLAGS[key];
    if (!flag || !flag.enabled) return false;
    if (flag.rollout < 100) return Math.random() * 100 < flag.rollout;
    return true;
  };
  const getVariant = (key: string) => null;
  return <FeatureFlagsContext.Provider value={{ isEnabled, getVariant }}>{children}</FeatureFlagsContext.Provider>;
}

export const useFeatureFlag = (key: string) => useContext(FeatureFlagsContext).isEnabled(key);`;
  }, [flags]);

  return {
    flags, activeFlagId, setActiveFlagId, getActiveFlag,
    createFlag, updateFlag, removeFlag, addVariant, removeVariant,
    evaluateFlag, generateHookCode,
  };
}
