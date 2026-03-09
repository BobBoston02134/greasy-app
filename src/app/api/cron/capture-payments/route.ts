import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

// This endpoint is called by Vercel Cron every 5 minutes
// See vercel.json for cron configuration

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Find donations that need to be captured
    // Status = 'authorized' and capture_at <= now
    const { data: donations, error: fetchError } = await supabase
      .from("donations")
      .select("id, stripe_payment_intent_id, amount_cents, capture_at, checkin_email_sent, commitment_verified")
      .eq("status", "authorized")
      .lte("capture_at", now)
      .not("stripe_payment_intent_id", "is", null);

    if (fetchError) {
      console.error("[Cron] Error fetching donations:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    if (!donations || donations.length === 0) {
      return NextResponse.json({
        message: "No payments to capture",
        captured: 0,
      });
    }

    console.log(`[Cron] Found ${donations.length} payments to capture`);

    const results = {
      captured: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each donation
    for (const donation of donations) {
      // Skip donations in 48-hour grace window:
      // Check-in was sent, no response yet, and deadline was less than 48hr ago
      if (donation.checkin_email_sent && donation.commitment_verified === null) {
        const captureAt = new Date(donation.capture_at!);
        const hoursSinceDeadline = (Date.now() - captureAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceDeadline < 48) {
          console.log(`[Cron] Skipping donation ${donation.id} — in 48hr grace window`);
          continue;
        }
      }

      try {
        // Capture the payment intent
        const paymentIntent = await stripe.paymentIntents.capture(
          donation.stripe_payment_intent_id!
        );

        // Update donation status
        const { error: updateError } = await supabase
          .from("donations")
          .update({
            status: "captured",
            stripe_charge_id: paymentIntent.latest_charge as string,
          })
          .eq("id", donation.id);

        if (updateError) {
          console.error(`[Cron] Failed to update donation ${donation.id}:`, updateError);
          results.errors.push(`DB update failed for ${donation.id}`);
        }

        results.captured++;
        console.log(`[Cron] Captured payment for donation ${donation.id}`);
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${donation.id}: ${errorMessage}`);
        console.error(`[Cron] Failed to capture ${donation.id}:`, error);

        // Update donation status to failed if capture fails
        await supabase
          .from("donations")
          .update({ status: "failed" })
          .eq("id", donation.id);
      }
    }

    console.log(`[Cron] Capture complete: ${results.captured} captured, ${results.failed} failed`);

    return NextResponse.json({
      message: "Capture job complete",
      ...results,
    });
  } catch (error) {
    console.error("[Cron] Capture job error:", error);
    return NextResponse.json(
      { error: "Capture job failed" },
      { status: 500 }
    );
  }
}
