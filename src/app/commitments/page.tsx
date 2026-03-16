"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ENABLE_COMMITMENT_DASHBOARD } from "@/lib/flags";

interface Commitment {
  id: string;
  amount_cents: number;
  timeframe: string;
  capture_at: string | null;
  status: string;
  commitment_description: string | null;
  commitment_verified: boolean | null;
  commitment_verified_at: string | null;
  checkin_email_sent: boolean;
  created_at: string;
  charity: { name: string } | null;
  anti_charity: { name: string } | null;
}

function StatusBadge({ status, verified }: { status: string; verified: boolean | null }) {
  if (status === "authorized" && verified === null) {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        Active
      </span>
    );
  }
  if (verified === true) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Succeeded
      </span>
    );
  }
  if (verified === false || status === "captured") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Failed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
      {status}
    </span>
  );
}

export default function CommitmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ENABLE_COMMITMENT_DASHBOARD) {
      router.replace("/");
      return;
    }
    if (status === "unauthenticated") {
      router.push("/login?redirect=/commitments");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/donations")
        .then((r) => r.json())
        .then((data) => setCommitments(Array.isArray(data) ? data : []))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const active = commitments.filter(
    (c) => c.status === "authorized" && c.commitment_verified === null
  );
  const past = commitments.filter(
    (c) => c.status !== "authorized" || c.commitment_verified !== null
  );

  if (!ENABLE_COMMITMENT_DASHBOARD) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Commitments</h1>
        <Link
          href="/donate"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          New Commitment
        </Link>
      </div>
      <p className="mt-1 text-gray-500">
        Welcome back, {session?.user?.name || session?.user?.email}
      </p>

      {commitments.length === 0 && (
        <Card className="mt-8 text-center">
          <p className="text-gray-600">You have no commitments yet.</p>
          <Link
            href="/donate"
            className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Make Your First Commitment
          </Link>
        </Card>
      )}

      {active.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Active</h2>
          <div className="mt-3 space-y-4">
            {active.map((c) => (
              <CommitmentCard key={c.id} commitment={c} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Past</h2>
          <div className="mt-3 space-y-4">
            {past.map((c) => (
              <CommitmentCard key={c.id} commitment={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommitmentCard({ commitment: c }: { commitment: Commitment }) {
  const deadline = c.capture_at
    ? new Date(c.capture_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {formatCurrency(c.amount_cents)}
            </span>
            <StatusBadge status={c.status} verified={c.commitment_verified} />
            {c.checkin_email_sent && c.commitment_verified === null && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Check-in sent
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {c.charity?.name || "Unknown recipient"}
            {c.anti_charity && (
              <span className="text-gray-400"> vs {c.anti_charity.name}</span>
            )}
          </p>
          {c.commitment_description && (
            <p className="mt-2 text-sm italic text-gray-500">
              &ldquo;{c.commitment_description}&rdquo;
            </p>
          )}
          {deadline && (
            <p className="mt-1 text-xs text-gray-400">Deadline: {deadline}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
