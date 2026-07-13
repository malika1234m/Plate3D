/**
 * Small in-memory sliding-window rate limiter for auth endpoints.
 * Suitable for a single-instance deployment (Railway container); swap for
 * Redis/Upstash if the app ever runs multiple instances.
 */

const hits = new Map<string, number[]>();

/** True when the call is allowed; false when the key is over its budget. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  // Keep the map from growing without bound under scanning traffic.
  if (hits.size > 10_000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(req: Request): string {
  // Railway/most proxies set x-forwarded-for; first hop is the client.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function tooManyRequests(message: string) {
  return Response.json({ error: message }, { status: 429 });
}
