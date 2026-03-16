import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("stripe_customer_id", session.user.id)
    .single();

  return user?.is_admin ? user : null;
}

// GET /api/admin/donations — list all donations with full detail for review
export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("donations")
    .select(`
      id, amount_cents, fee_cents, status, timeframe, capture_at,
      donor_email, donor_name, commitment_description,
      commitment_verified, commitment_verified_at,
      stripe_payment_intent_id, stripe_charge_id,
      checkin_email_sent, created_at, updated_at,
      charity:charities!charity_id(name, slug),
      anti_charity:charities!anti_charity_id(name, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST /api/admin/donations — manual override: capture or cancel a specific payment
export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { donationId, action } = await request.json();

  if (!donationId || !["capture", "cancel"].includes(action)) {
    return NextResponse.json(
      { error: "donationId and action ('capture' | 'cancel') are required" },
      { status: 400 }
    );
  }

  // Fetch the donation
  const { data: donation, error: fetchError } = await supabase
    .from("donations")
    .select("id, stripe_payment_intent_id, status")
    .eq("id", donationId)
    .single();

  if (fetchError || !donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  if (donation.status !== "authorized") {
    return NextResponse.json(
      { error: `Cannot override: donation status is '${donation.status}', expected 'authorized'` },
      { status: 409 }
    );
  }

  if (!donation.stripe_payment_intent_id) {
    return NextResponse.json({ error: "No Stripe payment intent on record" }, { status: 422 });
  }

  try {
    if (action === "capture") {
      const paymentIntent = await stripe.paymentIntents.capture(
        donation.stripe_payment_intent_id
      );
      await supabase
        .from("donations")
        .update({
          status: "captured",
          stripe_charge_id: paymentIntent.latest_charge as string,
          commitment_verified: false,
          commitment_verified_at: new Date().toISOString(),
        })
        .eq("id", donationId);

      return NextResponse.json({ success: true, action: "captured" });
    } else {
      // cancel
      await stripe.paymentIntents.cancel(donation.stripe_payment_intent_id);
      await supabase
        .from("donations")
        .update({
          status: "refunded",
          commitment_verified: true,
          commitment_verified_at: new Date().toISOString(),
        })
        .eq("id", donationId);

      return NextResponse.json({ success: true, action: "canceled" });
    }
  } catch (error) {
    console.error("[Admin Override] Stripe error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Stripe operation failed: ${msg}` }, { status: 500 });
  }
}
