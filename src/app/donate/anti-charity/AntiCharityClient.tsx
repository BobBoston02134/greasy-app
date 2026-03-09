"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { SelectionGrid } from "@/components/ui/SelectionGrid";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CharityOption {
  value: string;
  label: string;
}

interface AntiCharityClientProps {
  availableOptions: CharityOption[];
}

export default function AntiCharityClient({ availableOptions }: AntiCharityClientProps) {
  const router = useRouter();
  const { state, hydrated, setAntiCharity, isStepComplete } = useDonationFlow();

  useEffect(() => {
    if (!hydrated) return;
    if (!isStepComplete(6)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  // Exclude the already-chosen recipient from the anti-charity options
  const antiCharityOptions = availableOptions.filter(
    (r) => r.value !== state.recipient
  );

  const handleNext = () => {
    if (state.antiCharity) {
      router.push("/donate/thank-you");
    }
  };

  if (!hydrated || !isStepComplete(6)) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Step 6: Anti-Charity
        </h1>
        <p className="mt-2 text-gray-600">
          Pick an organization you would rather NOT support. If you don&apos;t
          follow through, your donation goes here instead.
        </p>
      </div>

      <Card className="mt-8">
        <SelectionGrid
          options={antiCharityOptions}
          selectedValue={state.antiCharity}
          onSelect={setAntiCharity}
          columns={2}
          label="Anti-charity organization"
        />

        <div className="mt-6">
          <Button
            onClick={handleNext}
            fullWidth
            disabled={!state.antiCharity}
          >
            Confirm Anti-Charity
          </Button>
        </div>
      </Card>
    </div>
  );
}
