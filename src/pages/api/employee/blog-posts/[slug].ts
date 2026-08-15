import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

const BLOG_STORAGE_BUCKET = process.env.BLOG_STORAGE_BUCKET || import.meta.env.BLOG_STORAGE_BUCKET || 'blog-images';

function extractStoragePath(publicUrl: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${BLOG_STORAGE_BUCKET}/`;
    const markerIndex = publicUrl.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(publicUrl.slice(markerIndex + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}

export const DELETE: APIRoute = async ({ params }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ ok: false, error: 'Supabase is not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  const slug = params.slug?.trim();
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing slug' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { data: existing, error: fetchError } = await supabaseServer
    .from('blog_posts')
    .select('image,gallery')
    .eq('slug', slug)
    .maybeSingle();

  if (fetchError) {
    return new Response(JSON.stringify({ ok: false, error: fetchError.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const storagePaths = new Set<string>();

  if (existing?.image) {
    const path = extractStoragePath(existing.image);
    if (path) storagePaths.add(path);
  }

  if (Array.isArray(existing?.gallery)) {
    for (const item of existing.gallery) {
      if (item && typeof item === 'object' && typeof (item as any).src === 'string') {
        const path = extractStoragePath((item as any).src);
        if (path) storagePaths.add(path);
      }
    }
  }

  if (storagePaths.size > 0) {
    await supabaseServer.storage.from(BLOG_STORAGE_BUCKET).remove(Array.from(storagePaths));
  }

  const { error } = await supabaseServer
    .from('blog_posts')
    .delete()
    .eq('slug', slug);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};