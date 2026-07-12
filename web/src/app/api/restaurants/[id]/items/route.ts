import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  caption: z.string().max(160).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative(),
  imageUrl: z.string().max(500).optional(),
  videoUrl: z.string().max(500).optional(),
  isVegetarian: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!restaurant) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { categoryId, ...data } = parsed.data;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, restaurantId: id },
  });
  if (!category) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  const count = await prisma.menuItem.count({ where: { categoryId } });
  const item = await prisma.menuItem.create({
    data: { ...data, categoryId, restaurantId: id, sortOrder: count },
  });
  return Response.json({ item }, { status: 201 });
}
