import type { APIRoute } from 'astro';
import {
  COLORAUTO_GOOGLE_PLACE_ID,
  COLORAUTO_WRITE_REVIEW_URL,
  getGoogleReviews,
  testGooglePlacesConnection,
} from '../../utils/googlePlaces';

export const GET: APIRoute = async () => {
  const [diagnostics, liveReviews] = await Promise.all([
    testGooglePlacesConnection(),
    getGoogleReviews(),
  ]);

  return new Response(
    JSON.stringify(
      {
        ok: diagnostics.ok,
        summary: diagnostics.summary,
        diagnostics,
        site: {
          reviewsSource: liveReviews.source,
          reviewsShown: liveReviews.reviews.length,
          rating: liveReviews.rating,
          reviewCount: liveReviews.reviewCount,
          writeReviewUri: liveReviews.writeReviewUri,
        },
        nextSteps: diagnostics.ok
          ? [
              'Places API is working. Redeploy if production still shows fallback reviews.',
              'Confirm GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are set in Vercel Production.',
            ]
          : diagnostics.nextSteps,
      },
      null,
      2,
    ),
    {
      status: diagnostics.ok ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
};
