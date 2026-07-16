"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getToken, Billing, Restaurant } from "@/lib/portal";
import { Btn, ErrorNote, Field, inputCls, Modal, PortalHeader, Spinner } from "@/components/portal/ui";

export function DashboardClient() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([api.restaurants(), api.billing().catch(() => null)]);
      setRestaurants(r.restaurants);
      setBilling(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your restaurants.");
      setRestaurants([]);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    load();
  }, [router, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { restaurant } = await api.createRestaurant({ name: newName.trim() });
      router.push(`/dashboard/${restaurant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the restaurant.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-poppins)" }}>
      <PortalHeader active="dashboard" />
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">Your restaurants</h1>
            {billing && (
              <p className="mt-1 text-sm text-ink-dim">
                {billing.label} plan
                {billing.subscribed
                  ? " · active"
                  : billing.accessActive
                    ? ` · free trial, ${billing.trialDaysLeft} day${billing.trialDaysLeft === 1 ? "" : "s"} left`
                    : " · trial ended"}
                {" · "}
                <Link href="/account" className="text-accent">manage plan</Link>
              </p>
            )}
          </div>
          <Btn onClick={() => setCreating(true)}>+ New restaurant</Btn>
        </div>

        {billing && !billing.subscribed && !billing.accessActive && (
          <p className="mt-6 rounded-xl border border-navy-700 bg-navy-900 px-4 py-3 text-sm text-ink-dim">
            Your free month has ended — editing is paused, but your published menus stay live for customers.{" "}
            <Link href="/account" className="font-semibold text-accent">Choose a plan</Link> to keep going.
          </p>
        )}

        <div className="mt-4"><ErrorNote message={error} /></div>

        {restaurants === null ? (
          <Spinner />
        ) : restaurants.length === 0 ? (
          <div className="mt-16 rounded-[24px] border border-dashed border-navy-700 p-14 text-center">
            <p className="text-lg font-bold text-ink">No restaurants yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-dim">
              Create your first restaurant and your menu can be live — with a printable QR — in minutes.
            </p>
            <div className="mt-6">
              <Btn onClick={() => setCreating(true)}>Create your restaurant</Btn>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/${r.id}`}
                className="group rounded-[22px] border border-navy-700 bg-navy-900 p-6 transition-colors hover:border-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-ink">{r.name}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">/r/{r.slug}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                      r.isPublished ? "bg-emerald-500/15 text-emerald-400" : "bg-navy-800 text-ink-faint"
                    }`}
                  >
                    {r.isPublished ? "● LIVE" : "DRAFT"}
                  </span>
                </div>
                {r.description && <p className="mt-3 line-clamp-2 text-sm text-ink-dim">{r.description}</p>}
                <p className="mt-4 text-sm font-semibold text-accent group-hover:underline">Manage menu →</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {creating && (
        <Modal title="New restaurant" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-4">
            <Field label="Restaurant name" hint="You can add the details, theme, and address afterwards.">
              <input autoFocus required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="The Copper Kettle" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-3">
              <Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn type="submit" loading={busy}>Create</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
