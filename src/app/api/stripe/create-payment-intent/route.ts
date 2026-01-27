import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  ALLOWED_AMOUNTS,
  ALLOWED_TIMEFRAMES,
  ALLOWED_RECIPIENTS,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { amount, recipient, timeframe, customerId } = await request.json();

    if (!ALLOWED_AMOUNTS.includes(amount)) {
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
