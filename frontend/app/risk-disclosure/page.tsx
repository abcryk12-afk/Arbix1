export default function RiskDisclosurePage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            LEGAL
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Risk Disclosure
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            All investments carry some level of risk. This Risk Disclosure
            statement is designed to help you understand the main risks associated
            with using the Arbix platform and arbitrage trading.
          </p>
        </div>
      </section>

      {/* 1. No Guaranteed Profits */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">1. No Guaranteed Profits</h2>
          <p className="mt-3 text-slate-400">
            The Arbix platform does not guarantee any specific level of profit.
            Market conditions can change rapidly, and profit levels may increase or
            decrease over time. Past performance of the platform or its strategies
            does not guarantee future results.
          </p>
        </div>
      </section>

      {/* 2. Arbitrage Trading Risk */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">2. Arbitrage Trading Risk</h2>
          <p className="mt-3 text-slate-400">
            While arbitrage is generally considered lower-risk than speculative
            trading, it still involves several risks, including but not limited to:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Price gaps changing before trades are fully executed.</li>
            <li>• Limited liquidity on one or more exchanges.</li>
            <li>• Execution delays due to network or system load.</li>
            <li>• Unexpected market volatility or exchange outages.</li>
          </ul>
        </div>
      </section>

      {/* 3. Withdrawal & Liquidity Risk */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">3. Withdrawal &amp; Liquidity Risk</h2>
          <p className="mt-3 text-slate-400">
            During periods of high network traffic or unusual market activity,
            withdrawal processing times may be longer than usual. Additionally,
            congestion on blockchain networks or maintenance on payment channels may
            temporarily affect liquidity and transaction speed.
          </p>
        </div>
      </section>

      {/* 4. Referral / MLM Risk */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">4. Referral / MLM Risk</h2>
          <p className="mt-3 text-slate-400">
            Income from the Arbix referral program is not guaranteed. It depends on
            the actual activity and performance of referred users and your team
            structure. Users are strictly prohibited from making misleading or
            exaggerated claims while promoting the platform.
          </p>
        </div>
      </section>

      {/* 5. Investor Responsibility */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">5. Investor Responsibility</h2>
          <p className="mt-3 text-slate-400">
            You are responsible for your own investment decisions. You should never
            invest money you cannot afford to lose. We strongly recommend that you
            read all Terms &amp; Conditions, plan details and this Risk Disclosure
            carefully before investing.
          </p>
        </div>
      </section>

      {/* 6. Platform Liability Limitations */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">
            6. Platform Liability Limitations
          </h2>
          <p className="mt-3 text-slate-400">
            Arbix takes reasonable measures to manage risk, maintain security and
            keep the platform stable. However, it cannot eliminate all risks or
            prevent all losses. By using the platform, you accept that Arbix is not
            liable for losses arising from market events, third-party failures,
            technical issues or user decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
