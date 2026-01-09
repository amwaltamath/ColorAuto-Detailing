# Color Auto Detailing - AI Agent Guide

## Stack & Architecture

**Tech**: Astro 5 + React 19 + TypeScript + Tailwind v4 (via Vite plugin). Auto detailing business site with customer/employee portals. Deployed on Vercel serverless.

**Commands**: `npm run dev` (localhost:4321) | `npm run build` | `npm run preview`

**Data Flow**: Browser → Zustand auth → React → `auth.ts` (`PUBLIC_API_URL`) → backend. Server: Astro endpoints → `api.ts` (`API_URL`) → backend. Contact: Browser → `/api/contact` (Resend) → email.

**Deployment**: `@astrojs/vercel` adapter with `output: 'server'`. Static pages prerendered, API routes as Vercel functions. SEO redirects in `vercel.json` (301s from old URLs).

## Critical Patterns

### 1. Three-Tier Layouts
- **Layout.astro**: Base `<html>`, SEO (OG/Twitter/JSON-LD), GTM injection, global CSS. Props: `title|description|keywords|canonical|image|noindex`.
- **PublicLayout.astro**: Wraps Layout + Navigation/Footer. Use for marketing.
- **AuthLayout.astro**: Wraps Layout, gradient bg, no nav/footer. Use for login/register.

### 2. Astro ↔ React Hydration
- `.astro` files are **server-rendered** (zero JS). Use for static content.
- Hydrate React with `client:load`: `<QuoteModal client:load service="Ceramic Coating" />` (see [ads pages](src/pages/ads/)).
- **React**: Forms, auth, modals. **Astro**: Static sections, SEO content.

### 3. Dual API Clients (Browser vs Server)
- **Browser** ([auth.ts](src/utils/auth.ts)): Uses `PUBLIC_API_URL`. Functions: `loginUser`, `saveAuthToken`, `getAuthToken`, `isAuthenticated`. Always check `typeof window !== 'undefined'` for localStorage.
- **Server** ([api.ts](src/utils/api.ts)): Uses `API_URL` (server-only). Functions: `apiFetch<T>`, `getBookings`, `createBooking`. Bearer tokens in headers.
- **Contact API** ([api/contact.ts](src/pages/api/contact.ts)): Resend integration. Handles JSON/form-data, honeypot (`website` field), validation. Env: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

### 4. Auth Flow (Currently Mock)
- **Zustand Store** ([authStore.ts](src/stores/authStore.ts)): `user|isLoggedIn|login|logout|setUser`. Import via `useAuthStore()`.
- **Mock Login** ([LoginForm.tsx](src/components/auth/LoginForm.tsx)): Creates fake user → Zustand `login()` → redirect.
- **Production Path**: Call `loginUser()` → `saveAuthToken()` → Zustand `login()` → redirect.

### 5. Form Patterns
- React Hook Form for complex forms ([ContactForm.tsx](src/components/features/ContactForm.tsx)).
- States: `idle` → `loading` → `success`/`error`.
- POST to `/api/contact` with JSON. Honeypot field always empty in legit submissions.
- Quote modal ([QuoteModal.tsx](src/components/features/QuoteModal.tsx)): Custom event `openQuoteModal`, fetches `/api/contact`.

## Development Workflow

### Adding Pages
1. Create `.astro` in `src/pages/` (file-based routing).
2. Import layout (PublicLayout/AuthLayout/Layout).
3. Static sections with Tailwind. Hydrate React only where needed.

### Styling
- **Tailwind Config** ([tailwind.config.mjs](tailwind.config.mjs)): `primary: '#2563eb'`, `secondary: '#1e40af'`.
- Global CSS in [src/styles/global.css](src/styles/global.css), imported in Layout.astro.
- Utility-first. No CSS modules.

### Environment Variables
- `PUBLIC_API_URL` / `API_URL`: Both `http://localhost:3001/api` in local.env.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` for email.
- `PUBLIC_GTM_ID`: Default `GTM-PMBBJ2B6`.
- **Rule**: Only `PUBLIC_*` accessible in browser.

### Assets
- Images in `public/images/`: `/images/services/`, `/images/colorppf/`, etc.
- ColorPPF gallery uses `.avif` format (e.g., `GTI_Front_Hero_Gloss_Monza_Red.avif`).

## Key Features & Recent Changes

### Google Ads Landing Pages (src/pages/ads/)
- 8 conversion-optimized pages (auto-detailing, ceramic-coating, paint-protection-film, window-tinting, home-window-tint, office-window-tint, auto-paint-correction, color-ppf).
- All use `noindex={true}` (paid traffic only).
- QuoteModal hydrated with `client:load`, submits to `/api/contact`.

### SEO & Analytics
- **Redirects**: 32 permanent (301) mappings in `vercel.json` (e.g., `/auto-detailing/` → `/services/auto-detailing`).
- **GTM**: Injected in Layout.astro via `define:vars` to avoid ReferenceError.
- **Schema.org**: LocalBusiness JSON-LD in Layout.astro.

### Service Pages
- All service pages use PublicLayout, unified hero styling (`bg-black/60` overlay).
- PPF page has pricing (Partial Front $800, Full Front $1,600, Drivers $2,500, Full $5,500+).
- Ceramic Coating: Blue bold pricing for both levels.

## Known Limitations
- **Dashboards are stubs**: Hardcoded metrics. Wire to `getBookings()` for real data.
- **Mock auth**: LoginForm doesn't validate. Wire to `auth.ts` before production.
- **Contact form**: Requires Resend domain verification for production.
- **No tests**: Validate via `npm run build` and browser.

## Quick Reference
- **New service page**: Copy `src/pages/services/auto-detailing.astro` → update → add nav link.
- **Auth check**: Import `useAuthStore()`, check `isLoggedIn`.
- **API calls**: `apiFetch()` in frontmatter, `loginUser()` in React.
- **SEO**: Pass props to layout: `<PublicLayout title="..." description="..." keywords={[...]} />`.
- **Redirects**: Edit `vercel.json` for 301s.
