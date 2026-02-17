const { Op } = require('sequelize');
const { CmsPage, CmsPageSlug, sequelize } = require('../models');

const MAX_LEN = {
  title: 200,
  slug: 180,
  metaTitle: 120,
  metaDescription: 300,
  metaKeywords: 500,
  canonicalUrl: 300,
  ogTitle: 120,
  ogDescription: 300,
  ogImageUrl: 300,
  twitterCardType: 40,
  jsonLd: 6000,
};

function cleanText(v, max) {
  if (v == null) return '';
  const s = String(v).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

function cleanLongText(v) {
  if (v == null) return '';
  return String(v).trim();
}

function sanitizeCmsHtml(html) {
  const src = cleanLongText(html);
  if (!src) return '';

  let out = src;

  // Remove script tags completely
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove common inline event handlers
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs in href/src
  out = out.replace(/\s(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '');
  out = out.replace(/\s(href|src)\s*=\s*'\s*javascript:[^']*'/gi, '');

  return out;
}

function normalizeSlug(v) {
  const raw = String(v || '').trim().toLowerCase();
  if (!raw) return '';
  const s = raw
    .replace(/[^a-z0-9\-_/]/g, '-')
    .replace(/\/+/, '/')
    .replace(/-+/g, '-')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/^\-+/, '')
    .replace(/\-+$/, '');

  if (!s) return '';
  if (s.includes('..')) return '';
  if (s.length > MAX_LEN.slug) return s.slice(0, MAX_LEN.slug);
  return s;
}

function cleanUrl(v, max) {
  const s = cleanText(v, max);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

function normalizeTwitterCard(v) {
  const raw = String(v || '').trim().toLowerCase();
  if (!raw) return '';
  const allowed = new Set(['summary', 'summary_large_image', 'app', 'player']);
  return allowed.has(raw) ? raw : '';
}

function normalizeRobotsIndex(v) {
  if (v === false || v === 'false' || v === '0' || v === 0) return 0;
  if (v === true || v === 'true' || v === '1' || v === 1) return 1;
  return 1;
}

function toAdminDto(page, currentSlugRow) {
  return {
    id: page.id,
    title: page.title,
    slug: currentSlugRow?.slug || null,
    isPublished: !!page.is_published,
    publishedAt: page.published_at,
    updatedAt: page.updated_at,
    createdAt: page.created_at,
    seo: {
      metaTitle: page.meta_title || '',
      metaDescription: page.meta_description || '',
      metaKeywords: page.meta_keywords || '',
      canonicalUrl: page.canonical_url || '',
      ogTitle: page.og_title || '',
      ogDescription: page.og_description || '',
      ogImageUrl: page.og_image_url || '',
      twitterCardType: page.twitter_card_type || '',
      robotsIndex: page.robots_index !== 0,
      jsonLd: page.json_ld || '',
    },
    contentHtml: page.content_html || '',
  };
}

exports.listAdminCmsPages = async (req, res) => {
  try {
    const q = cleanText(req.query?.q, 120);
    const where = {};

    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
      ];
    }

    const pages = await CmsPage.findAll({
      where,
      order: [['updated_at', 'DESC']],
      limit: 200,
    });

    const ids = pages.map((p) => p.id);
    const slugRows = ids.length
      ? await CmsPageSlug.findAll({
          where: { page_id: { [Op.in]: ids }, is_current: 1 },
        })
      : [];

    const slugByPage = new Map(slugRows.map((r) => [r.page_id, r]));

    return res.status(200).json({
      success: true,
      pages: pages.map((p) => toAdminDto(p, slugByPage.get(p.id))),
    });
  } catch (error) {
    console.error('List admin cms pages error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load pages' });
  }
};

exports.listPublicCmsPages = async (req, res) => {
  try {
    const rows = await CmsPage.findAll({
      where: { is_published: 1 },
      attributes: ['id', 'updated_at', 'published_at'],
      order: [['updated_at', 'DESC']],
      limit: 5000,
    });

    const ids = rows.map((r) => r.id);
    const slugRows = ids.length
      ? await CmsPageSlug.findAll({
          where: { page_id: { [Op.in]: ids }, is_current: 1 },
          attributes: ['page_id', 'slug'],
        })
      : [];

    const slugByPage = new Map(slugRows.map((r) => [r.page_id, r.slug]));

    const pages = rows
      .map((p) => {
        const slug = slugByPage.get(p.id);
        if (!slug) return null;
        return {
          slug,
          updatedAt: p.updated_at,
          publishedAt: p.published_at,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, pages });
  } catch (error) {
    console.error('List public cms pages error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAdminCmsPage = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid page id' });
    }

    const page = await CmsPage.findByPk(id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const currentSlug = await CmsPageSlug.findOne({ where: { page_id: id, is_current: 1 } });
    const slugs = await CmsPageSlug.findAll({ where: { page_id: id }, order: [['created_at', 'DESC']] });

    return res.status(200).json({
      success: true,
      page: toAdminDto(page, currentSlug),
      slugHistory: slugs.map((s) => ({ slug: s.slug, isCurrent: !!s.is_current, createdAt: s.created_at })),
    });
  } catch (error) {
    console.error('Get admin cms page error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load page' });
  }
};

exports.createAdminCmsPage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const title = cleanText(req.body?.title, MAX_LEN.title);
    const slug = normalizeSlug(req.body?.slug);

    if (!title) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!slug) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }

    const existingSlug = await CmsPageSlug.findOne({ where: { slug } });
    if (existingSlug) {
      await t.rollback();
      return res.status(409).json({ success: false, message: 'Slug already exists' });
    }

    const page = await CmsPage.create(
      {
        title,
        content_html: sanitizeCmsHtml(req.body?.contentHtml),
        is_published: req.body?.isPublished ? 1 : 0,
        published_at: req.body?.isPublished ? new Date() : null,
        meta_title: cleanText(req.body?.seo?.metaTitle, MAX_LEN.metaTitle) || null,
        meta_description: cleanText(req.body?.seo?.metaDescription, MAX_LEN.metaDescription) || null,
        meta_keywords: cleanText(req.body?.seo?.metaKeywords, MAX_LEN.metaKeywords) || null,
        canonical_url: cleanUrl(req.body?.seo?.canonicalUrl, MAX_LEN.canonicalUrl) || null,
        og_title: cleanText(req.body?.seo?.ogTitle, MAX_LEN.ogTitle) || null,
        og_description: cleanText(req.body?.seo?.ogDescription, MAX_LEN.ogDescription) || null,
        og_image_url: cleanText(req.body?.seo?.ogImageUrl, MAX_LEN.ogImageUrl) || null,
        twitter_card_type: normalizeTwitterCard(req.body?.seo?.twitterCardType) || null,
        robots_index: normalizeRobotsIndex(req.body?.seo?.robotsIndex),
        json_ld: cleanText(req.body?.seo?.jsonLd, MAX_LEN.jsonLd) || null,
      },
      { transaction: t },
    );

    await CmsPageSlug.create(
      {
        page_id: page.id,
        slug,
        is_current: 1,
      },
      { transaction: t },
    );

    await t.commit();

    const currentSlug = await CmsPageSlug.findOne({ where: { page_id: page.id, is_current: 1 } });
    return res.status(201).json({ success: true, page: toAdminDto(page, currentSlug) });
  } catch (error) {
    await t.rollback();
    console.error('Create admin cms page error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create page' });
  }
};

exports.updateAdminCmsPage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid page id' });
    }

    const page = await CmsPage.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!page) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const title = cleanText(req.body?.title, MAX_LEN.title);
    const nextSlug = normalizeSlug(req.body?.slug);

    if (!title) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!nextSlug) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }

    const currentSlugRow = await CmsPageSlug.findOne({ where: { page_id: id, is_current: 1 }, transaction: t, lock: t.LOCK.UPDATE });
    const currentSlug = currentSlugRow?.slug || '';

    if (nextSlug !== currentSlug) {
      const existingSlug = await CmsPageSlug.findOne({ where: { slug: nextSlug } , transaction: t, lock: t.LOCK.UPDATE });
      if (existingSlug) {
        await t.rollback();
        return res.status(409).json({ success: false, message: 'Slug already exists' });
      }

      if (currentSlugRow) {
        await currentSlugRow.update({ is_current: 0 }, { transaction: t });
      }

      await CmsPageSlug.create(
        {
          page_id: id,
          slug: nextSlug,
          is_current: 1,
        },
        { transaction: t },
      );
    }

    const isPublished = !!req.body?.isPublished;

    await page.update(
      {
        title,
        content_html: sanitizeCmsHtml(req.body?.contentHtml),
        is_published: isPublished ? 1 : 0,
        published_at: isPublished ? (page.published_at || new Date()) : null,
        meta_title: cleanText(req.body?.seo?.metaTitle, MAX_LEN.metaTitle) || null,
        meta_description: cleanText(req.body?.seo?.metaDescription, MAX_LEN.metaDescription) || null,
        meta_keywords: cleanText(req.body?.seo?.metaKeywords, MAX_LEN.metaKeywords) || null,
        canonical_url: cleanUrl(req.body?.seo?.canonicalUrl, MAX_LEN.canonicalUrl) || null,
        og_title: cleanText(req.body?.seo?.ogTitle, MAX_LEN.ogTitle) || null,
        og_description: cleanText(req.body?.seo?.ogDescription, MAX_LEN.ogDescription) || null,
        og_image_url: cleanText(req.body?.seo?.ogImageUrl, MAX_LEN.ogImageUrl) || null,
        twitter_card_type: normalizeTwitterCard(req.body?.seo?.twitterCardType) || null,
        robots_index: normalizeRobotsIndex(req.body?.seo?.robotsIndex),
        json_ld: cleanText(req.body?.seo?.jsonLd, MAX_LEN.jsonLd) || null,
      },
      { transaction: t },
    );

    await t.commit();

    const fresh = await CmsPage.findByPk(id);
    const freshSlug = await CmsPageSlug.findOne({ where: { page_id: id, is_current: 1 } });
    return res.status(200).json({ success: true, page: toAdminDto(fresh, freshSlug) });
  } catch (error) {
    await t.rollback();
    console.error('Update admin cms page error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update page' });
  }
};

exports.deleteAdminCmsPage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid page id' });
    }

    await CmsPageSlug.destroy({ where: { page_id: id }, transaction: t });
    const deleted = await CmsPage.destroy({ where: { id }, transaction: t });
    await t.commit();

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    await t.rollback();
    console.error('Delete admin cms page error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete page' });
  }
};

exports.getPublicCmsPageBySlug = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params?.slug);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Invalid slug' });
    }

    const slugRow = await CmsPageSlug.findOne({ where: { slug } });
    if (!slugRow) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const page = await CmsPage.findByPk(slugRow.page_id);
    if (!page || page.is_published !== 1) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const currentSlugRow = await CmsPageSlug.findOne({ where: { page_id: page.id, is_current: 1 } });
    const currentSlug = currentSlugRow?.slug || slug;

    const isRedirect = currentSlug && currentSlug !== slug;

    return res.status(200).json({
      success: true,
      redirect: isRedirect
        ? {
            to: `/p/${currentSlug}`,
            permanent: true,
          }
        : null,
      page: isRedirect
        ? null
        : {
            id: page.id,
            title: page.title,
            slug: currentSlug,
            contentHtml: page.content_html || '',
            publishedAt: page.published_at,
            updatedAt: page.updated_at,
            seo: {
              metaTitle: page.meta_title || '',
              metaDescription: page.meta_description || '',
              metaKeywords: page.meta_keywords || '',
              canonicalUrl: page.canonical_url || '',
              ogTitle: page.og_title || '',
              ogDescription: page.og_description || '',
              ogImageUrl: page.og_image_url || '',
              twitterCardType: page.twitter_card_type || '',
              robotsIndex: page.robots_index !== 0,
              jsonLd: page.json_ld || '',
            },
          },
    });
  } catch (error) {
    console.error('Get public cms page by slug error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
