# Greasy Beta Runbook

Last updated: 2026-03-16

This runbook covers the operational procedures for handling common support and operational scenarios during the Greasy beta. Keep this document accessible and update it as you learn.

---

## Table of Contents

1. [Refund Requests](#refund-requests)
2. [Failed Payment Captures](#failed-payment-captures)
3. [User Can't Access Account](#user-cant-access-account)
4. [User Claims They Succeeded But Got Charged](#user-claims-they-succeeded-but-got-charged)
5. [User Never Received Check-in Email](#user-never-received-check-in-email)
6. [Admin Dashboard Access](#admin-dashboard-access)
7. [Making Yourself Admin](#making-yourself-admin)
8. [Escalation Path](#escalation-path)

---

## Refund Requests

**When:** User completed a commitment but was still charged, or was charged in error.

**Steps:**

1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Payments → find the payment by amount, date, or customer email
3. Click the charge → click **Refund**
4. Select "Full refund" for complete refunds
5. Update the donation status in Supabase:
   ```sql
   UPDATE donations SET status = 'refunded' WHERE stripe_payment_intent_id = 'pi_xxx';
   ```
6. Reply to the user confirming the refund. Stripe refunds typically post in 5-10 business days.

**If the charge was for a legitimate commitment failure:** Use your judgment. The product is designed to capture on failure. However, for beta users or clear technical errors, err on the side of the refund and the relationship.

---

## Failed Payment Captures

**When:** An admin alert email arrives with subject "[Greasy Alert] X payment capture(s) failed".

**Steps:**

1. Open the alert email to see which donation IDs failed
2. Go to **Admin Dashboard** → Payment Review section
3. Find the donation with status "authorized"
4. Check the Stripe payment intent status directly in the Stripe Dashboard
   - If the card was declined, the capture will continue to fail — contact the user
   - If the PaymentIntent is still "requires_capture", try the **Capture** button in Admin
5. If the capture succeeds via Admin override, it is resolved
6. If it continues to fail, refund in Stripe and mark the donation:
   ```sql
   UPDATE donations SET status = 'failed' WHERE id = 'donation-uuid';
   ```
7. Notify the user if their payment failed so they can update their payment method

**Note:** Set `ADMIN_ALERT_EMAIL` in Vercel environment variables to receive these alerts. Without it, silent failures will occur.

---

## User Can't Access Account

**When:** User forgot password or is locked out of an active commitment.

**Steps:**

1. Direct the user to `/forgot-password`
2. They enter their email and receive a reset link valid for 72 hours
3. If they don't receive it, check that `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set in Vercel
4. If the email still doesn't arrive, check the [Resend Dashboard](https://resend.com) → Emails for delivery status
5. As a last resort, manually reset their password hash in Supabase (requires bcrypt tooling — use with extreme care)

**For active commitments:** If a user is locked out with an active commitment nearing deadline, check the admin dashboard. You can manually capture or cancel via Admin → Payment Review.

---

## User Claims They Succeeded But Got Charged

**When:** User says they clicked "Yes, I did it" but were still charged.

**Steps:**

1. Go to Supabase → donations table, find their record by email
2. Check `commitment_verified` column:
   - `true` = they did click "Yes" — look at `commitment_verified_at` timestamp
   - `false` = system recorded "No"
   - `null` = no response recorded — cron captured automatically
3. Check `checkin_email_sent` = true (if false, they may never have received the email)
4. If `commitment_verified = true` but status = 'captured', there is a bug — issue a full refund immediately and investigate
5. If `commitment_verified = null`, the user didn't respond in time — the auto-capture is working as designed
6. Share the timeline with the user so they understand what happened

---

## User Never Received Check-in Email

**When:** User says they never got the check-in email and their payment was captured.

**Steps:**

1. Check Supabase: `SELECT checkin_email_sent, donor_email FROM donations WHERE id = 'uuid'`
2. If `checkin_email_sent = false`:
   - The cron didn't fire or the donation wasn't in the eligible window
   - Check Vercel → Functions logs for `/api/cron/send-checkins` errors
   - Check that `RESEND_API_KEY` is set
3. If `checkin_email_sent = true`:
   - Check the [Resend Dashboard](https://resend.com) for delivery status
   - Email may have gone to spam — ask the user to check
4. If you determine the email was never delivered due to a system error, consider issuing a refund and extending a good-faith re-commitment offer

---

## Admin Dashboard Access

**URL:** `/admin`

**What it shows:**
- Total revenue, donations, active subscriptions, MRR
- Period breakdowns (today / week / month)
- Donation status counts
- Payment Review: all authorized payments with capture/cancel controls
- Full donations table (last 100)

**Requirements:** Your user account must have `is_admin = true` in the database. See below.

---

## Making Yourself Admin

Run this SQL in the Supabase SQL Editor (dev or prod, as appropriate):

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

---

## Escalation Path

| Issue | Action |
|-------|--------|
| Bug in payment capture | Fix in code, deploy, manually override affected donations via Admin |
| Stripe outage | Monitor [status.stripe.com](https://status.stripe.com) — captures will retry via cron |
| Resend outage | Monitor [status.resend.com](https://resend.com) — emails queued but not delivered |
| Database connection error | Check Supabase project status and env vars in Vercel |
| Deployment failure | Check Vercel dashboard for build logs |

---

## Key Contacts & Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com
- **Resend Dashboard:** https://resend.com
- **Error monitoring:** Vercel Functions logs
