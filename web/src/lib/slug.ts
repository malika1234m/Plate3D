import { prisma } from "./db";

export function slugify(name: string): string {
  return name
    .normalize("NFKD") // é -> e + combining accent, then strip the accents
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "restaurant";
}

/** Generate a slug unique across restaurants, appending a counter if taken. */
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; ; i++) {
    const existing = await prisma.restaurant.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${i}`;
  }
}
