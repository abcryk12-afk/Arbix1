'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

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
    <div className="relative min-h-screen bg-page bg-theme-page flex items-center justify-center px-4 py-12 overflow-hidden network-grid-bg">
      <div className="pointer-events-none absolute inset-0 bg-theme-hero-overlay opacity-60"></div>
      <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-20 right-10 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-theme-primary rounded-xl mb-4 shadow-theme-md">
            <span className="text-primary-fg font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-heading mb-2">Admin Panel</h1>
          <p className="text-muted">Sign in with your admin email and secret code</p>
        </div>

        <div className="bg-surface/30 backdrop-blur-lg rounded-2xl border border-border/50 p-8 shadow-theme-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">
                Email Address
              </label>
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
              <label htmlFor="secretCode" className="block text-sm font-medium text-muted mb-2">
                Secret Code
              </label>
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
            <a href="/auth/login" className="text-muted hover:text-heading transition-colors text-sm">
              Back to User Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
