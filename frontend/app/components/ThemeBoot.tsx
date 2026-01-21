'use client';

import { useEffect } from 'react';

type SiteTheme = 'light' | 'dark';

function normalizeTheme(theme: unknown): SiteTheme {
  return theme === 'light' ? 'light' : 'dark';
}

function applyThemeToDocument(theme: unknown) {
  if (typeof document === 'undefined') return;
  const t = normalizeTheme(theme);
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
}

export default function ThemeBoot() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch('/api/public/site-theme', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const theme = data?.theme;
        if (!cancelled) applyThemeToDocument(theme);
      } catch {
        if (!cancelled) applyThemeToDocument('dark');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
