'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [variant, setVariant] = useState<'default' | 'blue' | 'green' | 'midnight' | 'royal' | 'galileo'>('default');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [assetsRes, themeRes] = await Promise.all([
          fetch('/api/public/site-assets', { method: 'GET', cache: 'no-store' }),
          fetch('/api/public/admin-login-theme', { method: 'GET', cache: 'no-store' }),
        ]);

        const assets = await assetsRes.json().catch(() => null);
        const theme = await themeRes.json().catch(() => null);

        const nextLogo = assets?.success ? (assets?.assets?.logo?.url || null) : null;
        const nextVariantRaw = theme?.success ? String(theme?.variant || '') : '';
        const nextVariant: 'default' | 'blue' | 'green' | 'midnight' | 'royal' | 'galileo' =
          nextVariantRaw === 'green'
            ? 'green'
            : nextVariantRaw === 'blue'
              ? 'blue'
              : nextVariantRaw === 'midnight'
                ? 'midnight'
                : nextVariantRaw === 'royal'
                  ? 'royal'
                  : nextVariantRaw === 'galileo'
                    ? 'galileo'
                  : 'default';

        if (!cancelled) {
          setLogoUrl(nextLogo);
          setVariant(nextVariant);
        }
      } catch {
        if (!cancelled) {
          setLogoUrl(null);
          setVariant('default');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = useMemo(() => {
    if (variant === 'galileo') {
      return {
        bg: 'bg-[#b99af8]',
        sheet: 'bg-white/15',
        accent: 'bg-[#0b0d12]',
        accentText: 'text-white',
        inputRing: 'focus-visible:outline-white/40',
        icon: 'text-white',
      };
    }
    if (variant === 'royal') {
      return {
        bg: 'bg-[#061634]',
        sheet: 'bg-[#0b2a5b]',
        accent: 'bg-[#3f7cff]',
        accentText: 'text-white',
        inputRing: 'focus-visible:outline-[#3f7cff]/60',
        icon: 'text-[#0b2a5b]',
      };
    }
    if (variant === 'midnight') {
      return {
        bg: 'bg-[#071a3a]',
        sheet: 'bg-[#0b2a5b]',
        accent: 'bg-[#4f8cff]',
        accentText: 'text-white',
        inputRing: 'focus-visible:outline-[#4f8cff]/60',
        icon: 'text-[#0b2a5b]',
      };
    }
    if (variant === 'green') {
      return {
        bg: 'bg-[#2c7f73]',
        sheet: 'bg-[#1f6e64]',
        accent: 'bg-[#66d1c1]',
        accentText: 'text-[#0a3a35]',
        inputRing: 'focus-visible:outline-[#66d1c1]/60',
        icon: 'text-[#1f6e64]',
      };
    }
    if (variant === 'blue') {
      return {
        bg: 'bg-[#5a60b4]',
        sheet: 'bg-[#4a4f98]',
        accent: 'bg-[#8ea2ff]',
        accentText: 'text-[#1b2152]',
        inputRing: 'focus-visible:outline-[#8ea2ff]/60',
        icon: 'text-[#4a4f98]',
      };
    }
    return {
      bg: 'bg-theme-page',
      sheet: 'bg-surface/30',
      accent: 'bg-theme-primary',
      accentText: 'text-primary-fg',
      inputRing: 'focus-visible:outline-ring/30',
      icon: 'text-heading',
    };
  }, [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !secretCode) {
      setMessage('Please enter email and secret code');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, secretCode }),
      });

      const loginData = await loginRes.json();

      if (!loginData?.success || !loginData?.token) {
        setMessage(loginData?.message || 'Login failed. Please check your credentials.');
        setMessageType('error');
        return;
      }

      const token = String(loginData.token);

      const checkRes = await fetch('/api/admin/check', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const checkData = await checkRes.json().catch(() => null);

      if (!checkRes.ok || !checkData?.success) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setMessage(
          checkData?.message ||
            'This account is not authorized to access the admin panel.'
        );
        setMessageType('error');
        return;
      }

      localStorage.setItem('adminToken', token);
      if (loginData?.user) {
        localStorage.setItem('adminUser', JSON.stringify(loginData.user));
      }

      setMessage('Admin login successful. Redirecting...');
      setMessageType('success');

      setTimeout(() => {
        router.push('/admin');
      }, 800);
    } catch {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    variant === 'default' ? (
      <div className="relative min-h-screen bg-page bg-theme-page flex items-center justify-center px-4 py-12 overflow-hidden network-grid-bg">
        <div className="pointer-events-none absolute inset-0 bg-theme-hero-overlay opacity-60"></div>
        <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-theme-primary rounded-xl mb-4 shadow-theme-md overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Arbix" className="h-12 w-12 object-contain" />
              ) : (
                <span className="text-primary-fg font-bold text-2xl">A</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-heading mb-2">Admin Panel</h1>
            <p className="text-muted">Sign in with your admin email and secret code</p>
          </div>

          <div className="bg-surface/30 backdrop-blur-lg rounded-2xl border border-border/50 p-8 shadow-theme-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="secretCode" className="block text-sm font-medium text-muted mb-2">Secret Code</label>
                <input
                  id="secretCode"
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all"
                  placeholder="Enter secret code"
                />
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
                className="w-full py-3 px-4 bg-theme-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-theme-md hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In as Admin'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/auth/login" className="text-muted hover:text-heading transition-colors text-sm">Back to User Login</a>
            </div>
          </div>
        </div>
      </div>
    ) : variant === 'galileo' ? (
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background:
            'radial-gradient(1000px 500px at 15% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), radial-gradient(900px 520px at 80% 30%, rgba(255,255,255,0.14), rgba(255,255,255,0) 60%), linear-gradient(135deg, #c7a3ff 0%, #8d7cff 45%, #5e85ff 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.45 }}>
          <div
            className="absolute -left-24 top-24 h-[520px] w-[520px] rounded-full"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 65%)' }}
          />
          <div
            className="absolute right-[-180px] top-[-120px] h-[520px] w-[520px] rounded-full"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 68%)' }}
          />
          <div
            className="absolute inset-x-0 bottom-[-160px] h-[520px]"
            style={{ background: 'radial-gradient(700px 280px at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 65%)' }}
          />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
          <div className="w-full rounded-[34px] border border-white/25 bg-white/10 shadow-theme-lg backdrop-blur-2xl">
            <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2 md:gap-10 md:p-10">
              <div className="text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Arbix" className="h-7 w-7 object-contain" />
                    ) : (
                      <span className="text-sm font-bold">A</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold tracking-tight">Arbix</div>
                </div>

                <div className="mt-10">
                  <div className="text-3xl font-semibold leading-tight">Welcome Back</div>
                  <div className="mt-2 text-[13px] text-white/80">
                    Sign in to manage your admin dashboard.
                  </div>
                </div>

                <div className="mt-8 max-w-md text-[12px] leading-relaxed text-white/70">
                  Secure admin access with your email and secret code. This page uses a glassmorphism theme for a modern look.
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-full max-w-md rounded-[28px] border border-white/25 bg-white/20 p-7 shadow-theme-lg backdrop-blur-2xl">
                  <div className="text-center">
                    <div className="text-[11px] font-semibold tracking-[0.18em] text-white/80">WELCOME BACK EXCLUSIVE MEMBER</div>
                    <div className="mt-2 text-[10px] text-white/70">LOG IN TO CONTINUE</div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-[11px] font-medium text-white/75 mb-2">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/95 px-4 py-3 text-[13px] text-[#0b0d12] placeholder:text-[#6b7280] shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
                        placeholder="admin@arbix.cloud"
                      />
                    </div>

                    <div>
                      <label htmlFor="secretCode" className="block text-[11px] font-medium text-white/75 mb-2">Secret Code</label>
                      <input
                        id="secretCode"
                        type="text"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/95 px-4 py-3 text-[13px] text-[#0b0d12] placeholder:text-[#6b7280] shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
                        placeholder="Enter secret code"
                      />
                    </div>

                    {message && (
                      <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-[12px] text-white">
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="m3-ripple w-full rounded-xl bg-[#0b0d12] px-4 py-3 text-[13px] font-semibold text-white shadow-theme-md transition hover:opacity-95 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Signing In...' : 'Proceed to my Account'}
                    </button>
                  </form>

                  <div className="mt-5 text-center">
                    <a href="/auth/login" className="text-[11px] text-white/75 hover:text-white transition-colors">
                      Back to User Login
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
    <div className={`min-h-screen ${palette.bg} text-white`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {variant === 'midnight' ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% 0%, rgba(79,140,255,0.55), rgba(7,26,58,0) 55%), radial-gradient(900px 500px at 50% 100%, rgba(79,140,255,0.15), rgba(7,26,58,0) 60%)',
          }}
        />
      ) : variant === 'royal' ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 520px at 50% 18%, rgba(68,115,255,0.65), rgba(6,22,52,0) 58%), radial-gradient(900px 520px at 50% 100%, rgba(68,115,255,0.20), rgba(6,22,52,0) 65%), linear-gradient(180deg, rgba(6,22,52,0) 0%, rgba(6,22,52,0.85) 76%, rgba(6,22,52,1) 100%)',
          }}
        />
      ) : null}
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
        <div className="relative px-6 pt-10">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-white/90 shadow-theme-md flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Arbix" className="h-12 w-12 object-contain" />
              ) : (
                <span className={`text-2xl font-extrabold ${palette.icon}`}>A</span>
              )}
            </div>
            <div className="mt-4 text-2xl font-semibold">Welcome Back!</div>
            <div className="mt-1 text-[12px] text-white/80">Sign in to admin dashboard</div>
          </div>

          <div className="pointer-events-none absolute -right-5 -top-6 h-28 w-28 rounded-full bg-white/20" />
          <div className="pointer-events-none absolute -left-8 top-6 h-36 w-36 rounded-full bg-black/10" />
        </div>

        <div className="relative mt-8 flex-1">
          <svg className="absolute -top-10 left-0 right-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path fill="rgba(255,255,255,0.98)" d="M0,160 C240,220 480,220 720,160 C960,100 1200,100 1440,160 L1440,200 L0,200 Z" />
          </svg>

          <div className="relative rounded-t-[38px] bg-white px-6 pt-10 pb-10 text-[#0b0d12]">
            <div className={`rounded-3xl ${palette.sheet} p-6 shadow-theme-lg`}
              style={{ boxShadow: '0 22px 50px rgba(0,0,0,0.22)' }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-white">Admin Login</div>
                <div className="mt-1 text-[12px] text-white/70">Use your admin email & secret code</div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-semibold text-white/80 mb-2">Email or Username</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full rounded-2xl bg-white/95 px-4 py-3 text-[13px] text-[#0b0d12] placeholder:text-[#6b7280] shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${palette.inputRing}`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="secretCode" className="block text-[12px] font-semibold text-white/80 mb-2">Password / Secret Code</label>
              <input
                id="secretCode"
                type="text"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                className={`w-full rounded-2xl bg-white/95 px-4 py-3 text-[13px] text-[#0b0d12] placeholder:text-[#6b7280] shadow-theme-sm focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${palette.inputRing}`}
                placeholder="Enter secret code"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  messageType === 'success'
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`m3-ripple w-full rounded-full ${palette.accent} px-4 py-3 text-[13px] font-semibold ${palette.accentText} shadow-theme-md transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
            >
              {isSubmitting ? 'Signing In...' : 'Sign in'}
            </button>
          </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/60">or</div>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              <div className="mt-4 text-center">
                <a href="/auth/login" className="text-[12px] text-white/75 hover:text-white transition-colors">
                  Back to User Login
                </a>
              </div>
            </div>

            <div className="mt-8 px-2 text-center text-[11px] text-[#6b7280]">
              © {new Date().getFullYear()} Arbix Admin
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  );
}
