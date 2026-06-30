/**
 * Client-side TOTP + AES-GCM helpers used by the Ray 2FA Vault.
 *
 * Secrets and backup codes are encrypted in the browser with a key derived
 * from the user's master password (PBKDF2-SHA-256, 600k iterations) before
 * any value reaches the network. The Supabase row only ever sees ciphertext.
 */

const SESSION_KEY = 'ray_mfa_master_key_v1';
const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 32;

const enc = new TextEncoder();
const dec = new TextDecoder();

/* -------------------------------------------------------------------------- */
/* Base helpers                                                                */
/* -------------------------------------------------------------------------- */

export function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

export function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

/* -------------------------------------------------------------------------- */
/* Base32 (RFC 4648) — for TOTP secrets                                       */
/* -------------------------------------------------------------------------- */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/* -------------------------------------------------------------------------- */
/* Key derivation + AES-GCM                                                    */
/* -------------------------------------------------------------------------- */

export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(masterPassword) as BufferSource, 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

export async function encryptString(plaintext: string, masterPassword: string): Promise<EncryptedPayload> {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(masterPassword, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plaintext) as BufferSource);
  return { ciphertext: bufToB64(ct), iv: bufToB64(iv), salt: bufToB64(salt) };
}

export async function decryptString(payload: EncryptedPayload, masterPassword: string): Promise<string> {
  const key = await deriveKey(masterPassword, b64ToBuf(payload.salt));
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(payload.iv) as BufferSource },
    key,
    b64ToBuf(payload.ciphertext) as BufferSource,
  );
  return dec.decode(pt);
}

/* -------------------------------------------------------------------------- */
/* Session-cached master password (per-tab, cleared on tab close)              */
/* -------------------------------------------------------------------------- */

export function cacheMasterPassword(password: string) {
  try { sessionStorage.setItem(SESSION_KEY, password); } catch { /* ignore */ }
}

export function getCachedMasterPassword(): string | null {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}

export function clearMasterPassword() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

/* -------------------------------------------------------------------------- */
/* TOTP generation (RFC 6238)                                                  */
/* -------------------------------------------------------------------------- */

export interface TOTPOptions {
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
  timestamp?: number; // ms, defaults to Date.now()
}

function algoToWebCrypto(algo: TOTPOptions['algorithm']): string {
  switch (algo) {
    case 'SHA256': return 'SHA-256';
    case 'SHA512': return 'SHA-512';
    case 'SHA1':
    default: return 'SHA-1';
  }
}

export async function generateTOTP(secretBase32: string, opts: TOTPOptions = {}): Promise<string> {
  const { algorithm = 'SHA1', digits = 6, period = 30, timestamp = Date.now() } = opts;
  const keyBytes = base32Decode(secretBase32);
  if (keyBytes.length === 0) return '0'.repeat(digits);

  const counter = Math.floor(timestamp / 1000 / period);
  const counterBuf = new ArrayBuffer(8);
  const view = new DataView(counterBuf);
  // high 32 bits typically 0 for JS-era timestamps
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);

  const key = await crypto.subtle.importKey(
    'raw', keyBytes as BufferSource, { name: 'HMAC', hash: algoToWebCrypto(algorithm) }, false, ['sign'],
  );
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBuf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = ((hmac[offset] & 0x7f) << 24)
                | ((hmac[offset + 1] & 0xff) << 16)
                | ((hmac[offset + 2] & 0xff) << 8)
                | (hmac[offset + 3] & 0xff);
  const code = (binCode % 10 ** digits).toString().padStart(digits, '0');
  return code;
}

export function secondsRemaining(period = 30, timestamp = Date.now()): number {
  return period - Math.floor((timestamp / 1000) % period);
}

/* -------------------------------------------------------------------------- */
/* otpauth:// URI parser                                                       */
/* -------------------------------------------------------------------------- */

export interface OtpauthParsed {
  type: 'totp' | 'hotp';
  label: string;
  issuer?: string;
  account?: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
}

export function parseOtpauthUri(uri: string): OtpauthParsed | null {
  try {
    const trimmed = uri.trim();
    if (!trimmed.toLowerCase().startsWith('otpauth://')) return null;
    const u = new URL(trimmed);
    const type = (u.hostname.toLowerCase() === 'hotp' ? 'hotp' : 'totp') as 'totp' | 'hotp';
    const rawLabel = decodeURIComponent(u.pathname.replace(/^\//, ''));
    const [issuerInLabel, account] = rawLabel.includes(':')
      ? rawLabel.split(':', 2).map((s) => s.trim())
      : [undefined, rawLabel];
    const params = u.searchParams;
    const secret = (params.get('secret') || '').replace(/\s+/g, '');
    if (!secret) return null;
    const algorithmRaw = (params.get('algorithm') || 'SHA1').toUpperCase();
    const algorithm = (['SHA1', 'SHA256', 'SHA512'].includes(algorithmRaw)
      ? algorithmRaw : 'SHA1') as OtpauthParsed['algorithm'];
    return {
      type,
      label: rawLabel,
      issuer: params.get('issuer') || issuerInLabel || undefined,
      account: account || undefined,
      secret,
      algorithm,
      digits: parseInt(params.get('digits') || '6', 10) || 6,
      period: parseInt(params.get('period') || '30', 10) || 30,
    };
  } catch {
    return null;
  }
}

/** Accepts raw base32, with or without spaces, or a full otpauth:// URI. */
export function normalizeSecretInput(input: string): {
  secret: string;
  parsed?: OtpauthParsed;
} | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith('otpauth://')) {
    const parsed = parseOtpauthUri(trimmed);
    if (!parsed) return null;
    return { secret: parsed.secret, parsed };
  }
  const cleaned = trimmed.toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (cleaned.length < 8) return null;
  return { secret: cleaned };
}
