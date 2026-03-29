'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia?.('(display-mode: standalone)');
  const iosStandalone = (window.navigator as any)?.standalone === true;
  return Boolean(mql?.matches || iosStandalone);
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  const dismissedKey = useMemo(() => 'arbix_install_prompt_dismissed_v1', []);
  const dashboardGateKey = useMemo(() => 'arbix_install_prompt_dashboard_once_v1', []);

  const isDashboard = Boolean(pathname?.startsWith('/dashboard'));

  const canShowOnThisRoute = useCallback(() => {
    if (!isDashboard) return true;
    try {
      return localStorage.getItem(dashboardGateKey) === '1';
    } catch {
      return false;
    }
  }, [dashboardGateKey, isDashboard]);

  const clearDashboardGate = useCallback(() => {
    try {
      localStorage.removeItem(dashboardGateKey);
    } catch {
      // ignore
    }
  }, [dashboardGateKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;

    try {
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed === '1') return;
    } catch {
      // ignore
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(!canShowOnThisRoute());
    };

    const onInstalled = () => {
      setHidden(true);
      setDeferred(null);
      clearDashboardGate();
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismissedKey, canShowOnThisRoute, clearDashboardGate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deferred) return;
    if (hidden && canShowOnThisRoute()) {
      setHidden(false);
    }
  }, [pathname, deferred, hidden, canShowOnThisRoute]);

  const dismiss = () => {
    setHidden(true);
    clearDashboardGate();
    try {
      localStorage.setItem(dismissedKey, '1');
    } catch {
      // ignore
    }
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
    } finally {
      setDeferred(null);
      setHidden(true);
      clearDashboardGate();
    }
  };

  if (hidden || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 px-3">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-theme-md backdrop-blur">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-heading">Install Arbix App</div>
          <div className="mt-0.5 text-[11px] text-muted">Add to your home screen for a faster experience.</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-border px-3 py-2 text-[11px] text-fg hover:opacity-95"
          >
            Later
          </button>
          <button
            type="button"
            onClick={install}
            className="rounded-lg bg-theme-primary px-3 py-2 text-[11px] font-medium text-primary-fg shadow-theme-sm transition hover:shadow-theme-md hover:opacity-95"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
