export default function HowItWorksPage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            HOW IT WORKS
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            How Arbix Works – Simple, Automated &amp; Transparent
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            In less than 60 seconds, understand how the Arbix automated arbitrage
            system works to generate daily passive profits for you — without any
            trading knowledge or manual effort.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>No manual trading required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Data-driven arbitrage system</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Working Model */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            The 3-Step Arbix Profit Cycle
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A simple, repeatable cycle designed so that any investor can understand
            exactly how value is created.
          </p>

          <div className="mt-6 space-y-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold text-primary">Step 1 — Invest</div>
              <h3 className="mt-1 text-sm font-semibold text-slate-100">
                Start with Your Investment
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                Choose a profit plan according to your budget and fund your wallet
                using easy deposit methods. You can start with a small amount and
                scale up over time.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> KYC protected
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-sky-400" /> Secure deposits
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold text-primary">Step 2 — Automated Arbitrage Trading</div>
              <h3 className="mt-1 text-sm font-semibold text-slate-100">
                System Trades Automatically
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                The Arbix algorithm continuously scans multiple crypto exchanges for
                price gaps and automatically executes buy and sell trades when an
                opportunity appears. No manual action is required from you.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-sky-400" /> Data-driven decisions
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-amber-400" /> No emotional trading
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold text-primary">Step 3 — Earn Daily Passive Profit</div>
              <h3 className="mt-1 text-sm font-semibold text-slate-100">
                Profit Gets Credited Automatically
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                As trades close, the realised profit is allocated to your account and
                reflected in your dashboard on a daily basis. You control whether to
                withdraw or reinvest according to your plan rules.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> Daily updates
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-2 py-0.5">
                  <span className="h-1 w-1 rounded-full bg-fuchsia-400" /> Withdraw or reinvest
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Workflow Timeline */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Complete Arbix Workflow (Start → Profit)
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            See the full journey from registration to profit in a single, clear
            vertical timeline.
          </p>

          <ol className="mt-6 space-y-4 border-l border-slate-800 pl-4 text-xs text-slate-300">
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">User Registration &amp; KYC</p>
              <p className="mt-1 text-slate-400">
                Create your Arbix account and complete KYC verification so the
                platform can safely manage your funds and rewards.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Choose Investment Plan</p>
              <p className="mt-1 text-slate-400">
                Select a plan that matches your capital and profit expectations.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Deposit Funds to Wallet</p>
              <p className="mt-1 text-slate-400">
                Send funds to your secure Arbix wallet to activate the selected
                package.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Arbitrage Engine Scans Markets</p>
              <p className="mt-1 text-slate-400">
                The engine continuously looks for profitable price gaps across
                multiple exchanges.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Auto Trades Execute</p>
              <p className="mt-1 text-slate-400">
                When a qualifying gap appears, the system automatically executes
                buy/sell orders.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Daily Profit Allocation</p>
              <p className="mt-1 text-slate-400">
                Realised profits are distributed to investor wallets and reflected in
                dashboards.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="font-semibold text-slate-100">Withdraw or Reinvest</p>
              <p className="mt-1 text-slate-400">
                Investors can withdraw earnings or compound by reinvesting, depending
                on plan rules.
              </p>
            </li>
            <li className="relative">
              <span className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <p className="font-semibold text-slate-100">Optional Referral Bonuses</p>
              <p className="mt-1 text-slate-400">
                Team activity can generate extra referral bonuses on top of trading
                profits.
              </p>
            </li>
          </ol>

          <p className="mt-4 text-xs font-medium text-slate-400">
            Simple. Automated. Transparent.
          </p>
        </div>
      </section>

      {/* Why Arbitrage Trading Works */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Why Arbitrage Trading is Effective &amp; Low-Risk
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Understand the logic that powers the Arbix engine and why arbitrage is
            different from pure speculation.
          </p>

          <div className="mt-6 space-y-4 text-xs text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">1) Price Gaps = Profit</h3>
              <p className="mt-2 text-slate-400">
                Each crypto exchange can have slightly different prices. Arbix aims
                to capture these price gaps — buying where it&apos;s cheaper and
                selling where it&apos;s higher.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">2) No Market Prediction Needed</h3>
              <p className="mt-2 text-slate-400">
                Arbitrage is not about predicting the future price. It is based on a
                mathematical spread: buy low on one exchange, sell high on another
                — within a short window.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-sm font-semibold text-slate-100">3) Automated 24/7 Monitoring</h3>
              <p className="mt-2 text-slate-400">
                The system can watch markets 24/7 in a way that a manual trader
                never can, allowing more consistent capture of opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Arbitrage Example */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            A Simple Example of Arbitrage Trading
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A high-level example to show how the Arbix engine thinks about
            opportunities.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] text-slate-400">Exchange A</div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  BTC = $40,000
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Exchange B</div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  BTC = $40,180
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Potential Profit Gap</div>
                <div className="mt-1 text-sm font-semibold text-emerald-400">
                  $180 difference
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              In this simplified scenario, the system automatically buys BTC on
              Exchange A (cheaper) and sells on Exchange B (higher). The net
              positive spread, after fees and risk parameters, becomes part of the
              profit pool distributed to investors.
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              Disclaimer: All numbers above are illustrative only. Real-time values
              and spreads will always vary.
            </p>
          </div>
        </div>
      </section>

      {/* Today&apos;s Trading Snapshot */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Today&apos;s Trading Snapshot
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Below is a mini overview of today&apos;s arbitrage activity. Full reports
            are available after login in the &quot;Trade Logs&quot; section.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 text-xs">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Pair</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-right">Profit %</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                <tr>
                  <td className="px-3 py-2">BTC/USDT</td>
                  <td className="px-3 py-2">10:12 AM</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.42%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">ETH/USDT</td>
                  <td className="px-3 py-2">09:55 AM</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.35%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">LTC/USDT</td>
                  <td className="px-3 py-2">09:20 AM</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.28%</td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Closed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">XRP/USDT</td>
                  <td className="px-3 py-2">09:05 AM</td>
                  <td className="px-3 py-2 text-right text-emerald-400">0.25%</td>
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
              View Full Trading History (Login Required)
            </button>
            <span>
              Real trades, updated regularly, with 100% transparent records inside the
              member area.
            </span>
          </div>
        </div>
      </section>

      {/* Referral Program (Optional) */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Boost Your Earnings with Team Rewards (Optional)
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            With Arbix, you earn not only from trading profits but can also increase
            your income by building a team and unlocking extra bonuses. This is
            completely optional — trading profits alone can be enough.
          </p>

          <div className="mt-6 grid gap-4 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Direct Referral Bonus</p>
              <p className="mt-2 text-slate-400">
                Earn a bonus whenever someone joins the platform using your referral
                link.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Level-Based Rewards</p>
              <p className="mt-2 text-slate-400">
                Unlock earnings from multiple levels of your team as their activity
                grows.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Team Growth Income</p>
              <p className="mt-2 text-slate-400">
                Build a long-term income stream through consistent team performance
                and retention.
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            <span className="font-medium text-slate-200">
              Learn more inside the dashboard
            </span>{" "}
            once you create your account and start exploring the referral area.
          </div>
        </div>
      </section>

      {/* Security & Transparency Guarantees */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Your Investment is Protected with Enterprise-Grade Security
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Security and transparency are the foundation of the Arbix platform.
          </p>

          <div className="mt-6 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">SSL Encrypted Platform</p>
              <p className="mt-2 text-slate-400">
                All communication between your browser and the platform uses
                industry-standard encryption.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Secured Wallet System</p>
              <p className="mt-2 text-slate-400">
                Funds are stored in managed wallets with multiple layers of
                protection and monitoring.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">KYC / AML Compliance</p>
              <p className="mt-2 text-slate-400">
                Know-Your-Customer and Anti-Money-Laundering policies help keep the
                ecosystem clean and compliant.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Anti-Fraud Monitoring</p>
              <p className="mt-2 text-slate-400">
                Active monitoring systems flag unusual behaviour to protect both the
                platform and investors.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:col-span-2">
              <p className="font-semibold text-slate-100">Transparent Reporting</p>
              <p className="mt-2 text-slate-400">
                Daily logs, live statistics and trading snapshots provide a clear
                view of platform activity and your personal performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Ready to Start Your Passive Income Journey?
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            No trading knowledge required. Arbix combines automated arbitrage,
            security and clear reporting so you can focus on your goals.
          </p>

          <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row">
            <button className="rounded-lg bg-primary px-5 py-2 font-medium text-white shadow-sm hover:bg-blue-500">
              Start Earning with Arbix
            </button>
            <button className="rounded-lg border border-slate-700 px-5 py-2 text-slate-200 hover:border-slate-500">
              Talk to Our Support Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
