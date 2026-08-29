export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-background px-4 py-16"
    >
      <span className="sr-only">Cargando panel...</span>
      <div className="mx-auto w-full max-w-4xl animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-surface-alt" />
          <div className="h-9 w-24 rounded-xl bg-surface-alt" />
        </div>

        <div className="mt-12">
          <div className="h-6 w-40 rounded bg-surface-alt" />
          <div className="mt-4 h-20 rounded-2xl bg-surface-alt" />
        </div>

        <div className="mt-12">
          <div className="h-6 w-36 rounded bg-surface-alt" />
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-48 rounded-2xl bg-surface-alt" />
            <div className="h-48 rounded-2xl bg-surface-alt" />
          </div>
        </div>
      </div>
    </div>
  );
}
