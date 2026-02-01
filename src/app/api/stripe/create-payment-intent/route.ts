import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  ALLOWED_AMOUNTS,
  ALLOWED_TIMEFRAMES,
  ALLOWED_RECIPIENTS,
} from "@/lib/constants";

const PLATFORM_FEE_RATE = 0.025; // 2.5%

export async function POST(request: Request) {
  try {
    const { amount, recipient, timeframe, customerId, coverFees } = await request.json();

    // When coverFees is true, the amount includes the fee, so we need to calculate the base amount
    const baseAmount = coverFees
      ? Math.round(amount / (1 + PLATFORM_FEE_RATE))
      : amount;

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
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
