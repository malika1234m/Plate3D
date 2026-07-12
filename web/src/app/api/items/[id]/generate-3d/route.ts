import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { gen3dEnabled, startGeneration, checkGeneration } from "@/lib/gen3d";
import { PLANS, planOf, upgradeRequired } from "@/lib/plans";

type Params = { params: Promise<{ id: string }> };

async function ownedItem(req: Request, id: string) {
  const user = await getAuthUser(req);
  if (!user) return null;
  return prisma.menuItem.findFirst({
    where: { id, restaurant: { ownerId: user.id } },
  });
}

/** Start 3D model generation for a menu item from its photo. Pro feature. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const item = await ownedItem(req, id);
  if (!item) return unauthorized();

  if (!PLANS[planOf(user)].gen3d) {
    return upgradeRequired(
      "3D model generation is a Pro feature. Upgrade to turn your dish photos into spinnable 3D models — your 360° videos stay free."
    );
  }

  if (!gen3dEnabled()) {
    return Response.json(
      {
        error:
          "3D generation is not configured on this server (MESHY_API_KEY missing). " +
          "The menu will show the interactive 360° video instead.",
        enabled: false,
      },
      { status: 503 }
    );
  }
  if (!item.imageUrl) {
    return Response.json(
      { error: "Add a photo of the dish first — it is used to build the 3D model." },
      { status: 400 }
    );
  }

  // The generation service must be able to fetch the image over the internet.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const imageUrl = item.imageUrl.startsWith("http")
    ? item.imageUrl
    : `${base}${item.imageUrl}`;

  try {
    const jobId = await startGeneration(imageUrl);
    const updated = await prisma.menuItem.update({
      where: { id },
      data: { modelStatus: "PROCESSING", modelJobId: jobId },
    });
    return Response.json({ item: updated });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 502 }
    );
  }
}

/** Poll generation status; updates the item when the model is ready. */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await ownedItem(req, id);
  if (!item) return unauthorized();

  if (item.modelStatus !== "PROCESSING" || !item.modelJobId) {
    return Response.json({ item });
  }

  const result = await checkGeneration(item.modelJobId);
  if (result.status === "READY") {
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        modelStatus: "READY",
        modelUrl: result.modelUrl,
        modelUsdzUrl: result.usdzUrl,
      },
    });
    return Response.json({ item: updated });
  }
  if (result.status === "FAILED") {
    const updated = await prisma.menuItem.update({
      where: { id },
      data: { modelStatus: "FAILED" },
    });
    return Response.json({ item: updated, error: result.error });
  }
  return Response.json({ item, progress: result.progress });
}
