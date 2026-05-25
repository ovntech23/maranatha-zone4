const limitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a specific key (e.g. IP + email) has exceeded its rate limit.
 * Limits to `limit` attempts per `windowMs` time window.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const record = limitMap.get(key);

  // If no record exists or the window has reset, start a new window
  if (!record || now > record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    limitMap.set(key, newRecord);
    return { success: true, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  // If limit is exceeded, return failure
  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  // Otherwise increment attempt count
  record.count += 1;
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt };
}
