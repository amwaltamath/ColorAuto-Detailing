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
  googleMapsUri?: string;
  source: 'google' | 'fallback';
}

const FALLBACK: GooglePlaceReviews = {
  rating: 5,
  reviewCount: 72,
  source: 'fallback',
  googleMapsUri: 'https://www.google.com/maps/place/?q=place_id:ChIJNbJl6dLXQYgRUd6uGVbDm10',
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
  const placeId = import.meta.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return FALLBACK;
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri,displayName',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[googlePlaces] API error:', response.status, body.slice(0, 200));
      return FALLBACK;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const rawReviews = Array.isArray(data.reviews) ? data.reviews : [];
    const reviews = rawReviews
      .map((item) => mapReview(item as Record<string, unknown>))
      .filter((item): item is GoogleReview => Boolean(item));

    if (reviews.length === 0) {
      return FALLBACK;
    }

    const result: GooglePlaceReviews = {
      rating: typeof data.rating === 'number' ? data.rating : FALLBACK.rating,
      reviewCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : FALLBACK.reviewCount,
      reviews,
      googleMapsUri: typeof data.googleMapsUri === 'string' ? data.googleMapsUri : FALLBACK.googleMapsUri,
      source: 'google',
    };

    cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  } catch (error) {
    console.error('[googlePlaces] fetch failed:', error);
    return FALLBACK;
  }
}
