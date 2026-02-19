import { useState, useCallback } from 'react';

export interface RateLimitRule {
  id: string;
  functionName: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  perIP: boolean;
  perUser: boolean;
  burstLimit: number;
  errorMessage: string;
  errorStatusCode: number;
  enabled: boolean;
}

export function useRateLimiter() {
  const [rules, setRules] = useState<RateLimitRule[]>([]);

  const addRule = useCallback((functionName: string) => {
    const rule: RateLimitRule = {
      id: crypto.randomUUID(),
      functionName,
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      perIP: true,
      perUser: true,
      burstLimit: 10,
      errorMessage: 'Too many requests. Please try again later.',
      errorStatusCode: 429,
      enabled: true,
    };
    setRules(prev => [...prev, rule]);
    return rule;
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<RateLimitRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const generateMiddleware = useCallback((rule: RateLimitRule): string => {
    return `// Rate limiting middleware for ${rule.functionName}
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + 60000 });
    return { allowed: true, remaining: ${rule.requestsPerMinute} - 1, resetAt: now + 60000 };
  }
  
  if (entry.count >= ${rule.requestsPerMinute}) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: ${rule.requestsPerMinute} - entry.count, resetAt: entry.resetAt };
}

// Usage in edge function:
// const ip = req.headers.get('x-forwarded-for') || 'unknown';
// const { allowed, remaining, resetAt } = checkRateLimit(${rule.perIP ? 'ip' : "'global'"});
// if (!allowed) {
//   return new Response(JSON.stringify({ error: "${rule.errorMessage}" }), {
//     status: ${rule.errorStatusCode},
//     headers: { 'X-RateLimit-Remaining': String(remaining), 'X-RateLimit-Reset': String(resetAt) }
//   });
// }`;
  }, []);

  return { rules, addRule, updateRule, removeRule, toggleRule, generateMiddleware };
}
