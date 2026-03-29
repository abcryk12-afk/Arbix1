import Link from 'next/link';
import { EDUCATION_LESSONS } from '../education/lessonsData';

export default function BlogIndexPage() {
  const posts = EDUCATION_LESSONS.filter((l) => l.kind === 'blog' && !l.isPremium);

  return (
    <main className="arbix-page-enter min-h-screen bg-page text-fg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="arbix-card rounded-3xl p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/30 px-3 py-1 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Arbix Cloud Blog
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-heading md:text-3xl">
            Arbitrage insights, explained in plain language.
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Practical, risk-aware articles about arbitrage trading, systematic strategies, and responsible ways to think about passive income.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="arbix-card arbix-3d rounded-3xl p-6 transition hover:opacity-95"
            >
              <div className="text-sm font-semibold text-heading">{p.title}</div>
              <div className="mt-2 text-sm text-muted">{p.description}</div>
              <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Read article
              </div>
            </Link>
          ))}

          {posts.length === 0 ? (
            <div className="arbix-card rounded-3xl p-6 text-sm text-muted md:col-span-3">
              Blog posts will be added soon.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
