'use client';

import { useEffect } from 'react';

export default function PwaBoot() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const register = async (): Promise<(() => void) | null> => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        try {
          await reg.update();
        } catch {
          // ignore
        }

        const onFocus = () => {
          try {
            reg.update();
          } catch {
            // ignore
          }
        };

        const onVisibility = () => {
          try {
            if (document.visibilityState === 'visible') reg.update();
          } catch {
            // ignore
          }
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        const interval = window.setInterval(() => {
          try {
            reg.update();
          } catch {
            // ignore
          }
        }, 60 * 60 * 1000);

        return () => {
          window.removeEventListener('focus', onFocus);
          document.removeEventListener('visibilitychange', onVisibility);
          window.clearInterval(interval);
        };
      } catch {
        // ignore
      }

      return null;
    };

    if (isLocalhost) {
      let cleanup: (() => void) | null = null;
      register().then((fn) => {
        cleanup = typeof fn === 'function' ? fn : null;
      });
      return () => {
        try {
          cleanup?.();
        } catch {
          // ignore
        }
      };
    }

    const onLoad = () => {
      register();
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
