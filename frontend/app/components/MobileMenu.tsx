"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Profit Plan", href: "#plans" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
    { name: "Login", href: "/auth/login" },
    { name: "Join Now", href: "/auth/signup" },
  ];

  return (
    <div className="md:hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-mobile-menu-toggle
        className="fixed top-4 right-4 z-50 rounded-lg bg-primary p-3 text-white shadow-lg hover:bg-blue-500 md:hidden"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
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

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black">
          {/* Menu Container */}
          <div className="flex h-full">
            {/* Close Area */}
            <div
              className="flex-1 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <div className="w-80 bg-slate-950 p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Menu</h2>
                <p className="text-sm text-slate-400">Navigate to any page</p>
              </div>

              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-lg font-medium transition-colors ${
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

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-800">
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    SSL Secured
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    KYC Compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    24/7 Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
