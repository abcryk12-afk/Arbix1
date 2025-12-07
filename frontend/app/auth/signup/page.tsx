'use client';

import { useMemo, useState } from 'react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return 'Weak';
    if (score === 2 || score === 3) return 'Medium';
    return 'Strong';
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000/api/auth/register'
        : '/api/auth/register';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          phone,
          referredBy: referralCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        setMessage(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero / Intro */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            SIGN UP
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Create Your Arbix Account
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Create your account in one simple step. No OTP verification required.
          </p>
        </div>
      </section>

      {/* Signup Form */}
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Fill in your details to create your Arbix account.
          </p>

          {message && (
            <div className={`mt-4 rounded-lg p-3 text-xs ${
              message.includes('successfully') 
                ? 'bg-emerald-950/20 border border-emerald-600/60 text-emerald-400' 
                : 'bg-red-950/20 border border-red-600/60 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form
            className="mt-6 space-y-4 text-xs text-slate-300"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Create a strong password"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Password strength: {passwordStrength}</span>
                <span>Min 8 chars, 1 uppercase, 1 number, 1 symbol</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-[10px] text-red-400">Passwords do not match!</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="phone">
                Mobile Number (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="e.g. +971500000000"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Used for alerts and backup communication (international format).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-slate-400" htmlFor="referral">
                Referral Code (Optional)
              </label>
              <input
                id="referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                placeholder="Enter referral code if you have one"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                If you do not have a referral code, simply leave this field blank.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || password !== confirmPassword || !fullName || !email || !password}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span>✔ No OTP required</span>
              <span>✔ Instant activation</span>
              <span>✔ Takes only 1 minute</span>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <a href="/auth/login" className="text-primary hover:text-blue-500 underline">
                Login here
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}