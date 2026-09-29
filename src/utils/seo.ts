/** Apex production host (no www). Must match astro.config `site`. */
export const SITE_ORIGIN = 'https://colorautodetailing.com';

/** Path for canonical URLs: no trailing slash except site root. */
export function normalizeCanonicalPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Absolute canonical URL for a pathname on the apex domain. */
export function canonicalUrlForPath(pathname: string): string {
  return new URL(normalizeCanonicalPath(pathname), SITE_ORIGIN).href;
}

/** Normalize a full canonical URL (apex host, no trailing slash except root). */
export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, '');
    const path = normalizeCanonicalPath(parsed.pathname);
    return new URL(path, `https://${host}`).href;
  } catch {
    return url;
  }
}
