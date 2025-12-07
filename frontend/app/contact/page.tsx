export default function ContactPage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* SECTION 1 — Hero / Intro */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            SUPPORT
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            We&apos;re Here to Help — Contact Arbix Support
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            If you have any questions about investments, trading, withdrawals or
            your account, our Support team is available 24/7 to assist you.
          </p>
        </div>
      </section>

      {/* SECTION 2 — Quick Support Blocks */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Quick Support Options
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose one of the primary support channels below to get help as fast as
            possible.
          </p>

          <div className="mt-6 space-y-4 text-xs text-slate-300">
            {/* Live Chat */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Live Chat Support
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Immediate assistance from our support agents
              </p>
              <p className="mt-2 text-slate-400">
                Immediate replies with an average response time of 2–5 minutes.
              </p>
              <button className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500">
                Start Live Chat
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                (Developers: attach your live chat widget or third-party chat here.)
              </p>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                WhatsApp Support
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Fast support, even on the go
              </p>
              <p className="mt-2 text-slate-400">
                Convenient customer service with the option to send voice notes and
                screenshots for quicker resolution.
              </p>
              <button className="mt-3 inline-flex items-center justify-center rounded-lg border border-emerald-500 px-4 py-2 text-xs font-medium text-emerald-300 hover:border-emerald-400">
                Chat on WhatsApp
              </button>
            </div>

            {/* Email */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                Email Support
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Detailed queries and compliance matters
              </p>
              <p className="mt-2 text-slate-400">
                Ideal for verification issues, formal documentation and
                compliance-related questions.
              </p>
              <a
                href="mailto:support@arbix.com"
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
              >
                support@arbix.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Contact Form */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Send Us a Message
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Prefer to contact us via form? Fill in your details below and our team
            will get back to you as soon as possible.
          </p>

          <form className="mt-6 space-y-4 text-xs text-slate-300">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="subject">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                defaultValue="account"
              >
                <option value="account">Account Issue</option>
                <option value="deposit">Deposit / Withdrawal</option>
                <option value="technical">Technical Support</option>
                <option value="kyc">KYC / Verification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Describe your question or issue in a few lines"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              Submit Request
            </button>

            <p className="mt-2 text-[10px] text-slate-500">
              We never share your information with third parties. Your data is used
              only to support and improve your experience with Arbix.
            </p>
          </form>
        </div>
      </section>

      {/* SECTION 4 — Support Categories */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Support Categories
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Quickly find the type of help you need, even before opening a support
            ticket.
          </p>

          <div className="mt-6 grid gap-4 text-xs text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Account Support</p>
              <p className="mt-2 text-slate-400">
                Login issues, password reset, account access and KYC guidance.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Investment &amp; Trading</p>
              <p className="mt-2 text-slate-400">
                Plan selection, profit updates and trading snapshot information.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Withdrawals</p>
              <p className="mt-2 text-slate-400">
                Withdrawal timing, fees, wallet verification and related queries.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-slate-100">Compliance</p>
              <p className="mt-2 text-slate-400">
                KYC/AML, identity verification and security concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Corporate Information */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Corporate Information
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A brief overview of the company behind the Arbix platform.
          </p>

          <div className="mt-4 space-y-1 text-xs text-slate-300">
            <p>
              <span className="font-semibold text-slate-100">Registered Business Name:</span>{' '}
              Arbix Technologies (placeholder)
            </p>
            <p>
              <span className="font-semibold text-slate-100">Location:</span>{' '}
              Dubai • London • Karachi (city-level only, for illustration)
            </p>
            <p>
              <span className="font-semibold text-slate-100">Support Hours:</span> 24/7
            </p>
            <p>
              <span className="font-semibold text-slate-100">Compliance Email:</span>{' '}
              compliance@arbix.com
            </p>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Note: Detailed legal and registered address information is available in
            the Terms &amp; Conditions section, following industry best practice.
          </p>
        </div>
      </section>

      {/* SECTION 6 — Trust & Security Notes */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Your Security is Our Priority
          </h2>
          <div className="mt-4 space-y-2 text-xs text-slate-300">
            <p>✔ SSL encrypted communication</p>
            <p>✔ KYC / AML compliant onboarding</p>
            <p>✔ Active anti-fraud monitoring</p>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            The Arbix system uses enterprise-grade security protocols to help
            protect every investor&apos;s data and funds.
          </p>
        </div>
      </section>

      {/* SECTION 7 — Final CTA */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="text-xl font-semibold text-slate-50 md:text-2xl">
            Need Immediate Help?
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Our team is ready to guide you through any question or issue you may
            have.
          </p>
          <button className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500">
            Start Live Chat Now
          </button>
        </div>
      </section>
    </div>
  );
}
