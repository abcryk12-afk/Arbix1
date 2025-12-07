'use client';

export default function HomePage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section
        id="hero"
        className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          <div className="space-y-8 md:flex-row md:items-center md:gap-8">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Automated Arbitrage &amp; Passive Income Platform
              </p>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-5xl">
                Invest Smartly, Earn Passively
                <span className="block text-sm font-normal text-slate-300 sm:text-base md:text-lg">
                  Invest wisely and let an automated system grow your profits.
                </span>
              </h1>
              <p className="text-sm text-slate-300 md:text-base">
                Simply invest your capital and let the Arbix automated arbitrage system
                generate daily returns for you — with no prior trading experience
                required.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:text-sm">
                <a href="/auth/signup" className="rounded-lg bg-primary px-5 py-2.5 text-center font-medium text-white shadow-sm hover:bg-blue-500">
                  Start Earning Today
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-2.5 text-slate-200 hover:border-slate-500"
                >
                  See How It Works
                </a>
              </div>
              <div className="grid gap-4 text-[11px] text-slate-400 sm:grid-cols-3 sm:gap-6">
                <div>
                  <div className="font-semibold text-slate-200">No Trading Knowledge Needed</div>
                  <div>Fully managed arbitrage engine</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Automated &amp; Transparent</div>
                  <div>Daily profit updates and reporting</div>
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Referral + Team Bonuses</div>
                  <div>Build passive income through referrals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              Why Choose Arbix?
            </h2>
            <p className="mt-4 text-slate-400">
              Professional arbitrage trading with proven results
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Lightning Fast Trading</h3>
              <p className="mt-2 text-sm text-slate-400">
                Execute trades in milliseconds across multiple exchanges
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Proven Strategy</h3>
              <p className="mt-2 text-sm text-slate-400">
                Back-tested algorithms with consistent profit generation
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Secure & Insured</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your funds are protected with bank-level security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">$2.5M+</div>
              <div className="mt-2 text-sm text-slate-400">Total Trading Volume</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">15,000+</div>
              <div className="mt-2 text-sm text-slate-400">Active Traders</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">98.2%</div>
              <div className="mt-2 text-sm text-slate-400">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">24/7</div>
              <div className="mt-2 text-sm text-slate-400">Trading Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Ready to Start Your Journey?
          </h2>
          <p className="mt-4 text-slate-400">
            Join thousands of successful traders earning passive income with Arbix
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a href="/auth/signup" className="rounded-lg bg-primary px-8 py-3 font-medium text-white shadow-sm hover:bg-blue-500">
              Get Started Now
            </a>
            <a href="/auth/login" className="rounded-lg border border-slate-700 px-8 py-3 text-slate-200 hover:border-slate-500">
              Login to Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
