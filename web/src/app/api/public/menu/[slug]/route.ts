import { prisma } from "@/lib/db";
import { planOf } from "@/lib/plans";

type Params = { params: Promise<{ slug: string }> };

/** Public menu payload — what customers see after scanning the QR code. */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      owner: { select: { plan: true } },
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: { options: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!restaurant || !restaurant.isPublished) {
    return Response.json({ error: "Menu not found" }, { status: 404 });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to omit from the public payload
  const { ownerId: _ownerId, owner, ...pub } = restaurant;
  return Response.json({ restaurant: { ...pub, orderingEnabled: planOf(owner) === "pro" } });
}
