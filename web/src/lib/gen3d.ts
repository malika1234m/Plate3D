/**
 * 3D model generation pipeline.
 *
 * Uses Meshy.ai's image-to-3D API when MESHY_API_KEY is set. The owner uploads
 * a food video plus a still photo from the mobile app; the photo is sent to the
 * generation service and the resulting GLB is attached to the menu item. When
 * no key is configured, items keep modelStatus NONE and the customer menu
 * shows the interactive 360° video instead.
 */

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

export function gen3dEnabled(): boolean {
  return Boolean(process.env.MESHY_API_KEY);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Start an image-to-3D job. Returns the provider task id. */
export async function startGeneration(imageUrl: string): Promise<string> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      image_url: imageUrl,
      enable_pbr: true,
      should_texture: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`3D generation request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.result as string;
}

export type GenerationStatus =
  | { status: "PROCESSING"; progress: number }
  | { status: "READY"; modelUrl: string; usdzUrl: string }
  | { status: "FAILED"; error: string };

/** Poll a generation job. */
export async function checkGeneration(taskId: string): Promise<GenerationStatus> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    return { status: "FAILED", error: `Status check failed: ${res.status}` };
  }
  const data = await res.json();
  if (data.status === "SUCCEEDED") {
    return {
      status: "READY",
      modelUrl: data.model_urls?.glb ?? "",
      usdzUrl: data.model_urls?.usdz ?? "", // iOS AR Quick Look
    };
  }
  if (data.status === "FAILED" || data.status === "CANCELED") {
    return { status: "FAILED", error: data.task_error?.message ?? "Generation failed" };
  }
  return { status: "PROCESSING", progress: data.progress ?? 0 };
}
