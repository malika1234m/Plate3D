"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

/* ---------- Scroll reveal ---------- */

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s cubic-bezier(0.2,0.7,0.3,1), transform 0.7s cubic-bezier(0.2,0.7,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Animated counter ---------- */

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- Live 3D dish embed ---------- */

export function LiveDish3D({
  modelUrl,
  usdzUrl,
  poster,
  name,
}: {
  modelUrl: string;
  usdzUrl?: string;
  poster?: string;
  name: string;
}) {
  return (
    <div className="relative h-[380px] sm:h-[440px] rounded-3xl border border-navy-700 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 70%, rgba(240,118,46,0.14), transparent 65%)" }}
    >
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" />
      <model-viewer
        src={modelUrl}
        ios-src={usdzUrl || undefined}
        alt={`Interactive 3D model of ${name}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        auto-rotate-delay="800"
        rotation-per-second="26deg"
        shadow-intensity="1"
        exposure="1.1"
        touch-action="pan-y"
        interaction-prompt="none"
        poster={poster || undefined}
      />
      <span className="absolute top-4 left-4 rounded-full border border-white/15 bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-ink pointer-events-none">
        Live 3D — drag me
      </span>
      <span className="absolute bottom-4 left-4 text-sm font-bold text-ink pointer-events-none">{name}</span>
    </div>
  );
}
