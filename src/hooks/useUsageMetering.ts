import { useState, useCallback } from 'react';

export interface UsageMeter {
  id: string;
  name: string;
  unit: string; // 'api_call' | 'storage_gb' | 'compute_min' | 'message' | 'token'
  currentUsage: number;
  limit: number;
  resetInterval: 'hourly' | 'daily' | 'monthly';
  overageRate: number; // cents per extra unit
  isActive: boolean;
}

export interface UsageRecord {
  id: string;
  meterId: string;
  amount: number;
  timestamp: string;
  userId: string;
  metadata: Record<string, string>;
}

export function useUsageMetering() {
  const [meters, setMeters] = useState<UsageMeter[]>([]);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [activeMeterId, setActiveMeterId] = useState<string | null>(null);

  const UNIT_PRESETS = ['api_call', 'storage_gb', 'compute_min', 'message', 'token', 'seat', 'bandwidth_gb'] as const;

  const createMeter = useCallback((name: string, unit: string, limit: number) => {
    const meter: UsageMeter = {
      id: crypto.randomUUID(), name, unit, currentUsage: 0,
      limit, resetInterval: 'monthly', overageRate: 0, isActive: true,
    };
    setMeters(prev => [...prev, meter]);
    return meter;
  }, []);

  const updateMeter = useCallback((id: string, updates: Partial<UsageMeter>) => {
    setMeters(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const removeMeter = useCallback((id: string) => {
    setMeters(prev => prev.filter(m => m.id !== id));
  }, []);

  const recordUsage = useCallback((meterId: string, amount: number, userId = 'demo') => {
    const record: UsageRecord = {
      id: crypto.randomUUID(), meterId, amount,
      timestamp: new Date().toISOString(), userId, metadata: {},
    };
    setRecords(prev => [...prev, record]);
    setMeters(prev => prev.map(m => m.id === meterId ? { ...m, currentUsage: m.currentUsage + amount } : m));
  }, []);

  const getActiveMeter = useCallback(() => meters.find(m => m.id === activeMeterId) || null, [meters, activeMeterId]);

  const getMeterUsagePercent = useCallback((meter: UsageMeter) => {
    return meter.limit > 0 ? Math.min(100, (meter.currentUsage / meter.limit) * 100) : 0;
  }, []);

  const calculateOverage = useCallback((meter: UsageMeter) => {
    const over = Math.max(0, meter.currentUsage - meter.limit);
    return { overageUnits: over, overageCost: over * meter.overageRate };
  }, []);

  const generateMeteringMiddleware = useCallback(() => {
    return `// Usage Metering Middleware
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function recordUsage(userId: string, meterId: string, amount: number) {
  const { error } = await supabase.from('usage_records').insert({
    user_id: userId, meter_id: meterId, amount,
    recorded_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function checkLimit(userId: string, meterId: string): Promise<boolean> {
  const { data } = await supabase.from('usage_meters').select('*').eq('id', meterId).single();
  if (!data) return false;

  const periodStart = getPeriodStart(data.reset_interval);
  const { data: usage } = await supabase.from('usage_records')
    .select('amount').eq('user_id', userId).eq('meter_id', meterId)
    .gte('recorded_at', periodStart);

  const total = (usage || []).reduce((s, r) => s + r.amount, 0);
  return total < data.usage_limit;
}

function getPeriodStart(interval: string): string {
  const now = new Date();
  if (interval === 'daily') now.setHours(0, 0, 0, 0);
  else if (interval === 'monthly') { now.setDate(1); now.setHours(0, 0, 0, 0); }
  else now.setMinutes(0, 0, 0);
  return now.toISOString();
}`;
  }, []);

  const generateUsageDashboard = useCallback(() => {
    return `import React from 'react';

interface Meter { name: string; unit: string; currentUsage: number; limit: number; }

export function UsageDashboard({ meters }: { meters: Meter[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meters.map(m => {
        const pct = m.limit > 0 ? Math.min(100, (m.currentUsage / m.limit) * 100) : 0;
        return (
          <div key={m.name} className="border rounded-lg p-4">
            <h3 className="font-semibold">{m.name}</h3>
            <p className="text-sm text-gray-500">{m.currentUsage.toLocaleString()} / {m.limit.toLocaleString()} {m.unit}</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: pct + '%', backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}`;
  }, []);

  return {
    meters, records, activeMeterId, setActiveMeterId, getActiveMeter,
    UNIT_PRESETS, createMeter, updateMeter, removeMeter, recordUsage,
    getMeterUsagePercent, calculateOverage,
    generateMeteringMiddleware, generateUsageDashboard,
  };
}
