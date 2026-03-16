import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    // Fetch donations with charity info
    const { data: donations, error } = await supabase
      .from("donations")
      .select(`
        id,
        amount_cents,
        fee_cents,
        cover_fees,
        timeframe,
        capture_at,
        status,
        commitment_description,
        commitment_verified,
        commitment_verified_at,
        checkin_email_sent,
        created_at,
        charity:charities!charity_id(name),
        anti_charity:charities!anti_charity_id(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Donations API] Error fetching donations:", error);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    return NextResponse.json(donations || []);
  } catch (error) {
    console.error("[Donations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
