"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Profit Plan", href: "#plans" },
    { name: "Education", href: "/education" },
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
        className="fixed top-4 right-4 z-50 rounded-lg bg-primary p-3 text-primary-fg shadow-theme-md hover:shadow-theme-lg md:hidden"
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
        <div className="fixed inset-0 z-40 bg-muted/70">
          {/* Menu Container */}
          <div className="flex h-full">
            {/* Close Area */}
            <div
              className="flex-1 bg-muted/50"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <div className="w-80 bg-surface p-6 shadow-theme-lg">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-heading">Menu</h2>
                <p className="text-sm text-muted">Navigate to any page</p>
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
                        ? "bg-primary text-primary-fg hover:shadow-theme-md"
                        : item.name === "Login"
                        ? "border border-border text-muted hover:border-border2"
                        : "text-muted hover:text-heading"
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </nav>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-border">
                <div className="space-y-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    SSL Secured
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-info" />
                    KYC Compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning" />
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
