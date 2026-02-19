import { useState, useCallback } from 'react';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  durationMinutes: number;
  severity: 'info' | 'warning' | 'critical';
  channels: ('webhook' | 'email' | 'slack')[];
  isEnabled: boolean;
  cooldownMinutes: number;
}

export function useAlertingRulesEngine() {
  const [rules, setRules] = useState<AlertRule[]>([]);

  const addRule = useCallback(() => {
    setRules(prev => [...prev, {
      id: crypto.randomUUID(),
      name: 'New Alert',
      metric: 'response_time_ms',
      operator: '>',
      threshold: 1000,
      durationMinutes: 5,
      severity: 'warning',
      channels: ['webhook'],
      isEnabled: true,
      cooldownMinutes: 15,
    }]);
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<AlertRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  }, []);

  const generateCode = useCallback((): string => {
    return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RULES = ${JSON.stringify(rules.filter(r => r.isEnabled), null, 2)};

serve(async (req) => {
  const { metrics } = await req.json();
  const triggered: any[] = [];

  for (const rule of RULES) {
    const value = metrics[rule.metric];
    if (value === undefined) continue;

    let fired = false;
    switch (rule.operator) {
      case '>': fired = value > rule.threshold; break;
      case '<': fired = value < rule.threshold; break;
      case '>=': fired = value >= rule.threshold; break;
      case '<=': fired = value <= rule.threshold; break;
      case '==': fired = value === rule.threshold; break;
    }

    if (fired) {
      triggered.push({ rule: rule.name, severity: rule.severity, value, threshold: rule.threshold });

      for (const channel of rule.channels) {
        if (channel === 'webhook') {
          await fetch(Deno.env.get('ALERT_WEBHOOK_URL') || '', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert: rule.name, severity: rule.severity, metric: rule.metric, value }),
          }).catch(() => {});
        }
      }
    }
  }

  return new Response(JSON.stringify({ triggered, total: triggered.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});`;
  }, [rules]);

  return { rules, addRule, updateRule, removeRule, toggleRule, generateCode };
}
