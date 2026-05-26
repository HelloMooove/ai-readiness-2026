import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// AES-256-GCM symmetric encryption used for secrets we store in the
// database (e.g. per-form Airtable PATs). The encryption passphrase lives
// in the ENCRYPTION_KEY env var; never commit it. If lost, all encrypted
// values become unreadable — back it up in a password manager.
//
// Format of the returned string: "<iv-b64>.<tag-b64>.<ciphertext-b64>"

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32; // 256 bits

// Salt is intentionally static — it pairs with the env-var passphrase to
// derive a stable key, so the same plaintext encrypts to a different
// ciphertext every time (because IV is random) but decryption stays
// reproducible across server cold starts.
const SCRYPT_SALT = 'mooove-encryption-v1';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const passphrase = process.env.ENCRYPTION_KEY;
  if (!passphrase) {
    throw new Error('ENCRYPTION_KEY env var is missing');
  }
  if (passphrase.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  cachedKey = scryptSync(passphrase, SCRYPT_SALT, KEY_BYTES);
  return cachedKey;
}

export function encrypt(plain: string): string {
  if (plain == null || plain === '') return '';
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

export function decrypt(blob: string): string {
  if (!blob) return '';
  const parts = blob.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value: expected iv.tag.ciphertext format');
  }
  const [ivB64, tagB64, encB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const enc = Buffer.from(encB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

// Convenience: never throws — returns null if the value can't be decrypted
// (e.g. encrypted with a different key after a key rotation, or corrupted).
// Use this in hot paths where decrypt failures must not crash the request.
export function tryDecrypt(blob: string | null | undefined): string | null {
  if (!blob) return null;
  try {
    return decrypt(blob);
  } catch (err) {
    console.error('Decryption failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
