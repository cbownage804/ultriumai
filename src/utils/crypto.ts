/**
 * SafePass Cryptographic Utilities
 * Implements client-side AES-256 encryption with PBKDF2 key derivation
 */

// Crypto configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const TAG_LENGTH = 16; // 128 bits for GCM tag

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
}

export interface KeyDerivationParams {
  salt: Uint8Array;
  iterations: number;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureRandom(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a secure salt for PBKDF2
 */
export function generateSalt(): Uint8Array {
  return generateSecureRandom(SALT_LENGTH);
}

/**
 * Generate a secure initialization vector
 */
export function generateIV(): Uint8Array {
  return generateSecureRandom(IV_LENGTH);
}

/**
 * Derive encryption key from master password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  plaintext: string,
  masterPassword: string,
  salt?: Uint8Array
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate salt if not provided
  const cryptoSalt = salt || generateSalt();
  const iv = generateIV();
  
  // Derive key from master password
  const key = await deriveKeyFromPassword(masterPassword, cryptoSalt);
  
  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH * 8 // Convert to bits
    },
    key,
    data
  );
  
  // Extract ciphertext and tag
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -TAG_LENGTH);
  const tag = encryptedArray.slice(-TAG_LENGTH);
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(cryptoSalt),
    tag: arrayBufferToBase64(tag)
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<string> {
  const decoder = new TextDecoder();
  
  // Convert base64 to arrays
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const tag = base64ToArrayBuffer(encryptedData.tag);
  
  // Reconstruct encrypted data with tag
  const encryptedWithTag = new Uint8Array(ciphertext.length + tag.length);
  encryptedWithTag.set(new Uint8Array(ciphertext));
  encryptedWithTag.set(new Uint8Array(tag), ciphertext.length);
  
  // Derive key from master password
  const key = await deriveKeyFromPassword(masterPassword, new Uint8Array(salt));
  
  try {
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(iv),
        tagLength: TAG_LENGTH * 8
      },
      key,
      encryptedWithTag
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed - incorrect master password or corrupted data');
  }
}

/**
 * Generate cryptographically secure password
 */
export function generateSecurePassword(options: {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
  excludeAmbiguous?: boolean;
}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = false,
    excludeAmbiguous = false
  } = options;

  let charset = '';
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (includeSymbols) {
    const symbols = excludeAmbiguous ? '!@#$%^&*-_=+' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    charset += symbols;
  }

  if (!charset) {
    throw new Error('At least one character type must be selected');
  }

  // Use cryptographically secure random generation
  const password = new Array(length);
  const randomBytes = generateSecureRandom(length * 2); // Extra bytes for rejection sampling
  
  let passwordIndex = 0;
  let randomIndex = 0;
  
  while (passwordIndex < length && randomIndex < randomBytes.length) {
    const randomValue = randomBytes[randomIndex];
    randomIndex++;
    
    // Use rejection sampling to avoid modulo bias
    const maxValue = Math.floor(256 / charset.length) * charset.length;
    if (randomValue < maxValue) {
      password[passwordIndex] = charset[randomValue % charset.length];
      passwordIndex++;
    }
  }
  
  // Fallback if we run out of random bytes (very unlikely)
  while (passwordIndex < length) {
    const moreBytes = generateSecureRandom(1);
    const randomValue = moreBytes[0];
    const maxValue = Math.floor(256 / charset.length) * charset.length;
    if (randomValue < maxValue) {
      password[passwordIndex] = charset[randomValue % charset.length];
      passwordIndex++;
    }
  }
  
  return password.join('');
}

/**
 * Generate secure passphrase
 */
export function generatePassphrase(options: {
  wordCount?: number;
  separator?: string;
  wordList?: string[];
  includeNumbers?: boolean;
  capitalizeFirst?: boolean;
}): string {
  const {
    wordCount = 4,
    separator = '-',
    includeNumbers = false,
    capitalizeFirst = true
  } = options;

  // EFF Large Wordlist (subset for demo - in production use full list)
  const defaultWordList = [
    'ability', 'absence', 'academy', 'account', 'accused', 'achieve', 'acquire', 'address',
    'advance', 'adviser', 'against', 'airport', 'already', 'amazing', 'analyst', 'ancient',
    'anxiety', 'anybody', 'applied', 'approve', 'arrange', 'arrival', 'article', 'assault',
    'athlete', 'attempt', 'attract', 'auction', 'average', 'backing', 'balance', 'banking',
    'barrier', 'battery', 'bearing', 'bedroom', 'benefit', 'bicycle', 'blanket', 'bracket',
    'cabinet', 'caliber', 'campaign', 'capable', 'capital', 'capture', 'cardiac', 'carrier',
    'ceiling', 'central', 'century', 'chamber', 'channel', 'chapter', 'charity', 'chicken',
    'digital', 'dinosaur', 'diploma', 'disable', 'distant', 'divorce', 'document', 'domestic'
  ];

  const wordList = options.wordList || defaultWordList;
  const words = [];
  
  for (let i = 0; i < wordCount; i++) {
    const randomBytes = generateSecureRandom(2);
    const randomIndex = (randomBytes[0] * 256 + randomBytes[1]) % wordList.length;
    let word = wordList[randomIndex];
    
    if (capitalizeFirst) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    words.push(word);
  }
  
  let passphrase = words.join(separator);
  
  if (includeNumbers) {
    const randomNumber = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    passphrase += separator + randomNumber;
  }
  
  return passphrase;
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 25;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 10;
  else feedback.push('Add uppercase letters');
  
  if (/[0-9]/.test(password)) score += 10;
  else feedback.push('Add numbers');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  else feedback.push('Add symbols');
  
  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 10;
  else feedback.push('Avoid repeated characters');
  
  if (!/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    score += 10;
  } else {
    feedback.push('Avoid common sequences');
  }
  
  // Determine level
  let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  if (score < 30) level = 'very-weak';
  else if (score < 50) level = 'weak';
  else if (score < 70) level = 'fair';
  else if (score < 90) level = 'good';
  else level = 'strong';
  
  return {
    score: Math.min(score, 100),
    feedback,
    level
  };
}

/**
 * Verify master password strength
 */
export function validateMasterPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Master password must be at least 12 characters long');
  }
  
  const strength = calculatePasswordStrength(password);
  if (strength.score < 70) {
    errors.push('Master password is too weak - use a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utility functions for base64 encoding/decoding
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash data using SHA-256
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verify data integrity using SHA-256 hash
 */
export async function verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashData(data);
  return actualHash === expectedHash;
}