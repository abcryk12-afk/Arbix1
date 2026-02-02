'use client';

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            TESTIMONIALS
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            What Users Say
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Community feedback about Arbix experience.
          </p>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-sm text-muted">“Simple onboarding and a clean dashboard.”</div>
              <div className="mt-4 text-xs text-muted">Verified user</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-sm text-muted">“Support responded fast and helped me understand the process.”</div>
              <div className="mt-4 text-xs text-muted">Verified user</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-6">
              <div className="text-sm text-muted">“Easy to register with referral. Looking forward to more features.”</div>
              <div className="mt-4 text-xs text-muted">Verified user</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
