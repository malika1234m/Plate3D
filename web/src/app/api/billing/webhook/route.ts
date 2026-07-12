import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe, stripeEnabled } from "@/lib/stripe";

/**
 * Stripe webhook: flips users between free and pro.
 * Point Stripe at POST /api/billing/webhook and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Billing not configured" }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            stripeSubscriptionId: String(session.subscription),
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: "free", stripeSubscriptionId: "" },
      });
      break;
    }
  }

  return Response.json({ received: true });
}
