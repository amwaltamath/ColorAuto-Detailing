export interface SeoGuideInput {
  businessName: string;
  serviceType: string;
  primaryCity: string;
  nearbyCities: string[];
  competitors: string[];
  budgetLevel: 'starter' | 'growth' | 'aggressive';
  goalType: 'calls' | 'form-leads' | 'maps-visibility';
}

export interface PromptTemplate {
  title: string;
  prompt: string;
}

export function buildPromptTemplates(input: SeoGuideInput): PromptTemplate[] {
  const nearby = input.nearbyCities.length ? input.nearbyCities.join(', ') : 'none provided';
  const competitors = input.competitors.length ? input.competitors.join(', ') : 'none provided';

  return [
    {
      title: 'Service Page Brief Prompt',
      prompt: `Create a high-converting SEO service page brief for ${input.businessName} focused on ${input.serviceType} in ${input.primaryCity}. Include semantic keywords, title tag options, H1 options, FAQ ideas, and internal link suggestions. Nearby cities to naturally mention: ${nearby}. Keep claims realistic and local-intent focused.`,
    },
    {
      title: 'Competitor Gap Prompt',
      prompt: `Analyze content and positioning gaps for ${input.serviceType} in ${input.primaryCity}. Competitors: ${competitors}. Return actionable opportunities in pricing transparency, trust signals, before/after proof, and local relevance. Prioritize opportunities that can be implemented in 2 weeks.`,
    },
    {
      title: 'Google Business Profile Prompt',
      prompt: `Draft 8 weekly Google Business Profile posts for ${input.businessName} promoting ${input.serviceType} in ${input.primaryCity}. Target goal: ${input.goalType}. Include CTA lines for ${input.budgetLevel} budget and add one review-request angle per post.`,
    },
    {
      title: 'Blog Calendar Prompt',
      prompt: `Create a 2-month blog calendar for a ${input.serviceType} business in ${input.primaryCity}. Include 8 posts with search intent, primary keyword, secondary keywords, internal links, and conversion CTA idea. Nearby city support: ${nearby}.`,
    },
  ];
}
