import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SETUP-TWO-FACTOR] ${step}${detailsStr}`);
};

// Simple base32 encoding for TOTP secrets
const base32Encode = (buffer: Uint8Array): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let result = '';
  
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  
  return result;
};

const generateSecret = (): string => {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return base32Encode(buffer);
};

const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);
    const code = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 6)
      .toUpperCase();
    codes.push(code);
  }
  return codes;
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

    // Check if 2FA is already enabled
    const { data: existingSettings } = await supabase
      .from('security_settings')
      .select('two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    if (existingSettings?.two_factor_enabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Generate secret and backup codes
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    
    logStep("Generated 2FA secret and backup codes");

    // Create QR code URL for Google Authenticator/Authy
    const issuer = 'UltriumGPT';
    const accountName = user.email || user.id;
    const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    // Store the secret temporarily (will be activated when user verifies)
    const { error: updateError } = await supabase
      .from('security_settings')
      .upsert(
        {
          user_id: user.id,
          two_factor_secret: secret,
          backup_codes: backupCodes,
          two_factor_enabled: false // Not enabled until verified
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      );

    if (updateError) {
      throw updateError;
    }

    logStep("Stored temporary 2FA setup");

    return new Response(JSON.stringify({
      secret,
      qr_code: qrCodeUrl,
      backup_codes: backupCodes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in setup-two-factor", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);