export interface GoogleReview {
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface GooglePlaceReviews {
  rating: number;
  reviewCount: number;
  reviews: GoogleReview[];
  googleMapsUri: string;
  writeReviewUri: string;
  source: 'google' | 'fallback';
}

/** ColorAuto Detailing — 562 S Westgate Dr, Grand Junction, CO */
export const COLORAUTO_GOOGLE_PLACE_ID = 'ChIJ4wL7dYw0bocR-x3Kz3s2uC4';

/** Verified Google Maps listing short link used across the site */
export const COLORAUTO_GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/U8GewAAibaMwEZ8q8';

export function getGoogleMapsListingUrl(): string {
  return COLORAUTO_GOOGLE_MAPS_URL;
}

export function getGoogleWriteReviewUrl(placeId = resolvePlaceId()): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function resolvePlaceId(): string {
  return import.meta.env.GOOGLE_PLACE_ID || COLORAUTO_GOOGLE_PLACE_ID;
}

const FALLBACK: GooglePlaceReviews = {
  rating: 5,
  reviewCount: 72,
  source: 'fallback',
  googleMapsUri: COLORAUTO_GOOGLE_MAPS_URL,
  writeReviewUri: getGoogleWriteReviewUrl(),
  reviews: [
    {
      authorName: 'Alex R.',
      rating: 5,
      text: 'Paint correction + ceramic came out flawless. Looks brand new!',
      relativeTime: '',
    },
    {
      authorName: 'Jamie W.',
      rating: 5,
      text: 'PPF saved my bumper from rock chips. Install is seamless.',
      relativeTime: '',
    },
    {
      authorName: 'Chris M.',
      rating: 5,
      text: 'Fast window tint and great service. Cooler cabin instantly.',
      relativeTime: '',
    },
    {
      authorName: 'Amanda K.',
      rating: 5,
      text: 'Finally can see clearly without squinting from glare. The team was professional and completed the job in a few hours.',
      relativeTime: '',
    },
    {
      authorName: 'Kevin R.',
      rating: 5,
      text: "My interior isn't fading anymore and my AC doesn't have to work as hard. Great work by ColorAuto!",
      relativeTime: '',
    },
  ],
};

const CACHE_TTL_MS = 60 * 60 * 1000;

let cache: { data: GooglePlaceReviews; expiresAt: number } | null = null;

function stars(rating: number): string {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export { stars };

function isColorAutoListing(displayName: unknown): boolean {
  if (typeof displayName !== 'string') return false;
  return /color\s*auto/i.test(displayName);
}

function mapReview(review: Record<string, unknown>): GoogleReview | null {
  const rating = typeof review.rating === 'number' ? review.rating : 0;
  const textObj = review.text as { text?: string } | undefined;
  const text = typeof textObj?.text === 'string' ? textObj.text.trim() : '';
  const author = review.authorAttribution as { displayName?: string; photoUri?: string } | undefined;
  const authorName = typeof author?.displayName === 'string' ? author.displayName : 'Google User';

  if (!text || rating < 1) return null;

  return {
    authorName,
    authorPhotoUrl: typeof author?.photoUri === 'string' ? author.photoUri : undefined,
    rating,
    text,
    relativeTime:
      typeof review.relativePublishTimeDescription === 'string'
        ? review.relativePublishTimeDescription
        : '',
  };
}

export async function getGoogleReviews(): Promise<GooglePlaceReviews> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = resolvePlaceId();
  const writeReviewUri = getGoogleWriteReviewUrl(placeId);

  if (!apiKey) {
    return { ...FALLBACK, writeReviewUri };
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,displayName',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[googlePlaces] API error:', response.status, body.slice(0, 200));
      return { ...FALLBACK, writeReviewUri };
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (!isColorAutoListing(data.displayName)) {
      console.error(
        '[googlePlaces] Place ID does not match ColorAuto listing:',
        data.displayName,
      );
      return { ...FALLBACK, writeReviewUri: getGoogleWriteReviewUrl(COLORAUTO_GOOGLE_PLACE_ID) };
    }

    const rawReviews = Array.isArray(data.reviews) ? data.reviews : [];
    const reviews = rawReviews
      .map((item) => mapReview(item as Record<string, unknown>))
      .filter((item): item is GoogleReview => Boolean(item));

    if (reviews.length === 0) {
      return { ...FALLBACK, writeReviewUri };
    }

    const result: GooglePlaceReviews = {
      rating: typeof data.rating === 'number' ? data.rating : FALLBACK.rating,
      reviewCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : FALLBACK.reviewCount,
      reviews,
      googleMapsUri: COLORAUTO_GOOGLE_MAPS_URL,
      writeReviewUri,
      source: 'google',
    };

    cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  } catch (error) {
    console.error('[googlePlaces] fetch failed:', error);
    return { ...FALLBACK, writeReviewUri };
  }
}
