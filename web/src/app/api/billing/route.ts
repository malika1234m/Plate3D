import { getAuthUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, planOf, countModels, countVideos, hasActiveAccess, isSubscribed, trialDaysLeft } from "@/lib/plans";
import { stripeEnabled } from "@/lib/stripe";

/** Current plan, its limits, and usage — powers the app's billing screen. */
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const plan = planOf(user);
  const [restaurants, models, videos] = await Promise.all([
    prisma.restaurant.count({ where: { ownerId: user.id } }),
    countModels(user.id),
    countVideos(user.id),
  ]);
  return Response.json({
    plan,
    label: PLANS[plan].label,
    limits: PLANS[plan],
    usage: { restaurants, models, videos },
    subscribed: isSubscribed(user),
    trialDaysLeft: trialDaysLeft(user),
    accessActive: hasActiveAccess(user),
    billingConfigured: stripeEnabled(),
  });
}
