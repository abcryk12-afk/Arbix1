'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UiTheme = 'default' | 'aurora_glass';

const STORAGE_KEY = 'arbix_ui_theme';
const EVENT_NAME = 'arbix-ui-theme-change';

type UiThemeContextType = {
  uiTheme: UiTheme;
  setUiTheme: (theme: UiTheme) => void;
};

const UiThemeContext = createContext<UiThemeContextType | undefined>(undefined);

function normalizeTheme(input: unknown): UiTheme {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw || raw === 'default' || raw === 'system' || raw === 'legacy') return 'default';
  if (raw === 'aurora_glass' || raw === 'aurora-glass' || raw === 'auroraglass') return 'aurora_glass';
  return 'default';
}

function applyThemeToDocument(theme: UiTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-ui-theme', theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'aurora_glass' ? '#4A00E0' : (document.documentElement.getAttribute('data-theme') === 'dark' ? '#000000' : '#ffffff'));
  }
}

function readStoredTheme(): UiTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeTheme(raw);
  } catch {
    return null;
  }
}

function storeTheme(theme: UiTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
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

export function UiThemeProvider({ children }: { children: React.ReactNode }) {
  const [uiTheme, setUiThemeState] = useState<UiTheme>('default');

  useEffect(() => {
    let cancelled = false;

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const next = normalizeTheme(detail?.theme);
      if (cancelled) return;
      setUiThemeState(next);
    };

    window.addEventListener(EVENT_NAME, onChange);

    const init = async () => {
      const stored = readStoredTheme();
      if (!cancelled && stored) setUiThemeState(stored);

      const { res, data } = await fetchJsonSafe('/api/public/ui-theme', { method: 'GET', cache: 'no-store' });
      if (cancelled) return;
      if (!res || !res.ok || !data?.success) return;
      setUiThemeState(normalizeTheme(data?.theme));
    };

    init();

    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, onChange);
    };
  }, []);

  useEffect(() => {
    applyThemeToDocument(uiTheme);
    storeTheme(uiTheme);
  }, [uiTheme]);

  const api = useMemo<UiThemeContextType>(() => {
    return {
      uiTheme,
      setUiTheme: (theme) => {
        const next = normalizeTheme(theme);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { theme: next } }));
        setUiThemeState(next);
      },
    };
  }, [uiTheme]);

  return <UiThemeContext.Provider value={api}>{children}</UiThemeContext.Provider>;
}

export function useUiTheme() {
  const ctx = useContext(UiThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used within UiThemeProvider');
  return ctx;
}

export function dispatchUiTheme(theme: UiTheme) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { theme } }));
}
