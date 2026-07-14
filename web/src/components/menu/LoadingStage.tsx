"use client";

import Image from "next/image";

/**
 * Branded "Bringing the menu to life" stage shared by the streaming
 * loading screen (server phase) and the asset overlay (client phase).
 */
export function LoadingStage({ progress }: { progress: number }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center overflow-hidden"
      style={{ background: "#070708", fontFamily: "var(--font-poppins)" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{ background: "rgba(240,118,46,0.16)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full blur-[90px]"
        style={{ background: "rgba(63,169,224,0.10)" }}
      />

      {/* Logo with pulsing halo */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-[-18px] rounded-full animate-ping"
          style={{
            background: "radial-gradient(circle, rgba(240,118,46,0.25), transparent 70%)",
            animationDuration: "2.4s",
          }}
        />
        <Image
          src="/logo.png"
          alt="Plate3D"
          width={132}
          height={132}
          priority
          className="relative rounded-3xl"
        />
      </div>

      <h1 className="mt-8 text-2xl sm:text-3xl font-extrabold text-[#f4f4f1]">
        Bringing the menu <span style={{ color: "#f0762e" }}>to life in 3D</span>
      </h1>
      <p className="mt-2 text-sm sm:text-base text-[#80807a]">
        Sit back and get ready for a delicious experience.
      </p>

      {/* Progress */}
      <div className="mt-12 w-full max-w-md">
        <p className="mb-3 text-sm font-semibold text-[#b9b9b2]">Loading 3D Menu…</p>
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-[#1b1b1f] border border-[#26262c]">
          <div
            className="h-full rounded-full transition-[width] duration-200 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #d4531a, #f0762e, #f5934f)",
              boxShadow: "0 0 14px rgba(240,118,46,0.55)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 w-24 animate-[stageshimmer_1.6s_linear_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            }}
          />
        </div>
        <p
          className="mt-2 text-right text-sm font-bold tabular-nums"
          style={{ color: "#f0762e" }}
        >
          {Math.round(progress)}%
        </p>
      </div>

      <style>{`
        @keyframes stageshimmer {
          from { left: -6rem; }
          to { left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-ping, .animate-\\[stageshimmer_1\\.6s_linear_infinite\\] { animation: none; }
        }
      `}</style>
    </div>
  );
}
