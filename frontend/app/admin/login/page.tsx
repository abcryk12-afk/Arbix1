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
  const [variant, setVariant] = useState<'blue' | 'green'>('blue');

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
        const nextVariant: 'blue' | 'green' = nextVariantRaw === 'green' ? 'green' : 'blue';

        if (!cancelled) {
          setLogoUrl(nextLogo);
          setVariant(nextVariant);
        }
      } catch {
        if (!cancelled) {
          setLogoUrl(null);
          setVariant('blue');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = useMemo(() => {
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
    return {
      bg: 'bg-[#5a60b4]',
      sheet: 'bg-[#4a4f98]',
      accent: 'bg-[#8ea2ff]',
      accentText: 'text-[#1b2152]',
      inputRing: 'focus-visible:outline-[#8ea2ff]/60',
      icon: 'text-[#4a4f98]',
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
    <div className={`min-h-screen ${palette.bg} text-white`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
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
  );
}
