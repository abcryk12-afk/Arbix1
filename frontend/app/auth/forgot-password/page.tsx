'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage('Please enter your email');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setMessage(data.message || 'A password reset link has been sent to your email.');
        setMessageType('success');
      } else {
        setMessage(data?.message || `Request failed (HTTP ${response.status}).`);
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
    <div className="relative min-h-screen bg-page flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-surface/30"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4 shadow-theme-sm">
            <span className="text-primary-fg font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-heading mb-2">Forgot Your Password?</h1>
          <p className="text-muted">Enter your email to receive a reset link.</p>
        </div>

        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-border p-8 shadow-theme-sm">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg text-fg placeholder:text-muted outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Enter your email"
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  messageType === 'success'
                    ? 'bg-success/10 border border-border text-fg'
                    : 'bg-danger/10 border border-border text-fg'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-theme-md hover:shadow-theme-lg hover:opacity-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/login" className="text-heading hover:opacity-90 font-medium transition">
              Back to Login
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="inline-flex items-center text-muted hover:text-heading transition">
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
