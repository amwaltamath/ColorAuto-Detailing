/** Canonical production origin. The apex host 307-redirects here. */
export const SITE_ORIGIN = 'https://www.colorautodetailing.com';

export const BUSINESS_ID = `${SITE_ORIGIN}/#business`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export const BUSINESS_NAME = 'ColorAuto Detailing';
export const BUSINESS_ALTERNATE_NAMES = ['Color Auto Detailing', 'ColorAuto'];
export const BUSINESS_PHONE = '970-628-1505';
export const BUSINESS_EMAIL = 'admin@colorautodetailing.com';
export const STREET_ADDRESS = '562 S Westgate Drive';
export const ADDRESS_LOCALITY = 'Grand Junction';
export const ADDRESS_REGION = 'CO';
export const POSTAL_CODE = '81505';
export const ADDRESS_COUNTRY = 'US';
export const FORMATTED_ADDRESS = `${STREET_ADDRESS}, ${ADDRESS_LOCALITY}, ${ADDRESS_REGION} ${POSTAL_CODE}`;

/**
 * Building centroid for 562 S Westgate Drive, Grand Junction, CO 81505.
 * OpenStreetMap way 497201583 is 39.086479, -108.586097.
 * The Census address-range match is 39.086518, -108.586465.
 */
export const GEO_LATITUDE = 39.086479;
export const GEO_LONGITUDE = -108.586097;

export const BUSINESS_MAPS_URL = 'https://maps.app.goo.gl/U8GewAAibaMwEZ8q8';

export const WEEKDAY_OPENS = '08:00';
export const WEEKDAY_CLOSES = '17:00';
export const HOURS_LABEL = 'Monday–Friday 8:00 AM–5:00 PM';
export const HOURS_CLOSED_LABEL = 'Saturday–Sunday closed';

export const SAME_AS = [
  'https://www.facebook.com/ColorAutoDetailing',
  'https://www.instagram.com/colorautodetailing',
  'https://www.youtube.com/@colorautodetailing3388',
  BUSINESS_MAPS_URL,
];

/** Places named on the site as the shop's service area. */
export const SERVICE_AREA = [
  { '@type': 'City', name: 'Grand Junction', '@id': 'https://www.wikidata.org/wiki/Q162660' },
  { '@type': 'City', name: 'Fruita' },
  { '@type': 'City', name: 'Clifton' },
  { '@type': 'City', name: 'Palisade' },
  { '@type': 'Place', name: 'Orchard Mesa' },
  { '@type': 'Place', name: 'Redlands' },
  { '@type': 'City', name: 'Loma' },
  { '@type': 'City', name: 'Mack' },
  { '@type': 'AdministrativeArea', name: 'Mesa County, Colorado' },
  { '@type': 'AdministrativeArea', name: 'Western Colorado' },
  { '@type': 'AdministrativeArea', name: 'Western Slope, Colorado' },
];

export const GRAND_JUNCTION_AREA = {
  '@type': 'City',
  name: 'Grand Junction',
  '@id': 'https://www.wikidata.org/wiki/Q162660',
};

/** Short descriptions taken from existing service-page and homepage copy. */
export const SERVICES = [
  {
    name: 'Auto Detailing',
    path: '/services/auto-detailing',
    summary: 'Hand wash, interior deep clean, and full exterior finish.',
  },
  {
    name: 'Paint Correction',
    path: '/services/auto-paint-correction',
    summary: 'Machine polish to remove swirls, haze, and oxidation.',
  },
  {
    name: 'Ceramic Coating',
    path: '/services/ceramic-coating',
    summary: 'Hydrophobic ceramic protection against dirt, UV, and road grime.',
  },
  {
    name: 'Paint Protection Film',
    path: '/services/paint-protection-film',
    summary: 'Clear XPEL film that stops rock chips, scratches, and road debris.',
  },
  {
    name: 'Color PPF',
    path: '/services/color-ppf',
    summary: 'Color-change paint protection film that also protects against chips.',
  },
  {
    name: 'Window Tinting',
    path: '/services/window-tinting',
    summary: 'XPEL automotive, home, and office window film.',
  },
  {
    name: 'Car Window Tinting',
    path: '/services/auto-window-tinting',
    summary: 'XPEL PRIME ceramic and dyed film for vehicles.',
  },
  {
    name: 'Home Window Tint',
    path: '/services/home-window-tint',
    summary: 'Residential film for heat, glare, UV, and privacy.',
  },
  {
    name: 'Office Window Tint',
    path: '/services/office-window-tint',
    summary: 'Commercial film for privacy, comfort, and energy savings.',
  },
] as const;

/** Starting prices published on the car and window tinting pages. */
export const TINT_OFFERS = [
  {
    '@type': 'Offer',
    name: 'XPEL PRIME CS Window Tint',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      minPrice: 250,
    },
    description: 'From $250. Color-stable dyed film with 99% UV block and a lifetime warranty.',
  },
  {
    '@type': 'Offer',
    name: 'XPEL PRIME XR Window Tint',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      minPrice: 350,
    },
    description: 'From $350. Nano-ceramic film with 60% heat reduction and signal-friendly optics.',
  },
  {
    '@type': 'Offer',
    name: 'XPEL PRIME XR PLUS Window Tint',
    priceCurrency: 'USD',
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      minPrice: 500,
    },
    description: 'From $500. Flagship ceramic film with 60% heat rejection and maximum clarity.',
  },
];

const SITEMAP_BLOCKED_EXACT = new Set([
  '/404',
  '/business-card',
  '/ads',
  '/employee',
  '/customer',
  '/api',
]);

const SITEMAP_BLOCKED_PREFIXES = ['/ads/', '/employee/', '/customer/', '/api/'];

/** Path for canonical URLs: no trailing slash except the site root. */
export function normalizeCanonicalPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Absolute canonical URL for a pathname on the www host. Root has no trailing slash. */
export function canonicalUrlForPath(pathname: string): string {
  const path = normalizeCanonicalPath(pathname);
  if (path === '/') return SITE_ORIGIN;
  return new URL(path, SITE_ORIGIN).href;
}

/** Force a canonical URL onto the www host, without a trailing slash. */
export function normalizeCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url, SITE_ORIGIN);
    return canonicalUrlForPath(parsed.pathname);
  } catch {
    return url;
  }
}

/** True when a pathname is a public, indexable HTML page. */
export function isIndexablePath(pathname: string): boolean {
  const path = normalizeCanonicalPath(pathname.split('?')[0] || '/');
  if (path.endsWith('.txt')) return false;
  if (SITEMAP_BLOCKED_EXACT.has(path)) return false;
  return !SITEMAP_BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Sitemap filter: drop noindex and non-public URLs. */
export function isIndexableSitemapUrl(pageUrl: string): boolean {
  try {
    return isIndexablePath(new URL(pageUrl).pathname);
  } catch {
    return false;
  }
}

export function postalAddressLd() {
  return {
    '@type': 'PostalAddress',
    streetAddress: STREET_ADDRESS,
    addressLocality: ADDRESS_LOCALITY,
    addressRegion: ADDRESS_REGION,
    postalCode: POSTAL_CODE,
    addressCountry: ADDRESS_COUNTRY,
  };
}

export function geoLd() {
  return {
    '@type': 'GeoCoordinates',
    latitude: GEO_LATITUDE,
    longitude: GEO_LONGITUDE,
  };
}

export function aggregateRatingLd(rating: number, reviewCount: number) {
  return {
    '@type': 'AggregateRating',
    ratingValue: rating.toFixed(1),
    reviewCount: String(reviewCount),
    bestRating: '5',
    worstRating: '1',
  };
}

/** Provider reference shared by every Service node. Values match the sitewide business entity. */
export function businessRefLd() {
  return {
    '@type': 'AutoRepair',
    '@id': BUSINESS_ID,
    name: BUSINESS_NAME,
    url: SITE_ORIGIN,
    telephone: BUSINESS_PHONE,
    email: BUSINESS_EMAIL,
    image: `${SITE_ORIGIN}/images/ColorAuto.png`,
    address: postalAddressLd(),
    geo: geoLd(),
  };
}

export function businessGraphLd(rating: number, reviewCount: number) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AutoRepair',
        '@id': BUSINESS_ID,
        name: BUSINESS_NAME,
        alternateName: BUSINESS_ALTERNATE_NAMES,
        description:
          'XPEL-certified auto detailing, paint protection film (PPF), ceramic coating, paint correction, and window tinting shop in Grand Junction, CO.',
        url: SITE_ORIGIN,
        telephone: BUSINESS_PHONE,
        email: BUSINESS_EMAIL,
        image: `${SITE_ORIGIN}/images/ColorAuto.png`,
        logo: `${SITE_ORIGIN}/images/ColorAuto.png`,
        priceRange: '$$',
        currenciesAccepted: 'USD',
        address: postalAddressLd(),
        geo: geoLd(),
        hasMap: BUSINESS_MAPS_URL,
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: WEEKDAY_OPENS,
            closes: WEEKDAY_CLOSES,
          },
        ],
        sameAs: SAME_AS,
        areaServed: SERVICE_AREA,
        founder: {
          '@type': 'Person',
          name: 'Paul',
          jobTitle: 'Founder, Owner & Lead Installer',
        },
        aggregateRating: aggregateRatingLd(rating, reviewCount),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Auto detailing and protection services',
          itemListElement: SERVICES.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              url: canonicalUrlForPath(service.path),
            },
          })),
        },
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_ORIGIN,
        name: BUSINESS_NAME,
        publisher: { '@id': BUSINESS_ID },
        inLanguage: 'en-US',
      },
    ],
  };
}

export function serviceListLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ColorAuto Detailing services',
    itemListElement: SERVICES.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: service.name,
      url: canonicalUrlForPath(service.path),
    })),
  };
}
