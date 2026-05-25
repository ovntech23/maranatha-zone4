import crypto from "crypto";

/**
 * Hash a password securely using PBKDF2 with a random salt and HMAC-SHA512.
 * Output format is `salt:hash` to be stored in the database.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored `salt:hash` string securely.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 600000, 64, "sha512").toString("hex");
  
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(verifyHash, "hex");
  
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
