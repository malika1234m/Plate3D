import Stripe from "stripe";

/**
 * Stripe is optional in development. Billing endpoints return a clear
 * "not configured" response until these env vars are set:
 *   STRIPE_SECRET_KEY         sk_...
 *   STRIPE_PRICE_ID_BASIC     price id of the Basic monthly subscription
 *   STRIPE_PRICE_ID_STARTER   price id of the Starter monthly subscription
 *   STRIPE_PRICE_ID_PRO       price id of the Pro monthly subscription
 *   STRIPE_WEBHOOK_SECRET     whsec_... (from `stripe listen` or the dashboard)
 *
 * STRIPE_PRICE_ID (singular) is still honoured as a legacy alias for the Pro price.
 */

function anyPriceId(): boolean {
  return Boolean(
    process.env.STRIPE_PRICE_ID_BASIC ||
      process.env.STRIPE_PRICE_ID_STARTER ||
      process.env.STRIPE_PRICE_ID_PRO ||
      process.env.STRIPE_PRICE_ID
  );
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && anyPriceId());
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
        "Set STRIPE_SECRET_KEY and the STRIPE_PRICE_ID_* price ids to enable upgrades.",
    },
    { status: 503 }
  );
}
