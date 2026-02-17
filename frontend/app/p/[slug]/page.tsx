import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

type PublicCmsPageResponse = {
  success: boolean;
  redirect?: {
    to: string;
    permanent: boolean;
  } | null;
  page?: {
    id: number;
    title: string;
    slug: string;
    contentHtml: string;
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
      twitterCardType?: string;
      robotsIndex?: boolean;
      jsonLd?: string;
    };
  } | null;
};

async function fetchCmsPage(slug: string): Promise<PublicCmsPageResponse | null> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/public/cms-pages/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    return data as PublicCmsPageResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params?.slug;
  if (!slug) return {};

  const data = await fetchCmsPage(slug);
  if (!data?.success) return {};
  if (data.redirect?.to) return {};

  const page = data.page;
  if (!page) return {};

  const seo = page.seo || {};

  const title = (seo.metaTitle && seo.metaTitle.trim()) ? seo.metaTitle.trim() : page.title;
  const description = (seo.metaDescription && seo.metaDescription.trim()) ? seo.metaDescription.trim() : undefined;
  const keywords = (seo.metaKeywords && seo.metaKeywords.trim())
    ? seo.metaKeywords.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  const robotsIndex = seo.robotsIndex !== false;

  const ogTitle = (seo.ogTitle && seo.ogTitle.trim()) ? seo.ogTitle.trim() : title;
  const ogDescription = (seo.ogDescription && seo.ogDescription.trim()) ? seo.ogDescription.trim() : description;
  const ogImageUrl = (seo.ogImageUrl && seo.ogImageUrl.trim()) ? seo.ogImageUrl.trim() : undefined;

  const canonicalUrl = (seo.canonicalUrl && seo.canonicalUrl.trim()) ? seo.canonicalUrl.trim() : undefined;

  return {
    title,
    description,
    keywords,
    robots: robotsIndex ? { index: true, follow: true } : { index: false, follow: false },
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      type: 'article',
      title: ogTitle,
      description: ogDescription,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: ((seo.twitterCardType && seo.twitterCardType.trim()) ? seo.twitterCardType.trim() : 'summary_large_image') as any,
      title: ogTitle,
      description: ogDescription,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function CmsPageBySlug({ params }: { params: { slug: string } }) {
  const slug = params?.slug;
  if (!slug) notFound();

  const data = await fetchCmsPage(slug);
  if (!data?.success) notFound();

  if (data.redirect?.to) {
    redirect(data.redirect.to);
  }

  const page = data.page;
  if (!page) notFound();

  const jsonLdRaw = page.seo?.jsonLd;
  const hasJsonLd = typeof jsonLdRaw === 'string' && jsonLdRaw.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <article className="prose prose-invert max-w-none">
        <h1>{page.title}</h1>
        {hasJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdRaw as string }}
          />
        ) : null}
        <div dangerouslySetInnerHTML={{ __html: page.contentHtml || '' }} />
      </article>
    </div>
  );
}
