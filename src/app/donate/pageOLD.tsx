"use client";

import { useRouter } from "next/navigation";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { SelectionGrid } from "@/components/ui/SelectionGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AMOUNTS } from "@/lib/constants";

const amountOptions = AMOUNTS.map((a) => ({
  value: String(a.value),
  label: a.label,
  description: a.display,
}));

export default function DonateAmountPage() {
  const router = useRouter();
  const { state, setAmount } = useDonationFlow();

  const selectedValue = state.amount !== null ? String(state.amount) : null;

  const handleNext = () => {
    if (state.amount !== null) {
      router.push("/donate/timeframe");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Step 1: Choose Amount
        </h1>
        <p className="mt-2 text-gray-600">
          How much would you like to donate?
        </p>
      </div>

      <Card className="mt-8">
        <SelectionGrid
          options={amountOptions}
          selectedValue={selectedValue}
          onSelect={(val) => setAmount(Number(val))}
          columns={3}
          label="Donation amount"
        />

        <div className="mt-6">
          <Button
            onClick={handleNext}
            fullWidth
            disabled={state.amount === null}
          >
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
