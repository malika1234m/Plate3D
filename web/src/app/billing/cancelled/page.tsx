export default function BillingCancelled() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl text-ink" style={{ fontFamily: "var(--font-fraunces)" }}>
        Checkout cancelled
      </h1>
      <p className="mt-3 text-ink-dim max-w-md">
        No charge was made. You can upgrade any time from the Plate3D app.
      </p>
    </main>
  );
}
