'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            LOGIN
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            Login to Your Account
          </h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">
            Enter your credentials to securely access your Arbix dashboard.
          </p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <form
            className="space-y-4 text-xs text-slate-300"
            onSubmit={(e) => {
              e.preventDefault();
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
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
            >
              Login Securely
            </button>

            <div className="mt-3 flex flex-col gap-1 text-[11px] text-slate-400">
              <a href="/auth/forgot-password" className="hover:text-slate-200">
                Forgot Password?
              </a>
              <p>
                New here?{' '}
                <a href="/auth/signup" className="text-primary hover:text-blue-400">
                  Create an account
                </a>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span>✔ SSL Protected</span>
              <span>✔ Encrypted Login</span>
              <span>✔ 2FA Ready (optional)</span>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
