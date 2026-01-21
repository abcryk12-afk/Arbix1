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

async function fetchJsonSafe(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const res = await fetch(input, init);
    const data = await res.json().catch(() => null);
    return { res, data };
  } catch {
    return { res: null, data: null };
  }
}

export default function ThemeBoot() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        let userTheme: unknown = null;
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const { res: userRes, data: userData } = await fetchJsonSafe('/api/user/theme', {
              method: 'GET',
              cache: 'no-store',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (userRes && userRes.ok && userData?.success) {
              userTheme = userData?.themePreference;
            }
          }
        } catch {}

        if (userTheme === 'light' || userTheme === 'dark') {
          if (!cancelled) applyThemeToDocument(userTheme);
          return;
        }

        const { data } = await fetchJsonSafe('/api/public/site-theme', { cache: 'no-store' });
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
