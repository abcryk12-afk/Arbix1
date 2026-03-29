import Link from 'next/link';
import { EDUCATION_LESSONS } from '../../education/lessonsData';

type Props = {
  params: {
    slug: string;
  };
};

export default function BlogPostPage({ params }: Props) {
  const slug = params.slug;
  const post = EDUCATION_LESSONS.find((l) => l.kind === 'blog' && !l.isPremium && l.slug === slug);

  if (!post) {
    return (
      <main className="arbix-page-enter min-h-screen bg-page text-fg">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="arbix-card rounded-3xl p-6">
            <div className="text-lg font-semibold text-heading">Post not found</div>
            <div className="mt-2 text-sm text-muted">We couldn’t find this blog post.</div>
            <Link
              href="/blog"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-fg transition hover:opacity-95"
            >
              Back to blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="arbix-page-enter min-h-screen bg-page text-fg">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/blog"
            className="rounded-xl border border-border bg-surface/40 px-4 py-2 text-xs text-fg transition hover:opacity-95"
          >
            Back
          </Link>
          <span className="rounded-full border border-border bg-success/10 px-3 py-1 text-[11px] text-success-fg">
            Blog
          </span>
        </div>

        <article className="arbix-card rounded-3xl p-6 md:p-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-heading md:text-3xl">{post.title}</h1>
            <p className="text-sm text-muted">{post.description}</p>
          </header>

          <div className="mt-6 space-y-4">
            {(post.sections || []).map((s) => (
              <section key={s.heading} className="rounded-2xl border border-border bg-surface/40 p-5">
                <h2 className="text-sm font-semibold text-heading">{s.heading}</h2>
                <div className="mt-2 space-y-2 text-sm text-muted">
                  {s.paragraphs.map((p, idx) => (
                    <p key={idx} className="leading-relaxed text-muted">
                      {p}
                    </p>
                  ))}
                </div>
                {Array.isArray(s.bullets) && s.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            {(post.sections || []).length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface/40 p-5 text-sm text-muted">
                Post content will be added soon.
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </main>
  );
}
