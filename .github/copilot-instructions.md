# Color Auto Detailing — AI Agent Quick Guide

## Stack & Runtime
- **Tech**: Astro 5 SSR + React 19 + TypeScript + Tailwind v4 on Vercel Functions.
- **Commands**: `npm run dev` (localhost:4321) · `npm run build` · `npm run preview`.
- **Env**: `PUBLIC_API_URL` (browser), `API_URL` (server-only), `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_GTM_ID`.

## Core Patterns
- **Astro↔React boundary**: `.astro` SSR for content/SEO; hydrate React with `client:load` only where needed. Example: [src/pages/services/ceramic-coating.astro](src/pages/services/ceramic-coating.astro) hydrates `QuoteModal`.
- **Dual API clients**: Browser auth in [src/utils/auth.ts](src/utils/auth.ts) uses `PUBLIC_API_URL` and window checks; server calls in [src/utils/api.ts](src/utils/api.ts) use `API_URL` and add Bearer tokens.
- **Layouts (3 levels)**: Base [src/layouts/Layout.astro](src/layouts/Layout.astro) (SEO, GTM, CSS) → [src/layouts/PublicLayout.astro](src/layouts/PublicLayout.astro) (nav/footer) → [src/layouts/AuthLayout.astro](src/layouts/AuthLayout.astro) (auth pages).
- **Contact API**: [src/pages/api/contact.ts](src/pages/api/contact.ts) accepts JSON/x-www-form-urlencoded/multipart, uses honeypot `website`, sends via Resend.
- **Ads pages**: [src/pages/ads/*](src/pages/ads) are conversion-optimized and set `noindex={true}`.

## Data Flows
- **Browser Auth**: React form → [src/utils/auth.ts](src/utils/auth.ts) → Backend; persist token, update Zustand [src/stores/authStore.ts](src/stores/authStore.ts).
- **Server API**: Astro endpoints/actions → [src/utils/api.ts](src/utils/api.ts) → Backend.
- **Contact Form**: React/HTML form → [/api/contact](src/pages/api/contact.ts) → Resend email.

## Key Files & Conventions
- **Routing**: File-based under [src/pages](src/pages); `/api/*` endpoints in [src/pages/api](src/pages/api).
- **SEO/Redirects**: Configure in [vercel.json](vercel.json); GTM via `define:vars` inside [Layout.astro](src/layouts/Layout.astro).
- **Styling**: Tailwind config in [tailwind.config.mjs](tailwind.config.mjs); global CSS in [src/styles/global.css](src/styles/global.css).
- **Images**: Use [public/images](public/images) with `loading="lazy"`; ColorPPF gallery in [public/images/colorppf](public/images/colorppf).

## Development Workflow
- **SSR-first**: Prefer `.astro` for static content; hydrate React sparsely.
- **API usage**: Use `apiFetch<T>()` server-side; use `loginUser()` in React and guard `localStorage` with `typeof window !== 'undefined'`.
- **Common routes**: [src/pages/index.astro](src/pages/index.astro) → `/`; [src/pages/customer/dashboard.astro](src/pages/customer/dashboard.astro) → `/customer/dashboard`.

## Common Tasks
- **New service page**: Copy [src/pages/services/auto-detailing.astro](src/pages/services/auto-detailing.astro), edit content, add nav link in [src/components/common/Navigation.astro](src/components/common/Navigation.astro).
- **Wire auth**: Update [src/components/auth/LoginForm.tsx](src/components/auth/LoginForm.tsx) to call `loginUser()`, save token, update store, then redirect.
- **Fix contact issues**: Ensure honeypot empty, correct `Content-Type`, and Resend envs set.

## Debugging Tips
- **Hot reload**: `npm run dev` for quick feedback; check browser console for React hydration errors.
- **Build checks**: `npm run build` validates TS/imports; fix strict TS types in API responses.
- **Realtime/Chat**: Supabase schema at [supabase/schema.sql](supabase/schema.sql); chat API stubs under [src/pages/api/messages.ts](src/pages/api/messages.ts) and [src/pages/api/admin/chat-sessions.ts](src/pages/api/admin/chat-sessions.ts).

## Notes
- Vercel adapter with `output: 'server'` in Astro; API routes run as Functions.
- Use `noindex` for paid-traffic landing pages; keep canonical/SEO props in layouts.
