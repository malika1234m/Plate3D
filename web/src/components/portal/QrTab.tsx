"use client";

import { useEffect, useState } from "react";
import { api, Restaurant } from "@/lib/portal";
import { Btn, Spinner } from "@/components/portal/ui";

/**
 * QR tab: shows the raw code, and downloads a branded, print-ready card —
 * restaurant name up top, "Designed by ApiNova Technologies" at the bottom,
 * so every printed table card also advertises us.
 */

const CARD_W = 1200;
const CARD_H = 1700;

async function buildPrintCard(qrUrl: string, restaurant: Restaurant, menuUrl: string): Promise<string> {
  await document.fonts.ready;
  // next/font hashes the family name — read the real one off the DOM.
  const family =
    getComputedStyle(document.body).getPropertyValue("--font-poppins").trim() ||
    getComputedStyle(document.body).fontFamily ||
    "sans-serif";

  const qr = new Image();
  qr.src = qrUrl;
  await new Promise((res, rej) => {
    qr.onload = res;
    qr.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // White card
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Accent top bar
  const grad = ctx.createLinearGradient(0, 0, CARD_W, 0);
  grad.addColorStop(0, "#f0762e");
  grad.addColorStop(1, "#f5934f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, 18);

  ctx.textAlign = "center";

  // Restaurant name (wraps to two lines when long)
  ctx.fillStyle = "#16130f";
  ctx.font = `800 76px ${family}`;
  const name = restaurant.name;
  const maxW = CARD_W - 160;
  let nameBottom = 190;
  if (ctx.measureText(name).width <= maxW) {
    ctx.fillText(name, CARD_W / 2, nameBottom);
  } else {
    const words = name.split(" ");
    let line1 = "";
    let line2 = "";
    for (const w of words) {
      if (!line2 && ctx.measureText(`${line1} ${w}`.trim()).width <= maxW) {
        line1 = `${line1} ${w}`.trim();
      } else {
        line2 = `${line2} ${w}`.trim();
      }
    }
    ctx.fillText(line1, CARD_W / 2, 160);
    ctx.fillText(line2, CARD_W / 2, 250, maxW);
    nameBottom = 250;
  }

  // Tagline
  ctx.fillStyle = "#f0762e";
  ctx.font = `700 44px ${family}`;
  ctx.fillText("Scan for our 3D menu", CARD_W / 2, nameBottom + 84);

  ctx.fillStyle = "#6f6a63";
  ctx.font = `400 30px ${family}`;
  ctx.fillText("Point your camera at the code — no app needed", CARD_W / 2, nameBottom + 140);

  // QR with rounded accent frame
  const qrSize = 760;
  const qrX = (CARD_W - qrSize) / 2;
  const qrY = nameBottom + 200;
  const pad = 34;
  const r = 40;
  ctx.beginPath();
  ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, r);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#f0762e";
  ctx.stroke();
  ctx.imageSmoothingEnabled = false; // QR modules must stay crisp
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;

  // Menu URL
  ctx.fillStyle = "#16130f";
  ctx.font = `600 34px ${family}`;
  ctx.fillText(menuUrl.replace(/^https?:\/\//, ""), CARD_W / 2, qrY + qrSize + pad + 76, maxW);

  // Footer: divider + our branding
  const footY = CARD_H - 150;
  ctx.strokeStyle = "#e8e2d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, footY);
  ctx.lineTo(CARD_W - 120, footY);
  ctx.stroke();

  ctx.font = `700 32px ${family}`;
  ctx.fillStyle = "#16130f";
  ctx.fillText("Powered by GoPlate", CARD_W / 2, footY + 62);
  ctx.font = `500 26px ${family}`;
  ctx.fillStyle = "#8a8378";
  ctx.fillText("Designed by ApiNova Technologies", CARD_W / 2, footY + 106);

  return canvas.toDataURL("image/png");
}

export function QrTab({ restaurant }: { restaurant: Restaurant }) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    let revoke = "";
    api
      .qrBlobUrl(restaurant.id)
      .then((u) => {
        revoke = u;
        setQrUrl(u);
      })
      .catch(() => {});
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [restaurant.id]);

  // Prefer the canonical public URL (baked in at build time) — printed cards
  // must always carry the real domain, whatever origin the owner browses from.
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const menuUrl = `${base.replace(/\/$/, "")}/r/${restaurant.slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadCard = async () => {
    setBuilding(true);
    try {
      const dataUrl = await buildPrintCard(qrUrl, restaurant, menuUrl);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${restaurant.slug}-table-card.png`;
      a.click();
    } finally {
      setBuilding(false);
    }
  };

  return (
    <section className="mt-8 mx-auto max-w-md text-center">
      {!restaurant.isPublished && (
        <p className="mb-6 rounded-xl border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-ink-dim">
          Your menu is still a <span className="font-bold text-ink">draft</span> — publish it in Settings before
          printing the QR.
        </p>
      )}
      {qrUrl ? (
        <div className="mx-auto inline-block rounded-3xl border-2 border-accent bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for ${restaurant.name}`} width={280} height={280} />
        </div>
      ) : (
        <Spinner />
      )}
      <p className="mt-5 break-all rounded-full border border-navy-700 bg-navy-900 px-5 py-2.5 text-sm font-semibold text-ink">
        {menuUrl}
      </p>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-dim">
        Download the print-ready table card — your restaurant&apos;s name on top, the QR in the middle — and place
        it on tables, the counter, or your window. Customers scan with their phone camera; no app needed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {qrUrl && (
          <Btn onClick={downloadCard} loading={building}>Download print card (PNG)</Btn>
        )}
        {qrUrl && (
          <a href={qrUrl} download={`${restaurant.slug}-qr.png`}>
            <Btn variant="secondary">Plain QR only</Btn>
          </a>
        )}
        <Btn variant="secondary" onClick={copy}>{copied ? "Copied!" : "Copy menu link"}</Btn>
        <a href={menuUrl} target="_blank" rel="noreferrer">
          <Btn variant="secondary">Open menu ↗</Btn>
        </a>
      </div>
    </section>
  );
}
