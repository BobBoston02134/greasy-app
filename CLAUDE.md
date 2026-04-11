# Greasy App — Claude Instructions

## At Conversation Start

Prompt the user: "Want me to pull up the backlog? We can review what's in progress and what's next."

## WORKFLOW RULE — MANDATORY

**Before executing any multi-step task, STOP and follow this process:**

1. **Break down** the request into discrete work items
2. **Identify agents** — assign each item to the right specialist
3. **Spawn in parallel** — launch multiple agents simultaneously where possible
4. **Coordinate, don't execute** — your job is orchestration, not doing everything yourself

**If you find yourself writing code for more than 2-3 steps without spawning an agent, you're doing it wrong.**

### AUTONOMY RULE — NON-NEGOTIABLE

Agents must never stop to ask Bob for verification or approval during feature work. Run autonomously from start to finish. QA sign-off remains a required safety gate before every push.

All compound bash commands (cd + git, cd + vercel, etc.) are pre-approved and must never prompt for confirmation.

### NON-NEGOTIABLE GATES — NEVER SKIP

These three rules are absolute. No exceptions, no shortcuts, no "just this once."

**GATE 1 — Build check before every commit**
Before any `git commit`, the orchestrator MUST run `npm run build`. If the build fails, no commit happens. The @full-stack-developer fixes the errors first. This is not optional.

**GATE 2 — @qa-engineer before every push — LIVE TESTING REQUIRED**
Before any `git push`, the orchestrator MUST spawn @qa-engineer to verify the change works as intended and does not break existing flows. No push without QA sign-off. No task may be marked complete until @qa-engineer has reviewed and signed off.

**Code traces are NOT acceptable QA.** @qa-engineer must run the actual dev server (`npm run dev`) and execute the affected flow end-to-end against a live database. Static analysis of code logic does not count as a pass. If @qa-engineer cannot run a live test, it must explicitly say so and flag the task as UNVERIFIED — never mark it as passed.

Specific requirements:
- Start `npm run dev` and confirm the server is running
- Execute the exact user flow affected by the change
- Confirm expected behavior in the browser or via API response
- Check the database to verify data was written correctly
- Only then mark QA as passed

**GATE 3 — Orchestrator never writes code**
The orchestrator (main Claude thread) does not write implementation code. Ever. If code needs to be written, fixed, or debugged, delegate to @full-stack-developer. If the orchestrator catches itself writing code, it must stop, spawn the right agent, and hand off. Fixing broken code yourself instead of delegating is a workflow violation.

**GATE 4 — Deploy after every successful QA pass**
After every successful QA pass, run: `vercel --prod`

### Available Agents

| Agent | Use For |
|-------|---------|
| @product-owner | Product strategy, requirements, prioritization |
| @ux-designer | User experience, interaction design, usability |
| @full-stack-developer | End-to-end implementation, frontend + backend |
| @database-designer | Schema design, queries, migrations, optimization |
| @devops-engineer | CI/CD, deployment, infrastructure, monitoring |
| @code-reviewer | Code quality, best practices, PR reviews |
| @security-analyst | Vulnerability assessment, security hardening |
| @qa-engineer | Test strategy, test cases, quality assurance |
| @api-architect | API design, integrations, contracts |
| @performance-optimizer | Speed, efficiency, bottleneck analysis |
| @documentation-writer | Technical docs, guides, READMEs |
| @accessibility-specialist | WCAG compliance, inclusive design |
| @Explore | Fast codebase exploration and search |
| @Plan | Implementation planning and architecture |

### Example Delegation

User asks: "Add user authentication with email verification"

**Wrong:** Start writing auth code yourself
**Right:**
- @database-designer → user table schema with verification tokens
- @full-stack-developer → auth routes, email sending, UI
- @qa-engineer → test registration and verification flow
- Run these in parallel, coordinate results

## Project Context

Greasy is a motivational fundraising platform where donors can designate an "anti-charity" — if they fail to follow through on a commitment, their donation goes to an organization they'd rather not support. This creates financial accountability.

**Tech stack:** Next.js 16, Stripe (payments), Supabase (PostgreSQL), next-auth (authentication)

**Key files:**
- `BACKLOG.md` — Feature roadmap, bug fixes, and task tracking
- `/src/app/donate/` — Multi-step donation wizard (7 steps)
- `/src/hooks/useDonationFlow.ts` — Donation state management
- `/src/app/api/stripe/` — Stripe API routes
- `/src/lib/supabase.ts` — Database client
- `/database/schema.sql` — Database schema

## User Preferences

- The user is the **business owner**, not a developer
- Communicate as a **product owner** — strategic, not technical
- Keep technical details minimal unless asked
- Focus on priorities, sequences, and trade-offs
- **Delegate to agents** — don't do all the work yourself
- **Full autonomy** — write code, commit, and push without asking for confirmation. Just do it and report what was done.

## Feature Flags — MANDATORY CONVENTION

Every unfinished, incomplete, or in-progress feature MUST be wrapped in a simple `if/else` feature flag. No exceptions.

- Use simple boolean constants in `/src/lib/flags.ts` (e.g. `export const ENABLE_SUBDOMAIN_ROUTING = false`)
- @product-owner must include a flag name when scoping any new feature
- @full-stack-developer must wrap all new/unfinished features in the corresponding flag
- This is a permanent project convention — never ship unguarded in-progress code

## Current Status

See `BACKLOG.md` for the current task list and priorities.
