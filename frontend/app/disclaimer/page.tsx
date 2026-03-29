export default function DisclaimerPage() {
  return (
    <div className="bg-page text-fg">
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            LEGAL
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Disclaimer
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            This page explains key limitations and general information about the
            content shared on the Arbix Cloud website and platform.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            1. Not Financial Advice
          </h2>
          <p className="mt-3 text-muted">
            The information on Arbix Cloud is provided for general and educational
            purposes. It is not financial, investment, legal, or tax advice. Please
            make decisions based on your own research and, if needed, professional
            guidance.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            2. No Guarantees
          </h2>
          <p className="mt-3 text-muted">
            Arbix Cloud does not guarantee any specific results or returns.
            Performance can change based on market conditions, fees, liquidity,
            execution timing, and other risks.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            3. Accuracy of Information
          </h2>
          <p className="mt-3 text-muted">
            We try to keep information accurate and up to date. However, we cannot
            guarantee that everything will always be complete, current, or suitable
            for your specific situation. Some details may change over time.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            4. Third-Party Links
          </h2>
          <p className="mt-3 text-muted">
            Our website may include links to third-party websites or services.
            Arbix Cloud does not control these sites and is not responsible for
            their content, policies, availability, or security. Please review their
            terms and policies directly.
          </p>
        </div>
      </section>

      <section className="bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            5. Contact
          </h2>
          <p className="mt-3 text-muted">
            If you have questions about this Disclaimer, you can contact us at:
          </p>
          <p className="mt-2 text-muted">support@arbix.cloud</p>
        </div>
      </section>
    </div>
  );
}
