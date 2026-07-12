import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MenuClient } from "@/components/menu/MenuClient";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

async function getMenu(slug: string) {
  return prisma.restaurant.findUnique({
    where: { slug },
    include: {
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
  if (!restaurant) return { title: "Menu not found" };
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

  const { ownerId: _ownerId, ...pub } = restaurant;
  return <MenuClient restaurant={pub} />;
}
