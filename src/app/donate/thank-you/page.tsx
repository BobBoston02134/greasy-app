"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { Card } from "@/components/ui/Card";
import { RECIPIENTS, TIMEFRAMES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function DonateThankYouPage() {
  const router = useRouter();
  const { state, hydrated, reset, isStepComplete } = useDonationFlow();
  const isLeaving = useRef(false);

  const [snapshot, setSnapshot] = useState(() => ({ ...state }));

  useEffect(() => {
    if (hydrated && snapshot.amount === null && state.amount !== null) {
      setSnapshot({ ...state });
    }
  }, [hydrated, state, snapshot.amount]);

  useEffect(() => {
    if (!hydrated) return;
    if (isLeaving.current) return;
    if (!isStepComplete(7)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  const recipientLabel =
    RECIPIENTS.find((r) => r.value === snapshot.recipient)?.label ??
    snapshot.recipient;
  const timeframeLabel =
    TIMEFRAMES.find((t) => t.value === snapshot.timeframe)?.label ??
    snapshot.timeframe;
  const antiCharityLabel =
    RECIPIENTS.find((r) => r.value === snapshot.antiCharity)?.label ?? null;

  const handleDone = () => {
    isLeaving.current = true;
    reset();
    window.location.href = "/";
  };

  if (!hydrated || !isStepComplete(7)) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Thank You!</h1>
        <p className="mt-2 text-gray-600">
          Your donation has been processed successfully.
        </p>
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Donation Summary
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Donation</span>
            <span className="font-semibold text-gray-900">
              {snapshot.amount !== null
                ? formatCurrency(snapshot.amount)
                : "—"}
            </span>
          </div>
          {snapshot.coverFees && snapshot.amount !== null && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Fee coverage (2.5%)</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(Math.round(snapshot.amount * 0.025))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Recipient</span>
            <span className="font-semibold text-gray-900">
              {recipientLabel}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Timeframe</span>
            <span className="font-semibold text-gray-900">
              {timeframeLabel}
            </span>
          </div>
          {antiCharityLabel && (
            <div className="flex justify-between">
              <span className="text-gray-500">Anti-Charity</span>
              <span className="font-semibold text-gray-900">
                {antiCharityLabel}
              </span>
            </div>
          )}
        </div>

        {snapshot.coverFees && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Thank you for covering the platform fee! 100% of your{" "}
            {snapshot.amount !== null ? formatCurrency(snapshot.amount) : ""}{" "}
            donation will go directly to {recipientLabel}.
          </div>
        )}
      </Card>

      <div className="mt-8 flex gap-4">
        <Link
          href="/donate"
          onClick={() => reset()}
          className="flex-1 rounded-lg border-2 border-green-600 px-4 py-3 text-center font-semibold text-green-600 hover:bg-green-50 transition-colors"
        >
          Donate Again
        </Link>
        <button
          onClick={handleDone}
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
