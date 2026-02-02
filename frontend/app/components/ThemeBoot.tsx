'use client';

import { useEffect } from 'react';

type SiteTheme = 'light' | 'dark' | 'colorful';
type SystemTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'arbix_theme_override';
const SITE_THEME_STORAGE_KEY = 'arbix_site_theme';
const THEME_EVENT_NAME = 'arbix-theme-change';

function normalizeTheme(theme: unknown): SiteTheme | null {
  if (theme === 'light' || theme === 'dark' || theme === 'colorful') return theme;
  return null;
}

function themeToColorScheme(theme: SiteTheme): SystemTheme {
  return theme === 'dark' ? 'dark' : 'light';
}

function applyThemeToDocument(theme: unknown) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeTheme(theme);
  const t = normalized || getSystemTheme();
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = themeToColorScheme(t);
}

function readStoredTheme(): SiteTheme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'colorful') return raw;
    return null;
  } catch {
    return null;
  }
}

function storeTheme(theme: unknown) {
  try {
    const t = normalizeTheme(theme);
    if (!t) return;
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
  }
}

function clearStoredTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
  }
}

function storeSiteTheme(theme: SiteTheme) {
  try {
    localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  } catch {
  }
}

function clearSiteTheme() {
  try {
    localStorage.removeItem(SITE_THEME_STORAGE_KEY);
  } catch {
  }
}

function getSystemTheme(): SystemTheme {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
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

    let hasSiteTheme = false;
    let siteTheme: SiteTheme | null = null;

    let hasServerTheme = false;
    let serverTheme: SiteTheme | null = null;

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const theme = detail?.theme;
      const persist = detail?.persist;
      const scope = detail?.scope;
      if (!cancelled) {
        if (scope === 'site') {
          hasSiteTheme = true;
          siteTheme = normalizeTheme(theme);

          if (siteTheme) {
            storeSiteTheme(siteTheme);
            applyThemeToDocument(siteTheme);
            return;
          }

          clearSiteTheme();

          if (hasServerTheme && serverTheme) {
            applyThemeToDocument(serverTheme);
            return;
          }

          const stored = readStoredTheme();
          if (stored) {
            applyThemeToDocument(stored);
            return;
          }

          applyThemeToDocument(getSystemTheme());
          return;
        }

        if (hasSiteTheme && siteTheme) {
          applyThemeToDocument(siteTheme);
          return;
        }

        if (persist === 'clear' && (theme === null || theme === undefined || theme === '' || theme === 'default' || theme === 'system')) {
          clearStoredTheme();
          applyThemeToDocument(getSystemTheme());
          return;
        }

        applyThemeToDocument(theme);
        if (persist === 'override') storeTheme(theme);
        if (persist === 'clear') clearStoredTheme();
      }
    };

    const onSystemThemeChange = () => {
      if (cancelled) return;

      if (hasSiteTheme && siteTheme) return;

      if (hasServerTheme && serverTheme) return;

      const stored = readStoredTheme();
      if (stored) return;

      applyThemeToDocument(getSystemTheme());
    };

    window.addEventListener(THEME_EVENT_NAME, onThemeChange);

    const run = async () => {
      try {
        const { res: siteRes, data: siteData } = await fetchJsonSafe('/api/public/site-theme', {
          method: 'GET',
          cache: 'no-store',
        });

        if (siteRes && siteRes.ok && siteData?.success) {
          const normalized = normalizeTheme(siteData?.theme);
          hasSiteTheme = true;
          siteTheme = normalized;
          if (normalized) {
            if (!cancelled) {
              storeSiteTheme(normalized);
              applyThemeToDocument(normalized);
            }
            return;
          }

          clearSiteTheme();
        }

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
              hasServerTheme = true;
              userTheme = userData?.themePreference;
            }
          }
        } catch {}

        if (hasServerTheme) {
          const normalized = normalizeTheme(userTheme);
          serverTheme = normalized;

          if (!cancelled) {
            if (normalized) {
              applyThemeToDocument(normalized);
              storeTheme(normalized);
            } else {
              clearStoredTheme();
            }
          }

          if (normalized) return;
        }

        if (normalizeTheme(userTheme)) {
          if (!cancelled) {
            applyThemeToDocument(userTheme);
            storeTheme(userTheme);
          }
          return;
        }

        const storedTheme = readStoredTheme();
        if (storedTheme) {
          if (!cancelled) applyThemeToDocument(storedTheme);
          return;
        }

        if (!cancelled) applyThemeToDocument(getSystemTheme());
      } catch {
        if (!cancelled) {
          applyThemeToDocument('dark');
        }
      }
    };

    let mediaQuery: MediaQueryList | null = null;
    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        mediaQuery.addEventListener('change', onSystemThemeChange);
      } catch {
        mediaQuery.addListener(onSystemThemeChange);
      }
    } catch {
      mediaQuery = null;
    }

    run();
    return () => {
      cancelled = true;
      window.removeEventListener(THEME_EVENT_NAME, onThemeChange);

      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener('change', onSystemThemeChange);
        } catch {
          mediaQuery.removeListener(onSystemThemeChange);
        }
      }
    };
  }, []);

  return null;
}
