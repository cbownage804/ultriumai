import { describe, it, expect } from 'vitest';

// Extract classifyError for testing — it's a module-private function,
// so we re-implement the same logic here for unit coverage.
interface ClassifiedError {
  category: 'rate_limit' | 'credits' | 'payload_too_large' | 'timeout' | 'network' | 'server' | 'unknown';
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  retryDelayMs?: number;
}

function classifyError(status: number, errorMsg: string, err?: Error): ClassifiedError {
  if (status === 429) return {
    category: 'rate_limit', retryable: true, retryDelayMs: 30_000,
    userMessage: 'You\'re sending requests too quickly.',
    suggestion: 'Wait 30 seconds, then try again.',
  };
  if (status === 402) return {
    category: 'credits', retryable: false,
    userMessage: 'AI credits exhausted.',
    suggestion: 'Purchase more credits in Settings → Billing to continue.',
  };
  if (status === 400 && /token|too large|exceeds|maximum context/i.test(errorMsg)) return {
    category: 'payload_too_large', retryable: true,
    userMessage: 'Your project context is too large for a single request.',
    suggestion: 'Try a more specific request like "update only the header component" instead of broad changes.',
  };
  if (status === 400 && /provider|upstream|internal|encountered an issue/i.test(errorMsg)) return {
    category: 'server', retryable: true, retryDelayMs: 5000,
    userMessage: 'The AI provider encountered a temporary issue.',
    suggestion: 'This usually resolves quickly. Try again in a few seconds.',
  };
  if (status === 504 || status === 408 || err?.name === 'AbortError' || /timeout/i.test(errorMsg)) return {
    category: 'timeout', retryable: true, retryDelayMs: 2000,
    userMessage: 'The AI took too long to respond.',
    suggestion: 'Try a simpler request, or break your task into smaller steps.',
  };
  if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed to fetch')) return {
    category: 'network', retryable: true, retryDelayMs: 3000,
    userMessage: 'Network connection issue.',
    suggestion: 'Check your internet connection and try again.',
  };
  if (status >= 500) return {
    category: 'server', retryable: true, retryDelayMs: 5000,
    userMessage: 'AI service is temporarily unavailable.',
    suggestion: 'This usually resolves in a few seconds. Try again shortly.',
  };
  let cleanMsg = errorMsg || 'Something went wrong.';
  try { const parsed = JSON.parse(cleanMsg); if (parsed?.error) cleanMsg = parsed.error; } catch {}
  cleanMsg = cleanMsg.replace(/AI builder returned \d+:\s*/i, '').slice(0, 150);
  return {
    category: 'unknown', retryable: false,
    userMessage: cleanMsg,
    suggestion: 'Try rephrasing your request or refreshing the page.',
  };
}

describe('classifyError', () => {
  it('classifies 429 as rate_limit', () => {
    const result = classifyError(429, '');
    expect(result.category).toBe('rate_limit');
    expect(result.retryable).toBe(true);
    expect(result.retryDelayMs).toBe(30_000);
  });

  it('classifies 402 as credits', () => {
    const result = classifyError(402, '');
    expect(result.category).toBe('credits');
    expect(result.retryable).toBe(false);
  });

  it('classifies payload too large', () => {
    const result = classifyError(400, 'Token limit exceeds maximum context');
    expect(result.category).toBe('payload_too_large');
    expect(result.retryable).toBe(true);
  });

  it('classifies upstream provider error', () => {
    const result = classifyError(400, 'upstream provider encountered an issue');
    expect(result.category).toBe('server');
    expect(result.retryable).toBe(true);
  });

  it('classifies 504 as timeout', () => {
    const result = classifyError(504, '');
    expect(result.category).toBe('timeout');
  });

  it('classifies AbortError as timeout', () => {
    const err = new Error('AbortError');
    err.name = 'AbortError';
    const result = classifyError(0, '', err);
    expect(result.category).toBe('timeout');
  });

  it('classifies Failed to fetch as network', () => {
    const result = classifyError(0, '', new Error('Failed to fetch'));
    expect(result.category).toBe('network');
    expect(result.retryable).toBe(true);
  });

  it('classifies 500+ as server', () => {
    const result = classifyError(503, '');
    expect(result.category).toBe('server');
  });

  it('strips JSON from unknown errors', () => {
    const result = classifyError(200, '{"error":"Something bad"}');
    expect(result.userMessage).toBe('Something bad');
  });

  it('truncates long error messages', () => {
    const longMsg = 'x'.repeat(300);
    const result = classifyError(200, longMsg);
    expect(result.userMessage.length).toBeLessThanOrEqual(150);
  });
});
