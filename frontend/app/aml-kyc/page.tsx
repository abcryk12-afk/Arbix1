export default function AmlKycPage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            LEGAL
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            AML / KYC Policy
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            This AML / KYC Policy explains how Arbix works to prevent money
            laundering, fraud and misuse of the platform, and how we verify user
            identities to maintain a safe environment.
          </p>
        </div>
      </section>

      {/* 1. Purpose of AML/KYC */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">1. Purpose of AML/KYC</h2>
          <p className="mt-3 text-slate-400">
            The primary goals of our AML (Anti-Money Laundering) and KYC
            (Know-Your-Customer) procedures are to:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Prevent money laundering and terrorist financing.</li>
            <li>• Detect and prevent fraud and other financial crimes.</li>
            <li>• Protect users and the platform from misuse and illegal activity.</li>
          </ul>
        </div>
      </section>

      {/* 2. Required Documents */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">2. Required Documents</h2>
          <p className="mt-3 text-slate-400">
            To complete KYC verification, users may be required to provide:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• A valid government-issued ID document (e.g. ID card or passport).</li>
            <li>• A live selfie or video verification to match the ID document.</li>
            <li>• Proof of address (such as a utility bill or bank statement), where required.</li>
          </ul>
        </div>
      </section>

      {/* 3. Verification Process */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">3. Verification Process</h2>
          <p className="mt-3 text-slate-400">
            The verification process typically includes the following steps:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Uploading the requested identification and supporting documents.</li>
            <li>• Automated checks to validate document authenticity and consistency.</li>
            <li>• Manual review by our compliance team if additional checks are needed.</li>
            <li>• Notification of approval, rejection or request for further information.</li>
          </ul>
        </div>
      </section>

      {/* 4. Restricted Activities */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">4. Restricted Activities</h2>
          <p className="mt-3 text-slate-400">
            The following activities are strictly prohibited on the Arbix platform:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Using fake names or false personal information.</li>
            <li>• Submitting forged, altered or stolen documents.</li>
            <li>• Accepting or sending third-party deposits without approval.</li>
            <li>• Engaging in suspicious wallet or transaction behaviour.</li>
          </ul>
        </div>
      </section>

      {/* 5. Transaction Monitoring */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">5. Transaction Monitoring</h2>
          <p className="mt-3 text-slate-400">
            Arbix continuously monitors transactions and account activity to detect
            unusual or high-risk patterns. This may include:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Real-time fraud and risk scoring systems.</li>
            <li>• Manual review of flagged or high-value transactions.</li>
            <li>• Temporary freezing of accounts when serious concerns arise.</li>
          </ul>
        </div>
      </section>

      {/* 6. Compliance Actions */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">6. Compliance Actions</h2>
          <p className="mt-3 text-slate-400">
            Where required, Arbix may take actions to comply with AML/KYC
            obligations, including but not limited to:
          </p>
          <ul className="mt-2 space-y-1 text-slate-400">
            <li>• Requesting additional documents or information from users.</li>
            <li>• Restricting deposits, withdrawals or account features.</li>
            <li>• Closing accounts that violate AML/KYC requirements.</li>
            <li>• Reporting suspicious activity to relevant authorities.</li>
          </ul>
        </div>
      </section>

      {/* 7. Contact for KYC Issues */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-slate-300 md:text-sm">
          <h2 className="text-base font-semibold text-slate-50 md:text-lg">
            7. Contact for KYC Issues
          </h2>
          <p className="mt-3 text-slate-400">
            If you have questions or concerns about verification or AML/KYC
            procedures, please contact our compliance team at:
          </p>
          <p className="mt-2 text-slate-400">compliance@arbix.cloud</p>
        </div>
      </section>
    </div>
  );
}
