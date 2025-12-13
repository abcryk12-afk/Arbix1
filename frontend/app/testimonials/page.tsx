'use client';

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            TESTIMONIALS
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            What Users Say
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Community feedback about Arbix experience.
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-sm text-slate-300">“Simple onboarding and a clean dashboard.”</div>
              <div className="mt-4 text-xs text-slate-500">Verified user</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-sm text-slate-300">“Support responded fast and helped me understand the process.”</div>
              <div className="mt-4 text-xs text-slate-500">Verified user</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-sm text-slate-300">“Easy to register with referral. Looking forward to more features.”</div>
              <div className="mt-4 text-xs text-slate-500">Verified user</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
