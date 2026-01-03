# Color Auto Detailing - Copilot Instructions

## Architecture Overview

**Stack**: Astro 5 + React 19 + TypeScript + Tailwind v4 (via Vite plugin). Auto detailing business site with customer/employee portals. Run `npm run dev|build|preview`.

**Data flow**: Browser → Zustand (auth state) → React components → `auth.ts` utils (`PUBLIC_API_URL`) → backend API. Server-side: Astro endpoints → `api.ts` utils (`API_URL`) → backend. Two separate API clients because Astro server vs browser contexts have different env var access.

## Critical Patterns

### 1. Layout Hierarchy (3 Levels)
- [Layout.astro](src/layouts/Layout.astro): Base `<html>`, SEO metadata (OG/Twitter/JSON-LD), global CSS import. Pass `title|description|keywords|canonical|image|noindex` as props.
- [PublicLayout.astro](src/layouts/PublicLayout.astro): Wraps `Layout` + adds `Navigation`/`Footer`. Use for marketing pages.
- [AuthLayout.astro](src/layouts/AuthLayout.astro): Wraps `Layout` with gradient background, no nav/footer. Use for login/register screens.

### 2. Astro ↔ React Hydration
- `.astro` files are **server-rendered by default** (no JS shipped). Use for static content.
- Hydrate React components with `client:load` directive: `<LoginForm client:load role="customer" />` ([example](src/pages/customer/login.astro)).
- **When to use React**: Forms, auth state, interactive UI. **When to use Astro**: Static sections, SEO-critical content.
- Components in `src/components/` can be `.astro` (server-only) or `.tsx` (interactive).

### 3. Authentication Architecture
**Current state** (mock): [LoginForm.tsx](src/components/auth/LoginForm.tsx) creates fake user → calls Zustand `login()` → `window.location.href` redirect.

**Production path**: Replace mock with real API flow:
```tsx
// In LoginForm.tsx handleSubmit:
const { token, user } = await loginUser(email, password, role);  // auth.ts
saveAuthToken(token);  // localStorage
login(user);  // Zustand
```

**State management**: [authStore.ts](src/stores/authStore.ts) is global Zustand store with `user|isLoggedIn|login|logout|setUser`. Import via `useAuthStore()` in React.

**Token storage**: `auth.ts` helpers use `localStorage` with browser checks (`typeof window !== 'undefined'`). Always gate localStorage access.

### 4. API Client Separation
- **Browser-side** ([auth.ts](src/utils/auth.ts)): Uses `PUBLIC_API_URL` env var (accessible in browser). Functions: `loginUser`, `saveAuthToken`, `getAuthToken`, `isAuthenticated`.
- **Server-side** ([api.ts](src/utils/api.ts)): Uses `API_URL` env var (server-only). Functions: `apiFetch<T>`, `getBookings`, `createBooking`. Pass bearer token in headers.
- **Why two?** Astro's env vars: `PUBLIC_*` available everywhere, others only in server context.

## Development Workflow

### Adding Pages
1. Create `.astro` in `src/pages/` (file-based routing).
2. Import layout: `PublicLayout` (public pages), `AuthLayout` (login/register), or raw `Layout` (custom).
3. Compose static sections with Tailwind classes.
4. Hydrate React components only where needed with `client:load`.

### Styling Conventions
- Tailwind config ([tailwind.config.mjs](tailwind.config.mjs)): Custom colors `primary: '#2563eb'`, `secondary: '#1e40af'`. Content scoped to `./src/**/*`.
- Global styles in [src/styles/global.css](src/styles/global.css), imported once in `Layout.astro`.
- Use utility classes directly in templates. No CSS modules.

### Environment Variables
- `local.env` file (not committed): `PUBLIC_API_URL` and `API_URL` both point to `http://localhost:3001/api`.
- **Rule**: Only `PUBLIC_*` vars accessible in browser. Use `API_URL` for server-side API calls in Astro endpoints.

### Asset Management
- Images in `public/images/` served directly (e.g., `/images/services/auto-detailing.jpg`).
- Structure: `services/`, `gallery/`, `team/`, `colorppf/` folders + root files. See [public/images/README.md](public/images/README.md) for conventions.
- ColorPPF gallery uses `.avif` format for GTI hero images (e.g., `GTI_Front_Hero_Gloss_Monza_Red.avif`).

## Recent Updates (January 2026)

### Hero Sections
- All service pages now use **unified hero styling** based on Paint Protection Film template with image overlay (bg-black/60), centered gradient text, and consistent CTA buttons.
- Hero sections across all pages: [auto-detailing.astro](src/pages/services/auto-detailing.astro), [paint-protection-film.astro](src/pages/services/paint-protection-film.astro), [ceramic-coating.astro](src/pages/services/ceramic-coating.astro), [window-tinting.astro](src/pages/services/window-tinting.astro), [auto-paint-correction.astro](src/pages/services/auto-paint-correction.astro), [home-window-tint.astro](src/pages/services/home-window-tint.astro), [office-window-tint.astro](src/pages/services/office-window-tint.astro), [color-ppf.astro](src/pages/services/color-ppf.astro).

### Service Name Changes
- **Home Window Tint**: All "Residential" references changed to "Home" for consistency.
- **Office Window Tint**: All "Commercial" references changed to "Office" throughout page.
- **Navigation**: "Home Service" menu label updated to "Home and Office Service".

### Google Ads Landing Pages
- New directory: `src/pages/ads/` contains **8 conversion-optimized landing pages** for Google Ads campaigns (one per service). All pages use `noindex={true}` to prevent organic ranking and focus on paid traffic.
- Landing pages include:
  - Compelling hero with service image and primary CTA
  - **Why/Benefits section** with gradient background (`bg-gradient-to-b from-blue-600 to-blue-800`), backdrop blur cards (`backdrop-blur-md`), hover effects (`hover:-translate-y-2`, `hover:shadow-2xl`), large 6xl icons, bold 2xl headings
  - Service features/benefits list
  - Multiple CTAs (phone call in blue, quote form in green)
  - Local business info (address, phone)
  - Minimal navigation to reduce bounce rate
- Files: [ads/auto-detailing.astro](src/pages/ads/auto-detailing.astro), [ads/ceramic-coating.astro](src/pages/ads/ceramic-coating.astro), [ads/paint-protection-film.astro](src/pages/ads/paint-protection-film.astro), [ads/window-tinting.astro](src/pages/ads/window-tinting.astro), [ads/home-window-tint.astro](src/pages/ads/home-window-tint.astro), [ads/office-window-tint.astro](src/pages/ads/office-window-tint.astro), [ads/auto-paint-correction.astro](src/pages/ads/auto-paint-correction.astro), [ads/color-ppf.astro](src/pages/ads/color-ppf.astro).

## Known Limitations

- **Dashboards are stubs**: [customer/dashboard.astro](src/pages/customer/dashboard.astro) shows hardcoded metrics (5 bookings, $450 spent). Replace with real `getBookings()` calls.
- **Mock auth**: LoginForm doesn't validate credentials or call backend. Wire to `auth.ts` helpers before production.
- **Contact form**: [api/contact.ts](src/pages/api/contact.ts) exists but integration TBD. Handles JSON and form-data with honeypot.

## Integration Points

- **Backend API**: Expects `POST /auth/login` with `{ email, password, role }` → returns `{ token, user }`.
- **Booking API**: `GET /bookings/:userId` and `POST /bookings` with bearer token (see `api.ts`).
- **Role-based routing**: `/customer/*` vs `/employee/*` pages. Auth check not enforced yet—add middleware/guards before launch.

## Quick Reference

- **New service page**: Copy `src/pages/services/auto-detailing.astro` → update content → add navigation link.
- **Add auth check**: Import `useAuthStore()`, check `isLoggedIn`, redirect if false.
- **Call API from page**: Use `apiFetch()` in frontmatter; use `loginUser()` in React components.
- **SEO override**: Pass props to layout: `<PublicLayout title="Custom Title" description="..." keywords={['auto', 'detail']} />`.
