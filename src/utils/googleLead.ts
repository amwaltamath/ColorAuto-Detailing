/**
 * Google tag IDs for Color Auto Detailing.
 *
 * GA4 stays on PUBLIC_GA_ID (live site: G-FK6KVDB8BP). The Ads tag is
 * configured in Layout.astro on that same gtag.js snippet — do not add a
 * second gtag/js script.
 *
 * "Reached TYP" is the manual Google Ads conversion for a successful lead.
 * Enhanced conversions (gtag set user_data) are intentionally not sent:
 * the privacy policy does not disclose sharing form email or phone with
 * Google, and user_data would stay attached to later hits on the page.
 */
export const GA_MEASUREMENT_ID = import.meta.env.PUBLIC_GA_ID || 'G-M47FRT6SY8';

export const GOOGLE_ADS_ID = 'AW-923734902';

export const GOOGLE_ADS_LEAD_SEND_TO = 'AW-923734902/2rSICNCSoNAaEPamvLgD';

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    trackColorAutoLead?: (formName?: string) => void;
  }
}

/** Fire only after the server accepts a lead (`res.ok && json.ok`). */
export function trackLeadConversion(formName?: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_LEAD_SEND_TO,
    });
    window.gtag('event', 'generate_lead', {
      send_to: GA_MEASUREMENT_ID,
      ...(formName ? { form_name: formName } : {}),
    });
  } catch {
    // Tracking must not change the success message or block the form.
  }
}
