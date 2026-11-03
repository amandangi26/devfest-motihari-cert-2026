export interface RateLimitConfig {
  windowMs: number; // Duration of the window in milliseconds
  max: number;      // Maximum number of requests within the window
  message?: string; // Custom error message
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

// In-memory store for tracking request counts by IP/key
const store = new Map<string, ClientRecord>();

// Periodic cleanup to avoid unbounded memory growth
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup > 60000) { // run at most once a minute
    lastCleanup = now;
    for (const [key, record] of store.entries()) {
      if (now > record.resetAt) {
        store.delete(key);
      }
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  message?: string;
}

/**
 * Check if a client has exceeded the rate limit.
 * @param key Unique identifier for the client (e.g., `login:${ip}` or `cert:${ip}`)
 * @param config Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  let record = store.get(key);

  if (!record || now > record.resetAt) {
    // New window
    record = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, record);

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  // Existing window
  if (record.count < config.max) {
    record.count += 1;
    const remaining = config.max - record.count;
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    return {
      success: true,
      limit: config.max,
      remaining,
      resetSeconds,
    };
  }

  // Rate limit exceeded
  const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    success: false,
    limit: config.max,
    remaining: 0,
    resetSeconds,
    message:
      config.message ||
      `Too many requests. Please wait ${resetSeconds} seconds before trying again.`,
  };
}

/**
 * Extracts the real client IP address from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}

