'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/profile')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-400">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="col-span-2 space-y-2 md:col-span-1">
            <div className="text-sm font-semibold text-slate-100">Arbix</div>
            <p className="text-[11px] leading-relaxed">
              Automated arbitrage &amp; managed passive income platform with a
              structured referral model.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Quick Links</div>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="/about" className="hover:text-white hover:underline">
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/how-it-works"
                  className="hover:text-white hover:underline"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a href="/plans" className="hover:text-white hover:underline">
                  Investment Plans
                </a>
              </li>
              <li>
                <a
                  href="/testimonials"
                  className="hover:text-white hover:underline"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white hover:underline">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Legal</div>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a href="/terms" className="hover:text-white hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="hover:text-white hover:underline"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/aml-kyc"
                  className="hover:text-white hover:underline"
                >
                  AML Policy
                </a>
              </li>
              <li>
                <a
                  href="/risk-disclosure"
                  className="hover:text-white hover:underline"
                >
                  Risk Disclosure
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-sm font-semibold text-slate-100">
              Contact &amp; Support
            </div>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:support@arbix.space"
                  className="hover:text-white hover:underline"
                >
                  support@arbix.space
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="https://t.me/arbix_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline"
                >
                  @arbix_support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
            <p>© 2026 Arbix. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:text-slate-300 hover:underline">
                Terms
              </a>
              <a
                href="/privacy"
                className="hover:text-slate-300 hover:underline"
              >
                Privacy
              </a>
              <a
                href="/aml-kyc"
                className="hover:text-slate-300 hover:underline"
              >
                AML Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
