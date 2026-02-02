"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { SelectionGrid } from "@/components/ui/SelectionGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TIMEFRAMES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const timeframeOptions = TIMEFRAMES.map((t) => ({
  value: t.value,
  label: t.label,
}));

export default function DonateTimeframePage() {
  const router = useRouter();
  const { state, hydrated, setTimeframe, isStepComplete } = useDonationFlow();

  useEffect(() => {
    if (!hydrated) return;
    if (state.amount === null) {
      router.replace("/donate");
    }
  }, [hydrated, state.amount, router]);

  const handleNext = () => {
    if (state.timeframe) {
      router.push("/donate/recipient");
    }
  };

  if (!hydrated || !isStepComplete(2)) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Step 2: Select Timeframe
        </h1>
        <p className="mt-2 text-gray-600">
          Your {state.amount !== null ? formatCurrency(state.amount) : ""}{" "}
          donation — when should it be processed?
        </p>
      </div>

      <Card className="mt-8">
        <SelectionGrid
          options={timeframeOptions}
          selectedValue={state.timeframe}
          onSelect={setTimeframe}
          columns={2}
          label="Donation timeframe"
        />

        <div className="mt-6">
          <Button
            onClick={handleNext}
            fullWidth
            disabled={!state.timeframe}
          >
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
