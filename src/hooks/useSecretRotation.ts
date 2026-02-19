import { useState, useCallback } from 'react';

export interface ManagedSecret {
  id: string;
  name: string;
  service: string;
  lastRotated: Date;
  rotationIntervalDays: number;
  isExpired: boolean;
  daysUntilExpiry: number;
  status: 'healthy' | 'warning' | 'expired';
  rotationGuide?: string;
}

export function useSecretRotation() {
  const [secrets, setSecrets] = useState<ManagedSecret[]>([]);

  const addSecret = useCallback((name: string, service: string, lastRotated: Date, rotationIntervalDays = 90) => {
    const daysSinceRotation = Math.floor((Date.now() - lastRotated.getTime()) / 86400000);
    const daysUntilExpiry = rotationIntervalDays - daysSinceRotation;
    const secret: ManagedSecret = {
      id: crypto.randomUUID(),
      name,
      service,
      lastRotated,
      rotationIntervalDays,
      isExpired: daysUntilExpiry <= 0,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      status: daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 14 ? 'warning' : 'healthy',
      rotationGuide: getRotationGuide(service),
    };
    setSecrets(prev => [...prev, secret]);
    return secret;
  }, []);

  const markRotated = useCallback((id: string) => {
    setSecrets(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, lastRotated: new Date(), isExpired: false, daysUntilExpiry: s.rotationIntervalDays, status: 'healthy' as const };
    }));
  }, []);

  const removeSecret = useCallback((id: string) => {
    setSecrets(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateInterval = useCallback((id: string, days: number) => {
    setSecrets(prev => prev.map(s => {
      if (s.id !== id) return s;
      const daysSinceRotation = Math.floor((Date.now() - s.lastRotated.getTime()) / 86400000);
      const daysUntilExpiry = days - daysSinceRotation;
      return { ...s, rotationIntervalDays: days, daysUntilExpiry: Math.max(0, daysUntilExpiry), isExpired: daysUntilExpiry <= 0, status: daysUntilExpiry <= 0 ? 'expired' : daysUntilExpiry <= 14 ? 'warning' : 'healthy' };
    }));
  }, []);

  const getExpiredSecrets = useCallback(() => secrets.filter(s => s.status === 'expired'), [secrets]);
  const getWarningSecrets = useCallback(() => secrets.filter(s => s.status === 'warning'), [secrets]);

  return { secrets, addSecret, markRotated, removeSecret, updateInterval, getExpiredSecrets, getWarningSecrets };
}

function getRotationGuide(service: string): string {
  const guides: Record<string, string> = {
    supabase: '1. Go to Supabase Dashboard → Settings → API\n2. Click "Generate new key"\n3. Update your environment variables\n4. Restart your application',
    stripe: '1. Go to Stripe Dashboard → Developers → API keys\n2. Click "Roll key" next to the secret key\n3. Update your environment variables\n4. Old key remains active for 24 hours',
    openai: '1. Go to platform.openai.com → API Keys\n2. Create new secret key\n3. Delete the old key\n4. Update your environment variables',
    github: '1. Go to GitHub → Settings → Developer settings → Tokens\n2. Generate new token with same scopes\n3. Update your environment variables\n4. Delete old token',
    default: '1. Go to the service dashboard\n2. Generate a new API key or token\n3. Update your environment variables\n4. Verify the new key works\n5. Delete or deactivate the old key',
  };
  return guides[service.toLowerCase()] || guides.default;
}
