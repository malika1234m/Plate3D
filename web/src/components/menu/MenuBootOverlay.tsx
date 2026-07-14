"use client";

import { useEffect, useState } from "react";
import { LoadingStage } from "./LoadingStage";

/**
 * Keeps the branded loading stage on screen until the menu is actually ready
 * to look at: fonts loaded and the images present at hydration finished
 * (or a hard cap, so a single slow photo can't hold the menu hostage).
 *
 * Continues from where the streamed loading screen (route loading.tsx)
 * left off, so the customer sees one continuous progress bar.
 */
const BASE = 40; // server phase ended around here
const MIN_VISIBLE_MS = 600;
const CAP_MS = 8000;

export function MenuBootOverlay() {
  const [progress, setProgress] = useState(BASE);
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const images = Array.from(document.images);
    const total = Math.max(images.length, 1);
    let loaded = images.filter((img) => img.complete).length;
    let fontsReady = false;

    document.fonts?.ready.then(() => {
      fontsReady = true;
    });

    const cleanups: Array<() => void> = [];
    for (const img of images) {
      if (img.complete) continue;
      const done = () => {
        loaded++;
      };
      img.addEventListener("load", done);
      img.addEventListener("error", done);
      cleanups.push(() => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    }

    const tick = setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      const assetProgress = BASE + (loaded / total) * (100 - BASE - 4);
      setProgress((p) => Math.max(p, Math.min(96, assetProgress)));

      const ready = loaded >= total && (fontsReady || elapsed > 3000);
      if ((ready && elapsed >= MIN_VISIBLE_MS) || elapsed >= CAP_MS) {
        clearInterval(tick);
        setProgress(100);
        setPhase("fading");
        setTimeout(() => {
          if (!cancelled) setPhase("done");
        }, 450);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearInterval(tick);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.45s ease",
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <LoadingStage progress={progress} />
    </div>
  );
}
