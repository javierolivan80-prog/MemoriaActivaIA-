export default function PricingLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-background px-4 py-16 sm:py-20"
    >
      <span className="sr-only">Cargando planes...</span>
      <div className="mx-auto w-full max-w-5xl animate-pulse">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="h-10 w-56 rounded bg-surface-alt" />
            <div className="mt-4 h-4 w-full rounded bg-surface-alt" />
            <div className="mt-2 h-4 w-3/4 rounded bg-surface-alt" />
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="h-96 rounded-2xl bg-surface-alt" />
            <div className="h-96 rounded-2xl bg-surface-alt" />
          </div>
        </div>
      </div>
    </div>
  );
}
