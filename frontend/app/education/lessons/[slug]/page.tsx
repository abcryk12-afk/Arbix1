'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EDUCATION_LESSONS, type EducationLesson } from '../../lessonsData';

type Props = {
  params: {
    slug: string;
  };
};

export default function EducationLessonPage({ params }: Props) {
  const slug = params.slug;
  const lesson: EducationLesson | undefined = useMemo(
    () => EDUCATION_LESSONS.find((l) => l.slug === slug),
    [slug]
  );

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

  const isLocked = Boolean(lesson?.isPremium) && (!isLoggedIn || !hasActivePackage);

  if (!lesson) {
    return (
      <main className="arbix-page-enter min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="arbix-card rounded-3xl p-6">
            <div className="text-lg font-semibold text-slate-100">Lesson not found</div>
            <div className="mt-2 text-sm text-slate-400">This lesson does not exist.</div>
            <Link
              href="/education"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Back to Education
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="arbix-page-enter min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/education"
            className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-200 hover:border-slate-700"
          >
            Back
          </Link>
          {lesson.isPremium ? (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
              Premium
            </span>
          ) : (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
              Free
            </span>
          )}
        </div>

        <div className="relative arbix-card rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{lesson.title}</h1>
            <p className="text-sm text-slate-400">{lesson.description}</p>
            {lesson.kind === 'video' && lesson.duration ? (
              <div className="text-[11px] text-slate-500">Duration: {lesson.duration}</div>
            ) : null}
          </div>

          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/55 backdrop-blur-sm">
              <div className="max-w-sm text-center">
                {!isLoggedIn ? (
                  <>
                    <div className="text-sm font-semibold text-slate-100">Login required</div>
                    <div className="mt-1 text-[11px] text-slate-400">Login to view premium lessons.</div>
                    <Link
                      href="/auth/login"
                      className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Login
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-slate-100">Active package required</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {isCheckingEligibility ? 'Checking eligibility…' : 'Activate any package to unlock premium.'}
                    </div>
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

          <div className={isLocked ? 'pointer-events-none select-none opacity-40' : ''}>
            {lesson.kind === 'video' && (
              <div className="mt-6">
                {lesson.youtubeEmbedUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
                    <iframe
                      src={lesson.youtubeEmbedUrl}
                      title={lesson.title}
                      className="h-[240px] w-full md:h-[420px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={lesson.youtubeUrl || 'https://www.youtube.com/'}
                    target="_blank"
                    rel="noreferrer"
                    className="arbix-card arbix-3d rounded-2xl p-5"
                  >
                    <div className="text-sm font-semibold text-slate-100">Open video on YouTube</div>
                    <div className="mt-1 text-sm text-slate-400">
                      Temporary link (search). You can replace it with your official playlist later.
                    </div>
                    <div className="mt-3 text-[11px] text-slate-300">Open</div>
                  </a>
                )}
              </div>
            )}

            {lesson.kind === 'pdf' && (
              <div className="mt-6">
                {lesson.pdfUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
                    <iframe
                      src={lesson.pdfUrl}
                      title={lesson.title}
                      className="h-[520px] w-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">
                    PDF not available.
                  </div>
                )}

                {lesson.pdfUrl ? (
                  <a
                    href={lesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-slate-200 hover:border-slate-700"
                  >
                    Download / Open PDF
                  </a>
                ) : null}
              </div>
            )}

            {lesson.kind === 'blog' && (
              <div className="mt-6 space-y-4">
                {(lesson.sections || []).map((s) => (
                  <section key={s.heading} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="text-sm font-semibold text-slate-100">{s.heading}</div>
                    <div className="mt-2 space-y-2 text-sm text-slate-300">
                      {s.paragraphs.map((p, idx) => (
                        <p key={idx} className="leading-relaxed text-slate-300">
                          {p}
                        </p>
                      ))}
                    </div>
                    {Array.isArray(s.bullets) && s.bullets.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                        {s.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}

                {(lesson.sections || []).length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">
                    Lesson content will be added soon.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
