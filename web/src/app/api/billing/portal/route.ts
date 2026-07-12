import { getAuthUser, unauthorized } from "@/lib/auth";
import { stripe, stripeEnabled, billingUnavailable } from "@/lib/stripe";

/** Stripe customer portal — manage or cancel the subscription. */
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  if (!stripeEnabled()) return billingUnavailable();
  if (!user.stripeCustomerId) {
    return Response.json({ error: "No billing account yet." }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: base,
  });
  return Response.json({ url: session.url });
}
