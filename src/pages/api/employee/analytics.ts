import type { APIRoute } from 'astro';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const GET: APIRoute = async ({ url }) => {
  const propertyId = import.meta.env.GA_PROPERTY_ID;
  const clientEmail = import.meta.env.GA_CLIENT_EMAIL;
  const privateKey = import.meta.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!propertyId || !clientEmail || !privateKey) {
    return new Response(JSON.stringify({
      error: 'GA4 reporting not configured. Set GA_PROPERTY_ID, GA_CLIENT_EMAIL, and GA_PRIVATE_KEY environment variables.',
      demo: true,
      ...getDemoData(),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const period = url.searchParams.get('period') || '28';
  const days = Math.min(Math.max(parseInt(period) || 28, 1), 90);

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey },
    });

    const [overview, pages, sources, daily] = await Promise.all([
      // Overview metrics
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'conversions' },
        ],
      }),
      // Top pages
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      // Traffic sources
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
      // Daily trend
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),
    ]);

    const overviewRow = overview[0]?.rows?.[0]?.metricValues || [];

    return new Response(JSON.stringify({
      demo: false,
      period: days,
      overview: {
        users: parseInt(overviewRow[0]?.value || '0'),
        sessions: parseInt(overviewRow[1]?.value || '0'),
        pageViews: parseInt(overviewRow[2]?.value || '0'),
        avgSessionDuration: parseFloat(overviewRow[3]?.value || '0'),
        bounceRate: parseFloat(overviewRow[4]?.value || '0'),
        conversions: parseInt(overviewRow[5]?.value || '0'),
      },
      topPages: (pages[0]?.rows || []).map((row: any) => ({
        path: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value),
        users: parseInt(row.metricValues[1].value),
      })),
      trafficSources: (sources[0]?.rows || []).map((row: any) => ({
        channel: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value),
        users: parseInt(row.metricValues[1].value),
      })),
      dailyTrend: (daily[0]?.rows || []).map((row: any) => ({
        date: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
      })),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('GA4 API error:', error.message);
    return new Response(JSON.stringify({
      error: 'Failed to fetch analytics data. Check server logs.',
      demo: true,
      ...getDemoData(),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

function getDemoData() {
  return {
    period: 28,
    overview: {
      users: 0, sessions: 0, pageViews: 0,
      avgSessionDuration: 0, bounceRate: 0, conversions: 0,
    },
    topPages: [],
    trafficSources: [],
    dailyTrend: [],
  };
}
