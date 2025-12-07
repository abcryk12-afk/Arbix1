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
    if (score <= 1) return { text: 'Weak', color: 'text-red-400' };
    if (score === 2 || score === 3) return { text: 'Medium', color: 'text-yellow-400' };
    return { text: 'Strong', color: 'text-emerald-400' };
  }, [password]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile-First Header */}
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
          <a 
            href="/auth/login" 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Already have account?
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 sm:text-4xl">
              Create Account
            </h1>
            <p className="text-slate-300 text-base">
              Start your journey to passive income with automated arbitrage trading
            </p>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`mb-6 rounded-xl p-4 text-sm ${
              message.includes('successfully') 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
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
                placeholder="Create a strong password"
              />
              {password && (
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-sm ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.text}
                  </span>
                </div>
              )}
              <div className="mt-2 text-xs text-slate-400">
                Use 8+ characters with uppercase, lowercase, numbers & symbols
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-400">Passwords do not match!</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Mobile Number <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Referral Code (Optional) */}
            <div>
              <label htmlFor="referral" className="block text-sm font-medium text-slate-300 mb-2">
                Referral Code <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                id="referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter referral code"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || password !== confirmPassword || !fullName || !email || !password}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Benefits */}
            <div className="grid grid-cols-1 gap-3 pt-4">
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No OTP verification required
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Instant account activation
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <svg className="h-5 w-5 text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Start earning immediately
              </div>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <a 
                href="/auth/login" 
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  );
}
