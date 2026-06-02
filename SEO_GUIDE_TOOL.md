# SEO Guide Tool (Window Tinting)

## UI Layout
- Employee Dashboard tab: SEO Guide
- Input form: business, service type, city, nearby cities, competitors, budget, goal
- Output sections: score, fast wins, keyword clusters, page brief, local/technical checklists, content calendar, roadmap, prompt pack

## API Endpoint
- Route: `POST /api/employee/seo-guide`
- Input payload fields:
	- businessName
	- serviceType
	- primaryCity
	- nearbyCities[]
	- competitors[]
	- budgetLevel (`starter | growth | aggressive`)
	- goalType (`calls | form-leads | maps-visibility`)
- Output includes:
	- score + category breakdown
	- keywordClusters
	- pageBrief
	- checklists
	- contentCalendar
	- roadmap
	- promptTemplates

## History Endpoints
- Route: `GET /api/employee/seo-guide/history`
	- Returns recent saved SEO guide snapshots
- Route: `POST /api/employee/seo-guide/history`
	- Saves the full generated payload as a snapshot
- Route: `GET /api/employee/seo-guide/history/:id`
	- Loads a single snapshot payload by id
- Route: `DELETE /api/employee/seo-guide/history/:id`
	- Deletes a snapshot

## Data Tables
See `supabase/seo_guide_schema.sql` for first-pass schema:
- seo_projects
- seo_keywords
- seo_pages
- seo_tasks
- seo_scores
- seo_guide_snapshots

## Prompt Pack
Prompt templates are generated in:
- `src/utils/seoGuideTemplates.ts`

They include:
- Service page brief prompt
- Competitor gap prompt
- Google Business Profile posts prompt
- Blog calendar prompt

## Employee Dashboard Workflow
- Generate a guide from the SEO tab form
- Click Save Snapshot to persist it
- Use the History panel to reload or delete prior guides