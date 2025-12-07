'use client';

import { useMemo, useState } from 'react';

type SignupStep = 1 | 2 | 3;

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);

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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const otpString = otp.join('');

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
            Sign up in just a few simple steps, verify your email and get ready to
            start earning from automated arbitrage trading.
          </p>
        </div>
      </section>

      {/* Step content */}
      {step === 1 && (
        <section className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
              Sign Up — Step 1
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter your basic details to create your Arbix account.
            </p>

            <form
              className="mt-6 space-y-4 text-xs text-slate-300"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <div>
                <label className="mb-1 block text-[11px] text-slate-400" htmlFor="name">
                  Full Name
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

              <div>
                <label className="mb-1 block text-[11px] text-slate-400" htmlFor="password">
                  Password
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
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
              >
                Next: Send OTP
              </button>

              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
                <span>✔ Data is encrypted</span>
                <span>✔ No hidden fees</span>
                <span>✔ Takes only 1 minute</span>
              </div>
            </form>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="border-b border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <h2 className="text-lg font-semibold text-slate-50 md:text-xl">
              Verify Your Email
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              We have sent a 6-digit OTP to <span className="font-semibold">{email}</span>.
              Please enter it below to verify your account.
            </p>

            <div className="mt-6 flex gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
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

            <p className="mt-3 text-[10px] text-slate-500">
              ✔ OTP expires in 10 minutes • ✔ Helps keep your account secure
            </p>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
            <div className="rounded-2xl border border-emerald-600/60 bg-emerald-950/20 p-5 text-xs text-slate-200 md:text-sm">
              <div className="text-lg font-semibold text-emerald-400">
                🎉 Congratulations — Your Account is Ready!
              </div>
              <p className="mt-2 text-slate-300">
                Your email has been verified and your Arbix account has been created
                successfully. You can now log in and start your earning journey.
              </p>

              <div className="mt-4 grid gap-2 text-[11px] text-slate-200 md:grid-cols-2">
                <p>
                  <span className="font-semibold">Full Name:</span> {fullName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {email}
                </p>
                <p>
                  <span className="font-semibold">Referral Code Used:</span>{' '}
                  {referralCode || 'None'}
                </p>
                <p>
                  <span className="font-semibold">Account Status:</span> Verified
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                <a
                  href="/auth/login"
                  className="rounded-lg bg-primary px-5 py-2 font-medium text-white hover:bg-blue-500"
                >
                  Go to Login
                </a>
                <a
                  href="/how-it-works"
                  className="rounded-lg border border-slate-700 px-5 py-2 text-slate-100 hover:border-slate-500"
                >
                  Explore How It Works
                </a>
              </div>

              <p className="mt-4 text-[10px] text-slate-500">
                A welcome email is typically sent with your account details,
                security notice, login link, support contact and links to Terms &amp;
                Risk Disclosure.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-slate-500">
                <span>✔ SSL Secured</span>
                <span>✔ Encrypted Data</span>
                <span>✔ KYC Compliant</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
