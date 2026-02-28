# Color Auto Detailing - Website & Portal

A modern Astro + React web application for Color Auto Detailing with customer booking portal and employee dashboard.

## AI Handoff (Feb 25, 2026)

Use this section to quickly rehydrate context when an AI or new dev picks up the repo.

### Current Stack

- Astro 5 SSR + React 19 + TypeScript + Tailwind v4
- Hosting: Vercel Functions (adapter set to `output: 'server'`)
- Commands: `npm run dev` (default 4321), `npm run build`, `npm run preview`

### Key Architecture

- Public site: `src/pages/index.astro`, `src/pages/services/*`, `src/pages/contact.astro`
- Customer portal: `src/pages/customer/*`
- Employee dashboard: `src/pages/employee/*` with `src/layouts/EmployeeLayout.astro`
- Layouts: `src/layouts/Layout.astro` (base), `PublicLayout.astro`, `AuthLayout.astro`
- API helper: `src/utils/api.ts` (`apiFetch<T>()` adds Bearer token)
- Auth flow: `src/components/auth/LoginForm.tsx` -> `src/utils/auth.ts` -> `src/stores/authStore.ts`

### Environment Variables

- `PUBLIC_API_URL` (browser)
- `API_URL` (server only)
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
- `PUBLIC_GTM_ID`

### Chat Feature (Employee + Public)

- Docs: `CHAT_FEATURE.md`
- Widget: `src/components/features/ChatWidget.tsx` (public)
- Manager: `src/components/features/ChatManager.tsx` (employee dashboard)
- Endpoints: `src/pages/api/messages.ts`, `src/pages/api/messages/respond.ts`, `src/pages/api/admin/chat-sessions.ts`
- Storage: in-memory (no persistence yet)

### Recent Work / Branding

- Branding updates described in `COLORAUTO_UPDATE.md`
- Default design direction matches colorautodetailing.com

### Known Gaps / Next Steps

- Persist chat data (Supabase tables listed in `CHAT_FEATURE.md`)
- Add auth checks for employee chat endpoints
- Wire contact form to Resend (`/api/contact`)
- Back-end booking and scheduling endpoints

### Quick Pointers

- Global styles: `src/styles/global.css`
- Tailwind config: `tailwind.config.mjs`
- Vercel redirects: `vercel.json`
- Project guide for AI agents: `.github/copilot-instructions.md`

## Features

- 🎨 **Public Website**: Service listings, pricing, contact information
- 👥 **Customer Portal**: View bookings, book services, manage profile
- 👨‍💼 **Employee Dashboard**: Schedule management, job tracking, reporting
- 🔐 **Authentication**: Role-based access control (customer, employee, admin)
- 📱 **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- ⚡ **Fast**: Built with Astro for optimal performance

## Project Structure

```
src/
├── layouts/           # Page layouts (Base, Public, Auth)
├── pages/            # Route pages (Astro)
│   ├── index.astro   # Homepage
│   ├── customer/     # Customer portal routes
│   └── employee/     # Employee portal routes
├── components/
│   ├── auth/         # Login forms, auth components
│   └── common/       # Navigation, footer, shared UI
├── stores/           # Zustand state management
├── utils/            # Auth, API client helpers
└── styles/           # Global CSS & Tailwind
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure API endpoints in `.env.local`

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Architecture

### Authentication Flow

1. User selects role (customer/employee) and logs in
2. Credentials sent to backend API (`/auth/login`)
3. Server returns JWT token + user data
4. Token stored in localStorage
5. Zustand store updated with user state
6. Redirect to appropriate dashboard

### State Management

- **Zustand**: Global auth state (`useAuthStore`)
- **React State**: Component-level form state
- **Local Storage**: JWT token persistence

### API Integration

- Base URL: `http://localhost:3001/api` (configurable via `.env.local`)
- Auth header: `Authorization: Bearer <token>`
- Utilities in `src/utils/api.ts` for API calls

## Development Workflow

### Creating New Pages

1. Create `.astro` file in `src/pages/` matching desired route
2. Import appropriate layout (PublicLayout, AuthLayout, etc.)
3. Use React components with `client:load` directive for interactivity

### Adding Components

- **Astro components** (`.astro`): Server-rendered, no JavaScript
- **React components** (`.tsx`): Interactive, use when needed
- Place in `src/components/` organized by feature

### Adding Routes

Astro uses file-based routing:
- `src/pages/about.astro` → `/about`
- `src/pages/customer/dashboard.astro` → `/customer/dashboard`

## Key Dependencies

- **Astro**: Static site generation & SSR
- **React**: Interactive UI components
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **react-hook-form**: Form handling (setup in dependencies)

## TODO & Next Steps

- [ ] Backend API implementation (Node/Express recommended)
- [ ] Database setup (PostgreSQL/MongoDB)
- [ ] JWT authentication middleware
- [ ] Booking system endpoints
- [ ] Email notifications
- [ ] Payment integration
- [ ] Employee time tracking
- [ ] Customer review system

## Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory ready for hosting

### Recommended Platforms

- **Vercel**: Recommended for Astro (auto-deploys on push)
- **Netlify**: Full-stack hosting with serverless functions
- **AWS Amplify**: Flexible deployment options

## Configuration

### API Endpoints

Update in `.env.local`:
```
PUBLIC_API_URL=http://localhost:3001/api
```

### Tailwind Theme

Customize in `tailwind.config.mjs`:
```javascript
theme: {
  extend: {
    colors: { /* your colors */ }
  }
}
```

## Troubleshooting

**Styles not loading?**
- Import `../styles/global.css` in layouts
- Check Tailwind config matches file patterns

**Components not interactive?**
- Add `client:load` directive to React components
- Check TypeScript errors in `.tsx` files

**API 404 errors?**
- Verify backend is running on configured port
- Check `.env.local` has correct API URL

## Support & Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand Store](https://github.com/pmndrs/zustand)

## License

Proprietary - Color Auto Detailing
