import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../../utils/supabaseServer';

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, 10);
}

export const GET: APIRoute = async () => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ snapshots: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { data, error } = await supabaseServer
      .from('seo_guide_snapshots')
      .select('id, business_name, service_type, primary_city, score_total, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ snapshots: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ snapshots: data || [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ snapshots: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServer) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    const input = body?.input || {};
    const score = body?.score || {};

    const businessName = typeof input.businessName === 'string' && input.businessName.trim()
      ? input.businessName.trim()
      : 'Color Auto Detailing';

    const serviceType = typeof input.serviceType === 'string' && input.serviceType.trim()
      ? input.serviceType.trim()
      : 'Auto Window Tinting';

    const primaryCity = typeof input.primaryCity === 'string' && input.primaryCity.trim()
      ? input.primaryCity.trim()
      : 'Phoenix';

    const budgetLevel = input.budgetLevel === 'growth' || input.budgetLevel === 'aggressive'
      ? input.budgetLevel
      : 'starter';

    const goalType = input.goalType === 'form-leads' || input.goalType === 'maps-visibility'
      ? input.goalType
      : 'calls';

    const scoreTotal = Number.isFinite(Number(score.total)) ? Number(score.total) : 0;

    const payload = body;

    const { data, error } = await supabaseServer
      .from('seo_guide_snapshots')
      .insert({
        business_name: businessName,
        service_type: serviceType,
        primary_city: primaryCity,
        nearby_cities: asTextArray(input.nearbyCities),
        competitors: asTextArray(input.competitors),
        budget_level: budgetLevel,
        goal_type: goalType,
        score_total: Math.max(0, Math.min(100, scoreTotal)),
        payload,
      })
      .select('id, created_at')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, snapshot: data }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save SEO guide snapshot' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
