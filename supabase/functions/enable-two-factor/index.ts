import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENABLE-TWO-FACTOR] ${step}${detailsStr}`);
};

// Simple HMAC-SHA1 implementation for TOTP
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

// Generate TOTP token
const generateTOTP = async (secret: string, timeStep: number = 30): Promise<string> => {
  const secretBytes = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  
  const timeBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = time & 0xff;
    time >>> 8;
  }
  
  const hash = await hmacSha1(secretBytes, timeBytes);
  const offset = hash[hash.length - 1] & 0xf;
  
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
};

// Verify TOTP token (check current and previous time windows)
const verifyTOTP = async (secret: string, token: string): Promise<boolean> => {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current and previous time window (allows for clock drift)
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

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { token: totpToken } = await req.json();
    
    if (!totpToken || totpToken.length !== 6) {
      throw new Error('Valid 6-digit token is required');
    }

    // Get security settings
    const { data: settings, error: settingsError } = await supabase
      .from('security_settings')
      .select('two_factor_secret, two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Security settings not found');
    }

    if (settings.two_factor_enabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    if (!settings.two_factor_secret) {
      throw new Error('Two-factor setup not initiated. Please setup 2FA first.');
    }

    // Verify the TOTP token
    const isValid = await verifyTOTP(settings.two_factor_secret, totpToken);
    
    if (!isValid) {
      throw new Error('Invalid token. Please check your authenticator app.');
    }

    logStep("TOTP token verified successfully");

    // Enable 2FA
    const { error: updateError } = await supabase
      .from('security_settings')
      .update({
        two_factor_enabled: true
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    logStep("Two-factor authentication enabled", { userId: user.id });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Two-factor authentication has been enabled successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in enable-two-factor", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);