import Stripe from "stripe";

/**
 * Stripe is optional in development. Billing endpoints return a clear
 * "not configured" response until these env vars are set:
 *   STRIPE_SECRET_KEY      sk_...
 *   STRIPE_PRICE_ID        price id of the Pro monthly subscription
 *   STRIPE_WEBHOOK_SECRET  whsec_... (from `stripe listen` or the dashboard)
 */

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

export function billingUnavailable() {
  return Response.json(
    {
      error:
        "Billing is not configured on this server yet (Stripe keys missing). " +
        "Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable upgrades.",
    },
    { status: 503 }
  );
}
