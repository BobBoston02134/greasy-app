"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleNext = async () => {
    if (!state.antiCharity || !state.paymentIntentId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/donations/commitment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: state.paymentIntentId,
          antiCharitySlug: state.antiCharity,
          isFinal: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save anti-charity');
        setSaving(false);
        return;
      }
      router.push("/donate/thank-you");
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (!hydrated || !isStepComplete(6)) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Now pick your consequence.
        </h1>
        <p className="mt-2 text-gray-600">
          Choose the organization your donation goes to if you don&apos;t follow through. Make it one you&apos;d genuinely hate to support — that&apos;s what makes this work.
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

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleNext}
            fullWidth
            disabled={!state.antiCharity}
            isLoading={saving}
          >
            Confirm Anti-Charity
          </Button>
        </div>
      </Card>
    </div>
  );
}
