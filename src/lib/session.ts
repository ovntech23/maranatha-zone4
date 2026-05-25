import { cookies } from "next/headers";

let runtimeSecret: string | null = null;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (!runtimeSecret) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      runtimeSecret = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
      console.warn("⚠️ WARNING: SESSION_SECRET env variable is missing! Generated a dynamic secure key in-memory for this runtime session.");
    }
    return runtimeSecret;
  }
  return secret;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  expiresAt: string;
}

// Convert string secret to CryptoKey for HMAC-SHA256 operations
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSessionSecret());
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Encrypt and sign a session payload using HMAC-SHA256.
 * Returns a secure stateless session token string.
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  const stringified = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const key = await getCryptoKey();
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(stringified)
  );
  
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
    
  const base64Payload = Buffer.from(stringified).toString("base64");
  return `${base64Payload}.${signatureHex}`;
}

/**
 * Verify and decrypt a session token.
 * Returns the session payload if signature is valid and token is active, otherwise null.
 */
export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const [base64Payload, signatureHex] = token.split(".");
    if (!base64Payload || !signatureHex) return null;
    
    const stringified = Buffer.from(base64Payload, "base64").toString("utf-8");
    const encoder = new TextEncoder();
    const key = await getCryptoKey();
    
    // Ensure signature is a valid hex string of even length to prevent parsing errors
    if (!/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length % 2 !== 0) {
      return null;
    }

    const matches = signatureHex.match(/.{1,2}/g);
    if (!matches) return null;

    // Convert hex signature back to ArrayBuffer
    const signatureBuffer = new Uint8Array(
      matches.map(byte => parseInt(byte, 16))
    );
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(stringified)
    );
    
    if (!isValid) return null;
    
    const payload = JSON.parse(stringified) as SessionPayload;
    if (new Date(payload.expiresAt) < new Date()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a new secure HTTP-Only session cookie.
 */
export async function createSession(userId: string, email: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const payload: SessionPayload = {
    userId,
    email,
    role,
    expiresAt: expiresAt.toISOString(),
  };
  const token = await encrypt(payload);
  
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Retrieve the active session from cookies.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    return await decrypt(token);
  } catch {
    return null;
  }
}

/**
 * Delete the active session cookie (Logout).
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
