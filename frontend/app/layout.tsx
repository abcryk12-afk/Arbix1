import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import Header from "./components/Header";
import Footer from "./components/Footer";
import ThemeBoot from "./components/ThemeBoot";
import { UiThemeProvider } from "./components/UiThemeProvider";
import PwaBoot from "./components/PwaBoot";
import InstallPrompt from "./components/InstallPrompt";
import type { ReactNode } from 'react';

type PublicSeoResponse = {
  success: boolean;
  global?: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    defaultKeywords?: string;
    openGraphTitle?: string;
    openGraphDescription?: string;
    ogImageUrl?: string;
    twitterCardType?: string;
    canonicalBase?: string;
    robotsIndex?: boolean;
    googleVerification?: string;
  };
};

type PublicSiteAssetsResponse = {
  success: boolean;
  assets?: {
    favicon?: { url?: string } | null;
    logo?: { url?: string } | null;
    ogImage?: { url?: string } | null;
  };
};

async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    return data as T;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "ArbiPro / Arbix";
  const fallbackDescription = "Automated Arbitrage Trading + MLM Investment Platform";

  const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';

  const [seo, siteAssets] = await Promise.all([
    safeFetchJson<PublicSeoResponse>(`${backendBase}/api/public/seo-settings`),
    safeFetchJson<PublicSiteAssetsResponse>(`${backendBase}/api/public/site-assets`),
  ]);

  const g = seo?.success ? (seo.global || {}) : {};
  const assets = siteAssets?.success ? (siteAssets.assets || {}) : {};

  const canonicalBase = typeof g.canonicalBase === 'string' ? g.canonicalBase.trim() : '';
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || '').trim();
  const metadataBaseCandidate = canonicalBase || envBase;
  const metadataBase = metadataBaseCandidate
    ? (() => {
        try {
          return new URL(metadataBaseCandidate);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const faviconUrl = typeof assets?.favicon?.url === 'string' ? assets.favicon.url : '';
  const ogImageUrl =
    (typeof g.ogImageUrl === 'string' && g.ogImageUrl.trim())
      ? g.ogImageUrl.trim()
      : (typeof assets?.ogImage?.url === 'string' ? assets.ogImage.url : '');

  const title = (typeof g.defaultMetaTitle === 'string' && g.defaultMetaTitle.trim()) ? g.defaultMetaTitle.trim() : fallbackTitle;
  const description = (typeof g.defaultMetaDescription === 'string' && g.defaultMetaDescription.trim()) ? g.defaultMetaDescription.trim() : fallbackDescription;
  const keywords = (typeof g.defaultKeywords === 'string' && g.defaultKeywords.trim()) ? g.defaultKeywords.trim() : '';

  const robotsIndex = g.robotsIndex !== false;
  const googleVerification = (typeof g.googleVerification === 'string' && g.googleVerification.trim()) ? g.googleVerification.trim() : '';

  const openGraphTitle = (typeof g.openGraphTitle === 'string' && g.openGraphTitle.trim()) ? g.openGraphTitle.trim() : title;
  const openGraphDescription = (typeof g.openGraphDescription === 'string' && g.openGraphDescription.trim()) ? g.openGraphDescription.trim() : description;
  const twitterCard = (typeof g.twitterCardType === 'string' && g.twitterCardType.trim()) ? g.twitterCardType.trim() : 'summary_large_image';

  const metadata: Metadata = {
    metadataBase,
    title,
    description,
    manifest: '/manifest.webmanifest',
    keywords: keywords ? keywords.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    icons: faviconUrl
      ? {
          icon: [
            { url: faviconUrl },
          ],
          apple: [
            { url: '/icon-maskable.svg' },
          ],
        }
      : undefined,
    robots: robotsIndex ? { index: true, follow: true } : { index: false, follow: false },
    verification: googleVerification ? { google: googleVerification } : undefined,
    openGraph: {
      type: 'website',
      title: openGraphTitle,
      description: openGraphDescription,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: twitterCard as any,
      title: openGraphTitle,
      description: openGraphDescription,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };

  return metadata;
}

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
    <html lang="en" data-theme="light" data-ui-theme="default">
      <body className="min-h-screen bg-page text-fg">
        <Script
          id="arbix-ui-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='arbix_ui_theme';var v=localStorage.getItem(k);var t=(v==='aurora_glass'||v==='aurora-glass'||v==='auroraglass')?'aurora_glass':'default';document.documentElement.setAttribute('data-ui-theme',t);}catch(e){}})();`,
          }}
        />
        <Script
          id="arbix-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ok=function(v){return v==='light'||v==='dark'||v==='colorful'||v==='aurora';};var k='arbix_theme_override';var sk='arbix_site_theme';var s=localStorage.getItem(sk);var t=localStorage.getItem(k);var hasSite=ok(s);var hasOverride=ok(t);var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var next=hasSite?s:(hasOverride?t:(systemDark?'dark':'light'));document.documentElement.setAttribute('data-theme',next);document.documentElement.style.colorScheme=(next==='dark'?'dark':'light');}catch(e){}})();`,
          }}
        />
        <ThemeBoot />
        <PwaBoot />
        <InstallPrompt />
        <UiThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </UiThemeProvider>
      </body>
    </html>
  );
}
