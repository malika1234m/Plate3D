import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { autoEditVideo } from "@/lib/video";
import { uploadsDir } from "@/lib/uploads";

export const maxDuration = 300; // video processing can take a while

type Params = { params: Promise<{ id: string }> };

/**
 * Upload a raw "how it's made" video. The server auto-edits it
 * (speed-up, trim, 720p, fade) and attaches the result to the dish.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const item = await prisma.menuItem.findFirst({
    where: { id, restaurant: { ownerId: user.id } },
  });
  if (!item) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No video provided" }, { status: 400 });
  }
  if (file.size > 200 * 1024 * 1024) {
    return Response.json({ error: "Video too large (max 200 MB)" }, { status: 413 });
  }

  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const key = crypto.randomBytes(12).toString("hex");
  const rawExt = path.extname(file.name).toLowerCase() || ".mp4";
  const rawPath = path.join(dir, `raw-${key}${rawExt}`);
  const outName = `story-${key}.mp4`;
  const outPath = path.join(dir, outName);

  await writeFile(rawPath, Buffer.from(await file.arrayBuffer()));

  let storyVideoUrl = `/uploads/${outName}`;
  let edited = true;
  try {
    await autoEditVideo(rawPath, outPath);
    await unlink(rawPath).catch(() => {});
  } catch {
    // Auto-edit failed (corrupt clip, unsupported codec) — keep the raw video
    edited = false;
    storyVideoUrl = `/uploads/raw-${key}${rawExt}`;
    await unlink(outPath).catch(() => {});
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { storyVideoUrl },
  });
  return Response.json({ item: updated, edited }, { status: 201 });
}

/** Remove the story video from a dish. */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const item = await prisma.menuItem.findFirst({
    where: { id, restaurant: { ownerId: user.id } },
  });
  if (!item) return unauthorized();
  const updated = await prisma.menuItem.update({
    where: { id },
    data: { storyVideoUrl: "" },
  });
  return Response.json({ item: updated });
}
