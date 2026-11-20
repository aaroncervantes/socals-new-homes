# SoCal’s New Homes

A one-question-at-a-time lead funnel for new-construction buyers in Southern California. The funnel is the website. It is not a property search.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL`, leads are stored in `data/leads.sqlite`. That file is gitignored.

```bash
npm test
npm run build
npm start
```

## What a visitor does

1. Welcome
2. Buying journey. Just browsing leaves for the homes site and does not save a lead
3. Otherwise: area, price, financing, first name, last name, phone, consent, submit
5. Success

Back follows the path they actually took. Progress is based on that path, not on every question in the file. Refresh restores an unfinished funnel from this browser. A successful submit clears that local copy. Nothing is a lead until submit.

## Lead classes

Defined in `src/lib/form/classification.ts`.

- `browser` — just browsing. Nothing is stored as a lead, emailed, or sent to a CRM.
- `nurture_lead` — researching, or planning to buy in 3–6 months but the timeline answer is 6+ months or just exploring.
- `qualified_lead` — ready to buy (any timeline), or planning to buy in 3–6 months with any nearer timeline.

A low budget does not reject anyone.

## Environment

Copy `.env.example`. Nothing in that file is a secret. Do not commit `.env`.

| Variable | Required to launch | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes, on Railway | Postgres connection string. Without it, the app uses SQLite. |
| `SQLITE_PATH` | No | SQLite file when `DATABASE_URL` is unset. |
| `LEAD_NOTIFICATION_EMAIL` | Yes, for email | Inbox that receives lead alerts. |
| `EMAIL_API_KEY` | Yes, for email | Resend API key. |
| `EMAIL_FROM` | Yes, for email | Verified Resend sender. |
| `GHL_WEBHOOK_URL` | No | HTTPS GoHighLevel inbound webhook. Preferred CRM path. |
| `GHL_API_KEY` | No | Used only when the webhook is unset or fails. |
| `GHL_LOCATION_ID` | No | Required together with `GHL_API_KEY`. |
| `NEXT_PUBLIC_SITE_URL` | Yes, before the production build | Canonical origin, no trailing slash. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Yes, before public launch | HTTPS profile URL. Blank shows a labeled placeholder. |
| `NEXT_PUBLIC_FACEBOOK_URL` | Yes, before public launch | HTTPS profile URL. Blank shows a labeled placeholder. |
| `NEXT_PUBLIC_LOGO_SRC` | No | Optional override. Blank uses `/brand/logo.png`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 id (`G-…`). Events stay free of name and phone. |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Numeric Meta Pixel id. |
| `RATE_LIMIT_MAX` | No | Lead posts per IP per hour. Default 8. |
| `MIN_SUBMIT_MS` | No | Minimum time from start to submit. Default 2500. |

Email is skipped, and the lead is still saved, when any of the three email variables is missing. CRM is skipped when GoHighLevel is not configured. A database failure does not show the thank-you screen.

The webhook receives a flat JSON object: firstName, lastName, phone, source (`SoCal’s New Homes Website`), leadClassification, buyingJourney, area, areaOther, budget, homePreferences, financing, timeline, utmSource, utmMedium, utmCampaign, submittedAt.

## Analytics

First-party events, stored without name or phone: `landing_viewed`, `form_started`, `question_viewed`, `question_completed`, `qualified_branch_entered`, `browsing_branch_entered`, `form_submitted`.

UTM parameters from the landing URL are kept for the whole visit and saved on the lead.

## Later campaign routes

`src/lib/campaigns.ts` holds presets for Corona, Ontario, Fontana, Jurupa Valley, and Rancho Cucamonga. The routes are not built. A later page can send people to `/?campaign=corona`, which preselects Riverside. Ontario, Fontana, and Rancho Cucamonga preselect San Bernardino County. `?area=` preselects only a current option: san-bernardino, riverside, orange-county, los-angeles, or other.

## Brand and legal placeholders

The approved mark is `public/brand/logo.png`. It is the welcome mark, the favicon, and the Open Graph image. Instagram URL, Facebook URL, DRE number, brokerage name, and legal entity are still not on file.

`/privacy`, `/terms`, and `/disclosures` are drafts. They are noindex. They list the facts this app actually collects and the blanks the owner still has to fill. Do not advertise the site until counsel replaces them.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Railway is the intended host. `railway.toml` sets the health check to `/api/health`.
