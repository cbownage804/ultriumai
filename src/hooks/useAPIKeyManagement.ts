import { useState, useCallback } from 'react';

export interface APIKeyField {
  id: string;
  name: string;
  prefix: string;
  expiryDays: number;
  rateLimit: number;
  scopes: string[];
}

export function useAPIKeyManagement() {
  const [fields, setFields] = useState<APIKeyField[]>([
    { id: '1', name: 'Default Key', prefix: 'sk_', expiryDays: 90, rateLimit: 1000, scopes: ['read', 'write'] },
  ]);
  const [tableName, setTableName] = useState('api_keys');

  const addField = useCallback(() => {
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      prefix: 'sk_',
      expiryDays: 90,
      rateLimit: 1000,
      scopes: ['read'],
    }]);
  }, []);

  const updateField = useCallback((id: string, updates: Partial<APIKeyField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const generateMigrationSQL = useCallback((): string => {
    return `-- API Keys table
CREATE TABLE IF NOT EXISTS public.${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_rpm INTEGER DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON public.${tableName}
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_${tableName}_hash ON public.${tableName}(key_hash);
CREATE INDEX idx_${tableName}_user ON public.${tableName}(user_id);`;
  }, [tableName]);

  const generateCode = useCallback((): string => {
    return `import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function generateKey(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function APIKeyDashboard() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyVisible, setNewKeyVisible] = useState('');

  const createKey = async (name: string, prefix = 'sk_', expiryDays = 90) => {
    const rawKey = generateKey(prefix);
    const keyHash = await hashKey(rawKey);
    const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

    const { error } = await supabase.from('${tableName}').insert({
      name,
      key_hash: keyHash,
      key_prefix: rawKey.substring(0, prefix.length + 4) + '...',
      expires_at: expiresAt,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) throw error;
    setNewKeyVisible(rawKey);
    loadKeys();
  };

  const revokeKey = async (id: string) => {
    await supabase.from('${tableName}').update({ is_active: false }).eq('id', id);
    loadKeys();
  };

  const loadKeys = async () => {
    const { data } = await supabase.from('${tableName}')
      .select('*').order('created_at', { ascending: false });
    setKeys(data || []);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button onClick={() => createKey('New Key')} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">
          Create Key
        </button>
      </div>
      {newKeyVisible && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Copy this key now — it won't be shown again:</p>
          <code className="text-sm font-mono break-all">{newKeyVisible}</code>
        </div>
      )}
      <div className="space-y-2">
        {keys.map(k => (
          <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{k.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{k.key_prefix}</p>
            </div>
            <button onClick={() => revokeKey(k.id)} className="text-xs text-destructive hover:underline">Revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}`;
  }, [tableName]);

  return { fields, tableName, setTableName, addField, updateField, removeField, generateCode, generateMigrationSQL };
}
