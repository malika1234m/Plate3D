import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MenuClient } from "@/components/menu/MenuClient";
import { planOf } from "@/lib/plans";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

async function getMenu(slug: string) {
  return prisma.restaurant.findUnique({
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getMenu(slug);
  // notFound() here runs before streaming starts, so bogus slugs get a real
  // HTTP 404 — thrown from the page body it would be too late (shell already
  // streamed with 200 because of loading.tsx).
  if (!restaurant || !restaurant.isPublished) notFound();
  return {
    title: `${restaurant.name} — Menu`,
    description:
      restaurant.description || `Explore the menu at ${restaurant.name} in 3D.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await getMenu(slug);
  if (!restaurant || !restaurant.isPublished) notFound();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured to omit from the public payload
  const { ownerId: _ownerId, owner, ...pub } = restaurant;
  const orderingEnabled = planOf(owner) === "pro";
  return <MenuClient restaurant={pub} orderingEnabled={orderingEnabled} />;
}
