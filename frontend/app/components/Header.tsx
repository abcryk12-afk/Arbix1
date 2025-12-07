"use client";

import { useState } from "react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          {/* Mobile menu button - Left side on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Logo + brand - Center on mobile, left on desktop */}
          <div className="flex items-center gap-2 md:justify-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              AX
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight">Arbix</div>
              <div className="text-[11px] text-slate-400">
                Automated Arbitrage &amp; Passive Income Platform
              </div>
            </div>
            <div className="sm:hidden">
              <div className="text-sm font-semibold tracking-tight">Arbix</div>
            </div>
          </div>

          {/* Mobile CTAs - Right side on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href="/auth/login"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500"
            >
              Login
            </a>
            <a
              href="/auth/signup"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              Join
            </a>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-5 text-xs font-medium text-slate-300 md:flex">
            <a href="/" className="hover:text-white">Home</a>
            <a href="/about" className="hover:text-white">About</a>
            <a href="/how-it-works" className="hover:text-white">How It Works</a>
            <a href="#plans" className="hover:text-white">Profit Plan</a>
            <a href="#testimonials" className="hover:text-white">Testimonials</a>
            <a href="/faq" className="hover:text-white">FAQ</a>
          </nav>

          {/* Desktop CTAs */}
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
        </div>

        {/* Mobile slide-out sidebar menu */}
        <div
          className={`fixed inset-0 z-50 md:hidden ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-72 bg-slate-950 shadow-xl">
            <div className="flex h-full flex-col">
              {/* Sidebar header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                    AX
                  </div>
                  <span className="text-sm font-semibold text-white">Arbix</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <a
                    href="/"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </a>
                  <a
                    href="/about"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </a>
                  <a
                    href="/how-it-works"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    How It Works
                  </a>
                  <a
                    href="#plans"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Profit Plan
                  </a>
                  <a
                    href="#testimonials"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Testimonials
                  </a>
                  <a
                    href="/faq"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    FAQ
                  </a>
                  <a
                    href="/contact"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                  </a>
                </div>
              </nav>

              {/* Sidebar footer with auth buttons */}
              <div className="border-t border-slate-800 p-4">
                <div className="space-y-2">
                  <a
                    href="/auth/login"
                    className="block w-full rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm font-medium text-slate-200 hover:border-slate-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </a>
                  <a
                    href="/auth/signup"
                    className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Join Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Trust badges - Only show on desktop */}
      <div className="hidden border-t border-slate-900/60 bg-slate-950/80 md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] text-slate-400">
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
          <span className="text-[10px] text-slate-500">
            Trusted arbitrage engine for global investors
          </span>
        </div>
      </div>
    </>
  );
}
