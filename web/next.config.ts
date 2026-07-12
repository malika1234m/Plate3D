import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static resolves its binary path from __dirname at runtime;
  // it must stay an external require, not be inlined into the server bundle.
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
