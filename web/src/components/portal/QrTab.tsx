"use client";

import { useEffect, useState } from "react";
import { api, Restaurant } from "@/lib/portal";
import { Btn, Spinner } from "@/components/portal/ui";

export function QrTab({ restaurant }: { restaurant: Restaurant }) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

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

  const menuUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${restaurant.slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        Print this code and place it on tables, the counter, or your window. Customers scan it with their phone
        camera — no app needed — and your 3D menu opens instantly.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {qrUrl && (
          <a href={qrUrl} download={`${restaurant.slug}-qr.png`}>
            <Btn>Download QR (PNG)</Btn>
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
