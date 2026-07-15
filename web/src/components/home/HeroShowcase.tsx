"use client";

import { useEffect, useState } from "react";

export type ShowcaseDish = {
  id: string;
  name: string;
  description: string;
  caption: string;
  price: number;
  imageUrl: string;
  has3D: boolean;
};

/**
 * Live hero showcase: floating dish card + vertical rail, fed by real menu
 * data. Auto-cycles through dishes; hover pauses, click selects.
 */
export function HeroShowcase({
  dishes,
  currency,
}: {
  dishes: ShowcaseDish[];
  currency: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || dishes.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % dishes.length), 4500);
    return () => clearInterval(t);
  }, [paused, dishes.length]);

  if (dishes.length === 0) return null;
  const dish = dishes[index];

  // Fixed locale: an undefined locale differs between server and browser,
  // causing a hydration mismatch (e.g. "US$8.50" vs "$8.50").
  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat("en-US", { style: "currency", currency });
  } catch {
    fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  }

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Floating dish card */}
      <div
        key={dish.id}
        className="absolute hidden lg:block top-[16%] left-[52%] w-60 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 rise"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-bold text-ink leading-snug">{dish.name}</p>
          {dish.has3D && (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0" style={{ background: "var(--accent)" }}>
              3D
            </span>
          )}
        </div>
        {dish.caption && <p className="mt-1 text-xs italic text-accent">“{dish.caption}”</p>}
        <p className="mt-2 text-xs leading-relaxed text-ink-dim line-clamp-3">{dish.description}</p>
        <p className="mt-3 text-xl font-extrabold text-accent">{fmt.format(dish.price)}</p>
      </div>

      {/* 360 badge + drag hint */}
      <div className="absolute hidden lg:flex flex-col items-center gap-3 bottom-[24%] left-[68%] pointer-events-none">
        <span className="flex flex-col items-center justify-center h-20 w-20 rounded-full border border-white/20 bg-black/55 backdrop-blur-md text-ink">
          <span className="text-lg font-extrabold">360°</span>
          <svg width="34" height="10" viewBox="0 0 34 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M2 3c4 3.5 26 3.5 30 0M28 1.5 32 3l-3.6 2" />
          </svg>
        </span>
        <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/60 backdrop-blur-md px-4 py-2.5 text-sm text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11.5V4.8a1.8 1.8 0 0 1 3.6 0v5.7l4.5.9a2 2 0 0 1 1.6 2.3l-.8 4.3a3 3 0 0 1-3 2.5h-3.7a3 3 0 0 1-2.2-1L5.5 15.6a1.6 1.6 0 0 1 2.3-2.2L9 14.5" />
          </svg>
          Drag to Rotate
        </span>
      </div>

      {/* Dish rail */}
      <div className="absolute hidden xl:flex flex-col items-center gap-3 right-8 top-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-4">
        <button
          aria-label="Previous dish"
          onClick={() => setIndex((i) => (i - 1 + dishes.length) % dishes.length)}
          className="text-ink-dim hover:text-ink"
        >
          <svg width="16" height="9" viewBox="0 0 16 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m2 7 6-5 6 5" />
          </svg>
        </button>
        {dishes.slice(0, 4).map((d, i) => (
          <button key={d.id} onClick={() => setIndex(i)} className="text-center">
            <span
              className="block h-[70px] w-[120px] rounded-lg overflow-hidden border-2 bg-black/40"
              style={{ borderColor: i === index ? "var(--accent)" : "rgba(255,255,255,0.12)" }}
            >
              {d.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-ink-faint" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M7 3v7a2 2 0 0 0 2 2v9M5 3v4M9 3v4M16 3c-1.5 1.5-2 3.5-2 6 0 2 .8 3 2 3v9M16 3v18" />
                  </svg>
                </span>
              )}
            </span>
            <span
              className="mt-1.5 block text-[10px] w-[120px] truncate"
              style={{ color: i === index ? "var(--ink)" : "var(--ink-faint)" }}
            >
              {d.name}
            </span>
          </button>
        ))}
        <button
          aria-label="Next dish"
          onClick={() => setIndex((i) => (i + 1) % dishes.length)}
          className="text-ink-dim hover:text-ink"
        >
          <svg width="16" height="9" viewBox="0 0 16 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m2 2 6 5 6-5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
