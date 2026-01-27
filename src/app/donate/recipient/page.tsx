"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { SelectionGrid } from "@/components/ui/SelectionGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RECIPIENTS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const recipientOptions = RECIPIENTS.map((r) => ({
  value: r.value,
  label: r.label,
}));

export default function DonateRecipientPage() {
  const router = useRouter();
  const { state, hydrated, setRecipient, isStepComplete } = useDonationFlow();

  useEffect(() => {
    if (!hydrated) return;
    if (!isStepComplete(3)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  const handleNext = () => {
    if (state.recipient) {
      router.push("/donate/payment");
    }
  };

  if (!hydrated || !isStepComplete(3)) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Step 3: Pick Recipient
        </h1>
        <p className="mt-2 text-gray-600">
          Where should your{" "}
          {state.amount !== null ? formatCurrency(state.amount) : ""} donation
          go?
        </p>
      </div>

      <Card className="mt-8">
        <SelectionGrid
          options={recipientOptions}
          selectedValue={state.recipient}
          onSelect={setRecipient}
          columns={2}
          label="Recipient organization"
        />

        <div className="mt-6">
          <Button
            onClick={handleNext}
            fullWidth
            disabled={!state.recipient}
          >
            Continue to Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}
