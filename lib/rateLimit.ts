/**
 * Simple in-memory rate limiter for serverless.
 * Uses a sliding window approach.
 * For 10K+ users, replace with Redis/Upstash.
 */

const windows = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, number> = {
  developer: 100,   // 100 req/min
  team: 1000,       // 1000 req/min
  enterprise: 10000, // 10000 req/min
};

const WINDOW_MS = 60_000; // 1 minute

export function checkRateLimit(
  key: string,
  plan: string = "developer"
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = LIMITS[plan] || LIMITS.developer;

  let window = windows.get(key);

  if (!window || now > window.resetAt) {
    window = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, window);
  }

  window.count++;

  // Cleanup old entries periodically
  if (windows.size > 10000) {
    for (const [k, v] of windows) {
      if (now > v.resetAt) windows.delete(k);
    }
  }

  return {
    allowed: window.count <= limit,
    remaining: Math.max(0, limit - window.count),
    resetAt: window.resetAt,
  };
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number }, plan: string = "developer") {
  const limit = LIMITS[plan] || LIMITS.developer;
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };
}
