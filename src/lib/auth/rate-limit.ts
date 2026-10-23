interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((ts) => now - ts < 300000); // 5 min max window
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}, 60000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Basic in-memory rate limiter for auth and AI endpoints.
 * @param identifier Client IP or User ID key
 * @param maxRequests Maximum allowed requests in window
 * @param windowSeconds Window length in seconds (defaults to 60)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = maxRequests - record.timestamps.length;
  const resetInSeconds = windowSeconds;

  return {
    success: true,
    limit: maxRequests,
    remaining,
    resetInSeconds,
  };
}

/**
 * Extracts a client identifier from headers or fallback for rate limiting.
 */
export function getClientIdentifier(headersList: Headers, prefix = "ip"): string {
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "127.0.0.1";
  return `${prefix}:${ip}`;
}
