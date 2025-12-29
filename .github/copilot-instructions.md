# Color Auto Detailing - Copilot Instructions

## Project Overview

A full-stack Astro + React application for Color Auto Detailing with customer booking portal and employee management system. Built with TypeScript, Tailwind CSS, and Zustand for state management.

**Stack:**
- Frontend: Astro (SSG/SSR) + React for interactive components
- Styling: Tailwind CSS (Vite plugin)
- State: Zustand (lightweight store)
- Forms: react-hook-form (configured but not yet integrated)
- Routing: File-based (Astro pages)

## Architecture & Key Patterns

### File-Based Routing
- **Convention**: `/src/pages/` directory maps to routes
- **Example**: `src/pages/customer/dashboard.astro` → `/customer/dashboard`
- **Important**: Use `.astro` for static pages, import React components for interactive sections

### Layout System
Three layout types for different purposes:
1. **Layout.astro** - Base wrapper (head, common styles)
2. **PublicLayout.astro** - Adds Navigation + Footer (public site pages)
3. **AuthLayout.astro** - Full-height centered gradient (login pages)

**Usage**: Import layout in page frontmatter, wrap content with `<Layout title="..."><slot /></Layout>`

### Component Strategy
- **.astro components**: Server-rendered, lightweight, no JS sent to browser
  - Use for static UI: Navigation, Footer, page structure
  - Place in `src/components/common/`
  
- **.tsx components**: React components for interactivity
  - Use: Forms, state management, event handlers
  - Must add `client:load` directive in page to hydrate: `<LoginForm client:load role="customer" />`
  - Place in `src/components/auth/` or by feature

**Key Pattern**: LoginForm.tsx uses Zustand store and form state - it's interactive and requires hydration.

### State Management
**Zustand Store** (`src/stores/authStore.ts`):
- Global auth state: `user` object, `isLoggedIn` boolean
- Methods: `login(user)`, `logout()`, `setUser(user)`
- Import with: `import { useAuthStore } from '../stores/authStore'`
- Usage in React: `const { user, login } = useAuthStore()`

**Authentication Flow**:
1. User submits LoginForm (email + password + role)
2. Form sends POST to `/api/auth/login` (see `src/utils/api.ts`)
3. Backend returns `{ token, user: {...} }`
4. LoginForm calls `useAuthStore.login(userData)` and redirects to dashboard
5. Token stored in localStorage via `saveAuthToken(token)`

### API Integration
**Environment Setup**:
```env
PUBLIC_API_URL=http://localhost:3001/api    # Accessible in browser
API_URL=http://localhost:3001/api            # Server-side only
```

**Utilities** (`src/utils/api.ts`):
- `apiFetch(endpoint, options)` - Generic API wrapper with auth headers
- `loginUser(email, password, role)` - Auth endpoint
- `getBookings(userId, token)` - Example protected endpoint
- All requests include `Authorization: Bearer <token>`

**Note**: Mock auth in LoginForm catches errors but doesn't call real endpoint yet - TODO: wire to backend.

## Development Workflow

### Running the Project
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Adding a New Customer Feature
**Example: Booking form page**
1. Create page: `src/pages/customer/book-service.astro`
2. Import layout: `import PublicLayout from '../../layouts/PublicLayout.astro'`
3. Create React component: `src/components/features/BookingForm.tsx`
4. In page, import and hydrate: `<BookingForm client:load />`
5. Form uses Zustand for auth context, makes API call to `/api/bookings` (POST)

### Adding a New Employee Dashboard Widget
1. Create component: `src/components/employee/ScheduleWidget.astro` or `.tsx`
2. Use Zustand to check role: `const { user } = useAuthStore()`
3. Conditionally render based on `user?.role === 'employee'`
4. If interactive, use React + `client:load`

## Project Structure Map

| Path | Purpose |
|------|---------|
| `src/pages/` | Route endpoints (public site + portals) |
| `src/layouts/` | Base, Public, Auth layouts |
| `src/components/auth/` | LoginForm, register forms |
| `src/components/common/` | Navigation, Footer (shared Astro) |
| `src/stores/` | Zustand auth store |
| `src/utils/` | `auth.ts`, `api.ts` helpers |
| `src/styles/` | `global.css` (Tailwind imports) |

## Common Tasks & Examples

### Check if User is Logged In
```tsx
import { useAuthStore } from '../stores/authStore';

export function ProtectedComponent() {
  const { isLoggedIn, user } = useAuthStore();
  
  if (!isLoggedIn) return <p>Please log in</p>;
  return <p>Welcome, {user?.name}</p>;
}
```

### Call Protected API
```tsx
import { getBookings } from '../utils/api';

const bookings = await getBookings(user.id, authToken);
```

### Add Styling
Use Tailwind classes directly - no CSS files needed:
```astro
<div class="max-w-7xl mx-auto px-4 py-8 bg-white rounded-lg shadow">
  <h1 class="text-4xl font-bold">Title</h1>
</div>
```

### Redirect After Login
In React component:
```tsx
window.location.href = user.role === 'customer' ? '/customer/dashboard' : '/employee/dashboard';
```

## Critical Gotchas

1. **React hydration**: Always add `client:load` to interactive React components in Astro pages
2. **Tailwind content pattern**: Config already includes `src/**/*.{astro,jsx,tsx}` - files must match this pattern
3. **Environment variables**: Only `PUBLIC_*` are accessible in browser; use `API_URL` for server calls
4. **localStorage**: Only available in browser - wrap with `typeof window !== 'undefined'` check
5. **Token persistence**: Must manually implement JWT refresh logic in backend (currently stores in localStorage)

## Next Implementation Steps

- [ ] Wire LoginForm to real backend at `PUBLIC_API_URL/auth/login`
- [ ] Create protected middleware/guards for dashboard pages
- [ ] Build booking system endpoints and booking form UI
- [ ] Add employee time-tracking widgets
- [ ] Implement payment gateway integration
- [ ] Add email notification system

## Useful Resources

- **Astro file-based routing**: https://docs.astro.build/en/core-concepts/routing/
- **Astro + React integration**: https://docs.astro.build/en/guides/integrations/react/
- **Zustand API**: https://github.com/pmndrs/zustand
- **Tailwind Astro setup**: https://tailwindcss.com/docs/guides/astro
