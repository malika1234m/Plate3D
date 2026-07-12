"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";

export type PublicModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type PublicModifierGroup = {
  id: string;
  name: string;
  type: string; // single | multi
  required: boolean;
  options: PublicModifierOption[];
};

export type PublicItem = {
  id: string;
  name: string;
  caption: string;
  description: string;
  price: number;
  imageUrl: string;
  videoUrl: string;
  storyVideoUrl: string;
  modelUrl: string;
  modelUsdzUrl: string;
  modelStatus: string;
  soldOutDate: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  modifierGroups: PublicModifierGroup[];
};

export type PublicCategory = {
  id: string;
  name: string;
  availableFrom: string;
  availableTo: string;
  items: PublicItem[];
};

export type PublicRestaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  caption: string;
  address: string;
  phone: string;
  currency: string;
  coverUrl: string;
  logoUrl: string;
  accentColor: string;
  theme: string;
  layout: string;
  showReel: boolean;
};

/* ---------- Owner-selectable menu themes ---------- */

const THEMES: Record<string, Record<string, string>> = {
  midnight: {
    "--m-bg": "#070708",
    "--m-surface": "#121214",
    "--m-raised": "#1b1b1f",
    "--m-border": "#28282e",
    "--m-text": "#f4f4f1",
    "--m-dim": "#b9b9b2",
    "--m-faint": "#80807a",
    "--m-scrim": "rgba(7,7,8,0.97)",
  },
  espresso: {
    "--m-bg": "#14100c",
    "--m-surface": "#1c1610",
    "--m-raised": "#2a2118",
    "--m-border": "#3b2f22",
    "--m-text": "#f3e9dc",
    "--m-dim": "#c9bba9",
    "--m-faint": "#8f8171",
    "--m-scrim": "rgba(20,16,12,0.97)",
  },
  ivory: {
    "--m-bg": "#f8f4ec",
    "--m-surface": "#ffffff",
    "--m-raised": "#f1ead9",
    "--m-border": "#e5dcc8",
    "--m-text": "#241d14",
    "--m-dim": "#5f5546",
    "--m-faint": "#94897a",
    "--m-scrim": "rgba(248,244,236,0.97)",
  },
};

const poppins = { fontFamily: "var(--font-poppins)" };

function useCurrency(currency: string) {
  return useMemo(() => {
    try {
      // Fixed locale: an undefined locale differs between server and browser,
      // causing a hydration mismatch (e.g. "US$8.50" vs "$8.50").
      return new Intl.NumberFormat("en-US", { style: "currency", currency });
    } catch {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    }
  }, [currency]);
}

const has3D = (item: PublicItem) => item.modelStatus === "READY" && !!item.modelUrl;

/** All time logic uses the viewer's clock — customers are at the restaurant. */
function localToday(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const isSoldOut = (item: PublicItem, now: Date | null) =>
  now !== null && !!item.soldOutDate && item.soldOutDate === localToday(now);

/** Category serving window; supports overnight ranges like 22:00–02:00. */
function categoryOpen(cat: PublicCategory, now: Date | null): boolean {
  if (now === null || !cat.availableFrom || !cat.availableTo) return true;
  const mins = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = cat.availableFrom.split(":").map(Number);
  const [th, tm] = cat.availableTo.split(":").map(Number);
  const from = fh * 60 + fm;
  const to = th * 60 + tm;
  return from <= to ? mins >= from && mins < to : mins >= from || mins < to;
}

type MediaTab = "3d" | "story" | "spin" | "photo";

function mediaTabs(item: PublicItem): MediaTab[] {
  const tabs: MediaTab[] = [];
  if (has3D(item)) tabs.push("3d");
  if (item.storyVideoUrl) tabs.push("story");
  if (item.videoUrl) tabs.push("spin");
  if (tabs.length === 0 && item.imageUrl) tabs.push("photo");
  return tabs;
}

const TAB_LABELS: Record<MediaTab, string> = {
  "3d": "3D View",
  story: "How it's made",
  spin: "360° View",
  photo: "Photo",
};

/* ---------- Small shared bits ---------- */

function SoldOutRibbon() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-black/55">
      <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider text-white bg-black/70">
        SOLD OUT
      </span>
    </span>
  );
}

function Thumb({ item, className }: { item: PublicItem; className: string }) {
  if (item.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.imageUrl} alt="" className={className} loading="lazy" />;
  }
  const video = item.storyVideoUrl || item.videoUrl;
  if (video) {
    return <video src={video} className={className} muted playsInline preload="metadata" />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center text-2xl font-bold`}
      style={{ color: "var(--m-faint)", ...poppins }}
      aria-hidden
    >
      {item.name.charAt(0).toUpperCase()}
    </div>
  );
}

function MediaBadge({ item }: { item: PublicItem }) {
  if (!has3D(item) && !item.videoUrl && !item.storyVideoUrl) return null;
  return (
    <span
      className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
      style={{ background: "var(--accent)" }}
    >
      {has3D(item) ? "3D" : item.storyVideoUrl ? "video" : "360°"}
    </span>
  );
}

const chev = (dir: "l" | "r") => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {dir === "l" ? <path d="m15 5-7 7 7 7" /> : <path d="m9 5 7 7-7 7" />}
  </svg>
);

/* ---------- Dish stage: full-screen viewer, mockup layout ---------- */

function DishStage({
  items,
  index,
  currency,
  now,
  initialTab,
  onNavigate,
  onClose,
}: {
  items: PublicItem[];
  index: number;
  currency: Intl.NumberFormat;
  now: Date | null;
  initialTab?: MediaTab;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const soldOut = isSoldOut(item, now);
  const tabs = mediaTabs(item);
  const [tab, setTab] = useState<MediaTab>(
    initialTab && tabs.includes(initialTab) ? initialTab : (tabs[0] ?? "photo")
  );
  const touchX = useRef<number | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(Math.min(index + 1, items.length - 1));
      if (e.key === "ArrowLeft") onNavigate(Math.max(index - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, index, items.length]);

  // Keep the active thumbnail in view
  useEffect(() => {
    railRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  // Modifier selections: groupId -> selected option ids
  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of item.modifierGroups) {
      init[g.id] = g.required && g.type === "single" && g.options[0] ? [g.options[0].id] : [];
    }
    return init;
  });

  const pick = (group: PublicModifierGroup, optionId: string) => {
    setSel((s) => {
      const current = s[group.id] ?? [];
      if (group.type === "single") {
        const next = current.includes(optionId) && !group.required ? [] : [optionId];
        return { ...s, [group.id]: next };
      }
      return {
        ...s,
        [group.id]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const total =
    item.price +
    item.modifierGroups.reduce(
      (sum, g) =>
        sum +
        g.options
          .filter((o) => (sel[g.id] ?? []).includes(o.id))
          .reduce((a, o) => a + o.priceDelta, 0),
      0
    );

  const swipeStart = (x: number) => (touchX.current = x);
  const swipeEnd = (x: number) => {
    if (touchX.current === null) return;
    const dx = x - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0 && index < items.length - 1) onNavigate(index + 1);
    if (dx > 0 && index > 0) onNavigate(index - 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col rise"
      style={{ background: "var(--m-scrim)", ...poppins }}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-5 shrink-0">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--m-dim)" }}
        >
          <span aria-hidden>←</span> Back to Menu
        </button>
        <span className="text-xs" style={{ color: "var(--m-faint)" }}>
          {index + 1} / {items.length}
        </span>
      </div>

      {/* Body: info panel + media */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:items-stretch gap-2 px-5 sm:px-8 pt-3">
        {/* Media (first on mobile; fixed height there so the info panel can scroll) */}
        <div
          className="relative order-1 lg:order-2 shrink-0 h-[38vh] lg:h-auto lg:flex-1"
          // Swiping navigates dishes — except in 3D view, where dragging rotates the model
          onTouchStart={tab === "3d" ? undefined : (e) => swipeStart(e.touches[0].clientX)}
          onTouchEnd={tab === "3d" ? undefined : (e) => swipeEnd(e.changedTouches[0].clientX)}
        >
          <div
            aria-hidden
            className="absolute bottom-[8%] left-1/2 -translate-x-1/2 h-[30vw] max-h-44 w-[70vw] max-w-lg rounded-[50%] blur-3xl opacity-25"
            style={{ background: "var(--accent)" }}
          />
          <div className="relative h-full w-full">
            {tab === "3d" && (
              <model-viewer
                src={item.modelUrl}
                ios-src={item.modelUsdzUrl || undefined}
                alt={`3D model of ${item.name}`}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                ar-placement="floor"
                camera-controls
                auto-rotate
                auto-rotate-delay="1200"
                rotation-per-second="24deg"
                shadow-intensity="1"
                exposure="1.05"
                touch-action="pan-y"
                interaction-prompt="none"
                poster={item.imageUrl || undefined}
              >
                <button
                  slot="ar-button"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg"
                  style={{ background: "var(--accent)" }}
                >
                  View on your table
                </button>
              </model-viewer>
            )}
            {(tab === "story" || tab === "spin") && (
              <video
                key={`${item.id}-${tab}`}
                src={tab === "story" ? item.storyVideoUrl : item.videoUrl}
                className="h-full w-full object-contain"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
              />
            )}
            {tab === "photo" &&
              (item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full flex items-center justify-center" style={{ color: "var(--m-faint)" }}>
                  No preview available
                </div>
              ))}
          </div>

          {/* Prev / next on the stage (desktop) */}
          {index > 0 && (
            <button
              onClick={() => onNavigate(index - 1)}
              aria-label="Previous dish"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: "var(--m-border)", background: "var(--m-surface)", color: "var(--m-text)" }}
            >
              {chev("l")}
            </button>
          )}
          {index < items.length - 1 && (
            <button
              onClick={() => onNavigate(index + 1)}
              aria-label="Next dish"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: "var(--m-border)", background: "var(--m-surface)", color: "var(--m-text)" }}
            >
              {chev("r")}
            </button>
          )}
        </div>

        {/* Info panel — scrolls independently on every screen size */}
        <div
          className="order-2 lg:order-1 flex-1 min-h-0 lg:flex-none lg:w-[360px] lg:shrink-0 overflow-y-auto no-scrollbar rounded-2xl lg:border lg:p-6 py-3"
          style={{ borderColor: "var(--m-border)", background: "transparent" }}
        >
          {soldOut && (
            <p
              className="mb-3 rounded-lg px-3 py-2 text-sm font-semibold text-center"
              style={{ background: "var(--m-raised)", color: "var(--m-dim)" }}
            >
              Sold out today — back tomorrow
            </p>
          )}
          <h2 className="text-3xl font-extrabold leading-tight" style={{ color: "var(--m-text)" }}>
            {item.name}
          </h2>
          {item.caption && (
            <p className="mt-1.5 text-sm italic" style={{ color: "var(--accent)" }}>
              “{item.caption}”
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {item.isVegetarian && (
              <span className="text-xs rounded-full border border-green-600/60 text-green-500 px-2 py-0.5">Vegetarian</span>
            )}
            {item.isSpicy && (
              <span className="text-xs rounded-full border border-red-600/60 text-red-500 px-2 py-0.5">Spicy</span>
            )}
          </div>
          {item.description && (
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--m-dim)" }}>
              {item.description}
            </p>
          )}
          <p className="mt-4 text-4xl font-extrabold" style={{ color: "var(--accent)" }}>
            {currency.format(total)}
          </p>

          {/* Choose your view */}
          {tabs.length > 1 && (
            <>
              <p className="mt-6 text-sm font-bold" style={{ color: "var(--m-text)" }}>
                Choose your view
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors"
                    style={
                      tab === t
                        ? { borderColor: "var(--accent)", color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }
                        : { borderColor: "var(--m-border)", color: "var(--m-dim)" }
                    }
                  >
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Explore hints (3D only) */}
          {tab === "3d" && (
            <div className="mt-6">
              <p className="text-sm font-bold" style={{ color: "var(--m-text)" }}>
                Explore in 3D
              </p>
              <ul className="mt-3 space-y-2.5 text-sm" style={{ color: "var(--m-dim)" }}>
                {["Drag to rotate", "Pinch or scroll to zoom", "Swipe for the next dish"].map((hint) => (
                  <li key={hint} className="flex items-center gap-3">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: "var(--accent)" }}
                    />
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modifiers: live price preview */}
          {item.modifierGroups.map((group) => (
            <div key={group.id} className="mt-6">
              <p className="text-sm font-bold" style={{ color: "var(--m-text)" }}>
                {group.name}
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--m-faint)" }}>
                  {group.required ? "required" : group.type === "multi" ? "pick any" : "pick one"}
                </span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = (sel[group.id] ?? []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => pick(group, opt.id)}
                      aria-pressed={active}
                      className="rounded-full px-3.5 py-1.5 text-sm border transition-colors"
                      style={
                        active
                          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }
                          : { borderColor: "var(--m-border)", color: "var(--m-dim)" }
                      }
                    >
                      {opt.name}
                      {opt.priceDelta !== 0 && (
                        <span className="ml-1 opacity-80">
                          {opt.priceDelta > 0 ? "+" : "−"}
                          {currency.format(Math.abs(opt.priceDelta))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Swipeable dish carousel */}
      <div className="shrink-0 px-5 sm:px-8 pb-5 pt-3">
        <div
          className="rounded-3xl border px-3 py-3 flex items-center gap-2"
          style={{ borderColor: "var(--m-border)", background: "color-mix(in srgb, var(--m-surface) 80%, transparent)" }}
        >
          <button
            onClick={() => index > 0 && onNavigate(index - 1)}
            aria-label="Previous dish"
            className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--m-border)", color: "var(--m-dim)" }}
          >
            {chev("l")}
          </button>
          <div ref={railRef} className="flex gap-3 overflow-x-auto no-scrollbar snap-x flex-1">
            {items.map((dish, i) => (
              <button
                key={dish.id}
                data-idx={i}
                onClick={() => onNavigate(i)}
                className="shrink-0 snap-start text-center"
              >
                <span
                  className="block h-16 w-24 rounded-xl overflow-hidden border-2"
                  style={{ borderColor: i === index ? "var(--accent)" : "var(--m-border)" }}
                >
                  <Thumb item={dish} className="h-full w-full object-cover" />
                </span>
                <span
                  className="mt-1 block w-24 truncate text-[10px] font-medium"
                  style={{ color: i === index ? "var(--m-text)" : "var(--m-faint)" }}
                >
                  {dish.name}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => index < items.length - 1 && onNavigate(index + 1)}
            aria-label="Next dish"
            className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--m-border)", color: "var(--m-dim)" }}
          >
            {chev("r")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Kitchen reel ---------- */

function KitchenReel({
  items,
  currency,
  onOpen,
}: {
  items: PublicItem[];
  currency: Intl.NumberFormat;
  onOpen: (item: PublicItem, tab: MediaTab) => void;
}) {
  return (
    <section className="pt-8">
      <h2 className="text-xl font-extrabold flex items-center gap-3" style={{ color: "var(--m-text)", ...poppins }}>
        From our kitchen
        <span className="h-px flex-1" style={{ background: "var(--m-border)" }} aria-hidden />
      </h2>
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
        {items.map((item) => {
          const src = item.storyVideoUrl || item.videoUrl;
          const tab: MediaTab = item.storyVideoUrl ? "story" : "spin";
          return (
            <button
              key={item.id}
              onClick={() => onOpen(item, tab)}
              className="relative shrink-0 snap-start w-40 h-60 sm:w-48 sm:h-72 rounded-2xl overflow-hidden border text-left transition-transform duration-200 hover:-translate-y-1"
              style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
              aria-label={`Watch ${item.name}`}
            >
              <video src={src} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata" />
              <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-black/75 to-transparent">
                <p className="text-white text-sm font-semibold leading-tight">{item.name}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: "var(--accent)" }}>
                  {currency.format(item.price)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Dish cards ---------- */

function DishCard({
  item,
  currency,
  soldOut,
  onOpen,
}: {
  item: PublicItem;
  currency: Intl.NumberFormat;
  soldOut: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={`group text-left rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 flex flex-col ${soldOut ? "opacity-60" : ""}`}
      style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}
    >
      <div className="relative m-3 mb-0 rounded-xl overflow-hidden aspect-[4/3]" style={{ background: "var(--m-raised)" }}>
        <Thumb item={item} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <MediaBadge item={item} />
        {soldOut && <SoldOutRibbon />}
      </div>
      <div className="p-4 flex-1 flex flex-col" style={poppins}>
        <h3 className="text-[17px] font-bold leading-snug" style={{ color: "var(--m-text)" }}>
          {item.name}
        </h3>
        {item.caption && (
          <p className="mt-0.5 text-xs italic truncate" style={{ color: "var(--accent)" }}>
            {item.caption}
          </p>
        )}
        {item.description && (
          <p className="mt-1.5 text-[13px] leading-relaxed line-clamp-2" style={{ color: "var(--m-faint)" }}>
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>
            {currency.format(item.price)}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border text-lg leading-none"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            aria-hidden
          >
            +
          </span>
        </div>
      </div>
    </button>
  );
}

function DishRow({
  item,
  currency,
  soldOut,
  onOpen,
}: {
  item: PublicItem;
  currency: Intl.NumberFormat;
  soldOut: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={`group w-full text-left flex gap-4 rounded-2xl p-3 border transition-all duration-200 hover:-translate-y-0.5 ${soldOut ? "opacity-60" : ""}`}
      style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}
    >
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl overflow-hidden" style={{ background: "var(--m-raised)" }}>
        <Thumb item={item} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <MediaBadge item={item} />
        {soldOut && <SoldOutRibbon />}
      </div>
      <div className="min-w-0 flex-1 py-1" style={poppins}>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[16px] font-bold truncate" style={{ color: "var(--m-text)" }}>
            {item.name}
          </h3>
          <span className="shrink-0 font-extrabold" style={{ color: "var(--accent)" }}>
            {currency.format(item.price)}
          </span>
        </div>
        {item.caption && (
          <p className="mt-0.5 text-xs italic truncate" style={{ color: "var(--accent)" }}>
            {item.caption}
          </p>
        )}
        {item.description && (
          <p className="mt-1 text-[13px] line-clamp-2" style={{ color: "var(--m-faint)" }}>
            {item.description}
          </p>
        )}
        <div className="mt-1.5 flex gap-2 text-[11px]" style={{ color: "var(--m-faint)" }}>
          {item.isVegetarian && <span className="text-green-500">● veg</span>}
          {item.isSpicy && <span className="text-red-500">● spicy</span>}
        </div>
      </div>
    </button>
  );
}

/* ---------- Sidebar icon ---------- */

const catIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

/* ---------- Full menu page ---------- */

export function MenuClient({
  restaurant,
}: {
  restaurant: PublicRestaurant & { categories: PublicCategory[] };
}) {
  const currency = useCurrency(restaurant.currency);
  const theme = THEMES[restaurant.theme] ?? THEMES.midnight;

  const categories = restaurant.categories.filter((c) => c.items.length > 0);
  const allItems = categories.flatMap((c) => c.items);

  const [stage, setStage] = useState<{ index: number; tab?: MediaTab } | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">(restaurant.layout === "list" ? "list" : "grid");
  const [vegOnly, setVegOnly] = useState(false);

  // Time-based state (serving windows, sold-out) activates after hydration.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const visibleCategories = categories
    .filter((c) => activeCat === "all" || c.id === activeCat)
    .map((c) => ({ ...c, items: vegOnly ? c.items.filter((i) => i.isVegetarian) : c.items }))
    .filter((c) => c.items.length > 0);

  const reelItems = restaurant.showReel
    ? allItems.filter((i) => i.storyVideoUrl || i.videoUrl).slice(0, 12)
    : [];

  const openItem = (item: PublicItem, tab?: MediaTab) => {
    const index = allItems.findIndex((i) => i.id === item.id);
    if (index >= 0) setStage({ index, tab });
  };

  const sidebarEntries = [
    { id: "all", name: "All Items", count: allItems.length },
    ...categories.map((c) => ({ id: c.id, name: c.name, count: c.items.length })),
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        ...(theme as React.CSSProperties),
        ["--accent" as string]: restaurant.accentColor || "#f0762e",
        background: "var(--m-bg)",
        color: "var(--m-text)",
      }}
    >
      <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" />

      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--m-bg) 88%, transparent)", borderColor: "var(--m-border)" }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 px-5 sm:px-8 py-4">
          <span className="flex items-center gap-3 min-w-0">
            {restaurant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover border-2 shrink-0"
                style={{ borderColor: "var(--accent)" }}
              />
            )}
            <span className="min-w-0">
              <span className="block text-lg font-extrabold truncate" style={poppins}>
                {restaurant.name}
              </span>
              {restaurant.caption && (
                <span className="block text-xs italic truncate" style={{ color: "var(--accent)" }}>
                  {restaurant.caption}
                </span>
              )}
            </span>
          </span>
          {restaurant.address && (
            <span className="hidden md:block text-xs text-right" style={{ color: "var(--m-faint)" }}>
              {restaurant.address}
              {restaurant.phone ? <><br />{restaurant.phone}</> : null}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pb-20 flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-60 shrink-0 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent)", ...poppins }}>
            Categories
          </p>
          <nav
            className="mt-4 rounded-2xl border p-2 space-y-1"
            style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
          >
            {sidebarEntries.map((entry) => {
              const active = activeCat === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setActiveCat(entry.id)}
                  className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold border transition-colors"
                  style={
                    active
                      ? { borderColor: "var(--accent)", color: "var(--m-text)", background: "color-mix(in srgb, var(--accent) 12%, transparent)" }
                      : { borderColor: "transparent", color: "var(--m-dim)" }
                  }
                >
                  <span style={{ color: active ? "var(--accent)" : "var(--m-faint)" }}>{catIcon}</span>
                  <span className="flex-1 text-left truncate" style={poppins}>{entry.name}</span>
                  <span className="text-xs" style={{ color: "var(--m-faint)" }}>{entry.count}</span>
                </button>
              );
            })}
          </nav>

          <div
            className="mt-6 rounded-2xl border p-5"
            style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
          >
            <p className="text-sm font-bold" style={{ ...poppins }}>
              Experience every detail in 3D
            </p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--m-faint)" }}>
              Rotate, zoom and explore each dish before you order. Tap any dish to open it.
            </p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Heading + view controls */}
          <div className="pt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold" style={poppins}>
                Our Full Menu
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--m-faint)" }}>
                Explore our delicious dishes in immersive 3D
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["grid", "Grid"],
                  ["list", "List"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setView(value)}
                  className="rounded-xl px-3.5 sm:px-4 py-2.5 text-sm font-semibold border transition-colors"
                  style={
                    view === value
                      ? { borderColor: "var(--accent)", color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }
                      : { borderColor: "var(--m-border)", color: "var(--m-dim)" }
                  }
                >
                  {label}
                  <span className="hidden sm:inline"> View</span>
                </button>
              ))}
              <button
                onClick={() => setVegOnly((v) => !v)}
                aria-pressed={vegOnly}
                className="rounded-xl px-3.5 sm:px-4 py-2.5 text-sm font-semibold border transition-colors"
                style={
                  vegOnly
                    ? { borderColor: "#4ade80", color: "#4ade80", background: "rgba(74,222,128,0.1)" }
                    : { borderColor: "var(--m-border)", color: "var(--m-dim)" }
                }
              >
                Veg only
              </button>
            </div>
          </div>

          {/* Category chips (mobile) */}
          <div className="lg:hidden mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {sidebarEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setActiveCat(entry.id)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm border transition-colors"
                style={
                  activeCat === entry.id
                    ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff", fontWeight: 600 }
                    : { borderColor: "var(--m-border)", color: "var(--m-dim)" }
                }
              >
                {entry.name}
              </button>
            ))}
          </div>

          {activeCat === "all" && !vegOnly && reelItems.length > 0 && (
            <KitchenReel items={reelItems} currency={currency} onOpen={openItem} />
          )}

          {visibleCategories.length === 0 && (
            <p className="text-center py-20" style={{ color: "var(--m-faint)" }}>
              {vegOnly ? "No vegetarian dishes in this section." : "This menu is being prepared. Check back soon."}
            </p>
          )}

          {visibleCategories.map((cat) => {
            const open = categoryOpen(cat, now);
            return (
              <section key={cat.id} className="pt-9">
                <h2 className="text-xl font-extrabold flex items-center gap-3" style={poppins}>
                  {cat.name}
                  {cat.availableFrom && cat.availableTo && (
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                      style={
                        open
                          ? { borderColor: "var(--accent)", color: "var(--accent)" }
                          : { borderColor: "var(--m-border)", color: "var(--m-faint)" }
                      }
                    >
                      {open ? "Serving now" : `Served ${cat.availableFrom}–${cat.availableTo}`}
                    </span>
                  )}
                  <span className="h-px flex-1" style={{ background: "var(--m-border)" }} aria-hidden />
                  <span className="text-xs font-normal" style={{ color: "var(--m-faint)" }}>
                    {cat.items.length} {cat.items.length === 1 ? "dish" : "dishes"}
                  </span>
                </h2>
                <div
                  className={`mt-4 ${
                    view === "grid"
                      ? "grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                      : "grid gap-3 grid-cols-1 xl:grid-cols-2"
                  } ${open ? "" : "opacity-50"}`}
                >
                  {cat.items.map((item) =>
                    view === "grid" ? (
                      <DishCard
                        key={item.id}
                        item={item}
                        currency={currency}
                        soldOut={isSoldOut(item, now)}
                        onOpen={() => openItem(item)}
                      />
                    ) : (
                      <DishRow
                        key={item.id}
                        item={item}
                        currency={currency}
                        soldOut={isSoldOut(item, now)}
                        onOpen={() => openItem(item)}
                      />
                    )
                  )}
                </div>
              </section>
            );
          })}

          {/* Bottom info bar */}
          <div
            className="mt-14 rounded-2xl border px-6 py-5 flex flex-wrap items-center gap-4"
            style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl border shrink-0"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
                <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
                <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
                <path d="M14 14h2.8v2.8H14zM17.8 17.8h2.7v2.7h-2.7z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1" style={poppins}>
              <p className="text-sm font-bold">Scanned the QR at your table?</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--m-faint)" }}>
                No app required. Just tap a dish and explore it in 3D.
              </p>
            </div>
            <span className="text-xs" style={{ color: "var(--m-faint)" }}>
              Powered by <span style={{ color: "var(--accent)" }}>Plate3D</span>
            </span>
          </div>
        </main>
      </div>

      {stage && (
        <DishStage
          key={allItems[stage.index]?.id}
          items={allItems}
          index={stage.index}
          currency={currency}
          now={now}
          initialTab={stage.tab}
          onNavigate={(index) => setStage({ index })}
          onClose={() => setStage(null)}
        />
      )}
    </div>
  );
}
