"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

interface AdminStats {
  overview: {
    totalDonations: number;
    totalRevenue: number;
    totalFees: number;
    userCount: number;
    activeSubscriptions: number;
    mrr: number;
  };
  periods: {
    today: { count: number; revenue: number };
    week: { count: number; revenue: number };
    month: { count: number; revenue: number };
  };
  statusBreakdown: Record<string, number>;
  recentDonations: Array<{
    id: string;
    amount_cents: number;
    status: string;
    created_at: string;
    charity: { name: string };
  }>;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchStats();
    }
  }, [status, router]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/stats");

      if (res.status === 403) {
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-gray-500">
        Welcome back, {session?.user?.name || session?.user?.email}
      </p>

      {/* Overview Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {formatCurrency(stats.overview.totalRevenue)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(stats.overview.totalFees)} in fees
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">Total Donations</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.overview.totalDonations}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {stats.overview.userCount} users
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {stats.overview.activeSubscriptions}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(stats.overview.mrr)}/mo MRR
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">This Month</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {formatCurrency(stats.periods.month.revenue)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {stats.periods.month.count} donations
          </p>
        </Card>
      </div>

      {/* Period Breakdown */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-semibold text-gray-900">Today</h3>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.periods.today.revenue)}
            </span>
            <span className="text-sm text-gray-500">
              {stats.periods.today.count} donations
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900">This Week</h3>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.periods.week.revenue)}
            </span>
            <span className="text-sm text-gray-500">
              {stats.periods.week.count} donations
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900">This Month</h3>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.periods.month.revenue)}
            </span>
            <span className="text-sm text-gray-500">
              {stats.periods.month.count} donations
            </span>
          </div>
        </Card>
      </div>

      {/* Status Breakdown & Recent Donations */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-gray-900">Donation Status</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize text-gray-600">{status}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900">Recent Donations</h3>
          <div className="mt-4 space-y-3">
            {stats.recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {donation.charity?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(donation.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(donation.amount_cents)}
                  </p>
                  <p className="text-xs capitalize text-gray-500">
                    {donation.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
