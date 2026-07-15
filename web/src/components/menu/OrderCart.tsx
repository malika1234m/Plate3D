"use client";

import { useEffect, useState } from "react";

/**
 * Customer ordering — Pro menus only. Floating cart bar, order sheet with
 * quantities/table/notes, submission, and a ticket-style confirmation.
 * Prices shown are advisory; the server recomputes everything from the live menu.
 */

export type CartLine = {
  key: string; // itemId + sorted optionIds
  itemId: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  optionIds: string[];
  optionNames: string[];
};

export function cartKey(itemId: string, optionIds: string[]): string {
  return `${itemId}|${[...optionIds].sort().join(",")}`;
}

const cutlery = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M7 3v7a2 2 0 0 0 2 2v9M5 3v4M9 3v4M16 3c-1.5 1.5-2 3.5-2 6 0 2 .8 3 2 3v9M16 3v18" />
  </svg>
);

function LineThumb({ src }: { src: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />;
  }
  return (
    <span className="flex h-full w-full items-center justify-center" style={{ color: "var(--m-faint)" }} aria-hidden>
      {cutlery}
    </span>
  );
}

export function OrderCart({
  cart,
  currency,
  slug,
  restaurantName,
  onChangeQty,
  onClear,
}: {
  cart: CartLine[];
  currency: Intl.NumberFormat;
  slug: string;
  restaurantName: string;
  onChangeQty: (key: string, delta: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);

  const count = cart.reduce((s, l) => s + l.quantity, 0);
  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  // The sheet is a dialog: lock scroll, close on Escape.
  useEffect(() => {
    if (!open && !done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !placing) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, done, placing]);

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tableNumber: table,
          customerName: name,
          note,
          items: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity, optionIds: l.optionIds })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");
      setDone({ code: data.code, total: data.total });
      onClear();
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place the order.");
    } finally {
      setPlacing(false);
    }
  };

  const styleTag = (
    <style>{`
      @keyframes oc-rise { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
      @keyframes oc-pop { 0% { transform: scale(0.92); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes oc-draw { to { stroke-dashoffset: 0; } }
      @keyframes oc-bar { from { transform: translateY(70px); } to { transform: none; } }
      .oc-rise { animation: oc-rise 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
      .oc-pop { animation: oc-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
      .oc-bar { animation: oc-bar 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
      .oc-draw { stroke-dasharray: 26; stroke-dashoffset: 26; animation: oc-draw 0.5s 0.25s ease-out forwards; }
      @media (prefers-reduced-motion: reduce) {
        .oc-rise, .oc-pop, .oc-bar { animation: none; }
        .oc-draw { stroke-dashoffset: 0; animation: none; }
      }
    `}</style>
  );

  /* ---------- Confirmation: ticket ---------- */
  if (done) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-sm"
        style={{ background: "var(--m-scrim)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Order confirmed"
      >
        {styleTag}
        <div
          className="oc-pop w-full max-w-sm overflow-hidden rounded-[26px] border text-center"
          style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}
        >
          <div className="px-8 pt-9">
            <span
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(123,178,106,0.14)", border: "1px solid rgba(123,178,106,0.35)" }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7bb26a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path className="oc-draw" d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h3 className="mt-5 text-[22px] font-extrabold leading-tight" style={{ color: "var(--m-text)" }}>
              Order sent to the kitchen
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: "var(--m-dim)" }}>
              {restaurantName} is on it.
            </p>
          </div>

          {/* Ticket stub */}
          <div className="mx-8 mt-6 rounded-2xl border border-dashed px-6 py-5" style={{ borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)", background: "color-mix(in srgb, var(--accent) 6%, transparent)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--m-faint)" }}>
              Your order number
            </p>
            <p className="mt-1 text-5xl font-extrabold tracking-[0.18em]" style={{ color: "var(--accent)" }}>
              {done.code}
            </p>
          </div>

          <div className="px-8 pb-8 pt-4">
            <p className="text-sm font-semibold" style={{ color: "var(--m-text)" }}>
              Total {currency.format(done.total)}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--m-faint)" }}>
              Pay at the counter or when it arrives — show this number if staff asks.
            </p>
            <button
              onClick={() => {
                setDone(null);
                setOpen(false);
              }}
              className="mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white transition-transform hover:scale-[1.01]"
              style={{ background: "linear-gradient(100deg, var(--accent), #f5934f)" }}
            >
              Back to the menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) return null;

  return (
    <>
      {styleTag}

      {/* Floating cart bar */}
      {!open && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-4 pointer-events-none">
          <button
            onClick={() => setOpen(true)}
            className="oc-bar pointer-events-auto mx-auto flex w-full max-w-lg items-center justify-between rounded-full py-2 pl-2 pr-6 text-white shadow-2xl transition-transform hover:scale-[1.01]"
            style={{ background: "linear-gradient(100deg, var(--accent), #f5934f)", boxShadow: "0 12px 40px -8px color-mix(in srgb, var(--accent) 65%, transparent)" }}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8h12l1.2 12.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 8Z" />
                  <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
                </svg>
              </span>
              <span className="text-left">
                <span className="block text-[15px] font-extrabold leading-tight">View your order</span>
                <span className="block text-xs font-medium text-white/85">
                  {count} {count === 1 ? "item" : "items"} · pay at the venue
                </span>
              </span>
            </span>
            <span className="text-lg font-extrabold">{currency.format(total)}</span>
          </button>
        </div>
      )}

      {/* Order sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm"
          style={{ background: "var(--m-scrim)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Your order"
        >
          <div
            className="oc-rise w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border p-6 sm:p-7"
            style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: "var(--m-text)" }}>
                  Your order
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: "var(--m-faint)" }}>
                  {count} {count === 1 ? "item" : "items"} · {restaurantName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClear}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ borderColor: "var(--m-border)", color: "var(--m-faint)" }}
                >
                  Clear all
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--m-border)", color: "var(--m-dim)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lines */}
            <div className="mt-5 space-y-3">
              {cart.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center gap-3.5 rounded-2xl border p-3"
                  style={{ borderColor: "var(--m-border)", background: "var(--m-raised)" }}
                >
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--m-surface)" }}>
                    <LineThumb src={l.imageUrl} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold" style={{ color: "var(--m-text)" }}>
                      {l.name}
                    </p>
                    {l.optionNames.length > 0 && (
                      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--m-faint)" }}>
                        {l.optionNames.join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-bold" style={{ color: "var(--accent)" }}>
                      {currency.format(l.unitPrice * l.quantity)}
                      {l.quantity > 1 && (
                        <span className="ml-1.5 text-xs font-medium" style={{ color: "var(--m-faint)" }}>
                          {currency.format(l.unitPrice)} each
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2.5 rounded-full border px-1.5 py-1"
                    style={{ borderColor: "var(--m-border)", background: "var(--m-surface)" }}
                  >
                    <button
                      onClick={() => onChangeQty(l.key, -1)}
                      aria-label={l.quantity === 1 ? "Remove" : "Less"}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold"
                      style={{ color: "var(--m-dim)" }}
                    >
                      {l.quantity === 1 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h16M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 7l1 13h9l1-13M10 11v5m4-5v5" />
                        </svg>
                      ) : (
                        "−"
                      )}
                    </button>
                    <span className="w-5 text-center text-sm font-extrabold" style={{ color: "var(--m-text)" }}>
                      {l.quantity}
                    </span>
                    <button
                      onClick={() => onChangeQty(l.key, 1)}
                      aria-label="More"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Seat details */}
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--m-faint)" }}>
              Where are you seated?
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <input
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="Table number"
                maxLength={20}
                className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                style={{ background: "var(--m-raised)", borderColor: "var(--m-border)", color: "var(--m-text)" }}
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={80}
                className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                style={{ background: "var(--m-raised)", borderColor: "var(--m-border)", color: "var(--m-text)" }}
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note for the kitchen — allergies, no onions…"
                maxLength={300}
                className="col-span-2 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                style={{ background: "var(--m-raised)", borderColor: "var(--m-border)", color: "var(--m-text)" }}
              />
            </div>

            {/* Total */}
            <div
              className="mt-5 flex items-center justify-between rounded-2xl border border-dashed px-5 py-3.5"
              style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}
            >
              <span>
                <span className="block text-sm font-bold" style={{ color: "var(--m-text)" }}>
                  Total
                </span>
                <span className="block text-[11px]" style={{ color: "var(--m-faint)" }}>
                  Pay at the counter — cash or card
                </span>
              </span>
              <span className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>
                {currency.format(total)}
              </span>
            </div>

            {error && (
              <p className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "rgba(224,82,63,0.12)", color: "#e0523f" }}>
                {error}
              </p>
            )}

            <button
              onClick={placeOrder}
              disabled={placing}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-[15px] font-extrabold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{ background: "linear-gradient(100deg, var(--accent), #f5934f)" }}
            >
              {placing ? (
                <>
                  <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  Sending to the kitchen…
                </>
              ) : (
                <>
                  Send order to the kitchen
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16m-6-6 6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: "var(--m-faint)" }}>
              Your order goes straight to the restaurant. Payment happens at the venue.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
