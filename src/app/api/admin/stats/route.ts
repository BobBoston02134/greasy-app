import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("is_admin")
      .eq("stripe_customer_id", session.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get donation stats
    const { data: donationStats } = await supabase
      .from("donations")
      .select("amount_cents, fee_cents, status, created_at");

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const donations = donationStats || [];

    // Calculate totals
    const totalDonations = donations.length;
    const capturedDonations = donations.filter(d => d.status === "captured");
    const totalRevenue = capturedDonations.reduce((sum, d) => sum + d.amount_cents, 0);
    const totalFees = capturedDonations.reduce((sum, d) => sum + d.fee_cents, 0);

    // Today's stats
    const todayDonations = donations.filter(
      d => new Date(d.created_at) >= startOfDay
    );
    const todayRevenue = todayDonations
      .filter(d => d.status === "captured")
      .reduce((sum, d) => sum + d.amount_cents, 0);

    // This week's stats
    const weekDonations = donations.filter(
      d => new Date(d.created_at) >= startOfWeek
    );
    const weekRevenue = weekDonations
      .filter(d => d.status === "captured")
      .reduce((sum, d) => sum + d.amount_cents, 0);

    // This month's stats
    const monthDonations = donations.filter(
      d => new Date(d.created_at) >= startOfMonth
    );
    const monthRevenue = monthDonations
      .filter(d => d.status === "captured")
      .reduce((sum, d) => sum + d.amount_cents, 0);

    // Status breakdown
    const statusCounts = donations.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get subscription stats
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("status, amount_cents, interval");

    const activeSubscriptions = (subscriptions || []).filter(
      s => s.status === "active"
    );
    const monthlyRecurring = activeSubscriptions
      .filter(s => s.interval === "month")
      .reduce((sum, s) => sum + s.amount_cents, 0);
    const weeklyRecurring = activeSubscriptions
      .filter(s => s.interval === "week")
      .reduce((sum, s) => sum + s.amount_cents, 0);
    const mrr = monthlyRecurring + (weeklyRecurring * 4.33);

    // Get user count
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get recent donations
    const { data: recentDonations } = await supabase
      .from("donations")
      .select(`
        id,
        amount_cents,
        status,
        created_at,
        charity:charities!charity_id(name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      overview: {
        totalDonations,
        totalRevenue,
        totalFees,
        userCount: userCount || 0,
        activeSubscriptions: activeSubscriptions.length,
        mrr: Math.round(mrr),
      },
      periods: {
        today: {
          count: todayDonations.length,
          revenue: todayRevenue,
        },
        week: {
          count: weekDonations.length,
          revenue: weekRevenue,
        },
        month: {
          count: monthDonations.length,
          revenue: monthRevenue,
        },
      },
      statusBreakdown: statusCounts,
      recentDonations: recentDonations || [],
    });
  } catch (error) {
    console.error("[Admin Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
