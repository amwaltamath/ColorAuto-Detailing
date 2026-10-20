# Meta Ads Setup Guide

**Date: May 1, 2026**

## Overview
ColorAuto Detailing is now fully configured for Meta (Facebook/Instagram) Lead Generation campaigns with proper pixel tracking, privacy compliance, and domain verification.

## Changes Deployed

### 1. Meta Pixel Events

**Location:** `src/layouts/Layout.astro`

Three critical events now fire automatically on all ad pages:

| Event | Trigger | Purpose |
|---|---|---|
| `PageView` | Page load | Always fires (standard) |
| `ViewContent` | Page load (ads only) | Signals high-intent visitor; requires `pixelContentName` prop |
| `Contact` | Phone link clicked | Tracks phone call initiation |
| `Lead` | Quote form submitted | Already existed in `QuoteModal.tsx` |

**How it works:**
- All `/ads/*` pages now pass a `pixelContentName` prop (e.g., `"Ceramic Coating"`)
- Layout automatically fires `ViewContent` if `pixelContentName` is present
- Any `tel:` link on the site fires `Contact` event
- Quote form submission fires `Lead` event

### 2. Privacy Policy

**URL:** `https://colorautodetailing.com/privacy-policy`

**Location:** `src/pages/privacy-policy.astro`

Required for Meta lead generation campaigns. Includes:
- Data collection disclosures (forms, SMS, analytics)
- Third-party tracking services (Meta Pixel, Google Analytics, reCAPTCHA, OpenPhone/Quo)
- SMS opt-out instructions
- User rights and contact information
- Links to third-party privacy policies

**Added to:**
- Quote Modal (`src/components/features/QuoteModal.tsx`) — below submit button
- Contact Page (`src/pages/contact.astro`) — below submit button

### 3. Domain Verification

**Meta Tag:** `<meta name="facebook-domain-verification" content="e5oueh4i4fyhcztfgg1v433derp42w">`

**Location:** `src/layouts/Layout.astro`

Verify in Meta Business Manager:
1. Business Settings → Brand Safety → Domains
2. Click **Verify** next to `colorautodetailing.com`
3. Complete verification (already added to code)

### 4. Updated Ads Pages

All 9 `/ads/*` pages now include `pixelContentName`:

- `auto-detailing.astro` → `"Auto Detailing"`
- `auto-paint-correction.astro` → `"Paint Correction"`
- `ceramic-coating.astro` → `"Ceramic Coating"`
- `color-ppf.astro` → `"Color PPF"`
- `home-window-tint.astro` → `"Home Window Tint"`
- `home-office-window-tint.astro` → `"Home & Office Window Tint"`
- `office-window-tint.astro` → `"Office Window Tint"`
- `paint-protection-film.astro` → `"Paint Protection Film"`
- `window-tinting.astro` → `"Window Tinting"`

## Campaign Setup

### UTM Parameter Structure

Use this format for all Meta ad landing pages:

```
https://colorautodetailing.com/ads/[SERVICE]?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=[SERVICE]
```

**Example URLs:**
- Ceramic: `https://colorautodetailing.com/ads/ceramic-coating?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=ceramic-coating`
- PPF: `https://colorautodetailing.com/ads/paint-protection-film?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=ppf`
- Window Tint: `https://colorautodetailing.com/ads/window-tinting?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=window-tinting`
- Auto Detailing: `https://colorautodetailing.com/ads/auto-detailing?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=auto-detailing`
- Color PPF: `https://colorautodetailing.com/ads/color-ppf?utm_source=facebook&utm_medium=paid_social&utm_campaign=ColorAuto+Premier+Leads+2026&utm_content=color-ppf`

### Meta Instant Forms → Employee dashboard

Instant Form submissions can flow into **Employee dashboard → Leads** (same Supabase table as website quotes).

**Production webhook URL:**

```
https://colorautodetailing.com/api/webhooks/meta-leads
```

**Vercel environment variables:**

| Variable | Purpose |
|----------|---------|
| `META_WEBHOOK_VERIFY_TOKEN` | Any secret string you choose; must match Meta webhook setup |
| `META_APP_SECRET` | App → Settings → Basic → App Secret (validates `X-Hub-Signature-256`) |
| `META_PAGE_ACCESS_TOKEN` | Page token with `leads_retrieval` (fetches name, phone, email from each lead) |

**Supabase (one-time):** run `supabase/meta_leads_migration.sql` in the SQL editor so `leads.external_id` exists (prevents duplicate rows if Meta retries the webhook).

**Meta Developers setup:**

1. [developers.facebook.com](https://developers.facebook.com) → your app (or create **Business** app).
2. Add product **Webhooks** → **Page** → Subscribe to field **`leadgen`**.
3. Callback URL: `https://colorautodetailing.com/api/webhooks/meta-leads`  
   Verify token: same as `META_WEBHOOK_VERIFY_TOKEN` → click **Verify and save**.
4. **Generate** a **Page access token** for the ColorAuto Facebook Page with:
   - `leads_retrieval`
   - `pages_manage_metadata`
   - `pages_read_engagement`  
   Paste into `META_PAGE_ACCESS_TOKEN` on Vercel and redeploy.
5. In **Webhooks → Page**, subscribe your Page to the app (Install app on Page if prompted).
6. Submit a **test lead** from Ads Manager (Instant Form preview) and confirm a new row in the dashboard with source **Meta Ads**.

Leads are stored with `source: meta_ads`, UTM fields from form/ad IDs, and sync to OrbisX when configured.

**Team alerts (same as contact form):**

- **Email** → `CONTACT_TO_EMAIL` via Resend (`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`)
- **SMS** → `QUO_SMS_NOTIFY_NUMBER` (personal cell, not the shop line) when `CHAT_SMS_BRIDGE_ENABLED=true` and Quo is configured

Each new Meta lead triggers both (if configured). Email includes a **View in dashboard** button; SMS includes name, phone, service, and the dashboard link.

### Bulk import (Meta CSV export)

**Employee dashboard → Leads → Import CSV**

1. In Meta Ads Manager, open your lead form / leads list and **Download** (CSV).
2. Upload the file in the dashboard. Rows use Meta columns (`full_name`, `email`, `phone_number`, `id`, `campaign_name`, `ad_name`, `created_time`, custom questions).
3. Leads with the same Meta **`id`** as an existing row (webhook or prior import) are **skipped** so you can re-import safely.

Run `supabase/meta_leads_migration.sql` once so `external_id` deduplication works.

### Lead Campaign Specs

**Campaign Objective:** Leads

**Recommended Settings:**
- **Budget:** $15–20/day
- **Audience:** Age 25–55, Grand Junction CO + 25mi radius, Advantage+ enabled
- **Placements:** Advantage+ (all platforms)
- **Instant Form:**
  - Privacy Policy: `https://colorautodetailing.com/privacy-policy`
  - Thank You: "We'll call you within 1 business day!"
  - Fields: Name, Phone, Email, "Which service?" (dropdown)

### Attribution

**Lead source detection** in `src/components/features/QuoteModal.tsx`:
- Checks `utm_source` parameter automatically
- Maps `facebook`, `fb`, `instagram`, `meta` → `"meta_ads"`
- All lead submissions include UTM params and detected source

## Verification Checklist

- [ ] Deploy to production (already done)
- [ ] Test Pixel events using [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper) Chrome extension
- [ ] Verify domain in Meta Business Manager
- [ ] Add Privacy Policy URL to Instant Form
- [ ] Launch first lead gen campaign
- [ ] Monitor first 7 days — call leads within 1 hour for best conversion

## Files Modified

```
src/layouts/Layout.astro                                    (+Meta events, domain verification)
src/components/features/QuoteModal.tsx                      (+Privacy Policy link)
src/pages/contact.astro                                     (+Privacy Policy link)
src/pages/ads/ceramic-coating.astro                         (+pixelContentName)
src/pages/ads/auto-detailing.astro                          (+pixelContentName)
src/pages/ads/auto-paint-correction.astro                   (+pixelContentName)
src/pages/ads/paint-protection-film.astro                   (+pixelContentName)
src/pages/ads/color-ppf.astro                               (+pixelContentName)
src/pages/ads/window-tinting.astro                          (+pixelContentName)
src/pages/ads/home-window-tint.astro                        (+pixelContentName)
src/pages/ads/office-window-tint.astro                      (+pixelContentName)
src/pages/ads/home-office-window-tint.astro                 (+pixelContentName)
src/pages/privacy-policy.astro                              (NEW)
```

## Commit

**Hash:** `565e0ed`

**Message:** `Meta ads: add Pixel ViewContent/Contact events, domain verification, privacy policy, update ads pages`

---

For questions or updates, refer to the inline comments in `Layout.astro` and `QuoteModal.tsx`.
