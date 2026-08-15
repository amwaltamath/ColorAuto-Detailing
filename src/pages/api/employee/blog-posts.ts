import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../utils/supabaseServer';

const SELECT_COLUMNS = [
  'slug',
  'title',
  'description',
  'publish_date',
  'image',
  'image_alt',
  'category',
  'featured',
  'author',
  'location',
  'project_summary',
  'services_performed',
  'duration',
  'material_highlight',
  'cta_label',
  'cta_href',
  'phone_number',
  'gallery',
  'body_markdown',
  'created_at',
  'updated_at',
].join(',');

export const GET: APIRoute = async () => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: false, posts: [], error: 'Supabase is not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data, error } = await supabaseServer
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .order('publish_date', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ ok: false, posts: [], error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, posts: data || [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: false, error: 'Supabase is not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';

    if (!slug) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing slug' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {};

    const stringFields: Array<[string, string]> = [
      ['title', 'title'],
      ['description', 'description'],
      ['image', 'image'],
      ['imageAlt', 'image_alt'],
      ['category', 'category'],
      ['author', 'author'],
      ['location', 'location'],
      ['projectSummary', 'project_summary'],
      ['duration', 'duration'],
      ['materialHighlight', 'material_highlight'],
      ['ctaLabel', 'cta_label'],
      ['ctaHref', 'cta_href'],
      ['phoneNumber', 'phone_number'],
    ];

    for (const [inputKey, dbKey] of stringFields) {
      if (typeof body[inputKey] === 'string') {
        const value = body[inputKey].trim();
        if (value) updates[dbKey] = value;
      }
    }

    if (typeof body.featured === 'boolean') {
      updates.featured = body.featured;
    }

    if (typeof body.publishDate === 'string') {
      const date = new Date(body.publishDate);
      if (!Number.isNaN(date.getTime())) {
        updates.publish_date = date.toISOString().slice(0, 10);
      }
    }

    if (Array.isArray(body.servicesPerformed)) {
      updates.services_performed = body.servicesPerformed
        .filter((item: unknown): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 25);
    }

    if (Array.isArray(body.gallery)) {
      updates.gallery = body.gallery
        .filter((item: unknown) => item && typeof item === 'object')
        .map((item: any) => ({
          src: typeof item.src === 'string' ? item.src : '',
          alt: typeof item.alt === 'string' ? item.alt : '',
        }))
        .filter((item: { src: string; alt: string }) => item.src && item.alt);
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No changes provided' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { data, error } = await supabaseServer
      .from('blog_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)
      .select(SELECT_COLUMNS)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, post: data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ ok: false, error: error?.message || 'Update failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};