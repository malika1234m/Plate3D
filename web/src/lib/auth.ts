import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret"
);

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

/** Resolve the authenticated user from a Bearer token, or null. */
export async function getAuthUser(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const userId = await verifyToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
