'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showPassword, setShowPassword] = useState(false);

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
        setTimeout(() => router.push('/dashboard'), 800);
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
    <div className="relative min-h-screen bg-page bg-theme-page flex items-center justify-center px-4 py-12 overflow-hidden network-grid-bg">
      <div className="pointer-events-none absolute inset-0 bg-theme-hero-overlay opacity-60"></div>
      <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-heading mb-2">Login to Your Account</h1>
          <p className="text-muted">SSL Protected • Encrypted Login</p>
        </div>

        <div className="arbix-card arbix-3d arbix-shine arbix-shine-active arbix-auth-card arbix-auth-float backdrop-blur-lg rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all"
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
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder-subtle focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2 transition-all pr-12"
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
              className="w-full py-3 px-4 bg-theme-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-theme-md hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/30 focus-visible:outline-offset-2"
            >
              {isSubmitting ? 'Logging in...' : 'Login Securely'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted">
              New here?{' '}
              <a href="/auth/signup" className="text-primary hover:text-heading font-medium transition-colors">
                Create an account
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center text-muted hover:text-heading transition-colors">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
