'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { text: 'Weak', color: 'text-fg' };
    if (score === 2 || score === 3) return { text: 'Medium', color: 'text-muted' };
    return { text: 'Strong', color: 'text-heading' };
  }, [password]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage('Missing reset token. Please use the link from your email.');
      setMessageType('error');
      return;
    }

    if (!password || password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Password reset successful. Redirecting to login...');
        setMessageType('success');
        setTimeout(() => router.push('/auth/login'), 1500);
      } else {
        setMessage(data.message || 'Password reset failed');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-page flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-heading mb-2">Reset Password</h1>
          <p className="text-muted">Create a new password for your account</p>
        </div>

        <div className="bg-surface/60 backdrop-blur-lg rounded-2xl border border-border p-8 shadow-theme-sm">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg text-fg placeholder:text-muted outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Create a strong password"
                required
              />
              {password && (
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs ${passwordStrength.color}`}>Password strength: {passwordStrength.text}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted mb-2">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface/60 border border-border rounded-lg text-fg placeholder:text-muted outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                placeholder="Confirm your new password"
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-fg">Passwords do not match</p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                messageType === 'success'
                  ? 'bg-success/10 border border-border text-fg'
                  : 'bg-danger/10 border border-border text-fg'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-theme-md hover:shadow-theme-lg hover:opacity-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/login" className="text-heading hover:opacity-90 font-medium transition">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
