import { z } from "zod";
import { prisma } from "@/lib/db";
import { planOf } from "@/lib/plans";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";

/**
 * Customer order submission from the public menu. Ordering is the Pro
 * restaurant experience. Prices are computed server-side from the live
 * menu — the client's numbers are never trusted.
 */

const schema = z.object({
  slug: z.string().min(1).max(120),
  tableNumber: z.string().max(20).optional().default(""),
  customerName: z.string().max(80).optional().default(""),
  note: z.string().max(300).optional().default(""),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        optionIds: z.array(z.string()).max(30).optional().default([]),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 10, 60_000)) {
    return tooManyRequests("Too many orders from this device. Wait a minute and try again.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid order" }, { status: 400 });
  }
  const { slug, tableNumber, customerName, note, items } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { owner: true },
  });
  if (!restaurant || !restaurant.isPublished) {
    return Response.json({ error: "Menu not found" }, { status: 404 });
  }
  if (planOf(restaurant.owner) !== "pro") {
    return Response.json({ error: "Ordering is not available on this menu." }, { status: 403 });
  }

  // Resolve every line against the live menu; compute prices server-side.
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((l) => l.itemId) }, restaurantId: restaurant.id, isAvailable: true },
    include: { modifierGroups: { include: { options: true } } },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: { name: string; quantity: number; unitPrice: number; options: string[]; lineTotal: number }[] = [];
  for (const line of items) {
    const item = byId.get(line.itemId);
    if (!item) return Response.json({ error: "A dish in your order is no longer available." }, { status: 409 });

    const validOptions = new Map(
      item.modifierGroups.flatMap((g) => g.options.map((o) => [o.id, o] as const))
    );
    const chosen = [];
    for (const oid of line.optionIds) {
      const opt = validOptions.get(oid);
      if (!opt) return Response.json({ error: "Invalid option selection." }, { status: 400 });
      chosen.push(opt);
    }
    const unitPrice = item.price + chosen.reduce((s, o) => s + o.priceDelta, 0);
    lines.push({
      name: item.name,
      quantity: line.quantity,
      unitPrice: Math.round(unitPrice * 100) / 100,
      options: chosen.map((o) => o.name),
      lineTotal: Math.round(unitPrice * line.quantity * 100) / 100,
    });
  }
  const total = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber,
      customerName,
      note,
      items: JSON.stringify(lines),
      total,
    },
  });

  // Short human-friendly code for "show this at the counter"
  const code = order.id.slice(-4).toUpperCase();
  return Response.json({ ok: true, orderId: order.id, code, total }, { status: 201 });
}
