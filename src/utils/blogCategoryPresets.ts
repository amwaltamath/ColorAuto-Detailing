export type BlogCategory = 'detailing' | 'ppf' | 'ceramic-coating' | 'window-tint' | 'color-ppf';

export interface BlogInstallStep {
  title: string;
  detail: string;
}

export interface BlogCategoryPreset {
  materialHighlight: string;
  ctaLabel: string;
  ctaHref: string;
  duration: string;
  productLabel: string;
  steps: BlogInstallStep[];
}

export const BLOG_CATEGORY_PRESETS: Record<BlogCategory, BlogCategoryPreset> = {
  detailing: {
    materialHighlight: 'Professional detailing products',
    ctaLabel: 'auto detailing services',
    ctaHref: '/services/auto-detailing',
    duration: '1 day',
    productLabel: 'Products used',
    steps: [
      { title: 'Inspection', detail: 'Walked the vehicle with the customer and confirmed the interior and exterior goals.' },
      { title: 'Wash and decontamination', detail: 'Washed, rinsed, and removed bonded contamination before any correction or dressing.' },
      { title: 'Interior detail', detail: 'Vacuumed, cleaned, and conditioned interior surfaces for the package selected.' },
      { title: 'Exterior finish', detail: 'Finished paint, glass, wheels, and trim so the vehicle was ready for pickup.' },
      { title: 'Delivery', detail: 'Reviewed what was done and how to keep the result between visits.' },
    ],
  },
  ppf: {
    materialHighlight: 'XPEL Ultimate Plus PPF',
    ctaLabel: 'paint protection film',
    ctaHref: '/services/paint-protection-film',
    duration: '1–2 days',
    productLabel: 'Film',
    steps: [
      { title: 'Coverage consult', detail: 'Confirmed which panels to protect and how far the film should wrap.' },
      { title: 'Wash and prep', detail: 'Washed and decontaminated the paint so the film bonds to a clean surface.' },
      { title: 'Pattern and install', detail: 'Plotted and installed XPEL paint protection film with wrapped edges where the coverage called for it.' },
      { title: 'Finish', detail: 'Squeegeed edges, tucked seams, and inspected the film under shop light.' },
      { title: 'Cure walkthrough', detail: 'Shared how the film settles and how to wash the vehicle while it cures.' },
    ],
  },
  'color-ppf': {
    materialHighlight: 'XPEL Color PPF',
    ctaLabel: 'Color PPF',
    ctaHref: '/services/color-ppf',
    duration: '2–4 days',
    productLabel: 'Film color',
    steps: [
      { title: 'Color consult', detail: 'Confirmed the color, finish, and which panels were part of the change.' },
      { title: 'Prep', detail: 'Washed, decontaminated, and prepped panels. Removed trim where the film needed a clean edge.' },
      { title: 'Color film install', detail: 'Installed XPEL Color PPF, aligning panels so the color reads even across the vehicle.' },
      { title: 'Edges and finish', detail: 'Wrapped edges, cleaned seams, and checked the finish in different light.' },
      { title: 'Delivery', detail: 'Walked through cure time, wash rules, and how to care for the colored film.' },
    ],
  },
  'ceramic-coating': {
    materialHighlight: 'Ceramic coating',
    ctaLabel: 'ceramic coating',
    ctaHref: '/services/ceramic-coating',
    duration: '1–2 days',
    productLabel: 'Coating',
    steps: [
      { title: 'Paint inspection', detail: 'Checked the paint and agreed on correction level before any coating went on.' },
      { title: 'Wash and decontamination', detail: 'Washed and removed bonded contamination so the coating bonds to the paint.' },
      { title: 'Paint correction', detail: 'Polished to the agreed level so defects were not locked under the coating.' },
      { title: 'Coating application', detail: 'Wiped panels and applied the ceramic coating to the prepared surfaces.' },
      { title: 'Cure and care', detail: 'Set cure time and explained the wash routine that keeps the coating performing.' },
    ],
  },
  'window-tint': {
    materialHighlight: 'XPEL PRIME window film',
    ctaLabel: 'window tinting',
    ctaHref: '/services/window-tinting',
    duration: '2–4 hours',
    productLabel: 'Film',
    steps: [
      { title: 'Shade consult', detail: 'Chose a legal shade and film tier for heat, privacy, and the look the customer wanted.' },
      { title: 'Glass prep', detail: 'Cleaned the glass so the film installs without dust or trapped debris.' },
      { title: 'Pattern and install', detail: 'Cut and installed XPEL PRIME film, then heat-shrunk and squeegeed each window.' },
      { title: 'Inspection', detail: 'Checked edges, vision, and film contact before the vehicle was released.' },
      { title: 'Cure instructions', detail: 'Asked them to keep the windows up for a few days while moisture finishes curing.' },
    ],
  },
};

export function blogCategoryPreset(category: string): BlogCategoryPreset {
  if (category in BLOG_CATEGORY_PRESETS) {
    return BLOG_CATEGORY_PRESETS[category as BlogCategory];
  }
  return BLOG_CATEGORY_PRESETS.detailing;
}
