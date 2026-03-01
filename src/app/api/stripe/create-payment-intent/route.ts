import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  ALLOWED_AMOUNTS,
  ALLOWED_TIMEFRAMES,
  ALLOWED_RECIPIENTS,
} from "@/lib/constants";

const PLATFORM_FEE_RATE = 0.025; // 2.5%

// Calculate capture time based on timeframe
function calculateCaptureAt(timeframe: string): Date | null {
  if (timeframe === "immediate") return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeframe) {
    case "5pm":
      return new Date(today.getTime() + 17 * 60 * 60 * 1000);
    case "10pm":
      return new Date(today.getTime() + 22 * 60 * 60 * 1000);
    case "midnight":
      return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    case "end_of_week": {
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
      return new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000);
    }
    case "end_of_month": {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return nextMonth;
    }
    case "end_of_quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const endOfQuarter = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      return endOfQuarter;
    }
    case "end_of_year":
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    default:
      return null;
  }
}

export async function POST(request: Request) {
  // Rate limit: 20 requests per minute (standard)
  const rateLimitResponse = await checkRateLimit(request, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { amount, recipient, timeframe, customerId, coverFees, antiCharity, donorEmail, donorName } = await request.json();

    // When coverFees is true, the amount includes the fee, so we need to calculate the base amount
    const baseAmount = coverFees
      ? Math.round(amount / (1 + PLATFORM_FEE_RATE))
      : amount;

    const feeCents = coverFees ? amount - baseAmount : Math.round(baseAmount * PLATFORM_FEE_RATE);

    if (!ALLOWED_AMOUNTS.includes(baseAmount)) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    if (!ALLOWED_RECIPIENTS.includes(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TIMEFRAMES.includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe" },
        { status: 400 }
      );
    }

    const captureMethod = timeframe === "immediate" ? "automatic" : "manual";
    const captureAt = calculateCaptureAt(timeframe);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      capture_method: captureMethod,
      ...(customerId && { customer: customerId }),
      metadata: {
        recipient,
        timeframe,
        source: "greasy",
        coverFees: coverFees ? "true" : "false",
        baseAmount: String(baseAmount),
        antiCharity: antiCharity || "",
      },
    });

    // Look up charity IDs from slugs
    const { data: charityData } = await supabase
      .from("charities")
      .select("id, slug")
      .eq("slug", recipient)
      .single();

    let antiCharityId = null;
    if (antiCharity) {
      const { data: antiCharityData } = await supabase
        .from("charities")
        .select("id")
        .eq("slug", antiCharity)
        .single();
      antiCharityId = antiCharityData?.id || null;
    }

    // Look up user ID from Stripe customer ID
    let userId = null;
    if (customerId) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      userId = userData?.id || null;
    }

    // Create donation record
    const { error: donationError } = await supabase.from("donations").insert({
      user_id: userId,
      amount_cents: baseAmount,
      fee_cents: feeCents,
      cover_fees: coverFees || false,
      charity_id: charityData?.id,
      anti_charity_id: antiCharityId,
      timeframe,
      capture_at: captureAt?.toISOString() || null,
      stripe_payment_intent_id: paymentIntent.id,
      status: timeframe === "immediate" ? "pending" : "authorized",
      donor_email: donorEmail || null,
      donor_name: donorName || null,
    });

    if (donationError) {
      console.error("[Create PaymentIntent] Failed to create donation record:", donationError);
      // Don't fail the request - payment can still proceed
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[Create PaymentIntent] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create payment intent", details: errorMessage },
      { status: 500 }
    );
  }
}
