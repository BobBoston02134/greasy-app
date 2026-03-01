import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from Stripe customer ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", session.user.id)
      .single();

    if (!user) {
      return NextResponse.json([]);
    }

    // Fetch subscriptions with charity info
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        stripe_subscription_id,
        amount_cents,
        fee_cents,
        cover_fees,
        interval,
        status,
        current_period_end,
        created_at,
        charity:charities!charity_id(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Subscriptions API] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptions || []);
  } catch (error) {
    console.error("[Subscriptions API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// Cancel a subscription
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("stripe_customer_id", session.user.id)
      .single();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, user_id")
      .eq("id", subscriptionId)
      .single();

    if (!subscription || subscription.user_id !== user?.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Cancel in Stripe
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Update in database
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cancel Subscription] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
