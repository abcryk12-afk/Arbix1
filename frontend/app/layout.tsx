import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import Header from "./components/Header";
import Footer from "./components/Footer";
import ThemeBoot from "./components/ThemeBoot";
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: "ArbiPro / Arbix",
  description: "Automated Arbitrage Trading + MLM Investment Platform",
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: 'black' },
    { media: '(prefers-color-scheme: light)', color: 'white' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-page text-fg">
        <Script
          id="arbix-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ok=function(v){return v==='light'||v==='dark'||v==='colorful';};var k='arbix_theme_override';var sk='arbix_site_theme';var s=localStorage.getItem(sk);var t=localStorage.getItem(k);var hasSite=ok(s);var hasOverride=ok(t);var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var next=hasSite?s:(hasOverride?t:(systemDark?'dark':'light'));document.documentElement.setAttribute('data-theme',next);document.documentElement.style.colorScheme=(next==='dark'?'dark':'light');}catch(e){}})();`,
          }}
        />
        <ThemeBoot />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
