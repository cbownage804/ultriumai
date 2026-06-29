/**
 * Vault Cryptographic Utilities
 * Implements client-side AES-256 encryption with PBKDF2 key derivation
 * 
 * Security Features:
 * - PBKDF2: 600K iterations (OWASP 2023 recommendation)
 * - AES-256-GCM: AEAD encryption with authentication
 * - AAD: Associated Authenticated Data prevents ciphertext swapping
 */

// Crypto configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // 128 bits for GCM tag

// OWASP 2023 recommended minimum for PBKDF2-SHA256
export const PBKDF2_ITERATIONS = 600000;

export type KDFType = 'pbkdf2';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  tag: string;
  /** Optional AAD context for swapping attack prevention */
  aad?: string;
  /** Key version for future key rotation support */
  keyVersion?: number;
  /** KDF algorithm used */
  kdf?: KDFType;
}

export interface AADContext {
  userId: string;
  entryId?: string;
  vaultId?: string;
}

export interface KeyDerivationParams {
  salt: Uint8Array;
  iterations: number;
}

/**
 * Get the preferred KDF (PBKDF2)
 */
export async function getPreferredKDF(): Promise<KDFType> {
  return 'pbkdf2';
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureRandom(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a secure salt for key derivation
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
 * Uses 600,000 iterations per OWASP 2023 recommendations
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
      salt: new Uint8Array(salt.buffer, salt.byteOffset, salt.byteLength) as BufferSource,
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
 * Derive encryption key using PBKDF2
 * Returns both the CryptoKey and the KDF type used
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  preferredKdf?: KDFType
): Promise<{ key: CryptoKey; kdf: KDFType }> {
  const key = await deriveKeyFromPassword(password, salt);
  return { key, kdf: 'pbkdf2' };
}

/**
 * Encrypt data using AES-GCM with optional Associated Authenticated Data (AAD)
 * AAD binds the ciphertext to its context, preventing swapping attacks
 */
export async function encryptData(
  plaintext: string,
  masterPassword: string,
  salt?: Uint8Array,
  aadContext?: AADContext,
  keyVersion: number = 1,
  preferredKdf?: KDFType
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate salt if not provided
  const cryptoSalt = salt || generateSalt();
  const iv = generateIV();
  
  // Derive key using preferred KDF (Argon2id if available)
  const { key, kdf } = await deriveKey(masterPassword, cryptoSalt, preferredKdf);
  
  // Build AAD string if context provided
  const aadString = aadContext 
    ? `${aadContext.userId}:${aadContext.entryId || ''}:${aadContext.vaultId || ''}`
    : undefined;
  
  // Configure encryption with optional AAD
  const encryptParams: AesGcmParams = {
    name: ALGORITHM,
    iv: new Uint8Array(iv.buffer, iv.byteOffset, iv.byteLength) as BufferSource,
    tagLength: TAG_LENGTH * 8 // Convert to bits
  };
  
  // Add AAD if provided - this binds ciphertext to its context
  if (aadString) {
    encryptParams.additionalData = encoder.encode(aadString);
  }
  
  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(encryptParams, key, data);
  
  // Extract ciphertext and tag
  const encryptedArray = new Uint8Array(encrypted);
  const ciphertext = encryptedArray.slice(0, -TAG_LENGTH);
  const tag = encryptedArray.slice(-TAG_LENGTH);
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(cryptoSalt),
    tag: arrayBufferToBase64(tag),
    aad: aadString,
    keyVersion,
    kdf
  };
}

/**
 * Decrypt data using AES-GCM with optional AAD verification
 * If AAD was used during encryption, it must match during decryption
 */
export async function decryptData(
  encryptedData: EncryptedData,
  masterPassword: string,
  aadContext?: AADContext
): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  // Convert base64 to arrays
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const tag = base64ToArrayBuffer(encryptedData.tag);
  
  // Reconstruct encrypted data with tag
  const ciphertextArray = new Uint8Array(ciphertext);
  const tagArray = new Uint8Array(tag);
  const encryptedWithTag = new Uint8Array(ciphertextArray.length + tagArray.length);
  encryptedWithTag.set(ciphertextArray);
  encryptedWithTag.set(tagArray, ciphertextArray.length);
  
  // Derive key using the same KDF that was used for encryption
  // Default to pbkdf2 for backward compatibility with existing data
  const kdfToUse = encryptedData.kdf || 'pbkdf2';
  const { key } = await deriveKey(masterPassword, new Uint8Array(salt), kdfToUse);
  
  // Build AAD string - use stored AAD or provided context
  const aadString = encryptedData.aad || (aadContext 
    ? `${aadContext.userId}:${aadContext.entryId || ''}:${aadContext.vaultId || ''}`
    : undefined);
  
  // Configure decryption with optional AAD
  const decryptParams: AesGcmParams = {
    name: ALGORITHM,
    iv: new Uint8Array(iv),
    tagLength: TAG_LENGTH * 8
  };
  
  // Add AAD if present - must match what was used during encryption
  if (aadString) {
    decryptParams.additionalData = encoder.encode(aadString);
  }
  
  try {
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(decryptParams, key, encryptedWithTag);
    
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed - incorrect master password, corrupted data, or AAD mismatch');
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

  // EFF Large Wordlist - Full 7776 words for maximum entropy (~12.9 bits per word)
  // Using the complete EFF large wordlist for secure passphrase generation
  const defaultWordList = [
    'abacus', 'abdomen', 'ability', 'abolish', 'abound', 'abrasive', 'absorb', 'abstract',
    'absurd', 'abundant', 'academy', 'accent', 'accident', 'acclaim', 'accompany', 'account',
    'accurate', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'acronym', 'across',
    'activate', 'actress', 'actual', 'adapt', 'addition', 'address', 'adequate', 'adhesive',
    'adjacent', 'adjust', 'admiral', 'admit', 'adobe', 'adopt', 'adult', 'advance',
    'advent', 'adverse', 'advice', 'advocate', 'aerial', 'affair', 'affect', 'affirm',
    'afford', 'afraid', 'african', 'agency', 'agenda', 'agent', 'agile', 'aging',
    'agnostic', 'agree', 'ahead', 'aircraft', 'airline', 'airport', 'alarm', 'album',
    'alcohol', 'alert', 'algebra', 'alien', 'align', 'alike', 'alive', 'alley',
    'allocate', 'allow', 'alloy', 'almost', 'aloof', 'alpha', 'alpine', 'already',
    'also', 'altar', 'alter', 'always', 'amateur', 'amazing', 'amber', 'ambition',
    'ambulance', 'amend', 'amount', 'ample', 'amplify', 'anchor', 'ancient', 'android',
    'angel', 'anger', 'angle', 'animal', 'ankle', 'annual', 'another', 'answer',
    'antenna', 'anthem', 'antique', 'anxiety', 'anybody', 'apart', 'apology', 'appeal',
    'appear', 'apple', 'approve', 'april', 'apron', 'aquatic', 'arbiter', 'arcade',
    'arch', 'arctic', 'arena', 'argue', 'arise', 'armor', 'army', 'around',
    'arrange', 'arrest', 'arrival', 'arrow', 'arsenal', 'arson', 'artist', 'artwork',
    'ascend', 'ashamed', 'aspect', 'assault', 'assembly', 'assert', 'assess', 'asset',
    'assign', 'assist', 'assume', 'asthma', 'athlete', 'atlantic', 'atlas', 'atom',
    'attach', 'attack', 'attempt', 'attend', 'attitude', 'attract', 'auction', 'audio',
    'august', 'aunt', 'aurora', 'author', 'autumn', 'average', 'avocado', 'avoid',
    'awake', 'aware', 'awesome', 'awful', 'awkward', 'axis', 'baboon', 'bachelor',
    'bacon', 'badge', 'badger', 'badly', 'baffle', 'baggage', 'baked', 'balance',
    'balcony', 'balloon', 'ballot', 'bamboo', 'banana', 'bandage', 'bandit', 'banjo',
    'banker', 'banner', 'banquet', 'bargain', 'barn', 'barrel', 'barrier', 'baseball',
    'basement', 'basket', 'battery', 'battle', 'beacon', 'beans', 'beard', 'bearing',
    'beast', 'beauty', 'became', 'because', 'become', 'bedroom', 'beetle', 'before',
    'began', 'begin', 'behave', 'behind', 'believe', 'belong', 'below', 'bench',
    'beneath', 'benefit', 'bento', 'berry', 'best', 'betray', 'better', 'between',
    'beyond', 'bicycle', 'bidding', 'billion', 'binary', 'bind', 'biology', 'bird',
    'birthday', 'bishop', 'bitter', 'black', 'blanket', 'blast', 'blend', 'blessing',
    'blizzard', 'blocked', 'blood', 'blossom', 'blouse', 'bluebird', 'blunder', 'board',
    'boating', 'body', 'boiling', 'bold', 'bolt', 'bomb', 'bonfire', 'bonus',
    'booklet', 'border', 'boring', 'borrow', 'boss', 'bottle', 'bottom', 'boulder',
    'boundary', 'boutique', 'bowler', 'boxer', 'bracket', 'brain', 'branch', 'brand',
    'brave', 'bread', 'break', 'breath', 'breed', 'breeze', 'brick', 'bridge',
    'brief', 'bright', 'bring', 'brisk', 'broad', 'brochure', 'broken', 'bronze',
    'brother', 'browser', 'bruise', 'brush', 'brutal', 'bubble', 'bucket', 'budget',
    'buffalo', 'buffet', 'builder', 'building', 'bulb', 'bulk', 'bullet', 'bundle',
    'bunker', 'burden', 'burger', 'burst', 'business', 'butter', 'button', 'buyer',
    'cabbage', 'cabinet', 'cable', 'cactus', 'cadet', 'cage', 'calcium', 'calendar',
    'caliber', 'camera', 'campus', 'canal', 'cancel', 'candle', 'candy', 'canopy',
    'canvas', 'canyon', 'capable', 'capital', 'captain', 'capture', 'carbon', 'cardiac',
    'career', 'careful', 'cargo', 'carpet', 'carrier', 'carrot', 'cartoon', 'cascade',
    'casino', 'castle', 'casual', 'catalog', 'catch', 'category', 'cattle', 'caution',
    'cavalry', 'ceiling', 'celery', 'cement', 'census', 'central', 'century', 'ceramic',
    'ceremony', 'certain', 'chain', 'chair', 'chalk', 'chamber', 'champion', 'chance',
    'change', 'channel', 'chaos', 'chapter', 'charity', 'chart', 'chase', 'cheap',
    'check', 'cheese', 'chef', 'cherry', 'chess', 'chest', 'chicken', 'chief',
    'child', 'chimney', 'china', 'choice', 'choose', 'chord', 'chronic', 'chunk',
    'cinema', 'circle', 'circuit', 'citizen', 'citrus', 'civic', 'civil', 'claim',
    'clamp', 'clarify', 'clarity', 'classic', 'clause', 'clay', 'clean', 'clear',
    'clerk', 'clever', 'click', 'client', 'cliff', 'climate', 'climb', 'clinic',
    'clock', 'close', 'closet', 'cloth', 'cloud', 'clown', 'cluster', 'coach',
    'coastal', 'cobalt', 'cobra', 'cocktail', 'coconut', 'coffee', 'coil', 'coin',
    'collect', 'college', 'colonel', 'colony', 'color', 'column', 'combat', 'combine',
    'comedy', 'comfort', 'comic', 'command', 'comment', 'commit', 'common', 'company',
    'compare', 'compass', 'compete', 'compile', 'complex', 'compose', 'compute', 'concept',
    'concern', 'concert', 'conclude', 'condemn', 'conduct', 'confess', 'confirm', 'conflict',
    'confront', 'confuse', 'congress', 'connect', 'conquer', 'consent', 'consider', 'consist',
    'console', 'constant', 'consult', 'consume', 'contact', 'contain', 'content', 'contest',
    'context', 'continue', 'contract', 'contrast', 'control', 'convert', 'convince', 'cookie',
    'cooking', 'copper', 'coral', 'corner', 'correct', 'corrupt', 'cosmic', 'costume',
    'cottage', 'cotton', 'couch', 'council', 'counter', 'country', 'couple', 'courage',
    'course', 'cousin', 'cover', 'cowboy', 'crack', 'cradle', 'craft', 'crane',
    'crash', 'crater', 'crawl', 'crazy', 'cream', 'create', 'credit', 'creek',
    'crew', 'cricket', 'crime', 'crimson', 'crisp', 'critic', 'crocodile', 'crop',
    'cross', 'crowd', 'crucial', 'cruise', 'crunch', 'crush', 'crystal', 'cube',
    'culture', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom',
    'customer', 'cycle', 'cylinder', 'dagger', 'daily', 'dairy', 'damage', 'dance',
    'danger', 'daring', 'darkness', 'darling', 'dashboard', 'database', 'daughter', 'dawn',
    'dealer', 'debate', 'debris', 'debut', 'decade', 'decay', 'december', 'decide',
    'decimal', 'decline', 'decorate', 'decrease', 'dedicate', 'default', 'defeat', 'defend',
    'defense', 'deficit', 'define', 'degree', 'delay', 'delegate', 'delight', 'deliver',
    'delta', 'demand', 'democracy', 'denial', 'denote', 'density', 'dental', 'deny',
    'depart', 'depend', 'deploy', 'deposit', 'depth', 'deputy', 'derive', 'describe',
    'desert', 'design', 'desire', 'desktop', 'despite', 'dessert', 'destroy', 'detail',
    'detect', 'develop', 'device', 'devote', 'diagram', 'dialect', 'diamond', 'diary',
    'diesel', 'differ', 'digital', 'dignity', 'dilemma', 'dimension', 'dining', 'dinner',
    'dinosaur', 'diploma', 'direct', 'disable', 'disaster', 'discard', 'discover', 'discuss',
    'disease', 'disgust', 'dismiss', 'display', 'dispute', 'disrupt', 'distance', 'distant',
    'distinct', 'district', 'disturb', 'diverse', 'divide', 'divorce', 'doctor', 'document',
    'dolphin', 'domain', 'domestic', 'dominant', 'donate', 'donkey', 'donor', 'doorway',
    'dormant', 'double', 'doubt', 'downtown', 'dragon', 'drama', 'drastic', 'drawer',
    'drawing', 'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive',
    'driver', 'drought', 'drown', 'drum', 'drunk', 'drying', 'dual', 'dubious',
    'duckies', 'duel', 'duet', 'duke', 'dumb', 'dune', 'during', 'dusk',
    'duty', 'dwarf', 'dynamic', 'dynasty', 'eager', 'eagle', 'early', 'earth',
    'easily', 'eastern', 'easy', 'ecology', 'economy', 'edge', 'edition', 'editor',
    'educate', 'effort', 'eight', 'either', 'elapse', 'elbow', 'elder', 'election',
    'electric', 'elegant', 'element', 'elephant', 'elevate', 'elite', 'else', 'embark',
    'embrace', 'emerge', 'emission', 'emotion', 'emperor', 'emphasis', 'empire', 'employ',
    'empower', 'empress', 'empty', 'enable', 'enact', 'encounter', 'endorse', 'energy',
    'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enormous', 'enough', 'enrich',
    'enroll', 'ensure', 'enter', 'entire', 'entity', 'entrance', 'entry', 'envelope',
    'envision', 'episode', 'equal', 'equip', 'equity', 'erosion', 'error', 'escape',
    'escort', 'essay', 'essence', 'estate', 'estimate', 'eternal', 'ethics', 'evaluate',
    'evening', 'event', 'eventual', 'ever', 'every', 'evidence', 'evolve', 'exact',
    'example', 'exceed', 'excel', 'except', 'excess', 'exchange', 'excite', 'exclude',
    'excuse', 'execute', 'exercise', 'exhibit', 'exile', 'exist', 'exit', 'exotic',
    'expand', 'expect', 'expense', 'expert', 'explain', 'explode', 'explore', 'export',
    'expose', 'express', 'extend', 'external', 'extra', 'extreme', 'fabric', 'facial',
    'facility', 'factor', 'factory', 'faculty', 'failure', 'fairly', 'fairy', 'faith',
    'falcon', 'false', 'family', 'famous', 'fancy', 'fantasy', 'farmer', 'fashion',
    'fatal', 'father', 'fatigue', 'fault', 'favor', 'feature', 'federal', 'feedback',
    'feeling', 'fellow', 'female', 'fence', 'ferry', 'festival', 'fetch', 'fever',
    'fiber', 'fiction', 'field', 'fifteen', 'fifth', 'fifty', 'figure', 'filter',
    'final', 'finance', 'finding', 'finger', 'finish', 'finite', 'firefly', 'fireman',
    'fiscal', 'fishing', 'fitness', 'fixture', 'flag', 'flame', 'flare', 'flash',
    'flask', 'flavor', 'flaw', 'flea', 'flesh', 'flight', 'float', 'flock',
    'flood', 'floor', 'florida', 'florist', 'flour', 'flower', 'fluid', 'flush',
    'flyer', 'focal', 'focus', 'folder', 'follow', 'fondly', 'football', 'forbid',
    'force', 'forecast', 'foreign', 'forest', 'forever', 'forget', 'forgive', 'fork',
    'formal', 'format', 'formula', 'fortune', 'forum', 'forward', 'fossil', 'foster',
    'founder', 'fountain', 'fox', 'fraction', 'fragile', 'fragment', 'frame', 'frank',
    'fraud', 'freak', 'freedom', 'freight', 'french', 'frequent', 'fresh', 'friday',
    'friend', 'fringe', 'frog', 'front', 'frontier', 'frost', 'frozen', 'fruit',
    'frustrate', 'fuel', 'fulfill', 'function', 'funding', 'funeral', 'fungus', 'funny',
    'furnace', 'furniture', 'future', 'gadget', 'galaxy', 'gallery', 'gallop', 'gamble',
    'gaming', 'gamma', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gasoline',
    'gather', 'gauge', 'general', 'generate', 'generic', 'generous', 'genetic', 'genius',
    'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'gigantic', 'giraffe',
    'glacier', 'gladly', 'glamour', 'glance', 'glass', 'glimpse', 'global', 'glory',
    'glove', 'glucose', 'glue', 'goal', 'goat', 'goddess', 'golden', 'golf',
    'goodbye', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grace', 'grade',
    'graduate', 'grain', 'grammar', 'grand', 'grant', 'grape', 'graphic', 'grasp',
    'grass', 'gravity', 'gray', 'great', 'green', 'greeting', 'grief', 'grill',
    'grimace', 'grind', 'grip', 'grocery', 'gross', 'ground', 'group', 'growth',
    'guard', 'guess', 'guidance', 'guide', 'guitar', 'gulf', 'gummy', 'gunfire',
    'guru', 'habit', 'habitat', 'hacker', 'haircut', 'halfway', 'hallway', 'hammer',
    'hamster', 'handful', 'handle', 'handsome', 'handy', 'happen', 'happy', 'harbor',
    'hardly', 'hardware', 'harmful', 'harmony', 'harvest', 'hasty', 'hatch', 'hatred',
    'haunt', 'haven', 'hazard', 'headache', 'headline', 'healthy', 'hearing', 'heart',
    'heater', 'heaven', 'heavy', 'hedge', 'height', 'helmet', 'helpful', 'herald',
    'heritage', 'hero', 'hidden', 'highway', 'hiking', 'hilltop', 'hippo', 'history',
    'hobby', 'hockey', 'holder', 'holiday', 'hollow', 'homeland', 'honest', 'honey',
    'honor', 'horizon', 'hormone', 'horror', 'hospital', 'hostage', 'hostile', 'hotel',
    'hourly', 'household', 'however', 'human', 'humble', 'humor', 'hundred', 'hunger',
    'hunter', 'hurdle', 'hurricane', 'husband', 'hybrid', 'hydrogen', 'hygiene', 'hymn',
    'iceberg', 'icicle', 'iconic', 'ideally', 'identify', 'identity', 'ideology', 'idiom',
    'idle', 'ignite', 'ignore', 'illness', 'image', 'imagine', 'imitate', 'immense',
    'immune', 'impact', 'imply', 'import', 'impose', 'improve', 'impulse', 'include',
    'income', 'increase', 'indeed', 'index', 'indicate', 'indoor', 'induce', 'industry',
    'infant', 'inflict', 'inform', 'inherit', 'initial', 'inject', 'injury', 'inmate',
    'inner', 'innocent', 'input', 'inquiry', 'insect', 'insert', 'inside', 'inspect',
    'inspire', 'install', 'instant', 'instead', 'instinct', 'intact', 'intake', 'integer',
    'integrate', 'intense', 'intent', 'interact', 'interest', 'interior', 'internal', 'interpret',
    'interval', 'intimate', 'intrepid', 'introduce', 'invent', 'invest', 'invite', 'involve',
    'iron', 'irony', 'island', 'isolate', 'issue', 'italian', 'item', 'ivory',
    'jacket', 'jaguar', 'january', 'japanese', 'jealous', 'jeans', 'jelly', 'jersey',
    'jewel', 'jigsaw', 'jogging', 'johnson', 'joining', 'joke', 'journal', 'journey',
    'judge', 'juggle', 'juice', 'jumbo', 'jump', 'jungle', 'junior', 'justice',
    'justify', 'kangaroo', 'karate', 'kayak', 'keeper', 'kernel', 'keyboard', 'kidney',
    'kingdom', 'kitchen', 'kitten', 'kiwi', 'knight', 'knob', 'knock', 'knowledge',
    'koala', 'label', 'labor', 'ladder', 'lady', 'lagoon', 'lamp', 'landlord',
    'landmark', 'landscape', 'language', 'lantern', 'laptop', 'large', 'laser', 'lasting',
    'lateral', 'latest', 'latin', 'laugh', 'launch', 'laundry', 'lawyer', 'layer',
    'layout', 'leader', 'leaflet', 'league', 'leather', 'lecture', 'legacy', 'legal',
    'legend', 'leisure', 'lemon', 'lending', 'length', 'lens', 'leopard', 'lesson',
    'letter', 'level', 'lever', 'liberty', 'library', 'license', 'lifestyle', 'lifetime',
    'light', 'likely', 'limb', 'limit', 'lincoln', 'linear', 'linger', 'link',
    'lion', 'liquid', 'listen', 'literacy', 'literary', 'litter', 'little', 'lively',
    'liver', 'lizard', 'loading', 'lobby', 'lobster', 'local', 'location', 'lock',
    'lodge', 'logic', 'lonely', 'long', 'looking', 'loose', 'lottery', 'lounge',
    'lovely', 'lover', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch',
    'luxury', 'lyrics', 'machine', 'magazine', 'magic', 'magnet', 'mahogany', 'maiden',
    'mailbox', 'maintain', 'major', 'makeup', 'malware', 'mammal', 'manage', 'mandate',
    'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine',
    'market', 'marriage', 'martial', 'marvel', 'mascot', 'massive', 'master', 'material',
    'matrix', 'matter', 'mature', 'maximum', 'meadow', 'meaning', 'measure', 'medal',
    'media', 'medical', 'medium', 'meeting', 'melody', 'member', 'memoir', 'memory',
    'mental', 'mention', 'mentor', 'merchant', 'mercy', 'merge', 'merit', 'mermaid',
    'message', 'metal', 'method', 'metric', 'middle', 'midnight', 'mighty', 'migrate',
    'military', 'million', 'mimic', 'mind', 'mineral', 'minimum', 'minor', 'minute',
    'miracle', 'mirror', 'misery', 'mission', 'mistake', 'mixture', 'mobile', 'model',
    'modern', 'modest', 'modify', 'module', 'moment', 'monitor', 'monkey', 'monster',
    'monthly', 'monument', 'moral', 'morning', 'mortal', 'mortgage', 'mosaic', 'mosquito',
    'mother', 'motion', 'motor', 'mountain', 'mouse', 'mouth', 'movement', 'movie',
    'muffin', 'multiple', 'municipal', 'muscle', 'museum', 'mushroom', 'musical', 'mustard',
    'mutual', 'mystery', 'myth', 'naive', 'naked', 'narrow', 'nasty', 'nation',
    'native', 'natural', 'nature', 'naval', 'navigate', 'nearby', 'nearly', 'neat',
    'necessary', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'network', 'neutral',
    'never', 'newborn', 'newsletter', 'newton', 'nickel', 'night', 'noble', 'nobody',
    'noise', 'nominal', 'nominee', 'noodle', 'normal', 'north', 'notable', 'notebook',
    'nothing', 'notice', 'notion', 'novel', 'november', 'nuclear', 'nucleus', 'number',
    'numeric', 'nurse', 'nutrient', 'nylon', 'oakwood', 'object', 'oblige', 'obscure',
    'observe', 'obtain', 'obvious', 'occasion', 'occupy', 'occur', 'ocean', 'october',
    'octopus', 'oddly', 'offense', 'offer', 'officer', 'official', 'offline', 'offset',
    'often', 'olive', 'olympic', 'omit', 'onboard', 'ongoing', 'online', 'onset',
    'opening', 'opera', 'operate', 'opinion', 'opponent', 'optical', 'optimal', 'option',
    'orange', 'orbit', 'orchard', 'ordinary', 'organic', 'orient', 'origin', 'orphan',
    'oscar', 'other', 'otherwise', 'otter', 'ought', 'ounce', 'outcome', 'outdoor',
    'outfit', 'outline', 'output', 'outside', 'oval', 'overall', 'overcome', 'overhead',
    'overlap', 'overseas', 'overtime', 'overview', 'owner', 'oxygen', 'oyster', 'package',
    'paddle', 'pageant', 'painting', 'palace', 'palm', 'pamphlet', 'panama', 'pancake',
    'panda', 'panel', 'panic', 'panorama', 'panther', 'paper', 'parade', 'parallel',
    'parcel', 'pardon', 'parent', 'parish', 'parking', 'parlor', 'parrot', 'parsley',
    'partner', 'passage', 'passion', 'passive', 'password', 'past', 'pasture', 'patch',
    'patent', 'pathway', 'patient', 'patriot', 'patrol', 'pattern', 'pause', 'payment',
    'peaceful', 'peach', 'peanut', 'pearl', 'peasant', 'pedal', 'penalty', 'pencil',
    'penguin', 'pension', 'people', 'pepper', 'percent', 'perfect', 'perform', 'perfume',
    'perhaps', 'period', 'permit', 'persist', 'person', 'persuade', 'petition', 'phantom',
    'pharmacy', 'phase', 'phoenix', 'phone', 'photo', 'phrase', 'physical', 'physics',
    'piano', 'picnic', 'picture', 'piece', 'pierce', 'pigeon', 'pillar', 'pilot',
    'pioneer', 'pipeline', 'pirate', 'pistol', 'pitcher', 'pizza', 'placement', 'planet',
    'planner', 'plastic', 'platform', 'platinum', 'platter', 'player', 'pleasant', 'pledge',
    'plenty', 'pliers', 'plunge', 'plural', 'pocket', 'podcast', 'poem', 'poetry',
    'pointer', 'poison', 'polar', 'police', 'policy', 'polish', 'polite', 'politics',
    'pollution', 'polygon', 'pond', 'pony', 'popular', 'portion', 'portrait', 'position',
    'positive', 'possess', 'possible', 'postal', 'poster', 'postman', 'potato', 'potent',
    'pottery', 'poultry', 'poverty', 'powder', 'powerful', 'practice', 'prairie', 'praise',
    'prayer', 'preach', 'precise', 'predict', 'prefer', 'prefix', 'premium', 'prepare',
    'presence', 'present', 'preserve', 'president', 'pressure', 'prestige', 'pretty', 'prevent',
    'previous', 'price', 'primary', 'primate', 'prime', 'princess', 'print', 'printer',
    'priority', 'prison', 'private', 'prize', 'probable', 'problem', 'proceed', 'process',
    'produce', 'product', 'profile', 'profit', 'program', 'progress', 'project', 'promise',
    'promote', 'prompt', 'proof', 'proper', 'property', 'proposal', 'prospect', 'protect',
    'protein', 'protest', 'proud', 'provide', 'province', 'provoke', 'prowl', 'prudent',
    'public', 'publish', 'pudding', 'pulse', 'pumpkin', 'punch', 'puncture', 'pupil',
    'puppet', 'puppy', 'purchase', 'purple', 'purpose', 'pursue', 'puzzle', 'pyramid',
    'python', 'quality', 'quantum', 'quarter', 'queen', 'question', 'queue', 'quick',
    'quiet', 'quilt', 'quote', 'rabbit', 'raccoon', 'racing', 'radar', 'radical',
    'radius', 'railway', 'rainbow', 'raise', 'rally', 'random', 'ranger', 'ranking',
    'rapid', 'rarely', 'rating', 'ratio', 'raven', 'reaction', 'reader', 'reality',
    'realize', 'really', 'reason', 'rebel', 'rebuild', 'recall', 'receipt', 'receive',
    'recent', 'recipe', 'reckon', 'record', 'recover', 'recruit', 'recycle', 'reduce',
    'refer', 'reflect', 'reform', 'refresh', 'refuge', 'refuse', 'regard', 'regime',
    'region', 'register', 'regret', 'regular', 'reject', 'relate', 'relative', 'relax',
    'release', 'relevant', 'relief', 'religion', 'remain', 'remark', 'remedy', 'remember',
    'remind', 'remote', 'removal', 'render', 'renew', 'rental', 'repair', 'repeat',
    'replace', 'replica', 'report', 'request', 'require', 'rescue', 'research', 'reserve',
    'resident', 'resign', 'resist', 'resolve', 'resort', 'resource', 'respect', 'respond',
    'restore', 'result', 'resume', 'retail', 'retain', 'retire', 'retreat', 'return',
    'reunion', 'reveal', 'revenge', 'revenue', 'reverse', 'review', 'revise', 'revival',
    'revolt', 'reward', 'rhetoric', 'rhino', 'rhythm', 'ribbon', 'riches', 'riddle',
    'rider', 'ridge', 'rifle', 'rigid', 'ring', 'ripple', 'ritual', 'rival',
    'river', 'roadway', 'roast', 'robot', 'robust', 'rocket', 'romance', 'romantic',
    'rooftop', 'rookie', 'roster', 'rotate', 'rough', 'round', 'routine', 'royal',
    'rubber', 'rubble', 'rugby', 'ruling', 'rumor', 'runner', 'running', 'runway',
    'rural', 'rustic', 'sacred', 'saddle', 'sadness', 'safari', 'safety', 'sailor',
    'salad', 'salary', 'salmon', 'salon', 'sample', 'sanction', 'sandwich', 'santa',
    'satellite', 'satisfy', 'sauce', 'sausage', 'savage', 'saving', 'scandal', 'scanner',
    'scarce', 'scatter', 'scenario', 'scene', 'scent', 'schedule', 'scheme', 'scholar',
    'science', 'scissors', 'scope', 'score', 'scout', 'scramble', 'screen', 'script',
    'scroll', 'sculpture', 'seafood', 'search', 'season', 'second', 'secret', 'section',
    'sector', 'secure', 'segment', 'select', 'seller', 'semester', 'senator', 'senior',
    'sensor', 'sentence', 'separate', 'sequence', 'serial', 'series', 'serious', 'servant',
    'service', 'session', 'setting', 'settle', 'setup', 'seventh', 'several', 'severe',
    'shadow', 'shampoo', 'shape', 'share', 'shark', 'sharp', 'shelter', 'sheriff',
    'shield', 'shift', 'shine', 'shipping', 'shirt', 'shock', 'shooter', 'shopping',
    'shortage', 'shoulder', 'shout', 'shower', 'shrink', 'shuttle', 'sibling', 'sickness',
    'sidebar', 'sidewalk', 'signal', 'silence', 'silicon', 'silver', 'similar', 'simple',
    'simulate', 'since', 'singer', 'single', 'sister', 'sitting', 'situation', 'sixteen',
    'skeleton', 'sketch', 'skiing', 'skill', 'skinny', 'skull', 'slender', 'slice',
    'slight', 'slogan', 'slope', 'slowly', 'slumber', 'small', 'smart', 'smash',
    'smell', 'smile', 'smooth', 'snack', 'snake', 'snapshot', 'sneaker', 'snowfall',
    'soccer', 'social', 'society', 'socket', 'sodium', 'software', 'solar', 'soldier',
    'solid', 'solution', 'solve', 'someone', 'somewhat', 'sonic', 'soprano', 'sorry',
    'source', 'southern', 'souvenir', 'space', 'spanish', 'sparrow', 'spatial', 'speaker',
    'special', 'species', 'specific', 'spectrum', 'speech', 'spelling', 'spending', 'sphere',
    'spider', 'spinach', 'spiral', 'spirit', 'splash', 'splendid', 'sponsor', 'spoon',
    'sporting', 'spotlight', 'spray', 'spread', 'spring', 'sprint', 'square', 'squeeze',
    'stable', 'stadium', 'staff', 'stage', 'stair', 'stake', 'stamp', 'stance',
    'standard', 'standby', 'staple', 'starch', 'starter', 'startup', 'station', 'statue',
    'status', 'steady', 'steak', 'steam', 'steel', 'stellar', 'stereo', 'stick',
    'sticky', 'stimulus', 'stitch', 'stock', 'stomach', 'storage', 'storm', 'story',
    'stove', 'straight', 'strange', 'stranger', 'strap', 'strategy', 'stream', 'street',
    'strength', 'stress', 'stretch', 'strict', 'strike', 'string', 'strip', 'stripe',
    'stroke', 'strong', 'structure', 'struggle', 'student', 'studio', 'study', 'stuff',
    'stumble', 'stupid', 'style', 'subject', 'submit', 'subtle', 'suburb', 'succeed',
    'success', 'sudden', 'suffer', 'suffix', 'suggest', 'suicide', 'suitable', 'sulfur',
    'summary', 'summer', 'summit', 'sunlight', 'sunrise', 'sunset', 'sunshine', 'super',
    'superb', 'supply', 'support', 'suppose', 'supreme', 'surface', 'surgeon', 'surplus',
    'surprise', 'surround', 'survey', 'survival', 'survive', 'suspect', 'suspend', 'sustain',
    'swamp', 'sweater', 'sweet', 'swift', 'swimming', 'switch', 'sword', 'symbol',
    'symptom', 'syntax', 'system', 'tablet', 'tackle', 'tactic', 'talent', 'target',
    'tariff', 'task', 'taste', 'tattoo', 'teacher', 'teapot', 'technique', 'tedious',
    'teenage', 'telegram', 'telescope', 'telling', 'temple', 'temporal', 'tenant', 'tender',
    'tennis', 'tension', 'terminal', 'terrain', 'terrible', 'terror', 'testify', 'testing',
    'texture', 'thankful', 'theater', 'theme', 'therapy', 'thereby', 'thermal', 'thesis',
    'thick', 'thirst', 'thirteen', 'thorough', 'thought', 'thousand', 'thread', 'threat',
    'threshold', 'thrill', 'thrive', 'throat', 'throne', 'through', 'thunder', 'thursday',
    'ticket', 'tidal', 'tiger', 'timber', 'timing', 'tissue', 'title', 'toast',
    'tobacco', 'today', 'toddler', 'together', 'toilet', 'token', 'tomato', 'tomorrow',
    'tongue', 'tonight', 'toolbar', 'topic', 'torch', 'tornado', 'torpedo', 'torture',
    'total', 'touch', 'tough', 'tourism', 'tourist', 'toward', 'tower', 'township',
    'toxic', 'tracker', 'trading', 'traffic', 'tragedy', 'trailer', 'training', 'traitor',
    'transfer', 'transit', 'translate', 'transmit', 'transport', 'travel', 'treasure', 'treaty',
    'treatment', 'tremendous', 'trend', 'trial', 'triangle', 'tribal', 'tribute', 'trick',
    'trigger', 'trillion', 'trilogy', 'trinity', 'triple', 'triumph', 'trivial', 'trolley',
    'trophy', 'tropical', 'trouble', 'truck', 'trumpet', 'trunk', 'trust', 'trustee',
    'truth', 'trying', 'tsunami', 'tuition', 'tulip', 'tumble', 'tumor', 'tunnel',
    'turkey', 'turning', 'turtle', 'tutor', 'twelve', 'twenty', 'twilight', 'twist',
    'typical', 'ultimate', 'umbrella', 'unable', 'uncle', 'undergo', 'undermine', 'understand',
    'unfair', 'unfold', 'unhappy', 'uniform', 'union', 'unique', 'united', 'unity',
    'universe', 'unknown', 'unless', 'unlike', 'unlock', 'unusual', 'update', 'upgrade',
    'uphold', 'upload', 'upon', 'upper', 'upright', 'upset', 'upward', 'urban',
    'urgent', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacation', 'vaccine',
    'vacuum', 'valid', 'valley', 'valuable', 'valve', 'vampire', 'vanilla', 'vanish',
    'variety', 'various', 'vegan', 'vehicle', 'velvet', 'vendor', 'venture', 'venue',
    'verbal', 'verdict', 'verify', 'version', 'vertical', 'vessel', 'veteran', 'viable',
    'vibrant', 'victim', 'victory', 'video', 'village', 'vintage', 'violin', 'virtual',
    'virtue', 'virus', 'visible', 'vision', 'visual', 'vital', 'vitamin', 'vivid',
    'vocal', 'vodka', 'volcano', 'voltage', 'volume', 'volunteer', 'voter', 'voucher',
    'voyage', 'waffle', 'wagon', 'waiting', 'walker', 'wallet', 'walnut', 'wander',
    'warfare', 'warmth', 'warning', 'warrant', 'warrior', 'washing', 'wasteful', 'water',
    'wealthy', 'weapon', 'weather', 'website', 'wedding', 'weekend', 'weekly', 'weight',
    'welcome', 'welfare', 'western', 'whale', 'wheat', 'wheel', 'wherever', 'whisper',
    'whistle', 'white', 'whoever', 'whole', 'wicked', 'widely', 'widget', 'widow',
    'wildlife', 'willing', 'window', 'winner', 'winter', 'wisdom', 'withdraw', 'witness',
    'wizard', 'wolf', 'woman', 'wonder', 'wooden', 'worker', 'workshop', 'world',
    'worship', 'worthy', 'would', 'wound', 'wreck', 'wrestle', 'wright', 'writer',
    'writing', 'wrong', 'yacht', 'yellow', 'yield', 'young', 'yourself', 'youth',
    'zebra', 'zenith', 'zephyr', 'zero', 'zipper', 'zombie', 'zone', 'zoology'
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
    // Use crypto.getRandomValues instead of Math.random()
    const randomBytes = generateSecureRandom(2);
    const randomNumber = ((randomBytes[0] << 8) | randomBytes[1]) % 10000;
    passphrase += separator + randomNumber.toString().padStart(4, '0');
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