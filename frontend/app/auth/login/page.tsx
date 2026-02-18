'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState('/dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const n = params.get('next') || '';
      if (n && n.startsWith('/')) setNextPath(n);
      else setNextPath('/dashboard');
    } catch {
      setNextPath('/dashboard');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/public/site-assets', { method: 'GET', cache: 'no-store' });
        const data = await res.json().catch(() => null);
        const nextLogo = data?.success ? (data?.assets?.logo?.url || null) : null;
        if (!cancelled) setLogoUrl(nextLogo);
      } catch {
        if (!cancelled) setLogoUrl(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cancelled && res.ok) {
          router.replace(nextPath || '/dashboard');
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setMessage('Login successful! Redirecting...');
        setMessageType('success');
        if (data?.token) localStorage.setItem('token', data.token);
        if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
        try {
          window.dispatchEvent(new Event('arbix-user-updated'));
        } catch {
          // ignore
        }
        setTimeout(() => {
          try {
            window.location.href = nextPath || '/dashboard';
          } catch {
            router.push(nextPath || '/dashboard');
          }
        }, 800);
      } else {
        setMessage(data?.message || `Login failed (HTTP ${response.status}).`);
        setMessageType('error');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-page text-fg">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-info/20 to-secondary/25" />
        <div className="absolute inset-0 opacity-70 bg-theme-hero-overlay" />

        <div className="relative mx-auto max-w-md px-5 pt-14 pb-24">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-[28px] bg-surface/85 border border-border shadow-theme-md flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Arbix" className="h-14 w-14 object-contain" />
              ) : (
                <span className="text-2xl font-extrabold text-heading">AX</span>
              )}
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-heading">Arbix</div>
            <div className="mt-1 text-[12px] text-muted">Login</div>
          </div>
        </div>

        <svg className="absolute bottom-[-1px] left-0 right-0 w-full" viewBox="0 0 1440 240" preserveAspectRatio="none">
          <path
            fill="rgb(var(--t-page))"
            d="M0,160 C240,220 480,220 720,160 C960,100 1200,100 1440,160 L1440,240 L0,240 Z"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-md px-5 -mt-14 pb-12">
        <div className="arbix-card rounded-3xl p-5 shadow-theme-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-heading">Welcome back!</div>
            <div className="mt-1 text-[12px] text-muted">Login to continue to your dashboard</div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface/50 border border-border rounded-2xl text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-2xl text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-muted hover:text-heading"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" className="h-4 w-4" />
                Remember me
              </label>
              <a href="/auth/forgot-password" className="text-primary hover:text-heading transition-colors">
                Forgot password?
              </a>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  messageType === 'success'
                    ? 'bg-secondary/10 border border-secondary/30 text-secondary'
                    : 'bg-danger/10 border border-danger/30 text-danger'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="m3-ripple w-full py-3 px-4 bg-theme-primary text-primary-fg rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-theme-md hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
            >
              {isSubmitting ? 'Logging in...' : 'Login Securely'}
            </button>
          </form>

          <div className="mt-5 text-center text-[12px] text-muted">
            New here?{' '}
            <a href="/auth/signup" className="text-primary hover:text-heading font-semibold transition-colors">
              Create an account
            </a>
          </div>

          <div className="mt-4 text-center">
            <a href="/welcome" className="text-[11px] text-muted hover:text-heading transition-colors">
              Back
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
