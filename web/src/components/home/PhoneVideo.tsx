"use client";

import { useEffect, useRef } from "react";

/**
 * A looping product video inside a phone bezel. Plays only while on screen
 * (IntersectionObserver) so a page full of videos stays light on battery
 * and bandwidth. Muted + playsInline so mobile browsers autoplay it.
 */
export function PhoneVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className="relative mx-auto w-[220px] sm:w-[240px] rounded-[36px] border border-navy-700 bg-navy-950 p-2.5 shadow-2xl"
      style={{ boxShadow: "0 24px 60px -20px rgba(240,118,46,0.25)" }}
    >
      {/* speaker notch */}
      <span aria-hidden className="absolute left-1/2 top-4 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/60" />
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="aspect-[9/16] w-full rounded-[26px] object-cover bg-navy-900"
      />
    </div>
  );
}
