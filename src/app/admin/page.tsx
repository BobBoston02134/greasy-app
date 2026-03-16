"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

interface AdminDonation {
  id: string;
  amount_cents: number;
  fee_cents: number;
  status: string;
  timeframe: string;
  capture_at: string | null;
  donor_email: string | null;
  donor_name: string | null;
  commitment_description: string | null;
  commitment_verified: boolean | null;
  stripe_payment_intent_id: string | null;
  checkin_email_sent: boolean;
  created_at: string;
  charity: { name: string; slug: string } | null;
  anti_charity: { name: string; slug: string } | null;
}

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
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [overrideLoading, setOverrideLoading] = useState<string | null>(null);
  const [overrideMessage, setOverrideMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchStats();
      fetchDonations();
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

  async function fetchDonations() {
    try {
      const res = await fetch("/api/admin/donations");
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch {
      // non-fatal
    }
  }

  async function handleOverride(donationId: string, action: "capture" | "cancel") {
    setOverrideLoading(donationId + action);
    setOverrideMessage("");
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setOverrideMessage(`Done: payment ${data.action}.`);
        await fetchDonations();
      } else {
        setOverrideMessage(`Error: ${data.error}`);
      }
    } catch {
      setOverrideMessage("Request failed.");
    } finally {
      setOverrideLoading(null);
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

      {/* Manual Payment Review */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Payment Review</h2>
        <p className="mt-1 text-sm text-gray-500">
          Inspect and manually override individual authorized payments. Use with care — captures and cancels are irreversible.
        </p>

        {overrideMessage && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            {overrideMessage}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {donations.filter(d => d.status === "authorized").length === 0 && (
            <Card>
              <p className="text-sm text-gray-500">No authorized payments awaiting action.</p>
            </Card>
          )}
          {donations
            .filter((d) => d.status === "authorized")
            .map((donation) => (
              <Card key={donation.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(donation.amount_cents)}
                      </span>
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        authorized
                      </span>
                      {donation.checkin_email_sent && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          check-in sent
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {donation.donor_name || donation.donor_email || "Anonymous"} &rarr;{" "}
                      <strong>{donation.charity?.name || "unknown"}</strong>
                      {donation.anti_charity && (
                        <> (anti: {donation.anti_charity.name})</>
                      )}
                    </p>
                    {donation.commitment_description && (
                      <p className="mt-1 text-xs italic text-gray-500">
                        &ldquo;{donation.commitment_description}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Deadline: {donation.capture_at ? formatDate(donation.capture_at) : "N/A"} &middot;{" "}
                      Created: {formatDate(donation.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 font-mono truncate">
                      {donation.stripe_payment_intent_id}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleOverride(donation.id, "capture")}
                      disabled={overrideLoading !== null}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {overrideLoading === donation.id + "capture" ? "..." : "Capture"}
                    </button>
                    <button
                      onClick={() => handleOverride(donation.id, "cancel")}
                      disabled={overrideLoading !== null}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {overrideLoading === donation.id + "cancel" ? "..." : "Cancel"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
        </div>

        {/* All donations table */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">All Donations (last 100)</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-2 font-medium text-gray-500">Date</th>
                  <th className="pb-2 font-medium text-gray-500">Donor</th>
                  <th className="pb-2 font-medium text-gray-500">Amount</th>
                  <th className="pb-2 font-medium text-gray-500">Recipient</th>
                  <th className="pb-2 font-medium text-gray-500">Anti-Charity</th>
                  <th className="pb-2 font-medium text-gray-500">Status</th>
                  <th className="pb-2 font-medium text-gray-500">Verified</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-500">{formatDate(d.created_at)}</td>
                    <td className="py-2 text-gray-900">{d.donor_name || d.donor_email || "—"}</td>
                    <td className="py-2 font-medium text-gray-900">{formatCurrency(d.amount_cents)}</td>
                    <td className="py-2 text-gray-600">{d.charity?.name || "—"}</td>
                    <td className="py-2 text-gray-600">{d.anti_charity?.name || "—"}</td>
                    <td className="py-2">
                      <span className={`capitalize ${
                        d.status === "captured" ? "text-red-600" :
                        d.status === "authorized" ? "text-yellow-600" :
                        d.status === "refunded" ? "text-green-600" :
                        "text-gray-600"
                      }`}>{d.status}</span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {d.commitment_verified === null ? "—" : d.commitment_verified ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-400">No donations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
