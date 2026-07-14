"use client";

import { useEffect, useState } from "react";
import { LoadingStage } from "@/components/menu/LoadingStage";

/**
 * Streamed to the customer the instant they open a menu URL, while the
 * server fetches and renders the menu. Climbs to ~40%; the client-side
 * MenuBootOverlay takes over from there until assets are ready.
 */
export default function MenuLoading() {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 40 ? p : p + Math.max(1, Math.round((40 - p) / 8))));
    }, 160);
    return () => clearInterval(t);
  }, []);

  return <LoadingStage progress={progress} />;
}
