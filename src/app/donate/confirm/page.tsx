"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const MAX_CHARS = 500;

export default function DonateConfirmPage() {
  const router = useRouter();
  const { state, hydrated, setWantsMotivation, setCommitmentDescription, isStepComplete } = useDonationFlow();
  const [phase, setPhase] = useState<'question' | 'describe'>('question');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hydrated) return;
    if (!isStepComplete(5)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  const saveCommitment = async (notes: string | null, isFinal: boolean) => {
    if (!state.paymentIntentId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/donations/commitment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: state.paymentIntentId, notes, isFinal }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save commitment');
        setSaving(false);
        return false;
      }
      return true;
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
      return false;
    }
  };

  const handleYes = () => {
    setWantsMotivation(true);
    setPhase('describe');
  };

  const handleNo = async () => {
    setWantsMotivation(false);
    setCommitmentDescription(null);
    // isFinal=true: no anti-charity step, so send confirmation email now
    const ok = await saveCommitment(null, true);
    if (ok) router.push("/donate/thank-you");
  };

  const handleDescriptionSubmit = async () => {
    const trimmed = description.trim() || null;
    setWantsMotivation(true);
    setCommitmentDescription(trimmed);
    // isFinal=false: user will still pick anti-charity; email sent at that final step
    const ok = await saveCommitment(trimmed, false);
    if (ok) router.push("/donate/anti-charity");
  };

  if (!hydrated || !isStepComplete(5)) return null;

  if (phase === 'describe') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">What are you committing to?</h1>
          <p className="mt-2 text-gray-600">Describe your commitment in a sentence or two. This will appear in your check-in email.</p>
        </div>

        <Card className="mt-8">
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              placeholder="e.g. Finish the product demo by Friday at 5pm"
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
            />
            <div className="text-right text-xs text-gray-400">
              {description.length}/{MAX_CHARS}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button onClick={handleDescriptionSubmit} fullWidth isLoading={saving}>
              {description.trim() ? 'Save & Pick Anti-Charity' : 'Skip & Pick Anti-Charity'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Make it count.</h1>
      </div>

      <Card className="mt-8 text-center">
        <p className="text-lg text-gray-700">
          Do you want to add an accountability target?
        </p>
        <p className="mt-2 text-sm text-gray-500">
          We&apos;ll check in with you when your deadline arrives. If you followed through, your donation goes to the cause you picked. If not — it goes to your anti-charity.
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          No response to the check-in email = donation goes to your anti-charity automatically.
        </p>

        <div className="mt-8 flex gap-4">
          <Button onClick={handleYes} fullWidth>
            Yes, Motivate Me
          </Button>
          <Button onClick={handleNo} variant="outline" fullWidth isLoading={saving}>
            No, Thank You
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </Card>
    </div>
  );
}
