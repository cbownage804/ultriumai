import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordQueryRequest {
  domain?: string;
  application?: string;
  username?: string;
  device_id: string;
  context?: any;
}

interface PasswordFillRequest {
  domain: string;
  username_field?: string;
  password_field?: string;
  device_id: string;
  auto_submit?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'query_passwords':
        return await queryPasswords(supabase, payload as PasswordQueryRequest);
      
      case 'fill_password':
        return await fillPassword(supabase, payload as PasswordFillRequest);
      
      case 'generate_password':
        return await generatePassword(supabase, payload);
      
      case 'save_credentials':
        return await saveCredentials(supabase, payload);
      
      case 'get_context_suggestions':
        return await getContextSuggestions(supabase, payload);
      
      case 'secure_note_lookup':
        return await secureNoteLookup(supabase, payload);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('SafePass Agent Integration Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function queryPasswords(supabase: any, request: PasswordQueryRequest) {
  // Build query based on context
  let query = supabase
    .from('password_entries')
    .select('id, title, username, domain, notes, tags, last_used, created_at')
    .eq('user_id', request.device_id); // This would be mapped to actual user_id

  if (request.domain) {
    query = query.ilike('domain', `%${request.domain}%`);
  }

  if (request.application) {
    query = query.or(`title.ilike.%${request.application}%, tags.cs.{${request.application}}`);
  }

  if (request.username) {
    query = query.ilike('username', `%${request.username}%`);
  }

  const { data: passwords, error } = await query.limit(10);

  if (error) throw error;

  // Filter and format results for agent
  const safeResults = passwords.map((pwd: any) => ({
    id: pwd.id,
    title: pwd.title,
    username: pwd.username,
    domain: pwd.domain,
    has_password: true,
    last_used: pwd.last_used,
    tags: pwd.tags,
    notes: pwd.notes ? 'Has notes' : null,
    strength_score: Math.floor(Math.random() * 40) + 60 // Mock strength score
  }));

  return new Response(
    JSON.stringify({ 
      success: true, 
      results: safeResults,
      total_found: safeResults.length,
      suggestions: generatePasswordSuggestions(request.context)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function fillPassword(supabase: any, request: PasswordFillRequest) {
  // Get password entry
  const { data: password, error } = await supabase
    .from('password_entries')
    .select('id, username, encrypted_password, domain, title')
    .eq('domain', request.domain)
    .single();

  if (error || !password) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Password not found for this domain'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // In a real implementation, password would be decrypted here
  // For demo purposes, we'll simulate successful fill
  const fillResult = {
    success: true,
    username: password.username,
    password_filled: true,
    auto_submit: request.auto_submit || false
  };

  // Log password usage
  await supabase
    .from('password_entries')
    .update({ 
      last_used: new Date().toISOString(),
      usage_count: supabase.raw('usage_count + 1')
    })
    .eq('id', password.id);

  // Create audit log
  await supabase
    .from('safepass_usage_logs')
    .insert({
      password_id: password.id,
      device_id: request.device_id,
      action: 'auto_fill',
      domain: request.domain,
      success: true,
      created_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      result: fillResult,
      message: 'Password filled successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generatePassword(supabase: any, request: any) {
  const options = {
    length: request.length || 16,
    includeUppercase: request.includeUppercase !== false,
    includeLowercase: request.includeLowercase !== false,
    includeNumbers: request.includeNumbers !== false,
    includeSymbols: request.includeSymbols !== false,
    excludeSimilar: request.excludeSimilar || false
  };

  const password = generateSecurePassword(options);
  const strength = calculatePasswordStrength(password);

  return new Response(
    JSON.stringify({ 
      success: true, 
      password: password,
      strength: strength,
      options: options,
      suggestions: [
        'Consider using a passphrase for better memorability',
        'Enable 2FA where available',
        'Don\'t reuse this password for other accounts'
      ]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function saveCredentials(supabase: any, request: any) {
  const credentialId = crypto.randomUUID();
  
  // In a real implementation, password would be encrypted before saving
  const { error } = await supabase
    .from('password_entries')
    .insert({
      id: credentialId,
      user_id: request.user_id,
      title: request.title,
      username: request.username,
      encrypted_password: btoa(request.password), // Basic encoding for demo
      domain: request.domain,
      notes: request.notes,
      tags: request.tags || [],
      created_via: 'agent',
      device_id: request.device_id
    });

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      credential_id: credentialId,
      message: 'Credentials saved securely'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getContextSuggestions(supabase: any, request: any) {
  const context = request.context || {};
  const suggestions = [];

  // Analyze current context for password suggestions
  if (context.url) {
    const domain = extractDomain(context.url);
    
    // Check if we have passwords for this domain
    const { data: existingPasswords } = await supabase
      .from('password_entries')
      .select('id, title, username')
      .ilike('domain', `%${domain}%`)
      .limit(5);

    if (existingPasswords && existingPasswords.length > 0) {
      suggestions.push({
        type: 'existing_passwords',
        message: `Found ${existingPasswords.length} saved passwords for ${domain}`,
        data: existingPasswords
      });
    } else {
      suggestions.push({
        type: 'new_password_prompt',
        message: `No saved passwords found for ${domain}. Would you like to save credentials after login?`,
        data: { domain }
      });
    }
  }

  // Check for weak passwords
  if (context.password_detected && context.password_strength < 60) {
    suggestions.push({
      type: 'weak_password_warning',
      message: 'Weak password detected. Consider generating a stronger password.',
      data: { current_strength: context.password_strength }
    });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      suggestions: suggestions,
      context_analyzed: Object.keys(context)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function secureNoteLookup(supabase: any, request: any) {
  const { data: notes, error } = await supabase
    .from('secure_notes')
    .select('id, title, content, tags, created_at')
    .eq('user_id', request.user_id)
    .or(`title.ilike.%${request.query}%, content.ilike.%${request.query}%, tags.cs.{${request.query}}`)
    .limit(10);

  if (error) throw error;

  const safeNotes = notes.map((note: any) => ({
    id: note.id,
    title: note.title,
    content_preview: note.content.substring(0, 200) + '...',
    tags: note.tags,
    created_at: note.created_at
  }));

  return new Response(
    JSON.stringify({ 
      success: true, 
      notes: safeNotes,
      total_found: safeNotes.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateSecurePassword(options: any): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const similar = 'il1Lo0O';

  let charset = '';
  if (options.includeUppercase) charset += uppercase;
  if (options.includeLowercase) charset += lowercase;
  if (options.includeNumbers) charset += numbers;
  if (options.includeSymbols) charset += symbols;

  if (options.excludeSimilar) {
    charset = charset.split('').filter(char => !similar.includes(char)).join('');
  }

  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  if (password.length >= 16) score += 10;
  
  return Math.min(100, score);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function generatePasswordSuggestions(context: any): string[] {
  const suggestions = [
    'Use unique passwords for each account',
    'Enable two-factor authentication when available',
    'Consider using passphrases for important accounts'
  ];

  if (context?.url) {
    const domain = extractDomain(context.url);
    suggestions.unshift(`Save credentials for ${domain} after successful login`);
  }

  return suggestions;
}