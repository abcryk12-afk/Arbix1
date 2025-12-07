'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!email || !password) {
      setMessage('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful! Redirecting to dashboard...');
        localStorage.setItem('token', data.token);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 text-white font-bold">
              AX
            </div>
            <div>
              <div className="text-lg font-bold text-white">Arbix</div>
              <div className="text-xs text-slate-400">Automated Trading Platform</div>
            </div>
          </div>
          <a href="/auth/signup" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            New to Arbix?
          </a>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 sm:text-4xl">
              Welcome Back
            </h1>
            <p className="text-slate-300 text-base">
              Sign in to access your dashboard and track your earnings
            </p>
          </div>

          {message && (
            <div className={`mb-6 rounded-xl p-4 text-sm ${
              message.includes('successful') 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-slate-300">
                  Remember me
                </label>
              </div>
              <a href="/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                SSL encrypted connection
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bank-level security
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 monitoring
              </div>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <a href="/auth/signup" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Create one here
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>Secure login powered by enterprise-grade encryption</p>
      </div>
    </div>
  );
}
