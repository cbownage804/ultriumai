/**
 * SafePass Rate Limiter Edge Function
 * Provides server-side rate limiting for vault unlock attempts
 * with CAPTCHA enforcement after multiple failures
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const MAX_ATTEMPTS_BEFORE_CAPTCHA = 3;
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for counting attempts

interface RateLimitRequest {
  action: 'check' | 'record_attempt' | 'record_success' | 'verify_captcha';
  userId: string;
  captchaToken?: string;
}

interface RateLimitResponse {
  allowed: boolean;
  requiresCaptcha: boolean;
  isLockedOut: boolean;
  lockoutRemainingMs?: number;
  attemptsRemaining?: number;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, captchaToken } = await req.json() as RateLimitRequest;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current rate limit state
    const { data: rateLimitData, error: fetchError } = await supabase
      .from('safepass_unlock_attempts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const now = Date.now();
    const lockedUntil = rateLimitData?.locked_until 
      ? new Date(rateLimitData.locked_until).getTime() 
      : null;
    const isLockedOut = lockedUntil ? lockedUntil > now : false;
    const attemptCount = rateLimitData?.attempt_count || 0;
    const lastAttempt = rateLimitData?.last_attempt_at 
      ? new Date(rateLimitData.last_attempt_at).getTime()
      : 0;

    // Reset attempts if window has passed
    const shouldResetAttempts = (now - lastAttempt) > ATTEMPT_WINDOW_MS;

    switch (action) {
      case 'check': {
        // Check if user can attempt unlock
        if (isLockedOut) {
          const response: RateLimitResponse = {
            allowed: false,
            requiresCaptcha: false,
            isLockedOut: true,
            lockoutRemainingMs: lockedUntil! - now,
            message: `Account locked. Try again in ${Math.ceil((lockedUntil! - now) / 60000)} minutes.`
          };
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const effectiveAttempts = shouldResetAttempts ? 0 : attemptCount;
        const requiresCaptcha = effectiveAttempts >= MAX_ATTEMPTS_BEFORE_CAPTCHA;
        const attemptsRemaining = MAX_ATTEMPTS_BEFORE_LOCKOUT - effectiveAttempts;

        const response: RateLimitResponse = {
          allowed: true,
          requiresCaptcha,
          isLockedOut: false,
          attemptsRemaining
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'record_attempt': {
        // Record a failed unlock attempt
        const newAttemptCount = shouldResetAttempts ? 1 : attemptCount + 1;
        const shouldLockout = newAttemptCount >= MAX_ATTEMPTS_BEFORE_LOCKOUT;
        const newLockedUntil = shouldLockout 
          ? new Date(now + LOCKOUT_DURATION_MS).toISOString() 
          : null;

        await supabase
          .from('safepass_unlock_attempts')
          .upsert({
            user_id: userId,
            attempt_count: newAttemptCount,
            last_attempt_at: new Date().toISOString(),
            locked_until: newLockedUntil
          }, { onConflict: 'user_id' });

        // Log the failed attempt for security auditing
        await supabase
          .from('audit_logs')
          .insert({
            user_id: userId,
            action: 'safepass_unlock_failed',
            resource_type: 'safepass_vault',
            details: {
              attempt_number: newAttemptCount,
              locked_out: shouldLockout,
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            }
          });

        const response: RateLimitResponse = {
          allowed: false,
          requiresCaptcha: newAttemptCount >= MAX_ATTEMPTS_BEFORE_CAPTCHA,
          isLockedOut: shouldLockout,
          lockoutRemainingMs: shouldLockout ? LOCKOUT_DURATION_MS : undefined,
          attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCKOUT - newAttemptCount,
          message: shouldLockout 
            ? `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MS / 60000} minutes.`
            : `Incorrect password. ${MAX_ATTEMPTS_BEFORE_LOCKOUT - newAttemptCount} attempts remaining.`
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'record_success': {
        // Clear rate limit state on successful unlock
        await supabase
          .from('safepass_unlock_attempts')
          .delete()
          .eq('user_id', userId);

        // Log successful unlock
        await supabase
          .from('audit_logs')
          .insert({
            user_id: userId,
            action: 'safepass_unlock_success',
            resource_type: 'safepass_vault',
            details: {
              ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            }
          });

        const response: RateLimitResponse = {
          allowed: true,
          requiresCaptcha: false,
          isLockedOut: false
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'verify_captcha': {
        // Verify CAPTCHA token (integrate with your CAPTCHA provider)
        // For now, we'll implement a placeholder that can be replaced
        // with actual CAPTCHA verification (e.g., hCaptcha, Turnstile)
        
        if (!captchaToken) {
          return new Response(
            JSON.stringify({ 
              verified: false, 
              error: 'CAPTCHA token required' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // TODO: Replace with actual CAPTCHA verification
        // Example for Cloudflare Turnstile:
        // const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
        // const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //   body: `secret=${turnstileSecret}&response=${captchaToken}`
        // });
        // const result = await verifyResponse.json();

        // Placeholder: accept any non-empty token in development
        const verified = captchaToken.length > 0;

        return new Response(
          JSON.stringify({ verified }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
