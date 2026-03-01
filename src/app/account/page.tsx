"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Donation {
  id: string;
  amount_cents: number;
  fee_cents: number;
  cover_fees: boolean;
  timeframe: string;
  status: string;
  created_at: string;
  charity: {
    name: string;
  };
  anti_charity: {
    name: string;
  } | null;
}

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  amount_cents: number;
  fee_cents: number;
  cover_fees: boolean;
  interval: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  charity: {
    name: string;
  };
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        const [donationsRes, subscriptionsRes] = await Promise.all([
          fetch("/api/donations"),
          fetch("/api/subscriptions"),
        ]);

        if (donationsRes.ok) {
          setDonations(await donationsRes.json());
        }
        if (subscriptionsRes.ok) {
          setSubscriptions(await subscriptionsRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.user?.id]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;

    setCancelingId(subscriptionId);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });

      if (res.ok) {
        setSubscriptions((subs) =>
          subs.map((s) =>
            s.id === subscriptionId ? { ...s, status: "canceled" } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setCancelingId(null);
    }
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      authorized: "bg-blue-100 text-blue-800",
      captured: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      redirected: "bg-purple-100 text-purple-800",
      active: "bg-green-100 text-green-800",
      past_due: "bg-orange-100 text-orange-800",
      canceled: "bg-gray-100 text-gray-800",
      incomplete: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </span>
    );
  };

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">My Account</h1>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900">{session?.user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">
              {session?.user?.email ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Stripe Customer ID</span>
            <span className="font-mono text-sm text-gray-900">
              {session?.user?.id ?? "—"}
            </span>
          </div>
        </div>
      </Card>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Active Subscriptions
          </h2>
          <div className="mt-4 space-y-4">
            {activeSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {sub.charity?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatAmount(sub.amount_cents)}/{sub.interval}
                    {sub.cover_fees && (
                      <span className="ml-1">
                        (+{formatAmount(sub.fee_cents)} fee)
                      </span>
                    )}
                  </p>
                  {sub.current_period_end && (
                    <p className="text-xs text-gray-400">
                      Next billing: {formatDate(sub.current_period_end)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(sub.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSubscription(sub.id)}
                    isLoading={cancelingId === sub.id}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Donation History
        </h2>

        {loading ? (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          </div>
        ) : donations.length === 0 ? (
          <p className="mt-4 text-gray-500">
            You have not made any donations yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {donation.charity?.name}
                    </p>
                    {donation.anti_charity && (
                      <p className="text-sm text-gray-500">
                        Anti-charity: {donation.anti_charity.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatDate(donation.created_at)} · {donation.timeframe}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatAmount(donation.amount_cents)}
                    </p>
                    {donation.cover_fees && (
                      <p className="text-xs text-gray-500">
                        +{formatAmount(donation.fee_cents)} fee covered
                      </p>
                    )}
                    <div className="mt-1">{getStatusBadge(donation.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Canceled/Past Subscriptions */}
      {subscriptions.filter((s) => s.status !== "active").length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Past Subscriptions
          </h2>
          <div className="mt-4 space-y-3">
            {subscriptions
              .filter((s) => s.status !== "active")
              .map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-gray-500"
                >
                  <div>
                    <p>{sub.charity?.name}</p>
                    <p className="text-sm">
                      {formatAmount(sub.amount_cents)}/{sub.interval}
                    </p>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/donate"
          className="rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white hover:bg-green-700 transition-colors inline-block"
        >
          Make a Donation
        </Link>
      </div>
    </div>
  );
}
