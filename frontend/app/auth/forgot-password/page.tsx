'use client';

import { useMemo, useState } from 'react';

type ResetStep = 1 | 2 | 3 | 4;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
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
    if (score <= 1) return 'Weak';
    if (score === 2 || score === 3) return 'Medium';
    return 'Strong';
  }, [password]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value.replace(/[^0-9]/g, '');
    setOtp(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const otpString = otp.join('');

  return (
    <div className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            PASSWORD RESET
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Forgot Your Password?
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Follow the simple steps below to reset your password securely using an
            email-based OTP.
          </p>
        </div>
      </section>

      {step === 1 && (
        <section className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
              Step 1 — Request Password Reset
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter the email address linked to your Arbix account. We will send a
              reset code if the account exists.
            </p>
            <form
              className="mt-6 space-y-4 text-xs text-slate-300"
              onSubmit={async (e) => {
                e.preventDefault();

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

                  const data = await response.json();

                  if (data.success) {
                    setMessage(data.message || 'If an account exists with this email, a reset link has been sent.');
                    setMessageType('success');
                    setStep(4);
                  } else {
                    setMessage(data.message || 'Failed to start password reset.');
                    setMessageType('error');
                  }
                } catch (err) {
                  setMessage('An error occurred. Please try again.');
                  setMessageType('error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label className="mb-1 block text-[11px] text-slate-400" htmlFor="email">
                  Email Address
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
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
              {message && (
                <div
                  className={`rounded-lg border p-3 text-[11px] ${
                    messageType === 'success'
                      ? 'border-emerald-600/60 bg-emerald-950/20 text-emerald-300'
                      : 'border-red-600/60 bg-red-950/20 text-red-300'
                  }`}
                >
                  {message}
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-500">
                If an account exists, a password reset link will be sent to this email.
              </p>
            </form>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
              Step 2 — Verify Reset Code
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit reset code sent to <span className="font-semibold">{email}</span>.
            </p>

            <div className="mt-6 flex gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`reset-otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="h-10 w-10 rounded-lg border border-slate-800 bg-slate-950 text-center text-sm text-slate-100 outline-none focus:border-primary"
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <button className="underline underline-offset-2">Resend OTP</button>
              <button
                className="underline underline-offset-2"
                onClick={() => setStep(1)}
              >
                Change Email
              </button>
            </div>

            <button
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
              onClick={() => setStep(3)}
              disabled={otpString.length !== 6}
            >
              Verify &amp; Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
              Step 3 — Create a New Password
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Set a new password for your account. Make sure it is strong and that
              you do not reuse old passwords.
            </p>

            <form
              className="mt-6 space-y-4 text-xs text-slate-300"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(4);
              }}
            >
              <div>
                <label className="mb-1 block text-[11px] text-slate-400" htmlFor="password">
                  New Password
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
                <label className="mb-1 block text-[11px] text-slate-400" htmlFor="confirm">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary"
                  placeholder="Re-enter your new password"
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1 text-[10px] text-red-400">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
                disabled={!password || password !== confirmPassword}
              >
                Update Password
              </button>
            </form>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <div className="rounded-2xl border border-emerald-600/60 bg-emerald-950/20 p-5 text-xs text-slate-200 md:text-sm">
              <div className="text-lg font-semibold text-emerald-400">
                Password Reset Email Sent
              </div>
              <p className="mt-2 text-slate-300">
                If an account exists with this email, a password reset link has been sent.
                Please open your email and click the link to set a new password.
              </p>
              <a
                href="/auth/login"
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                Back to Login
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
