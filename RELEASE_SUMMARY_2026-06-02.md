# Release Summary — 2026-06-02

## Branch and merge

- Feature work completed on `crm-preview`
- Merged into default branch `master`
- Merge commit: `d6c1f75`

## Included work

### Employee dashboard

- Reworked desktop navigation into a left sidebar with clearer CRM structure
- Added mobile slide-out drawer navigation for employee pages
- Improved CRM mobile layouts for customers, jobs, and invoices
- Added Color Auto logo to the employee portal header and mobile drawer

### Customer portal

- Launched customer login, registration, and dashboard experience
- Reused the same branded auth screen design across customer and employee login flows
- Added customer dashboard tabs for overview, history, vehicles, invoices, and profile
- Added onboarding checklist for first-time customer accounts
- Improved the dashboard CTA area with booking and vehicle-management actions
- Added customer-side vehicle onboarding so logged-in users can add vehicles directly

### Customer auth and data linking

- Replaced customer API identity lookup based on client-sent headers
- Added server-side JWT verification for customer API requests
- Linked customer CRM records by authenticated `user_id`, with fallback matching by email for legacy rows
- Auto-linked legacy CRM customer records when email matched an authenticated user

### API and schema work

- Added customer API endpoints for profile, jobs, invoices, and vehicles
- Added customer vehicle creation endpoint
- Added CRM API endpoints and schema files introduced in the preview branch

## Notes

- Repository default branch is `master`, not `main`
- Customer data relationship is: auth user -> `crm_customers` -> `crm_vehicles` / `crm_jobs` / `crm_invoices`
- Build validations were run successfully during rollout before merge