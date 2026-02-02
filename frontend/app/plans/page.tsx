'use client';

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            INVESTMENT PLANS
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Choose a Plan
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Select a plan based on your goals. For exact returns and terms, please refer to the dashboard and official announcements.
          </p>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-lg font-semibold">Starter</div>
              <div className="mt-2 text-sm text-muted">For beginners getting started.</div>
              <a href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-fg transition hover:opacity-95">
                Get Started
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-lg font-semibold">Professional</div>
              <div className="mt-2 text-sm text-muted">Most popular for steady growth.</div>
              <a href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-fg transition hover:opacity-95">
                Get Started
              </a>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-lg font-semibold">Enterprise</div>
              <div className="mt-2 text-sm text-muted">For higher volume investors.</div>
              <a href="/auth/signup" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-fg transition hover:opacity-95">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
