export default function ElderlyDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-background px-4 py-10 sm:py-16"
    >
      <span className="sr-only">Cargando perfil...</span>
      <div className="mx-auto w-full max-w-3xl animate-pulse">
        <div className="h-4 w-28 rounded bg-surface-alt" />

        <div className="mt-6 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full bg-surface-alt" />
          <div>
            <div className="h-7 w-40 rounded bg-surface-alt" />
            <div className="mt-2 h-4 w-20 rounded bg-surface-alt" />
          </div>
        </div>

        <div className="mt-8 h-8 w-full rounded bg-surface-alt" />

        <div className="mt-8 h-40 rounded-2xl bg-surface-alt" />
      </div>
    </div>
  );
}
