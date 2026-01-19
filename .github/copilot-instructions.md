# Color Auto Detailing — AI Agent Quick Guide

## Stack & Runtime
- **Tech**: Astro 5 SSR + React 19 + TypeScript + Tailwind v4 on Vercel Functions.
- **Commands**: `npm run dev` (localhost:4321) · `npm run build` · `npm run preview`.
- **Env**: `PUBLIC_API_URL` (browser), `API_URL` (server-only), `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `PUBLIC_GTM_ID`.
- **Adapter**: Vercel with `output: 'server'` in [astro.config.mjs](astro.config.mjs); API routes run as Vercel Functions.

## Core Architecture
**Three Portal Layers:**
1. **Public Site** ([src/pages/index.astro](src/pages/index.astro), [src/pages/services/*](src/pages/services)) — Landing pages, service info, contact form
2. **Customer Portal** ([src/pages/customer/*](src/pages/customer)) — Bookings, profile, order history
3. **Employee Dashboard** ([src/pages/employee/*](src/pages/employee)) — Schedules, team, chat, messaging ([src/layouts/EmployeeLayout.astro](src/layouts/EmployeeLayout.astro) with nav pills)

**Astro↔React Boundary:**
- `.astro` pages handle SSR content/SEO; use `client:load` only for interactive React components
- Example: [src/pages/services/auto-detailing.astro](src/pages/services/auto-detailing.astro) is static with optional `QuoteModal` hydration
- Employee Dashboard components ([DashboardStats.tsx](src/components/employee/DashboardStats.tsx), [SchedulesTable.tsx](src/components/employee/SchedulesTable.tsx)) fetch from `/api/employee/*` and refresh on intervals

## Data Flows & API Patterns
- **Browser Auth**: React form ([src/components/auth/LoginForm.tsx](src/components/auth/LoginForm.tsx)) → `loginUser()` in [src/utils/auth.ts](src/utils/auth.ts) → Backend; token to `localStorage`, update Zustand [src/stores/authStore.ts](src/stores/authStore.ts)
- **Server-side API**: Astro endpoints → `apiFetch<T>()` in [src/utils/api.ts](src/utils/api.ts) → Backend (adds Bearer token from `process.env.API_URL`)
- **Contact Form**: HTML/React form → [/api/contact](src/pages/api/contact.ts) → Resend email (honeypot: `website` field must be empty)
- **Employee Ops**: Tab-based UI in [EmployeeLayout.astro](src/layouts/EmployeeLayout.astro) switches between `/api/employee/schedules`, `/api/employee/teams`, `/api/messages/*`

## Layouts & Routing
- **3-level Layout Hierarchy**: 
  - Base [src/layouts/Layout.astro](src/layouts/Layout.astro) — Meta tags, GTM, Chat widget ([define:vars](https://docs.astro.build/en/reference/directives-reference/#definevars) for `PUBLIC_GTM_ID`)
  - [src/layouts/PublicLayout.astro](src/layouts/PublicLayout.astro) — Nav, Footer for public pages
  - [src/layouts/EmployeeLayout.astro](src/layouts/EmployeeLayout.astro) — Dark theme, logout button, tab navigation for employee portals
  - [src/layouts/AuthLayout.astro](src/layouts/AuthLayout.astro) — Centered login forms
- **File-based Routing**: `/services/ceramic-coating` → [src/pages/services/ceramic-coating.astro](src/pages/services/ceramic-coating.astro); `/api/*` endpoints in [src/pages/api](src/pages/api)
- **Ads Pages** ([src/pages/ads/*](src/pages/ads)) — Set `noindex={true}` for paid traffic; use standard `PublicLayout`

## Key Conventions
- **State**: Zustand stores in [src/stores](src/stores) — [authStore.ts](src/stores/authStore.ts) for user/auth, [chatStore.ts](src/stores/chatStore.ts) for chat session & messages
- **Components**: Role-based — [src/components/auth/*](src/components/auth), [src/components/employee/*](src/components/employee), [src/components/features/*](src/components/features) (forms, modals, widgets)
- **Forms**: Use `react-hook-form` for validation; honeypot `website` field in contact form
- **Images**: Lazy-load from [public/images](public/images); ColorPPF swatches in [public/images/colorppf](public/images/colorppf) (16 paint variant `.avif` files)
- **Styling**: Tailwind v4 config in [tailwind.config.mjs](tailwind.config.mjs); global CSS in [src/styles/global.css](src/styles/global.css)

## Development Workflow
1. **Localhost dev**: `npm run dev` → port 4321, hot reload enabled
2. **Build validation**: `npm run build` catches TS errors and import issues
3. **Browser checks**: Open console for React hydration errors; inspect Network tab for API calls
4. **localStorage guards**: Always check `typeof window !== 'undefined'` before accessing `localStorage` (e.g., `getAuthToken()`)
5. **Token flow**: React hydrated component calls `loginUser()` → saves token with `saveAuthToken()` → updates store → redirect to dashboard

## Common Tasks
- **New service page**: Copy [src/pages/services/auto-detailing.astro](src/pages/services/auto-detailing.astro), update content, add nav link in [src/components/common/Navigation.astro](src/components/common/Navigation.astro)
- **Fix contact form**: Ensure honeypot (`website` field) stays hidden/empty; verify `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` in env
- **Add employee tab**: Add button to nav-pills in [EmployeeLayout.astro](src/layouts/EmployeeLayout.astro), create API endpoint in [src/pages/api/employee](src/pages/api/employee), hydrate React component for content

## Debugging
- **Hot reload**: `npm run dev` for instant feedback; check browser DevTools Console for hydration errors
- **Build errors**: Run `npm run build` to catch strict TS type mismatches in API responses
- **Auth issues**: Check `localStorage` via `getAuthToken()` in console; verify token in API requests (Bearer header)
- **Chat/Messaging**: Schema in [supabase/schema.sql](supabase/schema.sql); API stubs at [src/pages/api/messages.ts](src/pages/api/messages.ts), [src/pages/api/admin/chat-sessions.ts](src/pages/api/admin/chat-sessions.ts)

## Notes
- Email form accepts JSON, form-encoded, and multipart; [/api/contact](src/pages/api/contact.ts) handles all three
- Employee UI uses dark theme (slate-900/800) vs. public site (light)
- Chat widget in [Layout.astro](src/layouts/Layout.astro) always visible; session ID stored in `useChatStore`
- Vercel redirects/aliases in [vercel.json](vercel.json)
