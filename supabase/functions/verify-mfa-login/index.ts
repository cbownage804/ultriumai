import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-MFA-LOGIN] ${step}${detailsStr}`);
};

// Base32 decode for TOTP secrets
const base32Decode = (encoded: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  for (const char of encoded.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return new Uint8Array(bytes);
};

// HMAC-SHA1 for TOTP
const hmacSha1 = async (key: Uint8Array, data: Uint8Array): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(signature);
};

// Verify TOTP token (check current and adjacent time windows)
const verifyTOTP = async (secret: string, token: string): Promise<boolean> => {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -1; i <= 1; i++) {
    const timeBytes = new Uint8Array(8);
    let time = currentTime + i;
    
    for (let j = 7; j >= 0; j--) {
      timeBytes[j] = time & 0xff;
      time = Math.floor(time / 256);
    }
    
    const secretBytes = base32Decode(secret);
    const hash = await hmacSha1(secretBytes, timeBytes);
    const offset = hash[hash.length - 1] & 0xf;
    
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  
  return false;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const authToken = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(authToken);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { token } = await req.json();
    
    if (!token || token.length !== 6) {
      throw new Error('Valid 6-digit token is required');
    }

    // Get security settings with 2FA secret
    const { data: settings, error: settingsError } = await supabase
      .from('security_settings')
      .select('two_factor_secret, two_factor_enabled, backup_codes')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Security settings not found');
    }

    if (!settings.two_factor_enabled) {
      // 2FA not enabled, just return success
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.two_factor_secret) {
      throw new Error('2FA is enabled but secret not found');
    }

    // Try TOTP verification first
    let isValid = await verifyTOTP(settings.two_factor_secret, token);
    
    // If TOTP failed, try backup codes
    if (!isValid && settings.backup_codes) {
      const backupCodes = settings.backup_codes as string[];
      const codeIndex = backupCodes.indexOf(token.toUpperCase());
      
      if (codeIndex !== -1) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((_, i) => i !== codeIndex);
        await supabase
          .from('security_settings')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', user.id);
        
        isValid = true;
        logStep("Backup code used", { remainingCodes: updatedCodes.length });
      }
    }
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    logStep("MFA verification successful", { userId: user.id });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'MFA verification successful'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR in verify-mfa-login", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
