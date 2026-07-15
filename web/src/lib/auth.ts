import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

// JWT_SECRET must be set in production. Refuse to sign tokens with a known
// fallback there — a public secret lets anyone forge bearer tokens.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not set. Refusing to start with an insecure fallback.");
}
const secret = new TextEncoder().encode(jwtSecret ?? "dev-secret-do-not-use-in-prod");

export async function signToken(userId: string, tokenVersion = 0): Promise<string> {
  return new SignJWT({ sub: userId, ver: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<{ userId: string; ver: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return { userId: payload.sub as string, ver: (payload.ver as number) ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Resolve the authenticated user from a Bearer token, or null.
 * Tokens carry the tokenVersion they were issued with; bumping the user's
 * tokenVersion (password change, etc.) revokes all previously issued tokens.
 */
export async function getAuthUser(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.userId } });
  if (!user || user.tokenVersion !== claims.ver) return null;
  return user;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
