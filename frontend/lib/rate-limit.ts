const requests = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  read: { windowMs: 60_000, maxRequests: 30 },
  write: { windowMs: 60_000, maxRequests: 10 },
  critical: { windowMs: 60_000, maxRequests: 3 },
};

export function rateLimit(key: string, tier: "read" | "write" | "critical" = "write"): void {
  const config = LIMITS[tier];
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + config.windowMs });
    return;
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(retryAfter);
  }
}

export function rateLimitKey(req: Request, suffix?: string): string {
  // Use session cookie or IP as key
  const cookie = req.headers.get("cookie") || "";
  const sessionMatch = cookie.match(/next-auth\.session-token=([^;]+)/);
  const sessionKey = sessionMatch?.[1]?.slice(0, 16) || "anonymous";
  return suffix ? `${sessionKey}:${suffix}` : sessionKey;
}

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super(`rate limit exceeded, retry after ${retryAfter}s`);
    this.retryAfter = retryAfter;
  }
}
