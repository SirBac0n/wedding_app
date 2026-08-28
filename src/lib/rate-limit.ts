import "server-only";
import { headers } from "next/headers";

// Lightweight in-memory sliding-window rate limiter for the guest-facing
// lookup endpoints (REQUIREMENTS.md section 5 — dropping the invite code
// means these need some abuse protection). In-memory means limits reset on
// deploy/restart and don't share state across multiple server instances;
// fine for a single-instance deployment at this guest-list scale, but swap
// for a shared store (e.g. Redis/Upstash) before scaling beyond one instance.

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

// Periodically forget stale buckets so this doesn't grow unbounded.
const MAX_BUCKETS = 10_000;

export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    if (buckets.size > MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Best-effort client identifier from request headers. Not spoof-proof (a
// client can fake X-Forwarded-For), but combined with the low limits here
// it's enough to slow down casual brute-forcing without a paid WAF service.
export async function getClientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
