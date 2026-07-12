import { getAuthUser, unauthorized } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
