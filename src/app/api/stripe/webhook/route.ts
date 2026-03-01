import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Log the event
  await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
    processed: false,
  });

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentCanceled(paymentIntent);
        break;
      }

      case "charge.captured": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeCaptured(charge);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);

    // Log error but still return 200 to prevent Stripe from retrying
    await supabase
      .from("webhook_events")
      .update({
        processed: true,
        error: error instanceof Error ? error.message : "Unknown error",
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);

  // Update donation status
  const { error } = await supabase
    .from("donations")
    .update({
      status: paymentIntent.capture_method === "manual" ? "authorized" : "captured",
      stripe_charge_id: paymentIntent.latest_charge as string,
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("[Webhook] Failed to update donation:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] PaymentIntent failed: ${paymentIntent.id}`);

  const { error } = await supabase
    .from("donations")
    .update({ status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("[Webhook] Failed to update donation:", error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] PaymentIntent canceled: ${paymentIntent.id}`);

  const { error } = await supabase
    .from("donations")
    .update({ status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("[Webhook] Failed to update donation:", error);
  }
}

async function handleChargeCaptured(charge: Stripe.Charge) {
  console.log(`[Webhook] Charge captured: ${charge.id}`);

  // Find donation by payment intent ID
  const paymentIntentId = charge.payment_intent as string;

  const { error } = await supabase
    .from("donations")
    .update({
      status: "captured",
      stripe_charge_id: charge.id,
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("[Webhook] Failed to update donation:", error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Webhook] Charge refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent as string;

  const { error } = await supabase
    .from("donations")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error("[Webhook] Failed to update donation:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription updated: ${subscription.id} -> ${subscription.status}`);

  // Access properties safely
  const sub = subscription as unknown as {
    id: string;
    status: string;
    current_period_end?: number;
    canceled_at?: number | null;
  };

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: sub.status,
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      canceled_at: sub.canceled_at
        ? new Date(sub.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", sub.id);

  if (error) {
    console.error("[Webhook] Failed to update subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("[Webhook] Failed to update subscription:", error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice paid: ${invoice.id}`);

  // Access properties safely
  const inv = invoice as unknown as {
    id: string;
    subscription?: string | null;
    amount_paid: number;
    payment_intent?: string | null;
    charge?: string | null;
  };

  // If this is a subscription invoice, create a donation record
  if (inv.subscription && inv.amount_paid > 0) {
    const subscriptionId = inv.subscription;

    // Get subscription details from our database
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("user_id, charity_id, amount_cents, fee_cents, cover_fees, interval")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (sub) {
      // Create a donation record for this recurring payment
      await supabase.from("donations").insert({
        user_id: sub.user_id,
        charity_id: sub.charity_id,
        amount_cents: sub.amount_cents,
        fee_cents: sub.fee_cents,
        cover_fees: sub.cover_fees,
        timeframe: `recurring_${sub.interval}`,
        stripe_payment_intent_id: inv.payment_intent || null,
        stripe_charge_id: inv.charge || null,
        status: "captured",
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice payment failed: ${invoice.id}`);

  // Access properties safely
  const inv = invoice as unknown as {
    id: string;
    subscription?: string | null;
  };

  if (inv.subscription) {
    const subscriptionId = inv.subscription;

    // Update subscription status
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", subscriptionId);

    if (error) {
      console.error("[Webhook] Failed to update subscription:", error);
    }
  }
}
