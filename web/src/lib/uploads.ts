import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Where uploaded media lives. Defaults to ./uploads for local dev; set
 * UPLOADS_DIR in production to a persistent location (e.g. /data/uploads
 * on a Railway volume) so files survive redeploys.
 */
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

const MAX_FETCH_BYTES = 150 * 1024 * 1024;

/**
 * Download a remote file into our own storage and return its /uploads path.
 * Used to persist generated 3D models — provider URLs (Meshy) expire.
 */
export async function saveFromUrl(url: string, ext: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_FETCH_BYTES) throw new Error("Downloaded file too large");
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const name = `model-${crypto.randomBytes(12).toString("hex")}${ext}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
