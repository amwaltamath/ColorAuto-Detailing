import { supabaseServer } from './supabaseServer';

export type BlogCategory = 'detailing' | 'ppf' | 'ceramic-coating' | 'window-tint' | 'color-ppf';

export interface BlogGalleryItem {
  src: string;
  alt: string;
}

export interface SupabaseBlogPost {
  slug: string;
  title: string;
  description: string;
  publishDate: Date;
  image: string;
  imageAlt: string;
  category: BlogCategory;
  featured: boolean;
  author: string;
  location: string;
  projectSummary: string;
  servicesPerformed: string[];
  duration: string;
  materialHighlight: string;
  ctaLabel: string;
  ctaHref: string;
  phoneNumber: string;
  gallery: BlogGalleryItem[];
  bodyMarkdown?: string | null;
}

function parseDate(value: unknown): Date {
  if (typeof value !== 'string') return new Date(0);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function parseGallery(value: unknown): BlogGalleryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const src = typeof record.src === 'string' ? record.src : '';
      const alt = typeof record.alt === 'string' ? record.alt : '';
      if (!src || !alt) return null;
      return { src, alt };
    })
    .filter((item): item is BlogGalleryItem => Boolean(item));
}

function mapRowToPost(row: any): SupabaseBlogPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    publishDate: parseDate(row.publish_date),
    image: row.image,
    imageAlt: row.image_alt,
    category: row.category,
    featured: Boolean(row.featured),
    author: row.author || 'ColorAuto Team',
    location: row.location || 'Grand Junction, CO',
    projectSummary: row.project_summary || '',
    servicesPerformed: Array.isArray(row.services_performed)
      ? row.services_performed.filter((item: unknown): item is string => typeof item === 'string')
      : [],
    duration: row.duration || '2 days',
    materialHighlight: row.material_highlight || 'Premium detailing materials',
    ctaLabel: row.cta_label || 'service options',
    ctaHref: row.cta_href || '/services',
    phoneNumber: row.phone_number || '970-628-1505',
    gallery: parseGallery(row.gallery),
    bodyMarkdown: row.body_markdown || null,
  };
}

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
].join(',');

export async function getSupabaseBlogPosts(): Promise<SupabaseBlogPost[]> {
  if (!supabaseServer) return [];

  const { data, error } = await supabaseServer
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .order('publish_date', { ascending: false });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map(mapRowToPost);
}

export async function getSupabaseBlogPostBySlug(slug: string): Promise<SupabaseBlogPost | null> {
  if (!supabaseServer) return null;

  const { data, error } = await supabaseServer
    .from('blog_posts')
    .select(SELECT_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToPost(data);
}
