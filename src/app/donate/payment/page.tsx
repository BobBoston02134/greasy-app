"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useDonationFlow } from "@/hooks/useDonationFlow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { RECIPIENTS, TIMEFRAMES } from "@/lib/constants";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function PaymentForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const { state, setPaymentIntent } = useDonationFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recipientLabel =
    RECIPIENTS.find((r) => r.value === state.recipient)?.label ??
    state.recipient;
  const timeframeLabel =
    TIMEFRAMES.find((t) => t.value === state.timeframe)?.label ??
    state.timeframe;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: state.amount,
          recipient: state.recipient,
          timeframe: state.timeframe,
          customerId: session?.user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create payment");
        setLoading(false);
        return;
      }

      const { clientSecret, paymentIntentId } = data;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
        setLoading(false);
        return;
      }

      setPaymentIntent(paymentIntentId, clientSecret);
      router.push("/donate/confirm");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Amount:</span>
          <span className="font-semibold text-gray-900">
            {state.amount !== null ? formatCurrency(state.amount) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Recipient:</span>
          <span className="font-semibold text-gray-900">{recipientLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Timeframe:</span>
          <span className="font-semibold text-gray-900">
            {timeframeLabel}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="rounded-lg border border-gray-300 p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  "::placeholder": { color: "#9ca3af" },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        isLoading={loading}
        disabled={!stripe}
      >
        Pay {state.amount !== null ? formatCurrency(state.amount) : ""}
      </Button>
    </form>
  );
}

export default function DonatePaymentPage() {
  const router = useRouter();
  const { hydrated, isStepComplete } = useDonationFlow();

  useEffect(() => {
    if (!hydrated) return;
    if (!isStepComplete(4)) {
      router.replace("/donate");
    }
  }, [hydrated, isStepComplete, router]);

  if (!hydrated || !isStepComplete(4)) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Step 4: Payment
        </h1>
        <p className="mt-2 text-gray-600">Enter your card details below.</p>
      </div>

      <Card className="mt-8">
        <Elements stripe={stripePromise}>
          <PaymentForm />
        </Elements>
      </Card>
    </div>
  );
}
