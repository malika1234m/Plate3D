/**
 * Subscription tiers. Free runs a real menu (video + QR); Pro unlocks the
 * premium surface area. Enforcement lives next to each gated endpoint.
 */

export type Plan = "free" | "pro";

export const PLANS: Record<
  Plan,
  { label: string; maxRestaurants: number; gen3d: boolean }
> = {
  free: { label: "Free", maxRestaurants: 1, gen3d: false },
  pro: { label: "Pro", maxRestaurants: 10, gen3d: true },
};

export function planOf(user: { plan: string }): Plan {
  return user.plan === "pro" ? "pro" : "free";
}

/** 402 Payment Required with a consistent shape the mobile app understands. */
export function upgradeRequired(message: string) {
  return Response.json({ error: message, upgradeRequired: true }, { status: 402 });
}
