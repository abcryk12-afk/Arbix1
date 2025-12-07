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
                  <div>Optional 3-level earning structure</div>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-0">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Today&apos;s Arbitrage Overview (Demo)</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    Live-style Preview
                  </span>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Total Investors</div>
                      <div className="mt-1 text-lg font-semibold">1,240+</div>
                      <div className="text-[10px] text-slate-500">Active members</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Total Deposits</div>
                      <div className="mt-1 text-lg font-semibold">$389k+</div>
                      <div className="text-[10px] text-slate-500">Across all plans</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                      <div className="text-[10px] text-slate-400">Total Payouts</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-400">$214k+</div>
                      <div className="text-[10px] text-slate-500">Since launch</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="mb-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sample Active Package</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        Demo
                      </span>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span>Package</span>
                        <span className="font-medium text-slate-100">Elite 5,000 USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily ROI</span>
                        <span className="font-medium text-emerald-400">2.5% / day</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration</span>
                        <span className="font-medium text-slate-100">120 days</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="mb-2 text-[11px] text-slate-400">Sample team earnings (per day)</div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>Level 1 (20%)</span>
                        <span className="text-emerald-400">$48.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 2 (10%)</span>
                        <span className="text-emerald-400">$21.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Level 3 (5%)</span>
                        <span className="text-emerald-400">$9.75</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Figures above are illustrative only. Actual numbers depend on live
                    market conditions and user allocations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            How Arbix Works
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            In just 3 simple steps your passive income journey begins: invest, let
            our automated arbitrage engine execute trades for you, and see profits
            update on a daily basis.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-2 text-xs font-semibold text-primary">1️⃣ Step 1: Invest</div>
              <h3 className="text-sm font-semibold text-slate-100">
                Choose Your Plan &amp; Deposit Funds
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Choose a profit plan that matches your budget and add funds using
                convenient deposit options.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-2 text-xs font-semibold text-primary">2️⃣ Step 2: Automated Arbitrage</div>
              <h3 className="text-sm font-semibold text-slate-100">
                Our System Trades for You
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                The Arbix algorithm scans multiple exchanges for arbitrage
                opportunities and automatically executes buy and sell trades.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-2 text-xs font-semibold text-primary">3️⃣ Step 3: Earn Passively</div>
              <h3 className="text-sm font-semibold text-slate-100">
                Profits Credited Automatically
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Your profits are updated in the system on a daily basis, and you can
                withdraw or reinvest them at any time.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-xs text-slate-400">
            <p>
              Want to boost your earnings? With the Arbix referral program you can
              build a team and earn extra bonuses as well. (Full details are
              available inside the dashboard.)
            </p>
            <a
              href="#plans"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              See Profit Plans
            </a>
          </div>
        </div>
      </section>

      {/* Why Arbix / Key Features */}
      <section id="why" className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Why Investors Choose Arbix
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Give investors clear reasons why this platform can be better and safer
            than others: automation, transparency, security and flexible options.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Fully Automated Trading</h3>
              <p className="mt-2 text-xs text-slate-400">
                No need to stare at charts or place manual trades — the arbitrage
                system handles everything for you.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Low-Risk Arbitrage Strategy</h3>
              <p className="mt-2 text-xs text-slate-400">
                Instead of pure market speculation, profits are generated from price
                differences — a smart, calculated approach.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Transparent Reporting</h3>
              <p className="mt-2 text-xs text-slate-400">
                Get access to live profit charts, daily trade snapshots and detailed
                reports — anytime, anywhere.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Global Investor Community</h3>
              <p className="mt-2 text-xs text-slate-400">
                A community-based system of thousands of active investors — with
                opportunities for learning, networking and growth.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Safe &amp; Secure Platform</h3>
              <p className="mt-2 text-xs text-slate-400">
                Enterprise-grade security with SSL encryption, secure wallets, KYC
                and multiple anti-fraud measures.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Flexible Investment Options</h3>
              <p className="mt-2 text-xs text-slate-400">
                Start with a smaller amount, observe the performance and gradually
                increase your investment.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-emerald-600/70 bg-emerald-950/20 p-4 md:col-span-3">
              <h3 className="text-sm font-semibold text-emerald-300">
                Multiple Income Streams
              </h3>
              <p className="mt-2 text-xs text-emerald-100/80">
                Increase your earning potential with trading profits plus referral
                rewards and team bonuses. (Details are available inside the member
                area.)
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <button className="rounded-lg bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-500">
              Join Arbix Now
            </button>
            <span className="text-slate-400">
              Simple signup • KYC protected • Trusted platform
            </span>
          </div>
        </div>
      </section>

      {/* Live Stats / Proof */}
      <section id="stats" className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Arbix at a Glance
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Live numbers that show real activity — social proof, scale and a
            high-level snapshot of system usage.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Total Profits Distributed</div>
              <div className="mt-2 text-xl font-semibold text-emerald-400">
                Rs 125,430,000+
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Updated in real-time</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Active Investors</div>
              <div className="mt-2 text-xl font-semibold text-slate-100">1,240+</div>
              <div className="mt-1 text-[11px] text-slate-500">From multiple countries</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Trades Executed</div>
              <div className="mt-2 text-xl font-semibold text-slate-100">850,000+</div>
              <div className="mt-1 text-[11px] text-slate-500">Since launch</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-[11px] text-slate-400">Avg Monthly ROI (Projected)</div>
              <div className="mt-2 text-xl font-semibold text-amber-300">X% – Y%</div>
              <div className="mt-1 text-[11px] text-slate-500">
                Not guaranteed. Performance may vary.
              </div>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-[11px] text-slate-500">
            Risk Note: All investments carry risk. The Arbix arbitrage system aims
            to minimise risk, but profits are never guaranteed. Past performance is
            not a guarantee of future results.
          </p>
        </div>
      </section>

      {/* Today&apos;s Trading Snapshot */}
      <section id="trading" className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Today&apos;s Trading Snapshot
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Every day Arbix uses arbitrage opportunities across different
            exchanges. Below is a demo view of a selected trading summary for
            today. Full detailed reports are available after login in the
            "Trade Logs" section.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 text-xs">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Pair</th>
                  <th className="px-3 py-2 text-left">Buy Exchange</th>
                  <th className="px-3 py-2 text-left">Sell Exchange</th>
                  <th className="px-3 py-2 text-right">Profit %</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                <tr>
                  <td className="px-3 py-2">10:12 AM</td>
                  <td className="px-3 py-2">BTC/USDT</td>
                  <td className="px-3 py-2">Exchange A</td>
                  <td className="px-3 py-2">Exchange B</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.45%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">09:55 AM</td>
                  <td className="px-3 py-2">ETH/USDT</td>
                  <td className="px-3 py-2">Exchange C</td>
                  <td className="px-3 py-2">Exchange A</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.38%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">09:33 AM</td>
                  <td className="px-3 py-2">BNB/USDT</td>
                  <td className="px-3 py-2">Exchange B</td>
                  <td className="px-3 py-2">Exchange D</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.41%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">09:05 AM</td>
                  <td className="px-3 py-2">XRP/USDT</td>
                  <td className="px-3 py-2">Exchange D</td>
                  <td className="px-3 py-2">Exchange A</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.36%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <button className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:border-slate-500">
              View Full Trading History
            </button>
            <span>
              All trades are executed by our automated engine based on live market
              spreads. No manual intervention, no emotional trading — pure
              data-driven arbitrage.
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="border-b border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900"
      >
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            What Our Investors Say
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            In MLM and investment, trust is everything. The opinions below are demo
            placeholders and can later be replaced with real user data.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-xs">
              <p className="text-slate-200">
                "I started with a small amount; now the profits look stable and
                seeing the daily trading snapshot in the dashboard has increased my
                confidence."
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-100">Ali R., Karachi</div>
                <div>Investor • Elite Plan</div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-xs">
              <p className="text-slate-200">
                "I had no trading experience and had never done MLM, but Arbix made
                everything simple — I now earn both passive income and referral
                income with full clarity."
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-100">Sana M., Dubai</div>
                <div>Investor • Referral Leader</div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-xs">
              <p className="text-slate-200">
                "Every week I make a partial withdrawal and reinvest the remaining
                amount. So far the experience has been very positive and the
                reporting is clear."
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-100">Hira K., London</div>
                <div>Investor • Growth Plan</div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            All testimonials are from real users. Results may vary from person to
            person depending on plan, time, and market conditions.
          </p>
        </div>
      </section>

      {/* Final Call-to-Action */}
      <section id="contact" className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-50 md:text-3xl">
              Start Earning Today – Join Our Investor Community
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              No trading experience required. Automated, secure and fully managed
              arbitrage system.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <button className="rounded-lg bg-primary px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-500">
              Get Started Now
            </button>
            <button className="rounded-lg border border-slate-700 px-5 py-2 text-slate-200 hover:border-slate-500">
              Talk to Our Support Team
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>KYC Verified Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Transparent Profit Reporting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Flexible Investment Options</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
