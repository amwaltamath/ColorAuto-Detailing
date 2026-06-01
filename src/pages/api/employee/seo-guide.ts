import type { APIRoute } from 'astro';
import { buildPromptTemplates, type SeoGuideInput } from '../../../utils/seoGuideTemplates';

type BudgetLevel = 'starter' | 'growth' | 'aggressive';
type GoalType = 'calls' | 'form-leads' | 'maps-visibility';

const SERVICE_KEYWORDS: Record<string, string[]> = {
  'Auto Window Tinting': [
    'car window tinting',
    'auto tint shop',
    'ceramic car tint',
    'legal tint installation',
    'heat rejection tint',
  ],
  'Residential Window Tinting': [
    'home window tinting',
    'residential window film',
    'UV blocking window film',
    'energy saving window tint',
    'privacy window film',
  ],
  'Commercial Window Tinting': [
    'commercial window tinting',
    'office window film',
    'storefront window tint',
    'commercial UV protection film',
    'glare reduction window film',
  ],
  'Ceramic Tint': [
    'ceramic window tint',
    'nano ceramic tint',
    'best ceramic tint',
    'ceramic tint cost',
    'ceramic tint benefits',
  ],
};

function safeString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function budgetToCadence(budget: BudgetLevel): string {
  if (budget === 'aggressive') return '4-5 review asks per day';
  if (budget === 'growth') return '2-3 review asks per day';
  return '1-2 review asks per day';
}

function buildKeywordClusters(input: SeoGuideInput) {
  const seeds = SERVICE_KEYWORDS[input.serviceType] ?? SERVICE_KEYWORDS['Auto Window Tinting'];
  const city = input.primaryCity;

  const transactional = seeds.map((seed) => `${seed} ${city}`);
  const local = [
    `${input.serviceType.toLowerCase()} near me`,
    `${input.serviceType.toLowerCase()} ${city}`,
    `best ${input.serviceType.toLowerCase()} ${city}`,
    `${city} tint shop`,
    ...input.nearbyCities.slice(0, 3).map((c) => `${input.serviceType.toLowerCase()} ${c}`),
  ];
  const informational = [
    `${input.serviceType.toLowerCase()} cost ${city}`,
    `how long does ${input.serviceType.toLowerCase()} last`,
    `${input.serviceType.toLowerCase()} vs standard tint`,
    `is ${input.serviceType.toLowerCase()} worth it`,
    `best tint percentage ${city}`,
  ];

  return [
    { intent: 'Transactional', keywords: transactional },
    { intent: 'Local', keywords: local },
    { intent: 'Informational', keywords: informational },
  ];
}

function buildPageBrief(input: SeoGuideInput) {
  const service = input.serviceType;
  const city = input.primaryCity;
  const business = input.businessName;
  const slug = `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return {
    titleOptions: [
      `${service} in ${city} | ${business}`,
      `${service} ${city} | Free Quote Today`,
      `Top-Rated ${service} in ${city} | ${business}`,
      `${service} Near ${city} | Trusted Local Installers`,
    ],
    h1: `${service} in ${city}`,
    slug: `/${slug.replace(/^-+|-+$/g, '')}`,
    metaDescription: `Get professional ${service.toLowerCase()} in ${city}. ${business} provides high-quality film options, clean installation, and fast scheduling. Request a quote today.`,
    faq: [
      `How much does ${service.toLowerCase()} cost in ${city}?`,
      `How long does ${service.toLowerCase()} installation take?`,
      `What tint percentage is legal in ${city}?`,
      `What warranty options are available for ${service.toLowerCase()}?`,
    ],
    internalLinks: [
      'Link to contact page quote form',
      'Link to service gallery / before-after examples',
      'Link to related tint or coating service pages',
      'Link to FAQ or policy page for warranties',
    ],
  };
}

function buildScore(input: SeoGuideInput) {
  const hasCompetitors = input.competitors.length > 0;
  const nearbyCount = Math.min(input.nearbyCities.length, 5);

  const onPage = Math.min(25, 12 + (input.primaryCity ? 5 : 0) + (input.serviceType ? 5 : 0) + (hasCompetitors ? 3 : 0));
  const localSignals = Math.min(30, 14 + nearbyCount * 2 + (input.goalType === 'maps-visibility' ? 6 : 3));
  const contentDepth = Math.min(20, 9 + nearbyCount + (hasCompetitors ? 4 : 1) + (input.budgetLevel !== 'starter' ? 3 : 0));
  const technical = Math.min(15, 9 + (input.budgetLevel === 'aggressive' ? 4 : input.budgetLevel === 'growth' ? 3 : 1));
  const authority = Math.min(10, 3 + (hasCompetitors ? 4 : 1) + (input.budgetLevel === 'aggressive' ? 3 : 1));

  const total = onPage + localSignals + contentDepth + technical + authority;

  return {
    total,
    breakdown: {
      onPage,
      localSignals,
      contentDepth,
      technical,
      authority,
    },
  };
}

function buildFastWins(input: SeoGuideInput) {
  return [
    `Add/refresh Google Business Profile posts weekly for ${input.serviceType} in ${input.primaryCity}.`,
    `Use review request cadence: ${budgetToCadence(input.budgetLevel)} and ask customers to mention ${input.primaryCity}.`,
    `Publish one dedicated page targeting ${input.serviceType.toLowerCase()} + ${input.primaryCity} with pricing range and FAQs.`,
    'Add LocalBusiness + Service + FAQ schema to core service pages.',
    'Tighten title tags and meta descriptions on top service pages to include service + city + CTA.',
  ];
}

function buildRoadmap(input: SeoGuideInput) {
  return [
    {
      week: 'Week 1',
      focus: 'On-page and technical baseline',
      tasks: [
        `Finalize ${input.serviceType} money page for ${input.primaryCity}.`,
        'Implement meta tags, H1-H2 structure, and schema blocks.',
        'Improve Core Web Vitals on top 5 landing pages.',
      ],
    },
    {
      week: 'Week 2',
      focus: 'Local signals and trust assets',
      tasks: [
        'Optimize Google Business Profile categories, services, and photos.',
        'Launch review request workflow by SMS/email after each completed job.',
        'Fix NAP consistency across key directory listings.',
      ],
    },
    {
      week: 'Week 3',
      focus: 'Content and internal linking',
      tasks: [
        'Publish 2 informational blog posts mapped to comparison and cost keywords.',
        'Add internal links from blog content to service and quote pages.',
        'Refresh FAQ sections based on customer objections.',
      ],
    },
    {
      week: 'Week 4',
      focus: 'Authority and expansion',
      tasks: [
        'Acquire 2-3 local backlinks from partners or sponsorship pages.',
        `Launch one nearby city support page if proof/projects exist (${input.nearbyCities[0] ?? 'nearby city'}).`,
        'Review rankings and update page copy for keywords on positions 6-20.',
      ],
    },
  ];
}

function buildContentCalendar(input: SeoGuideInput) {
  const city = input.primaryCity;
  const service = input.serviceType.toLowerCase();

  return [
    { week: 1, topic: `${input.serviceType} Cost Guide in ${city}`, keyword: `${service} cost ${city}`, intent: 'Informational' },
    { week: 1, topic: `${input.serviceType} vs Standard Film`, keyword: `${service} vs standard tint`, intent: 'Comparison' },
    { week: 2, topic: `Best Tint Percentage for Drivers in ${city}`, keyword: `best tint percentage ${city}`, intent: 'Informational' },
    { week: 2, topic: `How to Choose a ${input.serviceType} Installer`, keyword: `best ${service} installer ${city}`, intent: 'Commercial' },
    { week: 3, topic: `${input.serviceType} Maintenance Tips`, keyword: `${service} maintenance tips`, intent: 'Informational' },
    { week: 3, topic: `${input.serviceType} Warranty Questions Answered`, keyword: `${service} warranty`, intent: 'Commercial' },
    { week: 4, topic: `Top Reasons ${city} Homeowners Choose Window Film`, keyword: `window film benefits ${city}`, intent: 'Local' },
    { week: 4, topic: `${input.serviceType} Near Me: What to Check Before Booking`, keyword: `${service} near me`, intent: 'Transactional' },
  ];
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const budgetRaw = safeString(body?.budgetLevel, 'starter');
    const goalRaw = safeString(body?.goalType, 'calls');

    const input: SeoGuideInput = {
      businessName: safeString(body?.businessName, 'Color Auto Detailing'),
      serviceType: safeString(body?.serviceType, 'Auto Window Tinting'),
      primaryCity: safeString(body?.primaryCity, 'Phoenix'),
      nearbyCities: safeArray(body?.nearbyCities),
      competitors: safeArray(body?.competitors),
      budgetLevel: (budgetRaw === 'growth' || budgetRaw === 'aggressive' ? budgetRaw : 'starter') as BudgetLevel,
      goalType: (goalRaw === 'form-leads' || goalRaw === 'maps-visibility' ? goalRaw : 'calls') as GoalType,
    };

    const score = buildScore(input);

    const response = {
      input,
      score,
      fastWins: buildFastWins(input),
      keywordClusters: buildKeywordClusters(input),
      pageBrief: buildPageBrief(input),
      localChecklist: [
        'Verify primary and secondary GBP categories match target services.',
        'Add at least 20 geo-relevant project photos in GBP.',
        'Publish one GBP post per week with local CTA.',
        'Audit top citation sites for NAP consistency.',
        'Respond to all reviews with service + city context naturally.',
      ],
      technicalChecklist: [
        'Ensure service pages pass Core Web Vitals on mobile.',
        'Add canonical tags and avoid near-duplicate city pages.',
        'Validate schema markup (LocalBusiness, Service, FAQ).',
        'Compress large images and use descriptive alt text.',
        'Check index coverage in Google Search Console weekly.',
      ],
      contentCalendar: buildContentCalendar(input),
      roadmap: buildRoadmap(input),
      promptTemplates: buildPromptTemplates(input),
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate SEO guide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
