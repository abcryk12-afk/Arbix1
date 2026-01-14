'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EDUCATION_LESSONS } from './lessonsData';

type EducationTab = 'overview' | 'articles' | 'videos' | 'resources' | 'premium';

type EducationCard = {
  title: string;
  description: string;
  href: string;
  badge?: string;
};

type VideoCard = {
  title: string;
  description: string;
  href: string;
  duration?: string;
};

type PdfCard = {
  title: string;
  description: string;
  href: string;
};

export default function EducationPage() {
  const [tab, setTab] = useState<EducationTab>('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  useEffect(() => {
    try {
      setIsLoggedIn(Boolean(localStorage.getItem('token')));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasActivePackage(false);
          return;
        }

        setIsCheckingEligibility(true);

        const res = await fetch('/api/user/packages', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        const pkgs = data?.success && Array.isArray(data?.packages) ? data.packages : [];
        const anyActive = pkgs.some((p: any) => String(p?.status || '').toLowerCase() === 'active');
        setHasActivePackage(Boolean(anyActive));
      } catch {
        setHasActivePackage(false);
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    if (!isLoggedIn) {
      setHasActivePackage(false);
      return;
    }

    run();
  }, [isLoggedIn]);

  const articles: EducationCard[] = useMemo(() => {
    return EDUCATION_LESSONS.filter((l) => l.kind === 'blog' && !l.isPremium).map((l) => ({
      title: l.title,
      description: l.description,
      href: `/education/lessons/${l.slug}`,
      badge: 'Lesson',
    }));
  }, []);

  const videos: VideoCard[] = useMemo(() => {
    return EDUCATION_LESSONS.filter((l) => l.kind === 'video' && !l.isPremium).map((l) => ({
      title: l.title,
      description: l.description,
      href: `/education/lessons/${l.slug}`,
      duration: l.duration,
    }));
  }, []);

  const resources: PdfCard[] = useMemo(() => {
    return EDUCATION_LESSONS.filter((l) => l.kind === 'pdf' && !l.isPremium).map((l) => ({
      title: l.title,
      description: l.description,
      href: `/education/lessons/${l.slug}`,
    }));
  }, []);

  const premiumModules: EducationCard[] = useMemo(() => {
    return EDUCATION_LESSONS.filter((l) => l.isPremium).map((l) => ({
      title: l.title,
      description: l.description,
      href: `/education/lessons/${l.slug}`,
      badge: l.kind === 'pdf' ? 'Premium PDF' : l.kind === 'video' ? 'Premium Video' : 'Premium Lesson',
    }));
  }, []);

  const tabButton = (id: EducationTab, label: string) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={
          'rounded-xl px-3 py-2 text-xs font-medium transition-colors ' +
          (active
            ? 'bg-slate-900 text-slate-50'
            : 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100')
        }
      >
        {label}
      </button>
    );
  };

  return (
    <main className="arbix-page-enter min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="arbix-card rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Arbix Education
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                Learn, grow, and invest smarter.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                A professional learning hub for Arbix users: guides, videos, and premium modules for logged-in members.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  Login to Unlock Premium
                </Link>
              )}

              {isLoggedIn && !hasActivePackage ? (
                <Link
                  href="/dashboard/packages"
                  className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-200 hover:border-slate-700"
                >
                  Activate a Package
                </Link>
              ) : null}
              <Link
                href="/contact"
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-200 hover:border-slate-700"
              >
                Need Help?
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-1">
            <div className="flex flex-wrap gap-1">
              {tabButton('overview', 'Overview')}
              {tabButton('articles', 'Articles')}
              {tabButton('videos', 'Videos')}
              {tabButton('resources', 'PDFs')}
              {tabButton('premium', 'Premium')}
            </div>
          </div>
        </div>

        {tab === 'overview' && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="arbix-card rounded-3xl p-6">
              <div className="text-sm font-semibold text-slate-100">What you will learn</div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-[11px] text-slate-500">01</div>
                  <div className="mt-1 font-medium text-slate-100">Platform flow</div>
                  <div className="mt-1 text-[11px] text-slate-400">Account, deposit, packages, daily earnings, withdrawals.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-[11px] text-slate-500">02</div>
                  <div className="mt-1 font-medium text-slate-100">Security discipline</div>
                  <div className="mt-1 text-[11px] text-slate-400">Avoid scams, protect credentials, reduce risk mistakes.</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-[11px] text-slate-500">03</div>
                  <div className="mt-1 font-medium text-slate-100">Premium strategies</div>
                  <div className="mt-1 text-[11px] text-slate-400">For logged-in users: structured modules and resources.</div>
                </div>
              </div>
            </div>

            <div className="arbix-card rounded-3xl p-6">
              <div className="text-sm font-semibold text-slate-100">Quick start</div>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => setTab('articles')}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left text-sm text-slate-200 hover:border-slate-700"
                >
                  <div className="font-medium text-slate-100">Read guides</div>
                  <div className="mt-1 text-[11px] text-slate-400">Start with simple explanations and important warnings.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('videos')}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left text-sm text-slate-200 hover:border-slate-700"
                >
                  <div className="font-medium text-slate-100">Watch videos</div>
                  <div className="mt-1 text-[11px] text-slate-400">Short walkthroughs to minimize mistakes.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('premium')}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left text-sm text-slate-200 hover:border-slate-700"
                >
                  <div className="font-medium text-slate-100">Explore premium</div>
                  <div className="mt-1 text-[11px] text-slate-400">Login required to view full premium modules.</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'articles' && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <a
                key={a.title}
                href={a.href}
                className="arbix-card arbix-3d rounded-3xl p-6 hover:text-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-100">{a.title}</div>
                  {a.badge ? (
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] text-blue-200">
                      {a.badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-sm text-slate-400">{a.description}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Open
                </div>
              </a>
            ))}
          </div>
        )}

        {tab === 'resources' && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {resources.map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="arbix-card arbix-3d rounded-3xl p-6"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-100">{r.title}</div>
                  <span className="rounded-full border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-300">
                    PDF
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-400">{r.description}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Open
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'videos' && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {videos.map((v) => (
              <Link
                key={v.title}
                href={v.href}
                className="arbix-card arbix-3d rounded-3xl p-6"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-100">{v.title}</div>
                  {v.duration ? (
                    <span className="rounded-full border border-slate-800 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-300">
                      {v.duration}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 text-sm text-slate-400">{v.description}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Open
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === 'premium' && (
          <div className="mt-6">
            <div className="arbix-card rounded-3xl p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Premium Modules</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Full access is available for users with an active package.
                  </div>
                </div>
                {!isLoggedIn ? (
                  <Link
                    href="/auth/login"
                    className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Login
                  </Link>
                ) : !hasActivePackage ? (
                  <Link
                    href="/dashboard/packages"
                    className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Activate Package
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {premiumModules.map((m) => (
                  <div key={m.title} className="relative">
                    <Link
                      href={m.href}
                      className={
                        'arbix-card arbix-3d rounded-3xl p-6 block ' +
                        (!isLoggedIn || !hasActivePackage ? 'opacity-70' : '')
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-100">{m.title}</div>
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">
                          {m.badge || 'Premium'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-400">{m.description}</div>
                      <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {isCheckingEligibility ? 'Checking...' : isLoggedIn && hasActivePackage ? 'Open' : 'Locked'}
                      </div>
                    </Link>

                    {(!isLoggedIn || !hasActivePackage) && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
                        <div className="text-center">
                          {!isLoggedIn ? (
                            <>
                              <div className="text-xs font-semibold text-slate-100">Login required</div>
                              <div className="mt-1 text-[11px] text-slate-400">Unlock premium modules</div>
                              <Link
                                href="/auth/login"
                                className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                              >
                                Login
                              </Link>
                            </>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-slate-100">Active package required</div>
                              <div className="mt-1 text-[11px] text-slate-400">Activate any package to unlock</div>
                              <Link
                                href="/dashboard/packages"
                                className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                              >
                                Activate Package
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
              Want us to add specific lessons (Urdu/Hindi/English), PDFs, or a structured course plan? Share your topics list and I will organize it as modules.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
