import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword) return '';
  // If it's already a valid bcrypt hash, don't rehash it
  if (isBcryptHash(plainPassword)) {
    return plainPassword;
  }
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Check if a string is a bcrypt hash
 */
export function isBcryptHash(str) {
  if (typeof str !== 'string') return false;
  return /^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Compare plain password against stored password (handles both bcrypt hash and legacy plain text)
 * Returns: { valid: boolean, needsRehash: boolean }
 */
export async function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) {
    return { valid: false, needsRehash: false };
  }

  // If stored password is a bcrypt hash
  if (isBcryptHash(storedPassword)) {
    const valid = await bcrypt.compare(plainPassword, storedPassword);
    return { valid, needsRehash: false };
  }

  // Legacy plaintext match
  const valid = (plainPassword === storedPassword);
  return { valid, needsRehash: valid };
}
