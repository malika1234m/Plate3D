import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAuthUser, signToken, unauthorized } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

/**
 * Change password. Bumps tokenVersion so every other session is signed out,
 * and returns a fresh token so this session stays logged in.
 */
export async function PATCH(req: Request) {
  if (!rateLimit(`pwchange:${clientIp(req)}`, 5, 60_000)) {
    return tooManyRequests("Too many attempts. Wait a minute and try again.");
  }
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const { currentPassword, newPassword } = parsed.data;

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return Response.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      tokenVersion: { increment: 1 },
    },
  });

  const token = await signToken(updated.id, updated.tokenVersion);
  return Response.json({ ok: true, token });
}

const deleteSchema = z.object({ password: z.string().min(1) });

/**
 * Delete the account and everything it owns (restaurants, menus, dishes —
 * the schema cascades). Required by Google Play for apps with sign-up.
 */
export async function DELETE(req: Request) {
  if (!rateLimit(`acctdelete:${clientIp(req)}`, 5, 60_000)) {
    return tooManyRequests("Too many attempts. Wait a minute and try again.");
  }
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter your password to confirm." }, { status: 400 });
  }
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return Response.json({ error: "Password is incorrect." }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: user.id } });
  return Response.json({ ok: true });
}
