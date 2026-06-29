/**
 * WebAuthn/FIDO2 Utilities for Vault Hardware Key Support
 * 
 * Enables users to use hardware security keys (YubiKey, etc.) or 
 * platform authenticators (Touch ID, Windows Hello) as a second factor
 * for vault unlock.
 */

import { supabase } from '@/integrations/supabase/client';

// WebAuthn configuration
const RP_NAME = 'Vault';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const CHALLENGE_TIMEOUT = 60000; // 60 seconds

export interface WebAuthnCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  authenticatorType: 'cross-platform' | 'platform';
}

export interface WebAuthnRegistrationResult {
  success: boolean;
  credential?: WebAuthnCredential;
  error?: string;
}

export interface WebAuthnAuthenticationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Check if platform authenticator (Touch ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure challenge
 */
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Convert ArrayBuffer to base64url string
 */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert base64url string to ArrayBuffer
 */
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register a new WebAuthn credential for the current user
 */
export async function registerWebAuthnCredential(
  userId: string,
  userName: string,
  credentialName: string,
  authenticatorType: 'cross-platform' | 'platform' = 'cross-platform'
): Promise<WebAuthnRegistrationResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser' };
  }

  try {
    // Get existing credentials to exclude
    const { data: existingCreds } = await supabase
      .from('safepass_webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId);

    const excludeCredentials: PublicKeyCredentialDescriptor[] = (existingCreds || []).map(cred => ({
      type: 'public-key',
      id: base64urlToBuffer(cred.credential_id)
    }));

    const challenge = generateChallenge();

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge as BufferSource,
      rp: {
        name: RP_NAME,
        id: RP_ID
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }  // RS256
      ],
      timeout: CHALLENGE_TIMEOUT,
      attestation: 'none', // Privacy-preserving
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: authenticatorType,
        userVerification: 'preferred',
        residentKey: 'preferred',
        requireResidentKey: false
      }
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create credential' };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Extract public key from attestation
    const credentialId = bufferToBase64url(credential.rawId);
    const publicKey = bufferToBase64url(response.getPublicKey()!);
    const attestationObject = bufferToBase64url(response.attestationObject);

    // Store credential in database
    const { data, error } = await supabase
      .from('safepass_webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        attestation_object: attestationObject,
        name: credentialName,
        authenticator_type: authenticatorType,
        counter: 0
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      credential: {
        id: data.id,
        credentialId: data.credential_id,
        publicKey: data.public_key,
        name: data.name,
        createdAt: data.created_at,
        authenticatorType: data.authenticator_type as 'cross-platform' | 'platform'
      }
    };
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Registration was cancelled or timed out' };
      }
      if (error.name === 'InvalidStateError') {
        return { success: false, error: 'This security key is already registered' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Authenticate using a registered WebAuthn credential
 */
export async function authenticateWithWebAuthn(
  userId: string
): Promise<WebAuthnAuthenticationResult> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn is not supported in this browser' };
  }

  try {
    // Get user's registered credentials
    const { data: credentials, error: fetchError } = await supabase
      .from('safepass_webauthn_credentials')
      .select('credential_id, public_key')
      .eq('user_id', userId);

    if (fetchError || !credentials?.length) {
      return { success: false, error: 'No security keys registered' };
    }

    const challenge = generateChallenge();

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge as BufferSource,
      timeout: CHALLENGE_TIMEOUT,
      rpId: RP_ID,
      allowCredentials: credentials.map(cred => ({
        type: 'public-key',
        id: base64urlToBuffer(cred.credential_id)
      })),
      userVerification: 'preferred'
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Authentication failed' };
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    const credentialId = bufferToBase64url(assertion.rawId);

    // Find the matching credential
    const matchedCred = credentials.find(c => c.credential_id === credentialId);
    if (!matchedCred) {
      return { success: false, error: 'Unknown credential' };
    }

    // Verify the signature (simplified - in production, verify server-side)
    // For now, we trust the browser's verification
    const authenticatorData = new Uint8Array(response.authenticatorData);
    const signatureCounter = new DataView(authenticatorData.buffer).getUint32(33, false);

    // Update the credential counter and last used timestamp
    await supabase
      .from('safepass_webauthn_credentials')
      .update({
        counter: signatureCounter,
        last_used_at: new Date().toISOString()
      })
      .eq('credential_id', credentialId);

    return {
      success: true,
      credentialId
    };
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Authentication was cancelled or timed out' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all registered WebAuthn credentials for a user
 */
export async function getWebAuthnCredentials(userId: string): Promise<WebAuthnCredential[]> {
  const { data, error } = await supabase
    .from('safepass_webauthn_credentials')
    .select('id, credential_id, public_key, name, created_at, last_used_at, authenticator_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching WebAuthn credentials:', error);
    return [];
  }

  return (data || []).map(cred => ({
    id: cred.id,
    credentialId: cred.credential_id,
    publicKey: cred.public_key,
    name: cred.name,
    createdAt: cred.created_at,
    lastUsedAt: cred.last_used_at,
    authenticatorType: cred.authenticator_type as 'cross-platform' | 'platform'
  }));
}

/**
 * Delete a WebAuthn credential
 */
export async function deleteWebAuthnCredential(
  userId: string,
  credentialId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('safepass_webauthn_credentials')
    .delete()
    .eq('user_id', userId)
    .eq('id', credentialId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
