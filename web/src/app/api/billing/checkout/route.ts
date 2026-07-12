import { getAuthUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, stripeEnabled, billingUnavailable } from "@/lib/stripe";

/** Start a Stripe Checkout session for the Pro subscription. */
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  if (!stripeEnabled()) return billingUnavailable();
  if (user.plan === "pro") {
    return Response.json({ error: "You are already on Pro." }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Reuse the Stripe customer across attempts
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${base}/billing/success`,
    cancel_url: `${base}/billing/cancelled`,
    metadata: { userId: user.id },
  });

  return Response.json({ url: session.url });
}
