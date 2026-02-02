export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-page">
      <div className="relative flex flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute -inset-20 bg-theme-hero-overlay blur-3xl opacity-60" />

        <div className="relative flex flex-col items-center">
          <div className="relative h-20 w-20 rounded-[30px] border border-border bg-surface/70 shadow-theme-md flex items-center justify-center overflow-hidden">
            <div className="absolute inset-[3px] rounded-[26px] bg-theme-card" />
            <div className="relative h-10 w-10 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
          </div>

          <div className="mt-6 text-center space-y-1">
            <p className="text-xs font-semibold tracking-[0.35em] text-muted uppercase">
              Loading Admin Panel
            </p>
            <p className="text-sm text-muted">
              Preparing secure admin tools and analytics...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
