"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminUser");
      if (!stored) return;
      const obj = JSON.parse(stored);
      setAdminName(obj?.name || obj?.email || "");
    } catch {
      // ignore
    }
  }, []);

  if ((pathname || "").startsWith("/admin/login")) return null;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navItems = [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Wallets", href: "/admin/user-wallets" },
    { label: "KYC", href: "/admin/kyc" },
    { label: "Withdrawals", href: "/admin/withdrawals" },
    { label: "Packages", href: "/admin/packages" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="relative flex items-center gap-2 group">
            <span className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-blue-500/20 via-emerald-500/10 to-blue-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30 animate-pulse [animation-duration:2.4s]">
              AX
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-50">
                Arbix Admin
              </div>
              <div className="text-[11px] text-slate-400">
                Control Center for your platform
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 text-[11px] text-slate-200 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "group relative overflow-hidden rounded-lg px-3 py-2 transition-colors duration-200 " +
                (isActive(item.href)
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-300 hover:bg-slate-900/70 hover:text-white")
              }
            >
              <span className="absolute inset-x-1 bottom-0 h-px translate-y-full bg-gradient-to-r from-transparent via-blue-500/70 to-transparent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right text-[11px] text-slate-300 md:block">
            <div className="font-medium text-slate-100">
              {adminName || "Admin"}
            </div>
            <div className="text-slate-500">Secure access</div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
              } catch {
              }
              router.push("/admin/login");
            }}
            className="hidden rounded-lg border border-rose-700/70 bg-rose-500/10 px-3 py-1.5 text-[11px] font-medium text-rose-100 transition-colors duration-150 hover:border-rose-500 hover:bg-rose-500/20 md:inline-flex"
          >
            Logout
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-[11px] text-slate-200 transition-colors duration-150 hover:border-slate-500 hover:bg-slate-900/60"
          >
            View Site
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-[10px] text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live admin environment
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Monitor users, wallets &amp; payouts in real-time
            </span>
          </div>
          <span className="hidden text-[10px] text-slate-500 md:inline">
            Admin activity is logged for security &amp; compliance.
          </span>
        </div>
      </div>
    </header>
  );
}
