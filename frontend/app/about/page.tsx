export default function AboutPage() {
  return (
    <div className="bg-page text-fg">
      {/* SECTION 1 — Hero / Intro */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            ABOUT ARBIX
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            About Arbix — Smart, Secure &amp; Automated Investment Platform
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            Arbix is an automated arbitrage trading platform designed to give every
            everyday investor access to a simple, low-risk and transparent way to
            earn passive income — without needing any technical trading skills.
          </p>
        </div>
      </section>

      {/* SECTION 2 — Mission & Vision */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-heading md:text-xl">Our Mission</h2>
              <p className="mt-2 text-sm text-muted">
                To give every person access to an automated, data-driven arbitrage
                system — so that passive income is no longer limited to professional
                traders only, but becomes available to everyone.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-heading md:text-xl">Our Vision</h2>
              <p className="mt-2 text-sm text-muted">
                To build a global, transparent and community-driven investment
                ecosystem where investors receive real daily trading performance,
                detailed reporting and a strong focus on long-term safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Our Technology */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            The Technology Behind Arbix
          </h2>
          <p className="mt-2 text-sm text-muted">
            Technology is at the core of everything we do — from trade execution to
            risk management.
          </p>

          <div className="mt-6 space-y-4 text-xs text-muted">
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <h3 className="text-sm font-semibold text-heading">
                AI-Based Arbitrage Engine
              </h3>
              <p className="mt-2 text-muted">
                The Arbix algorithm detects price gaps between different crypto
                exchanges and executes automated buy/sell orders. No manual trading
                is required from the user.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <h3 className="text-sm font-semibold text-heading">
                Real-Time Market Scanning
              </h3>
              <p className="mt-2 text-muted">
                The system watches the market 24/7, something a manual trader could
                never match in speed, discipline or consistency.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <h3 className="text-sm font-semibold text-heading">
                Enterprise-Level Security
              </h3>
              <p className="mt-2 text-muted">
                SSL encryption, secured databases, KYC and anti-fraud filters help
                protect your data and funds at all times.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-muted">
            Trading decisions are based purely on data — emotions are kept at zero,
            while consistency stays at one hundred percent.
          </p>
        </div>
      </section>

      {/* SECTION 4 — Why Choose Us */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Why Investors Trust Arbix
          </h2>
          <p className="mt-2 text-sm text-muted">
            A balanced set of reasons that combine technology, transparency and
            real-world performance.
          </p>

          <div className="mt-6 space-y-4 text-xs text-muted">
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Automated Arbitrage Trading</p>
              <p className="mt-2 text-muted">
                Zero skill needed — the system does the heavy lifting and works for
                you in the background.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Low-Risk Strategy</p>
              <p className="mt-2 text-muted">
                Focused on price-difference based trading rather than pure market
                speculation.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Transparent Reporting</p>
              <p className="mt-2 text-muted">
                Live profit statistics, daily trade logs and clear, exportable
                records.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Consistent Daily Updates</p>
              <p className="mt-2 text-muted">
                Profit calculations and trading snapshots are updated on a regular
                daily cycle.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Global Investor Community</p>
              <p className="mt-2 text-muted">
                Hundreds of active investors and a growing community help validate
                and stabilise the platform.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Flexible Investment Options</p>
              <p className="mt-2 text-muted">
                Start with a smaller amount, observe performance for yourself, and
                increase gradually if you choose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Our Team */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            The People Behind Arbix
          </h2>
          <p className="mt-2 text-sm text-muted">
            The Arbix core team is made up of financial analysts, software
            engineers, security experts and arbitrage strategists who continuously
            work to improve the system and minimise risk.
          </p>

          <div className="mt-6 grid gap-4 text-xs text-muted sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">CTO – Algorithm Specialist</p>
              <p className="mt-2 text-muted">
                Leads the design and optimisation of the arbitrage engine and
                trading logic.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">
                Head of Trading – 8+ Years in Arbitrage
              </p>
              <p className="mt-2 text-muted">
                Brings real-market experience to refine strategies and manage
                execution policies.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Compliance Officer – KYC / AML</p>
              <p className="mt-2 text-muted">
                Ensures regulatory alignment, strong KYC checks and anti-money
                laundering processes.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <p className="font-semibold text-heading">Community Success Lead</p>
              <p className="mt-2 text-muted">
                Focused on investor education, support and long-term community
                relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Compliance & Security */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">
            Security, Compliance &amp; Transparency
          </h2>
          <p className="mt-2 text-sm text-muted">
            A short overview of the standards that guide how we operate.
          </p>

          <ul className="mt-6 space-y-2 text-xs text-muted">
            <li>✔ SSL &amp; encrypted communication</li>
            <li>✔ Secured wallet infrastructure</li>
            <li>✔ KYC / AML verification</li>
            <li>✔ Anti-fraud monitoring tools</li>
            <li>✔ 24/7 system monitoring</li>
          </ul>

          <p className="mt-3 text-[11px] font-medium text-muted">
            Investor safety is our first priority — always.
          </p>
        </div>
      </section>

      {/* SECTION 7 — Our Commitment */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-heading md:text-xl">Our Commitment</h2>
          <p className="mt-2 text-sm text-muted">
            Arbix never makes unrealistic promises. Our focus is on long-term,
            consistent and sustainable earnings. We operate on the principles of
            transparency, security and responsible investing.
          </p>
          <p className="mt-3 text-sm font-semibold text-heading">
            Simple. Safe. Transparent.
          </p>
        </div>
      </section>

      {/* SECTION 8 — Light Stats / Achievements */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="grid gap-4 text-xs text-muted sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-center">
              <div className="text-2xl font-semibold text-success">1,000+</div>
              <div className="mt-1 text-[11px] text-muted">Active Investors</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-center">
              <div className="text-2xl font-semibold text-heading">800,000+</div>
              <div className="mt-1 text-[11px] text-muted">Trades Executed</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-4 text-center">
              <div className="text-2xl font-semibold text-info">Daily</div>
              <div className="mt-1 text-[11px] text-muted">Transparent Reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 — Final CTA */}
      <section className="bg-page">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="text-xl font-semibold text-heading md:text-2xl">
            Ready to Start Your Passive Income Journey?
          </h2>
          <p className="mt-3 text-sm text-muted">
            No experience needed — enjoy automated arbitrage and transparent
            results with Arbix.
          </p>

          <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row">
            <button className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-fg shadow-theme-sm transition hover:opacity-95">
              Join Arbix Today
            </button>
            <button className="rounded-lg border border-border px-5 py-2 text-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95">
              Talk to Our Support Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
