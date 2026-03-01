import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/ratelimit";
import { ALLOWED_AMOUNTS, ALLOWED_RECIPIENTS } from "@/lib/constants";

const PLATFORM_FEE_RATE = 0.025; // 2.5%

// Recurring intervals supported
const ALLOWED_INTERVALS = ["week", "month"] as const;
type RecurringInterval = (typeof ALLOWED_INTERVALS)[number];

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute (strict)
  const rateLimitResponse = await checkRateLimit(request, "strict");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { amount, recipient, interval, customerId, coverFees } =
      await request.json();

    // Calculate base amount
    const baseAmount = coverFees
      ? Math.round(amount / (1 + PLATFORM_FEE_RATE))
      : amount;

    // Validate amount
    if (!ALLOWED_AMOUNTS.includes(baseAmount)) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    // Validate recipient
    if (!ALLOWED_RECIPIENTS.includes(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient" },
        { status: 400 }
      );
    }

    // Validate interval
    if (!ALLOWED_INTERVALS.includes(interval as RecurringInterval)) {
      return NextResponse.json(
        { error: "Invalid interval. Use 'week' or 'month'" },
        { status: 400 }
      );
    }

    // Require customer ID for recurring donations
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required for recurring donations" },
        { status: 400 }
      );
    }

    // Create or get product for this recipient
    const productName = `Greasy Donation - ${recipient}`;
    let product = await findOrCreateProduct(productName, recipient);

    // Create price for this amount and interval
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: "usd",
      recurring: {
        interval: interval as RecurringInterval,
      },
      metadata: {
        recipient,
        baseAmount: String(baseAmount),
        coverFees: coverFees ? "true" : "false",
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        source: "greasy",
        recipient,
        interval,
        coverFees: coverFees ? "true" : "false",
        baseAmount: String(baseAmount),
      },
    });

    // Get the client secret from the invoice's payment intent
    const invoice = subscription.latest_invoice as unknown as {
      payment_intent: { client_secret: string };
    };

    // Look up charity and user IDs
    const { data: charityData } = await supabase
      .from("charities")
      .select("id")
      .eq("slug", recipient)
      .single();

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    // Store subscription in database
    await supabase.from("subscriptions").insert({
      user_id: userData?.id,
      charity_id: charityData?.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: price.id,
      amount_cents: baseAmount,
      fee_cents: amount - baseAmount,
      cover_fees: coverFees || false,
      interval,
      status: subscription.status,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error("[Create Subscription] Error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

async function findOrCreateProduct(
  name: string,
  recipient: string
): Promise<{ id: string }> {
  // Search for existing product
  const products = await stripe.products.search({
    query: `name:'${name}' AND active:'true'`,
    limit: 1,
  });

  if (products.data.length > 0) {
    return products.data[0];
  }

  // Create new product
  return stripe.products.create({
    name,
    metadata: {
      recipient,
      source: "greasy",
    },
  });
}
