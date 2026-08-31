// Encrypts/decrypts the markbook's exam data using a key derived from the
// person's markbook password, via the browser's built-in Web Crypto API
// (SubtleCrypto). This exists so that once password protection is turned
// on, the actual marks are not sitting in plaintext in localStorage (or in
// a React component's props/state, inspectable via React DevTools) while
// the markbook is locked -- only the bcrypt hash used to verify the
// password was ever stored that way. The plaintext password itself is
// never persisted anywhere; it's only kept in memory (a React state
// variable) for the current session after a successful unlock, purely so
// edits made during that session can be re-encrypted before saving.
//
// Format written to localStorage: base64(salt[16] || iv[12] || ciphertext)
// A fresh random salt and IV are generated on every encrypt call.

const PBKDF2_ITERATIONS = 150000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

interface EncryptedEnvelopeV1 {
  v: 1;
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string;
  iv: string;
  data: string;
}

function getSubtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return crypto.subtle;
}

async function deriveKey(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Encrypts an arbitrary JSON-serialisable value with the given password.
// Returns a versioned JSON string with explicit KDF metadata.
export async function encryptWithPassword(password: string, value: unknown): Promise<string> {
  const subtle = getSubtle();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(value));
  const ciphertextBuf = await subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext);
  const ciphertext = new Uint8Array(ciphertextBuf);

  const envelope: EncryptedEnvelopeV1 = {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(ciphertext),
  };

  return JSON.stringify(envelope);
}

// Decrypts a blob produced by encryptWithPassword (or legacy base64 blob).
// Returns null on wrong password or corrupted data.
export async function decryptWithPassword<T = unknown>(password: string, blob: string): Promise<T | null> {
  if (!password || !blob) return null;
  try {
    const subtle = getSubtle();
    const dec = new TextDecoder();

    // Check if blob is versioned JSON envelope
    if (blob.trim().startsWith('{')) {
      try {
        const envelope = JSON.parse(blob);
        if (envelope && envelope.v === 1 && envelope.kdf === 'PBKDF2-SHA256') {
          const salt = base64ToBytes(envelope.salt);
          const iv = base64ToBytes(envelope.iv);
          const ciphertext = base64ToBytes(envelope.data);
          const key = await deriveKey(password, salt, envelope.iter || PBKDF2_ITERATIONS);
          const plaintextBuf = await subtle.decrypt(
            { name: 'AES-GCM', iv: iv as BufferSource },
            key,
            ciphertext as BufferSource
          );
          return JSON.parse(dec.decode(plaintextBuf)) as T;
        }
      } catch {
        // Fall through to legacy parsing if JSON parse failed
      }
    }

    // Legacy unversioned blob: base64(salt[16] || iv[12] || ciphertext)
    const combined = base64ToBytes(blob);
    if (combined.length < SALT_LENGTH + IV_LENGTH) return null;
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
    const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
    const plaintextBuf = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    return JSON.parse(dec.decode(plaintextBuf)) as T;
  } catch {
    return null;
  }
}

