import path from "path";

/**
 * Where uploaded media lives. Defaults to ./uploads for local dev; set
 * UPLOADS_DIR in production to a persistent location (e.g. /data/uploads
 * on a Railway volume) so files survive redeploys.
 */
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}
