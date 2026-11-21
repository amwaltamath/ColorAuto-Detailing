import type { APIRoute } from 'astro';
import { getGoogleReviews } from '../utils/googlePlaces';
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  FORMATTED_ADDRESS,
  HOURS_CLOSED_LABEL,
  HOURS_LABEL,
  SERVICES,
  SITE_ORIGIN,
  canonicalUrlForPath,
} from '../utils/seo';

export const GET: APIRoute = async () => {
  const reviews = await getGoogleReviews();
  const rating = reviews.rating.toFixed(1);
  const count = reviews.reviewCount.toLocaleString('en-US');
  const serviceLines = SERVICES.map(
    (service) => `- [${service.name}](${canonicalUrlForPath(service.path)}): ${service.summary}`,
  ).join('\n');

  const body = `# ${BUSINESS_NAME}

> ${BUSINESS_NAME} (Color Auto Detailing) is an XPEL-certified installer in Grand Junction, Colorado for auto detailing, paint protection film (PPF), color PPF, ceramic coating, paint correction, and window tint for cars, homes, and offices.

## Business

- Name: ${BUSINESS_NAME} (also Color Auto Detailing, ColorAuto)
- Website: ${SITE_ORIGIN}
- Address: ${FORMATTED_ADDRESS}
- Phone: ${BUSINESS_PHONE}
- Email: ${BUSINESS_EMAIL}
- Hours: ${HOURS_LABEL}; ${HOURS_CLOSED_LABEL}
- Map: https://maps.app.goo.gl/U8GewAAibaMwEZ8q8
- Google rating: ${rating} out of 5 from ${count} Google reviews

## Services

${serviceLines}

Published prices are on the pages that list them: detailing packages on the auto detailing page, and XPEL PRIME tint packages (shown as starting prices) on the window tinting pages. Other services are quoted.

## Service area

Grand Junction shop serving Fruita, Clifton, Palisade, Orchard Mesa, Redlands, Loma, Mack, Mesa County, and the Western Slope of Colorado. The window tinting page lists this service area.

## Reviews

${rating} stars from ${count} Google reviews. Review text shown on the site comes from the Google Places listing.

- [Customer reviews](${canonicalUrlForPath('/testimonials')})

## Frequently asked questions

Answers on these pages are the shop's own FAQ copy:

- [Homepage FAQ](${canonicalUrlForPath('/')}#faq) — paint correction time, PPF lifespan, ceramic over PPF, window tint aftercare, warranties, and detailing quotes
- [Window tinting FAQ](${canonicalUrlForPath('/services/window-tinting')}#faq)
- [Car window tinting FAQ](${canonicalUrlForPath('/services/auto-window-tinting')}#faq)

## Other pages

- [All services](${canonicalUrlForPath('/services')})
- [Contact](${canonicalUrlForPath('/contact')})
- [Our team](${canonicalUrlForPath('/our-team')})
- [Work gallery](${canonicalUrlForPath('/our-work')})
- [Project stories](${canonicalUrlForPath('/work')})
- [Apply](${canonicalUrlForPath('/apply')})
- [Privacy policy](${canonicalUrlForPath('/privacy-policy')})
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
