'use client';

import type { ClipboardEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  type Step = 1 | 2 | 3;

  const [step, setStep] = useState<Step>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [referralCode, setReferralCode] = useState('');
  const [referralLocked, setReferralLocked] = useState(false);

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpString = otp.join('');

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || '';
    if (ref) {
      setReferralCode(ref);
      setReferralLocked(true);
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      setMessageType('error');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

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
          referredBy: referralCode || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setMessage(data.message || 'OTP sent. Please check your email.');
        setMessageType('success');
        setOtp(['', '', '', '', '', '']);
        setStep(2);
        setResendCooldown(30);
      } else {
        setMessage(data?.message || `Registration failed (HTTP ${response.status}).`);
        setMessageType('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length > 1) return;

    const next = [...otp];
    next[index] = clean;
    setOtp(next);

    if (clean && index < 5) {
      const nextInput = document.getElementById(`signup-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);

    const last = document.getElementById(`signup-otp-${Math.min(text.length, 6) - 1}`);
    if (last) (last as HTMLInputElement).focus();
    e.preventDefault();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || otpString.length !== 6) {
      setMessage('Please enter the 6-digit verification code.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setMessage('Email verified successfully.');
        setMessageType('success');
        setStep(3);
      } else {
        setMessage(data?.message || `Invalid OTP (HTTP ${response.status}).`);
        setMessageType('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0) return;

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setMessage(data.message || 'OTP sent. Please check your email.');
        setMessageType('success');
        setResendCooldown(30);
      } else {
        setMessage(data?.message || `Failed to resend OTP (HTTP ${response.status}).`);
        setMessageType('error');
      }
    } catch {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-page flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-surface/30 opacity-60"></div>
      <div className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-20 right-10 w-72 h-72 bg-info/20 rounded-full filter blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-heading mb-2">Create Your Arbix Account</h1>
          <p className="text-muted">Sign up in a few easy steps, verify your email, and start earning with arbitrage trading.</p>
        </div>

        <div className="arbix-card arbix-3d arbix-shine arbix-shine-active arbix-auth-card arbix-auth-float backdrop-blur-lg rounded-2xl p-8">
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-heading">Sign Up — Step 1</div>
                <p className="mt-1 text-xs text-muted">Smooth registration. Takes only 1 minute.</p>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-muted mb-2">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-muted mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                  placeholder="Create a strong password"
                />
                {password && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs ${passwordStrength.color}`}>Password strength: {passwordStrength.text}</span>
                    <span className="text-[10px] text-muted">8+ chars, 1 uppercase, 1 number, 1 symbol</span>
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
                  required
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                  placeholder="Confirm your password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-fg">Passwords do not match</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-muted mb-2">Mobile Number (Optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                  placeholder="+92... / +971..."
                />
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-muted mb-2">Referral Code (Optional)</label>
                <input
                  id="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={referralLocked}
                  className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-fg placeholder:text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all disabled:opacity-60"
                  placeholder="If you don’t have a referral code, leave blank"
                />
                <p className="mt-1 text-[11px] text-muted">
                  {referralLocked ? 'Referral detected from link and locked.' : 'If you don’t have a referral code, leave blank.'}
                </p>
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 bg-surface/50 border border-border rounded text-primary-fg checked:bg-primary checked:border-border focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-muted">
                  I agree to the{' '}
                  <a href="/terms" className="text-heading hover:opacity-90 transition">Terms and Conditions</a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-heading hover:opacity-90 transition">Privacy Policy</a>
                </label>
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
                className="w-full py-3 px-4 bg-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-theme-md hover:shadow-theme-lg transform hover:scale-105 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {isSubmitting ? 'Sending OTP...' : 'Next: Send OTP'}
              </button>

              <div className="text-center text-[11px] text-muted">
                <div>Data is encrypted</div>
                <div>No hidden fees</div>
                <div>Takes only 1 minute</div>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-heading">Verify Your Email — Step 2</div>
                <p className="mt-1 text-xs text-muted">We’ve sent a 6-digit OTP to your email. Please enter it below.</p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-muted mb-2">Verification Code</label>
                <div className="flex gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`signup-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="h-11 w-11 rounded-lg border border-border bg-surface/50 text-center text-lg text-fg outline-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted">OTP expires in 10 minutes.</p>
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
                disabled={isSubmitting || otpString.length !== 6}
                className="w-full py-3 px-4 bg-primary text-primary-fg rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-theme-md hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
                <button
                  type="button"
                  className="text-heading hover:opacity-90 disabled:opacity-60 transition"
                  onClick={handleResendOtp}
                  disabled={isSubmitting || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => {
                    setStep(1);
                    setOtp(['', '', '', '', '', '']);
                    setMessage('');
                    setMessageType('');
                  }}
                  disabled={isSubmitting}
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-success/10 p-5 text-sm text-fg shadow-theme-sm">
                <div className="text-lg font-semibold text-heading">Congratulations — Your Account is Ready!</div>
                <p className="mt-2 text-muted">
                  Your email has been verified, and your Arbix account has been created successfully. You can now log in and start your earning journey!
                </p>
                <div className="mt-4 space-y-1 text-[11px] text-muted">
                  <div>
                    <span className="text-muted">Full Name:</span> {fullName}
                  </div>
                  <div>
                    <span className="text-muted">Email:</span> {email}
                  </div>
                  <div>
                    <span className="text-muted">Referral Used:</span> {referralCode || '—'}
                  </div>
                  <div>
                    <span className="text-muted">Account Status:</span> Verified
                  </div>
                  <div>
                    <span className="text-muted">Registration Date:</span> {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="w-full py-3 px-4 bg-primary text-primary-fg rounded-lg font-semibold transition-all shadow-theme-md hover:shadow-theme-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Go to Login
              </button>

              <button
                type="button"
                onClick={() => router.push('/how-it-works')}
                className="w-full py-3 px-4 bg-surface/50 border border-border text-fg rounded-lg font-semibold transition-all hover:shadow-theme-sm hover:opacity-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Explore How It Works
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted">
              Already have an account?{' '}
              <a href="/auth/login" className="text-heading hover:opacity-90 font-medium transition">
                Sign In
              </a>
            </p>
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
