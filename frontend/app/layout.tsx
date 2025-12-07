import "./globals.css";
import type { ReactNode } from "react";
import { useState } from "react";

export const metadata = {
  title: "ArbiPro / Arbix",
  description: "Automated Arbitrage Trading + MLM Investment Platform",
};

function HeaderWithMobileMenu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Logo + brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            AX
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Arbix</div>
            <div className="text-[11px] text-slate-400">
              Automated Arbitrage &amp; Passive Income Platform
            </div>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 text-xs font-medium text-slate-300 md:flex">
          <a href="/" className="hover:text-white">
            Home
          </a>
          <a href="/about" className="hover:text-white">
            About
          </a>
          <a href="/how-it-works" className="hover:text-white">
            How It Works
          </a>
          <a href="#plans" className="hover:text-white">
            Profit Plan
          </a>
          <a href="#testimonials" className="hover:text-white">
            Testimonials
          </a>
          <a href="/faq" className="hover:text-white">
            FAQ
          </a>
        </nav>

        {/* Desktop CTAs + micro trust + help */}
        <div className="hidden items-center gap-3 text-xs md:flex md:text-sm">
          <a
            href="/contact"
            className="hidden items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 md:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Need Help?
          </a>
          <a
            href="/auth/login"
            className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500 md:inline-block"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            className="rounded-lg bg-primary px-3 py-1.5 font-medium text-white shadow-sm hover:bg-blue-500"
          >
            Join Now
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950/95 md:hidden">
          <div className="px-4 py-4 space-y-3">
            <a href="/" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              Home
            </a>
            <a href="/about" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              About
            </a>
            <a href="/how-it-works" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              How It Works
            </a>
            <a href="#plans" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              Profit Plan
            </a>
            <a href="#testimonials" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              Testimonials
            </a>
            <a href="/faq" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              FAQ
            </a>
            <a href="/contact" className="block py-2 text-sm font-medium text-slate-300 hover:text-white">
              Need Help?
            </a>
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <a
                href="/auth/login"
                className="block w-full rounded-lg border border-slate-700 px-4 py-2 text-center text-sm text-slate-200 hover:border-slate-500"
              >
                Login
              </a>
              <a
                href="/auth/signup"
                className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-500"
              >
                Join Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trust micro badges under header */}
      <div className="border-t border-slate-900/60 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-[10px] text-slate-400">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> SSL Secured
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> KYC Compliant
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> 24/7 Support
            </span>
          </div>
          <span className="hidden text-[10px] text-slate-500 md:inline">
            Trusted arbitrage engine for global investors
          </span>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="flex min-h-screen flex-col">
          <HeaderWithMobileMenu />

          <main className="flex-1 bg-slate-950">{children}</main>

          {/* Rich footer with links, legal and trust badges */}
          <footer className="border-t border-slate-800 bg-slate-950/95">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-400">
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-100">Arbix</div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Automated arbitrage &amp; managed passive income platform with a
                    structured referral model.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-200">
                    Quick Links
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href="/" className="hover:text-slate-200">
                      Home
                    </a>
                    <a href="/about" className="hover:text-slate-200">
                      About
                    </a>
                    <a href="/how-it-works" className="hover:text-slate-200">
                      How It Works
                    </a>
                    <a href="#plans" className="hover:text-slate-200">
                      Profit Plan
                    </a>
                    <a href="/faq" className="hover:text-slate-200">
                      FAQ
                    </a>
                    <a href="/contact" className="hover:text-slate-200">
                      Contact / Support
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-200">
                    Legal
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href="/terms" className="hover:text-slate-200">
                      Terms &amp; Conditions
                    </a>
                    <a href="/privacy" className="hover:text-slate-200">
                      Privacy Policy
                    </a>
                    <a href="/risk-disclosure" className="hover:text-slate-200">
                      Risk Disclosure
                    </a>
                    <a href="/aml-kyc" className="hover:text-slate-200">
                      AML / KYC Policy
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-200">
                    Contact &amp; Social
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Email: support@arbix.app</span>
                    <span>Location: Dubai • Karachi (Ops)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-slate-700 px-2 py-1 hover:border-slate-500">
                      Facebook
                    </span>
                    <span className="rounded-full border border-slate-700 px-2 py-1 hover:border-slate-500">
                      Instagram
                    </span>
                    <span className="rounded-full border border-slate-700 px-2 py-1 hover:border-slate-500">
                      YouTube
                    </span>
                    <span className="rounded-full border border-slate-700 px-2 py-1 hover:border-slate-500">
                      Telegram
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-900 pt-4 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3">
                  <span>SSL Secured</span>
                  <span>Encrypted Data</span>
                  <span>Verified Payments</span>
                </div>
                <div className="text-[11px]">
                  © {new Date().getFullYear()} Arbix. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
