'use client';

import { useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  const isIos = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua);
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as unknown as { standalone?: boolean };
    return window.matchMedia?.('(display-mode: standalone)')?.matches || Boolean(nav.standalone);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault?.();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const canShow = Boolean(deferredPrompt) || (isIos && !isStandalone);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => null);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIos && !isStandalone) {
      setShowIosHelp(true);
    }
  };

  if (!canShow) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-[11px] font-medium text-fg transition hover:opacity-95"
        aria-label="Install app"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5M5 17a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          />
        </svg>
        <span>Install App</span>
      </button>

      {showIosHelp ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            onClick={() => setShowIosHelp(false)}
          />
          <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-md rounded-2xl border border-border bg-page p-4 shadow-theme-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-heading">Install Arbix</p>
                <p className="mt-1 text-[11px] text-muted">
                  On iPhone/iPad: tap the Share button in Safari, then choose “Add to Home Screen”.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] text-fg transition hover:opacity-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
