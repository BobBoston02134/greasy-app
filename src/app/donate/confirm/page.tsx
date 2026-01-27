"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DonateConfirmPage() {
  const router = useRouter();
  const { state, hydrated, setWantsMotivation, isStepComplete } = useDonationFlow();

  useEffect(() => {
    if (!hydrated) return;
    if (!isStepComplete(5)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  const handleYes = () => {
    setWantsMotivation(true);
    router.push("/donate/anti-charity");
  };

  const handleNo = () => {
    setWantsMotivation(false);
    router.push("/donate/thank-you");
  };

  if (!hydrated || !isStepComplete(5)) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Step 5: Confirm</h1>
      </div>

      <Card className="mt-8 text-center">
        <p className="text-lg text-gray-700">
          Would you like to use your gift to motivate you to accomplish a result?
        </p>
        <p className="mt-2 text-sm text-gray-500">
          If yes, you can pick an &ldquo;anti-charity&rdquo; — an organization
          your donation will go to if you don&apos;t follow through.
        </p>

        <div className="mt-8 flex gap-4">
          <Button onClick={handleYes} fullWidth>
            Yes, Motivate Me
          </Button>
          <Button onClick={handleNo} variant="outline" fullWidth>
            No, Thank You
          </Button>
        </div>
      </Card>
    </div>
  );
}
