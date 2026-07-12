import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";

/**
 * Auto-edit pipeline for "how it's made" dish videos.
 *
 * Owners film freely (up to ~a minute); we turn the raw clip into a tight,
 * menu-ready loop: first 45s taken, sped up 3x (max ~15s result), capped at
 * 720p / 30fps, fade-in, audio stripped (menus autoplay muted), H.264 with
 * faststart so it streams instantly on phones.
 */
export function autoEditVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg binary not available"));
      return;
    }
    const args = [
      "-y",
      "-t", "45",
      "-i", inputPath,
      "-vf",
      [
        "setpts=PTS/3",
        "scale='min(720,iw)':-2",
        "fps=30",
        "fade=t=in:st=0:d=0.4",
      ].join(","),
      "-an",
      "-t", "15",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "26",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    ];
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-400)}`));
    });
  });
}
