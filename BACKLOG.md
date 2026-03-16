# Greasy App Backlog

Last updated: 2026-03-16

---

## North Star: Get Real Money In The Door

Every feature we build should be evaluated against this question: **does this help a real user complete a commitment and authorize a real payment?** Prioritize anything that removes friction from that path. Defer everything else.

---

## Requires Your Action

These items cannot be completed by the dev team. They require you to log into external dashboards or run manual tests.

- [ ] **Test check-in cron** — hit `/api/cron/send-checkins` on sandbox, verify email arrives in Resend dashboard
- [ ] **Test Yes/No links** — do a test donation with a deferred timeframe, click both links, verify Stripe captures on "No" and cancels on "Yes"
- [ ] **End-to-end sandbox test** — full flow: signup → commitment → deadline → capture, with a Stripe test card
- [ ] **Stripe webhooks** — add `https://greasy.ai/api/stripe/webhook` in Stripe Dashboard with the events listed below
- [ ] **Admin access** — run `UPDATE users SET is_admin = true WHERE email = 'your@email.com'` in Supabase SQL Editor, then verify `/admin` loads
- [ ] **DNS** — verify Vercel has `*.getgreasy.ai` and `*.sandbox.getgreasy.ai` domains confirmed; test subdomain routing end to end
- [ ] **Env var: `ADMIN_ALERT_EMAIL`** — add to Vercel (sandbox + production) — your email address for cron failure alerts

---

## Pre-Launch Blockers (Must Fix Before Beta)

### P0 — Hard Blockers

#### Resume Here (next session)
1. [x] **Audit null columns** — fixed: `anti_charity_id` was never written (anti-charity chosen after payment); now written via PATCH at the anti-charity step. `commitment_description` field fix was also applied to check-in cron (was reading `notes`, now reads `commitment_description`).
2. [ ] **Test check-in cron manually** — requires deployed env: hit `/api/cron/send-checkins` and verify email arrives in Resend dashboard (USER ACTION REQUIRED)
3. [ ] **Test Yes/No links in check-in email** — verify Stripe captures payment on "No" and cancels on "Yes" (USER ACTION REQUIRED — needs real test donation)
4. [x] **Donation confirmation email** — already implemented; now correctly only sends on final step of flow (not duplicated)

#### Remaining Blockers
- [ ] **DNS / subdomain routing** — `sundai.sandbox.getgreasy.ai` not yet resolving. Cloudflare apex A record may already be correct (76.76.21.21 exists). Need to verify Vercel has confirmed `*.getgreasy.ai` and `*.sandbox.getgreasy.ai` domains and that subdomain routing works end to end. (USER ACTION REQUIRED)
- [x] **Password reset flow** — fully implemented at `/forgot-password`
- [x] **Commitment description field** — implemented in donation flow
- [x] **Default-to-capture warning** — present in confirm step (amber callout) and check-in email footer
- [ ] **End-to-end sandbox test** — full flow: signup → commitment → deadline → capture, verified with Stripe test card (USER ACTION REQUIRED)
- [ ] **Stripe webhooks confirmed** receiving events on production (USER ACTION REQUIRED — configure in Stripe Dashboard)
- [ ] **Admin dashboard live** — built and deployed; verify it loads at /admin after setting `is_admin = true` on your account (USER ACTION REQUIRED)

### P1 — Strong Recommendations Before Beta
- [x] Cron job monitoring — `sendAdminAlert` fires on capture failures; set `ADMIN_ALERT_EMAIL` env var in Vercel to receive alerts
- [x] Manual payment review tool in admin — Payment Review section in `/admin` with Capture/Cancel controls; API at `/api/admin/donations`
- [x] Beta user runbook — see `RUNBOOK.md`

---

## Iteration Pipeline (Post-Launch, In Priority Order)

### Revenue-Critical
- [x] **Frictionless re-commitment** — built, behind `ENABLE_FRICTIONLESS_RECOMMITMENT` flag (default off)
- [x] **Shareable commitment page** — built at `/c/[id]`, behind `ENABLE_SHAREABLE_COMMITMENT_PAGE` flag (default off)
- [x] **Email receipt + commitment confirmation** — already implemented; fires on final step of donation flow
- [x] **Reminder emails** — cron at `/api/cron/send-reminders`, behind `ENABLE_REMINDER_EMAILS` flag (default off); sends 7 days before deadline

### Trust & Credibility
- [x] **How it works page** — built at `/how-it-works`, behind `ENABLE_HOW_IT_WORKS_PAGE` flag (default off)
- [ ] **Success stories / social proof** — requires real user testimonials; no code work until you have content
- [x] **FAQ** — built at `/faq`, behind `ENABLE_FAQ_PAGE` flag (default off)

### User Experience
- [x] **Commitment dashboard** — built at `/commitments`, behind `ENABLE_COMMITMENT_DASHBOARD` flag (default off)
- [x] **Success confirmation flow** — built at `/commitment/success`, behind `ENABLE_SUCCESS_FAILURE_FLOWS` flag (default off)
- [x] **Failure acknowledgment flow** — built at `/commitment/failure`, behind `ENABLE_SUCCESS_FAILURE_FLOWS` flag (default off)

### Growth
- [ ] **Referral mechanic** — not yet built; flag `ENABLE_REFERRAL_MECHANIC` reserved in flags.ts
- [ ] **Group commitments** — not yet built; flag `ENABLE_GROUP_COMMITMENTS` reserved in flags.ts

---

## Action Required (Before You Can Test)

### 1. Create Supabase Projects
- [ ] Create **dev project** at supabase.com (for localhost + sandbox)
- [ ] Create **prod project** at supabase.com (for greasy.ai)

### 2. Run Database Schema
- [ ] Open SQL Editor in dev project → run `/database/schema.sql`
- [ ] Open SQL Editor in prod project → run `/database/schema.sql`
- [ ] Verify `contact_submissions` table exists in Supabase dev and prod projects (required for feedback widget)

### 3. Update Local Environment
- [ ] Replace placeholder values in `.env.local` with your dev project credentials

### 4. Configure Vercel Deployments
- [ ] Set sandbox.greasy.ai env vars (see Environment Configuration below)
- [ ] Set greasy.ai env vars (see Environment Configuration below)
- [ ] Set `EMAIL_VERIFY_SECRET` env var in Vercel (sandbox + production) — required for secure password reset tokens

### 5. Set Up Upstash Redis (Optional but Recommended)
- [ ] Create free account at upstash.com
- [ ] Create Redis database
- [ ] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel

### 6. Configure Stripe Webhooks
- [ ] In Stripe Dashboard → Webhooks, add endpoint: `https://greasy.ai/api/stripe/webhook`
- [ ] Events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.captured`
  - `charge.refunded`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### 7. Make Yourself Admin
- [ ] After creating account, run in Supabase SQL Editor:
  ```sql
  UPDATE users SET is_admin = true WHERE email = 'your@email.com';
  ```

---

## All Features Complete

### Phase 1: Foundation — COMPLETE
- [x] **Real authentication with password verification** — bcrypt hashing, Supabase user storage
- [x] **Database schema** — Full PostgreSQL schema for users, donations, charities, subscriptions
- [x] **Three-environment system** — local/sandbox/production auto-detection
- [x] **API rate limiting** — Upstash Redis-based rate limiting on all write endpoints

### Phase 2: Core Features — COMPLETE
- [x] **Donation history on account page** — Fetches from database with status badges
- [x] **Contact form persistence** — Saves to `contact_submissions` table
- [x] **Request a charity form** — Migrated from Prisma to Supabase
- [x] **Webhook handler** — Full implementation for payment + subscription events
- [x] **Recurring donations** — Stripe subscriptions with weekly/monthly intervals
- [x] **Admin dashboard** — Full stats, donation history, revenue metrics

### Phase 3: Infrastructure — COMPLETE
- [x] **Deferred payment auto-capture** — Vercel Cron job runs every 5 minutes
- [x] **Subscription management** — Users can view/cancel subscriptions from account page

---

## Completed (2026-03-02)

### Check-in Email Feature
- [x] 3 env vars added to Vercel (Production) and `.env.local`
- [x] Supabase migration run: `checkin_email_sent` column + index added
- [x] Stripe check-or-create bug fixed — signup no longer fails when Stripe customer already exists for email
- [x] Full donate flow tested: payment, commitment yes/no, notes saved to DB

### UI / UX
- [x] Password visibility toggle on login and join forms
- [x] Sandbox banner fixes — positioning, hydration, hostname detection, navbar overlap
- [x] Error details added to payment intent API response

---

## Completed (2026-03-01)

### Infrastructure
- [x] Three-environment system (`/src/lib/env.ts`)
- [x] Sandbox banner component
- [x] Supabase client library (`/src/lib/supabase.ts`)
- [x] Complete PostgreSQL schema (`/database/schema.sql`)
- [x] Rate limiting library (`/src/lib/ratelimit.ts`)
- [x] Vercel Cron configuration (`/vercel.json`)

### Authentication
- [x] Password verification with bcrypt
- [x] User storage in Supabase
- [x] Admin role support (`is_admin` column)

### API Routes Created/Updated
- [x] `/api/stripe/create-customer` — With rate limiting + Supabase user creation
- [x] `/api/stripe/create-payment-intent` — With rate limiting + donation record
- [x] `/api/stripe/create-subscription` — NEW: Stripe subscription creation
- [x] `/api/stripe/webhook` — Full implementation with 10 event handlers
- [x] `/api/charity-requests` — Migrated to Supabase + rate limiting
- [x] `/api/contact` — NEW: Persists contact form submissions
- [x] `/api/donations` — NEW: User's donation history
- [x] `/api/subscriptions` — NEW: User's subscriptions + cancel endpoint
- [x] `/api/cron/capture-payments` — NEW: Auto-capture deferred payments
- [x] `/api/admin/stats` — NEW: Dashboard statistics
- [x] `/api/admin/charity-requests` — NEW: Review charity requests
- [x] `/api/admin/contacts` — NEW: Review contact submissions

### Pages Updated
- [x] `/join` — Password validation, sends to API
- [x] `/login` — Fixed error messages and placeholder text
- [x] `/account` — Donation history + subscription management
- [x] `/contact` — Saves to database
- [x] `/admin` — NEW: Full admin dashboard

---

## Environment Configuration

### Three Environments

| Environment | URL | Stripe Mode | Database | Banner |
|---|---|---|---|---|
| Local | localhost:3000 | TEST | Supabase dev | None |
| Sandbox | sandbox.greasy.ai | TEST | Supabase dev | Yes |
| Production | greasy.ai | LIVE | Supabase prod | None |

### Vercel Environment Variables

**Sandbox Deployment (sandbox.greasy.ai):**
```
NEXT_PUBLIC_APP_ENV=sandbox
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://[dev-project-ref].supabase.co
SUPABASE_ANON_KEY=[from dev project Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[from dev project Settings > API]
DATABASE_URL=postgresql://postgres:[password]@db.[dev-project-ref].supabase.co:5432/postgres
NEXTAUTH_SECRET=[generate: openssl rand -base64 32]
NEXTAUTH_URL=https://sandbox.greasy.ai
UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
UPSTASH_REDIS_REST_TOKEN=[from Upstash console]
CRON_SECRET=[generate: openssl rand -base64 32]
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
ADMIN_ALERT_EMAIL=your@email.com
```

**Production Deployment (greasy.ai):**
```
NEXT_PUBLIC_APP_ENV=production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://[prod-project-ref].supabase.co
SUPABASE_ANON_KEY=[from prod project Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[from prod project Settings > API]
DATABASE_URL=postgresql://postgres:[password]@db.[prod-project-ref].supabase.co:5432/postgres
NEXTAUTH_SECRET=[generate: openssl rand -base64 32]
NEXTAUTH_URL=https://greasy.ai
UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
UPSTASH_REDIS_REST_TOKEN=[from Upstash console]
CRON_SECRET=[generate: openssl rand -base64 32]
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
ADMIN_ALERT_EMAIL=your@email.com
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with password hash, Stripe customer ID, admin flag |
| `charities` | Admin-curated list of recipient organizations |
| `donations` | One-time donation records with status workflow |
| `subscriptions` | Recurring donation subscriptions |
| `charity_requests` | User-submitted requests for new charities |
| `contact_submissions` | Contact form messages |
| `webhook_events` | Stripe event log for debugging |

---

## API Rate Limits

| Endpoint | Tier | Limit |
|----------|------|-------|
| create-customer | strict | 5/min |
| create-subscription | strict | 5/min |
| contact | strict | 5/min |
| charity-requests | strict | 5/min |
| create-payment-intent | standard | 20/min |

Rate limiting is optional — disabled if Upstash credentials not configured.

---

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/capture-payments` | Every 5 min | Captures deferred payments when `capture_at` time is reached; alerts admin on failures |
| `/api/cron/send-checkins` | Daily 8am | Sends check-in emails for donations due within 24 hours |
| `/api/cron/send-reminders` | Daily 9am | Sends 1-week-before reminders (behind `ENABLE_REMINDER_EMAILS` flag) |

---

## Notes

- **Platform fee:** 2.5% on transactions. Donor can opt to cover this at checkout.
- **Anti-charity concept:** If user fails commitment, donation goes to their designated anti-charity.
- **Recurring donations:** Support for weekly and monthly intervals via Stripe Subscriptions.
- **Admin access:** Set `is_admin = true` in users table to grant dashboard access.
