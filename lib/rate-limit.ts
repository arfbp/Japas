interface RateLimitData {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (now > data.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (data.count >= limit) {
    return false;
  }

  data.count++;
  return true;
}
