import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function ownedItem(req: Request, id: string) {
  const user = await getAuthUser(req);
  if (!user) return null;
  return prisma.menuItem.findFirst({
    where: { id, restaurant: { ownerId: user.id } },
  });
}

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  caption: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative().optional(),
  imageUrl: z.string().max(500).optional(),
  videoUrl: z.string().max(500).optional(),
  storyVideoUrl: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  isVegetarian: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  soldOutToday: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** Local date as YYYY-MM-DD — sold-out flags auto-expire at midnight. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await ownedItem(req, id);
  if (!item) return unauthorized();
  const full = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      modifierGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return Response.json({ item: full });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await ownedItem(req, id);
  if (!item) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, restaurantId: item.restaurantId },
    });
    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }
  }
  const { soldOutToday, ...data } = parsed.data;
  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...data,
      ...(soldOutToday !== undefined && { soldOutDate: soldOutToday ? today() : "" }),
    },
  });
  return Response.json({ item: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await ownedItem(req, id);
  if (!item) return unauthorized();
  await prisma.menuItem.delete({ where: { id } });
  return Response.json({ ok: true });
}
