"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RECIPIENTS, TIMEFRAMES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function DonateThankYouPage() {
  const router = useRouter();
  const { state, reset, isStepComplete } = useDonationFlow();
  const [phone, setPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [snapshot] = useState(() => ({ ...state }));

  useEffect(() => {
    if (!isStepComplete(7)) {
      router.replace("/donate");
    }
  }, [isStepComplete, router]);

  const recipientLabel =
    RECIPIENTS.find((r) => r.value === snapshot.recipient)?.label ??
    snapshot.recipient;
  const timeframeLabel =
    TIMEFRAMES.find((t) => t.value === snapshot.timeframe)?.label ??
    snapshot.timeframe;
  const antiCharityLabel =
    RECIPIENTS.find((r) => r.value === snapshot.antiCharity)?.label ?? null;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneSaved(true);
  };

  const handleDone = () => {
    reset();
    router.push("/");
  };

  if (!isStepComplete(7)) return null;

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
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-gray-900">
              {snapshot.amount !== null
                ? formatCurrency(snapshot.amount)
                : "—"}
            </span>
          </div>
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
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Get a Text Reminder
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your phone number and we will remind you of your commitment.
        </p>

        {phoneSaved ? (
          <p className="mt-3 text-sm text-green-600">
            Phone number saved! We will be in touch.
          </p>
        ) : (
          <form onSubmit={handlePhoneSubmit} className="mt-3 flex gap-2">
            <div className="flex-1">
              <Input
                label=""
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <Button type="submit" size="md">
              Save
            </Button>
          </form>
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
