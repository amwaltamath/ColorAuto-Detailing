/**
 * Apex production host (no www). Must match astro.config `site`.
 * Vercel currently redirects this host to www (307). That redirect is a
 * domain setting, not something vercel.json can fix without a loop.
 * Primary domain should be this origin so www and http land here.
 */
export const SITE_ORIGIN = 'https://colorautodetailing.com';

/** Towns already listed on the window tint page. Shared by LocalBusiness schema. */
export const COLORAUTO_AREA_SERVED = [
  { '@type': 'City', name: 'Grand Junction' },
  { '@type': 'City', name: 'Fruita' },
  { '@type': 'City', name: 'Clifton' },
  { '@type': 'City', name: 'Palisade' },
  { '@type': 'Place', name: 'Orchard Mesa' },
  { '@type': 'Place', name: 'Redlands' },
  { '@type': 'City', name: 'Loma' },
  { '@type': 'City', name: 'Mack' },
  { '@type': 'AdministrativeArea', name: 'Mesa County' },
];

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
