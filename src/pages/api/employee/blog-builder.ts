import type { APIRoute } from 'astro';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { supabaseServer } from '../../../utils/supabaseServer';

const VALID_CATEGORIES = new Set([
  'detailing',
  'ppf',
  'ceramic-coating',
  'window-tint',
  'color-ppf',
]);

const VALID_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_COUNT = 12;
const BLOG_STORAGE_BUCKET = process.env.BLOG_STORAGE_BUCKET || import.meta.env.BLOG_STORAGE_BUCKET || 'blog-images';

function sanitizeForSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sanitizeFileStem(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9-_ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function escapeQuotes(input: string): string {
  return input.replace(/"/g, '\\"');
}

function normalizeServices(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toMultilineBullets(input: string): string[] {
  return normalizeServices(input).map((line) => `- ${line}`);
}

async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function extensionFromFile(file: File): string {
  const byName = extname(file.name || '').toLowerCase();
  if (byName) return byName;

  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/webp') return '.webp';
  if (file.type === 'image/avif') return '.avif';
  return '.jpg';
}

async function resolveUniqueSlug(baseSlug: string): Promise<string> {
  if (!supabaseServer) return baseSlug;

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabaseServer
      .from('blog_posts')
      .select('id')
      .eq('slug', candidate)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildMarkdown(input: {
  title: string;
  description: string;
  publishDate: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  featured: boolean;
  author: string;
  location: string;
  projectSummary: string;
  servicesList: string[];
  duration: string;
  materialHighlight: string;
  ctaLabel: string;
  ctaHref: string;
  phoneNumber: string;
  gallery: Array<{ src: string; alt: string }>;
}): string {
  const galleryMarkup = input.gallery
    .map(
      (photo) =>
        `  <img src="${photo.src}" alt="${escapeQuotes(photo.alt)}" class="rounded-xl shadow-lg object-cover w-full h-64" loading="lazy" />`
    )
    .join('\n');

  return `---
title: "${escapeQuotes(input.title)}"
description: "${escapeQuotes(input.description)}"
publishDate: ${input.publishDate}
image: "${input.coverImage}"
imageAlt: "${escapeQuotes(input.coverImageAlt)}"
category: "${input.category}"
featured: ${input.featured}
author: "${escapeQuotes(input.author)}"
location: "${escapeQuotes(input.location)}"
---

${input.projectSummary}

## Services Performed

${input.servicesList.join('\n')}

## Installation Process

1. **Consultation and inspection**: Confirmed goals and problem areas.
2. **Surface preparation**: Decontamination and prep for the selected service.
3. **Professional installation**: Applied ${input.materialHighlight} using shop best practices.
4. **Detail finishing**: Final correction, wipe-down, and finish inspection.
5. **Delivery walkthrough**: Shared care instructions and maintenance plan.

## Results

This project is now protected and easier to maintain with a cleaner finish and stronger long-term durability.

**Location**: ${input.location}  
**Service Time**: ${input.duration}  
**Product/Material**: ${input.materialHighlight}

Ready for similar results? Learn more about our [${input.ctaLabel}](${input.ctaHref}) or [contact us for a quote](/contact). Call **${input.phoneNumber}**.

---

## Project Gallery

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
${galleryMarkup}
</div>
`;
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: 'Expected multipart form upload' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();

    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const location = String(formData.get('location') || 'Grand Junction, CO').trim() || 'Grand Junction, CO';
    const author = String(formData.get('author') || 'ColorAuto Team').trim() || 'ColorAuto Team';
    const category = String(formData.get('category') || 'ppf').trim();
    const featured = String(formData.get('featured') || 'false').toLowerCase() === 'true';
    const projectSummary = String(formData.get('projectSummary') || '').trim();
    const servicesPerformed = String(formData.get('servicesPerformed') || '').trim();
    const duration = String(formData.get('duration') || '2 days').trim() || '2 days';
    const materialHighlight = String(formData.get('materialHighlight') || 'Premium detailing materials').trim() || 'Premium detailing materials';
    const ctaLabel = String(formData.get('ctaLabel') || 'service options').trim() || 'service options';
    const ctaHref = String(formData.get('ctaHref') || '/services').trim() || '/services';
    const phoneNumber = String(formData.get('phoneNumber') || '970-628-1505').trim() || '970-628-1505';
    const imageAltPrefix = String(formData.get('imageAltPrefix') || title || 'Project photo').trim() || 'Project photo';

    if (!title || !description || !projectSummary || !servicesPerformed) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (!VALID_CATEGORIES.has(category)) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const uploadedPhotos = formData.getAll('photos').filter((entry): entry is File => entry instanceof File);
    if (uploadedPhotos.length === 0) {
      return new Response(JSON.stringify({ error: 'Please upload at least one photo' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (uploadedPhotos.length > MAX_IMAGE_COUNT) {
      return new Response(JSON.stringify({ error: `Please upload no more than ${MAX_IMAGE_COUNT} photos` }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const projectRoot = process.cwd();
    const blogContentDir = join(projectRoot, 'src', 'content', 'blog');
    const blogImageDir = join(projectRoot, 'public', 'images', 'blog');

    await ensureDirectory(blogContentDir);
    await ensureDirectory(blogImageDir);

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const publishDate = `${year}-${month}-${day}`;

    const baseSlug = sanitizeForSlug(title) || `project-${publishDate}`;
    const slug = await resolveUniqueSlug(baseSlug);
    const fileNameBase = `${year}-${slug}`;

    const imagePaths: string[] = [];
    const gallery: Array<{ src: string; alt: string }> = [];

    for (let i = 0; i < uploadedPhotos.length; i += 1) {
      const file = uploadedPhotos[i];
      if (!VALID_IMAGE_MIME_TYPES.has(file.type)) {
        return new Response(JSON.stringify({ error: `Unsupported image type for ${file.name}` }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      if (file.size > MAX_IMAGE_BYTES) {
        return new Response(JSON.stringify({ error: `${file.name} exceeds ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB` }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      const extension = extensionFromFile(file);
      const normalizedOriginalName = sanitizeFileStem(file.name.replace(extension, ''));
      const sequence = String(i + 1).padStart(2, '0');
      const imageFileName = `${fileNameBase}-${sequence}-${sanitizeForSlug(normalizedOriginalName || 'photo')}${extension}`;

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      let publicPath = '';

      if (supabaseServer) {
        const storagePath = `blog/${year}/${slug}/${imageFileName}`;
        const { error: uploadError } = await supabaseServer.storage
          .from(BLOG_STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) {
          return new Response(JSON.stringify({
            error: `Could not upload ${file.name}. Confirm Supabase storage bucket '${BLOG_STORAGE_BUCKET}' exists and is public.`,
          }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          });
        }

        const { data: publicUrlData } = supabaseServer.storage
          .from(BLOG_STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        publicPath = publicUrlData.publicUrl;
      } else {
        const imageDiskPath = join(blogImageDir, imageFileName);
        await writeFile(imageDiskPath, fileBuffer);
        publicPath = `/images/blog/${imageFileName}`;
      }

      imagePaths.push(publicPath);
      gallery.push({
        src: publicPath,
        alt: `${imageAltPrefix} ${i + 1}`,
      });
    }

    const services = normalizeServices(servicesPerformed);

    const markdown = buildMarkdown({
      title,
      description,
      publishDate,
      coverImage: imagePaths[0],
      coverImageAlt: `${imageAltPrefix} 1`,
      category,
      featured,
      author,
      location,
      projectSummary,
      servicesList: services.map((line) => `- ${line}`),
      duration,
      materialHighlight,
      ctaLabel,
      ctaHref,
      phoneNumber,
      gallery,
    });

    if (supabaseServer) {
      const { data: created, error: insertError } = await supabaseServer
        .from('blog_posts')
        .insert({
          slug,
          title,
          description,
          publish_date: publishDate,
          image: imagePaths[0],
          image_alt: `${imageAltPrefix} 1`,
          category,
          featured,
          author,
          location,
          project_summary: projectSummary,
          services_performed: services,
          duration,
          material_highlight: materialHighlight,
          cta_label: ctaLabel,
          cta_href: ctaHref,
          phone_number: phoneNumber,
          gallery,
          body_markdown: markdown,
        })
        .select('id')
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          ok: true,
          slug,
          postId: created?.id || null,
          imagePaths,
          storage: 'supabase',
        }),
        {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    let postFileName = `${fileNameBase}.md`;
    let postFilePath = join(blogContentDir, postFileName);
    let count = 2;

    while (await fileExists(postFilePath)) {
      postFileName = `${fileNameBase}-${count}.md`;
      postFilePath = join(blogContentDir, postFileName);
      count += 1;
    }

    await writeFile(postFilePath, markdown, 'utf-8');

    return new Response(
      JSON.stringify({
        ok: true,
        slug,
        postPath: `src/content/blog/${postFileName}`,
        imagePaths,
        storage: 'filesystem',
      }),
      {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create blog post' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
