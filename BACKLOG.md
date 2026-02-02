# Greasy App Backlog

Last updated: 2026-02-01

---

## Feature Roadmap

### Phase 1: Foundation
- [ ] **Account creation with real authentication** — Current auth has no password verification. Need proper account system with stored credentials.
- [ ] **Stored payment information** — Allow users to save payment method for faster checkout next time. Requires Stripe Customer + PaymentMethod linking.

### Phase 2: Core Features
- [ ] **Donation history on account page** — Currently a stub. Need to fetch and display user's past donations from Stripe.
- [ ] **Recurring donations** — Let donors set up weekly/monthly recurring gifts. Depends on account system + webhook infrastructure.
- [ ] **Admin dashboard** — Password-protected page showing donation count and total volume. Independent of other features.
- [x] **Request a charity form** — Let users submit requests for charities to be added to the platform. (2026-02-01)

---

## Deferred Bug Fixes

### Critical / Security
- [ ] **Auth has no password verification** (`/src/lib/auth.ts:13-22`) — Anyone with a user's email can log in. Will be fixed as part of account creation feature.
- [ ] **Webhook handler is a no-op** (`/src/app/api/stripe/webhook/route.ts`) — Must be implemented for deferred donations and recurring to work.
- [ ] **API routes have no auth/rate-limiting** — `create-payment-intent` and `create-customer` are publicly callable.

### High Priority
- [ ] **Contact form submissions not persisted** (`/src/app/contact/page.tsx`) — Form shows success but does nothing.
- [ ] **Deferred payments expire after 7 days** — Manual capture PaymentIntents need a scheduled job or webhook logic.

### Medium Priority
- [ ] **next-auth v4 + Next.js 16 compatibility** — Consider migrating to Auth.js v5.

---

## Completed

- [x] Request a charity form (2026-02-01) — /request-charity page with localStorage storage
- [x] Delete pageOLD.tsx dead code (2026-02-01)
- [x] Remove unused isValidPhone utility (2026-02-01)
- [x] Fix useEffect indentation in timeframe page (2026-02-01)
- [x] Verify .env.local not in git (2026-02-01) — Already protected by .gitignore, never committed
- [x] Fix Back to Home navigation on thank-you page (2026-02-01)
- [x] Add FeedbackWidget for beta tester feedback (2026-02-01)
- [x] Add PostHog session recording integration (2026-02-01)
- [x] Remove debug `console.log` statements from `/donate` page (2026-02-01)
- [x] Remove phone number field from thank-you page (2026-02-01)
- [x] Add 2.5% fee coverage checkbox at checkout (2026-02-01)
- [x] Fix donation flow state hydration race condition (commit c7deb29)

---

## Notes

- **Platform fee:** 2.5% on transactions. Donor can opt to cover this at checkout.
- **Anti-charity concept:** If user fails commitment, donation goes to their designated anti-charity instead of primary recipient.
