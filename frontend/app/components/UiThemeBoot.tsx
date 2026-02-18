'use client';

import { useEffect } from 'react';

type UiTheme = 'default' | 'aurora_glass';

const STORAGE_KEY = 'arbix_ui_theme';
const EVENT_NAME = 'arbix-ui-theme-change';

function normalizeTheme(input: unknown): UiTheme {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw || raw === 'default' || raw === 'system' || raw === 'legacy') return 'default';
  if (raw === 'aurora_glass' || raw === 'auroraglass' || raw === 'aurora-glass') return 'aurora_glass';
  return 'default';
}

function applyTheme(theme: UiTheme) {
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

export default function UiThemeBoot() {
  useEffect(() => {
    let cancelled = false;

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const theme = normalizeTheme(detail?.theme);
      if (cancelled) return;
      applyTheme(theme);
      storeTheme(theme);
    };

    window.addEventListener(EVENT_NAME, onChange);

    const run = async () => {
      const stored = readStoredTheme();
      if (stored && !cancelled) applyTheme(stored);

      const { res, data } = await fetchJsonSafe('/api/public/ui-theme', { method: 'GET', cache: 'no-store' });
      if (cancelled) return;
      if (!res || !res.ok || !data?.success) return;

      const dbTheme = normalizeTheme(data?.theme);
      applyTheme(dbTheme);
      storeTheme(dbTheme);
    };

    run();

    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, onChange);
    };
  }, []);

  return null;
}

export function setUiTheme(theme: UiTheme) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { theme } }));
}
