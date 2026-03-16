"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
  const { state, setAmount } = useDonationFlow();

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.replace("/join?redirect=/donate");
    return null;
  }
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
          Put your money where your mouth is.
        </h1>
        <p className="mt-2 text-gray-600">
          Choose how much you&apos;re putting on the line. Succeed, and it goes to a cause you love. Fail, and it goes somewhere you&apos;d rather not think about.
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