import { getAuthUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, planOf } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";

/** Current plan, its limits, and usage — powers the app's billing screen. */
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const plan = planOf(user);
  const restaurants = await prisma.restaurant.count({ where: { ownerId: user.id } });
  return Response.json({
    plan,
    label: PLANS[plan].label,
    limits: PLANS[plan],
    usage: { restaurants },
    billingConfigured: stripeEnabled(),
  });
}
