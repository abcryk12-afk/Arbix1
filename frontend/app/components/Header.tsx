"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/dashboard")) return null;

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Profit Plan", href: "/plans" },
    { name: "Testimonials", href: "/testimonials" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
    { name: "Login", href: "/auth/login" },
    { name: "Join Now", href: "/auth/signup" },
  ];

  return (
    <>
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
            <a href="/" className="hover:text-white">Home</a>
            <a href="/about" className="hover:text-white">About</a>
            <a href="/how-it-works" className="hover:text-white">How It Works</a>
            <a href="/plans" className="hover:text-white">Profit Plan</a>
            <a href="/testimonials" className="hover:text-white">Testimonials</a>
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

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg bg-primary p-2 text-white hover:bg-blue-500 md:hidden"
            aria-label="Toggle menu"
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
          <div className="border-t border-slate-800 bg-slate-950 md:hidden">
            <div className="px-4 py-4">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      item.name === "Join Now"
                        ? "bg-primary text-white hover:bg-blue-500"
                        : item.name === "Login"
                        ? "border border-slate-700 text-slate-200 hover:border-slate-500"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="border-t border-slate-900/60 bg-slate-950/80">
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
            <span className="hidden text-[10px] text-slate-500 md:inline">
              Trusted arbitrage engine for global investors
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
