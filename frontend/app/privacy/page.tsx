export default function PrivacyPage() {
  return (
    <div className="bg-page text-fg">
      {/* Hero */}
      <section className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            LEGAL
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted md:text-base">
            We value your privacy and protect your data with advanced security
            protocols. This Privacy Policy explains what information we collect, how
            we use it and how we keep it secure.
          </p>
        </div>
      </section>

      {/* 1. Information We Collect */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">1. Information We Collect</h2>
          <p className="mt-3 text-muted">
            Depending on how you use the Arbix platform, we may collect the
            following types of information:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• Basic identity details (name, date of birth).</li>
            <li>• Contact information (email address, phone number).</li>
            <li>• KYC documents such as ID/Passport and, where required, proof of address.</li>
            <li>• Payment and wallet information used for deposits and withdrawals.</li>
            <li>• Technical data such as IP address, device information and browser type.</li>
            <li>• Login history and activity logs for security and auditing.</li>
          </ul>
        </div>
      </section>

      {/* 2. How We Use Your Information */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">2. How We Use Your Information</h2>
          <p className="mt-3 text-muted">
            Your information is used solely to operate and improve the platform and
            to comply with legal requirements. Common uses include:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• Account registration, verification and KYC checks.</li>
            <li>• Processing deposits, withdrawals and other transactions.</li>
            <li>• Generating trading and profit reports for your account.</li>
            <li>• Ensuring security, fraud prevention and regulatory compliance.</li>
            <li>• Communicating important updates, notifications and support messages.</li>
          </ul>
        </div>
      </section>

      {/* 3. Data Protection Measures */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">3. Data Protection Measures</h2>
          <p className="mt-3 text-muted">
            We implement multiple layers of technical and organisational security to
            protect your personal data, including:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• SSL/TLS encryption for all communication between you and our servers.</li>
            <li>• Encrypted databases for storing sensitive information.</li>
            <li>• Optional two-factor authentication (2FA), where supported.</li>
            <li>• Anti-fraud systems and continuous security monitoring.</li>
          </ul>
        </div>
      </section>

      {/* 4. Cookies & Tracking */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">4. Cookies &amp; Tracking</h2>
          <p className="mt-3 text-muted">
            The Arbix platform may use cookies and similar technologies to enhance
            your experience and to understand how the platform is used. This may
            include:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• Session cookies to keep you logged in securely.</li>
            <li>• Analytics cookies to measure usage and improve user experience.</li>
            <li>• Basic behaviour tracking to detect unusual or suspicious activity.</li>
          </ul>
        </div>
      </section>

      {/* 5. Sharing of Information */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">5. Sharing of Information</h2>
          <p className="mt-3 text-muted">
            We do not sell your personal information. We may share limited data with
            trusted third parties only when necessary, such as:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• Compliance authorities, when required by law or regulation.</li>
            <li>• Payment processors to complete deposits and withdrawals.</li>
            <li>• Security and anti-fraud partners that help protect the platform.</li>
          </ul>
        </div>
      </section>

      {/* 6. User Rights */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">6. User Rights</h2>
          <p className="mt-3 text-muted">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• Access the personal data we hold about you.</li>
            <li>• Request corrections to inaccurate or incomplete information.</li>
            <li>
              • Request deletion of certain data, subject to legal and regulatory
              retention requirements (for example, KYC and transaction records).
            </li>
          </ul>
        </div>
      </section>

      {/* 7. Data Retention */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">7. Data Retention</h2>
          <p className="mt-3 text-muted">
            We keep your data only for as long as necessary to fulfil the purposes
            described in this Privacy Policy and to meet legal or regulatory
            obligations. For example:
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>• KYC records may be stored for several years as required by law.</li>
            <li>• Trading and transaction logs may be retained for audit and dispute resolution.</li>
          </ul>
        </div>
      </section>

      {/* 8. Third-Party Links */}
      <section className="border-b border-border bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">8. Third-Party Links</h2>
          <p className="mt-3 text-muted">
            The Arbix platform may contain links to third-party websites or
            services. We are not responsible for the content, security or privacy
            practices of those third parties. You should review their policies
            separately.
          </p>
        </div>
      </section>

      {/* 9. Contact for Privacy Issues */}
      <section className="bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-10 text-xs text-muted md:text-sm">
          <h2 className="text-base font-semibold text-heading md:text-lg">
            9. Contact for Privacy Issues
          </h2>
          <p className="mt-3 text-muted">
            If you have any questions or concerns about how your data is handled,
            please contact us at:
          </p>
          <p className="mt-2 text-muted">privacy@arbix.com</p>
        </div>
      </section>
    </div>
  );
}
