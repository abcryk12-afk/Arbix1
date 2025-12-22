'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

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
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10"></div>
      <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-20 right-10 w-72 h-72 bg-emerald-500/20 rounded-full filter blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Sign in with an authorized admin account</p>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  messageType === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/login" className="text-slate-400 hover:text-white transition-colors text-sm">
              Back to User Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
