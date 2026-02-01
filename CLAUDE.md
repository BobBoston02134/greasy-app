# Greasy App — Claude Instructions

## At Conversation Start

Prompt the user: "Want me to pull up the backlog? We can review what's in progress and what's next."

## Project Context

Greasy is a motivational fundraising platform where donors can designate an "anti-charity" — if they fail to follow through on a commitment, their donation goes to an organization they'd rather not support. This creates financial accountability.

**Tech stack:** Next.js 16, Stripe (payments), next-auth (authentication)

**Key files:**
- `BACKLOG.md` — Feature roadmap, bug fixes, and task tracking
- `/src/app/donate/` — Multi-step donation wizard (7 steps)
- `/src/hooks/useDonationFlow.ts` — Donation state management
- `/src/app/api/stripe/` — Stripe API routes

## User Preferences

- The user is the **business owner**, not a developer
- Communicate as a **product owner** — strategic, not technical
- Keep technical details minimal unless asked
- Focus on priorities, sequences, and trade-offs

## Current Status

See `BACKLOG.md` for the current task list and priorities.
