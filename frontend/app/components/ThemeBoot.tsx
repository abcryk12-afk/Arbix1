'use client';

import { useEffect } from 'react';

type SiteTheme = 'light' | 'dark' | 'colorful' | 'aurora';
type SystemTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'arbix_theme_override';
const SITE_THEME_STORAGE_KEY = 'arbix_site_theme';
const THEME_EVENT_NAME = 'arbix-theme-change';

const AURORA_TOKENS = [
  '--t-page',
  '--t-surface',
  '--t-surface-2',
  '--t-overlay',
  '--t-fg',
  '--t-heading',
  '--t-muted',
  '--t-subtle',
  '--t-border',
  '--t-border-2',
  '--t-ring',
  '--t-primary',
  '--t-primary-hover',
  '--t-on-primary',
  '--t-secondary',
  '--t-on-secondary',
  '--t-info',
  '--t-on-info',
  '--t-success',
  '--t-on-success',
  '--t-warning',
  '--t-on-warning',
  '--t-danger',
  '--t-on-danger',
  '--t-accent',
  '--t-on-accent',
  '--t-brand-1',
  '--t-brand-2',
  '--t-brand-3',
  '--t-white',
  '--t-shadow-rgb',
  '--t-dashboard-1',
  '--t-dashboard-2',
  '--t-dashboard-3',
  '--t-warning-deep',
  '--t-success-deep',
  '--t-danger-soft',
  '--t-danger-deep',
  '--t-border-soft',
] as const;

function normalizeTheme(theme: unknown): SiteTheme | null {
  if (theme === 'light' || theme === 'dark' || theme === 'colorful' || theme === 'aurora') return theme;
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

function clearAuroraOverrides() {
  if (typeof document === 'undefined') return;
  for (const token of AURORA_TOKENS) {
    document.documentElement.style.removeProperty(token);
  }
}

function applyAuroraOverrides(overrides: Record<string, unknown>) {
  if (typeof document === 'undefined') return;
  if (!overrides || typeof overrides !== 'object') return;

  for (const token of AURORA_TOKENS) {
    const v = (overrides as any)[token];
    if (typeof v === 'string' && v.trim()) {
      document.documentElement.style.setProperty(token, v.trim());
    }
  }
}

function readStoredTheme(): SiteTheme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'colorful' || raw === 'aurora') return raw;
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

    let auroraOverrides: Record<string, unknown> | null = null;

    const fetchAndApplyAuroraOverrides = async () => {
      const { res, data } = await fetchJsonSafe('/api/public/aurora-theme', {
        method: 'GET',
        cache: 'no-store',
      });

      if (cancelled) return;
      if (!res || !res.ok || !data?.success) return;

      auroraOverrides = data?.overrides && typeof data.overrides === 'object' ? data.overrides : {};

      if (document.documentElement.getAttribute('data-theme') !== 'aurora') return;
      applyAuroraOverrides(auroraOverrides || {});
    };

    const applyResolvedTheme = (theme: unknown) => {
      const normalized = normalizeTheme(theme);
      const resolved = normalized || getSystemTheme();
      applyThemeToDocument(resolved);
      if (resolved !== 'aurora') {
        clearAuroraOverrides();
        return;
      }

      if (auroraOverrides) applyAuroraOverrides(auroraOverrides);
      fetchAndApplyAuroraOverrides();
    };

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
            applyResolvedTheme(siteTheme);
            return;
          }

          clearSiteTheme();

          if (hasServerTheme && serverTheme) {
            applyResolvedTheme(serverTheme);
            return;
          }

          const stored = readStoredTheme();
          if (stored) {
            applyResolvedTheme(stored);
            return;
          }

          applyResolvedTheme(getSystemTheme());
          return;
        }

        if (hasSiteTheme && siteTheme) {
          applyResolvedTheme(siteTheme);
          return;
        }

        if (persist === 'clear' && (theme === null || theme === undefined || theme === '' || theme === 'default' || theme === 'system')) {
          clearStoredTheme();
          applyResolvedTheme(getSystemTheme());
          return;
        }

        applyResolvedTheme(theme);
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

      applyResolvedTheme(getSystemTheme());
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
              applyResolvedTheme(normalized);
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
              applyResolvedTheme(normalized);
              storeTheme(normalized);
            } else {
              clearStoredTheme();
            }
          }

          if (normalized) return;
        }

        if (normalizeTheme(userTheme)) {
          if (!cancelled) {
            applyResolvedTheme(userTheme);
            storeTheme(userTheme);
          }
          return;
        }

        const storedTheme = readStoredTheme();
        if (storedTheme) {
          if (!cancelled) applyResolvedTheme(storedTheme);
          return;
        }

        if (!cancelled) applyResolvedTheme(getSystemTheme());
      } catch {
        if (!cancelled) {
          applyResolvedTheme('dark');
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
