"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "@/lib/portal";
import { Btn, ErrorNote, Field, inputCls } from "@/components/portal/ui";

/**
 * Two-step sign-up, matching the mobile app: 1) the account,
 * 2) the restaurant. Categories come next on the dashboard.
 */
export function RegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2 — restaurant
  const [rName, setRName] = useState("");
  const [rDescription, setRDescription] = useState("");
  const [rAddress, setRAddress] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rCurrency, setRCurrency] = useState("USD");

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.trim() !== confirm.trim()) {
      setError("Passwords do not match.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const { token } = await api.register(name.trim(), email.trim(), password.trim());
      setToken(token);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  const submitRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { restaurant } = await api.createRestaurant({
        name: rName.trim(),
        description: rDescription.trim(),
        address: rAddress.trim(),
        phone: rPhone.trim(),
        currency: rCurrency.trim().toUpperCase() || "USD",
      });
      router.replace(`/dashboard/${restaurant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the restaurant.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-poppins)" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[760px] rounded-full blur-[130px]" style={{ background: "rgba(240,118,46,0.12)" }} />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2.5">
            <Image src="/logo.png" alt="Plate3D" width={44} height={44} priority className="rounded-xl" />
            <span className="text-2xl font-extrabold tracking-wide text-ink">
              PLATE<span className="text-accent">3D</span>
            </span>
          </Link>

          {/* Step indicator */}
          <div className="mt-8 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider">
            <span className={step === 1 ? "text-accent" : "text-ink-faint"}>1 · Your account</span>
            <span className="h-px w-8 bg-navy-700" aria-hidden />
            <span className={step === 2 ? "text-accent" : "text-ink-faint"}>2 · Your restaurant</span>
          </div>

          {step === 1 ? (
            <>
              <h1 className="mt-6 text-center text-3xl font-extrabold text-ink">Start your free month</h1>
              <p className="mt-2 text-center text-sm text-ink-dim">Full access for 30 days. No card needed.</p>
              <form onSubmit={submitAccount} className="mt-8 space-y-4 rounded-[24px] border border-navy-700 bg-navy-900 p-7 sm:p-8">
                <Field label="Your name">
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Chef" className={inputCls} autoComplete="name" />
                </Field>
                <Field label="Email">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.com" className={inputCls} autoComplete="email" />
                </Field>
                <Field label="Password" hint="At least 8 characters.">
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} autoComplete="new-password" />
                </Field>
                <Field label="Confirm password">
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" className={inputCls} autoComplete="new-password" />
                </Field>
                <ErrorNote message={error} />
                <Btn type="submit" loading={busy} className="w-full">Continue</Btn>
                <p className="text-center text-xs text-ink-faint">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-accent">Sign in</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-center text-3xl font-extrabold text-ink">About your restaurant</h1>
              <p className="mt-2 text-center text-sm text-ink-dim">This becomes your public menu page — you can change everything later.</p>
              <form onSubmit={submitRestaurant} className="mt-8 space-y-4 rounded-[24px] border border-navy-700 bg-navy-900 p-7 sm:p-8">
                <Field label="Restaurant name">
                  <input required value={rName} onChange={(e) => setRName(e.target.value)} placeholder="The Copper Kettle" className={inputCls} />
                </Field>
                <Field label="Short description (optional)">
                  <input value={rDescription} onChange={(e) => setRDescription(e.target.value)} placeholder="Slow food, open fire." className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone (optional)">
                    <input value={rPhone} onChange={(e) => setRPhone(e.target.value)} placeholder="+94 77 123 4567" className={inputCls} />
                  </Field>
                  <Field label="Currency">
                    <input value={rCurrency} onChange={(e) => setRCurrency(e.target.value)} placeholder="USD" maxLength={8} className={inputCls} />
                  </Field>
                </div>
                <Field label="Address (optional)">
                  <input value={rAddress} onChange={(e) => setRAddress(e.target.value)} placeholder="12 Market Lane" className={inputCls} />
                </Field>
                <ErrorNote message={error} />
                <Btn type="submit" loading={busy} className="w-full">Create my restaurant</Btn>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
