import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ENABLE_SHAREABLE_COMMITMENT_PAGE } from "@/lib/flags";

interface Props {
  params: { id: string };
}

export default async function ShareableCommitmentPage({ params }: Props) {
  if (!ENABLE_SHAREABLE_COMMITMENT_PAGE) {
    notFound();
  }

  // Support lookup by both donation UUID and stripe_payment_intent_id
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
  const query = supabase
    .from("donations")
    .select(`
      id, amount_cents, status, commitment_description, capture_at,
      commitment_verified, donor_name,
      charity:charities!charity_id(name)
    `);

  const { data: donation } = isUUID
    ? await query.eq("id", params.id).single()
    : await query.eq("stripe_payment_intent_id", params.id).single();

  if (!donation) {
    notFound();
  }

  const charityData = donation.charity as unknown as { name: string } | null;
  const amount = (donation.amount_cents / 100).toFixed(2);
  const name = donation.donor_name || "Someone";
  const deadline = donation.capture_at
    ? new Date(donation.capture_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const isActive =
    donation.status === "authorized" && donation.commitment_verified === null;
  const succeeded = donation.commitment_verified === true;
  const failed =
    donation.commitment_verified === false || donation.status === "captured";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-lg w-full">
        <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
          {isActive && (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
                Active Commitment
              </p>
              <h1 className="mt-3 text-2xl font-bold text-gray-900">
                {name} put ${amount} on the line
              </h1>
              {donation.commitment_description && (
                <p className="mt-4 text-lg text-gray-700 italic">
                  &ldquo;{donation.commitment_description}&rdquo;
                </p>
              )}
              <p className="mt-4 text-gray-500">
                Pledged to <strong>{charityData?.name || "a charity"}</strong>
                {deadline && <> &bull; deadline <strong>{deadline}</strong></>}
              </p>
              <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Hold them accountable. If they don&apos;t follow through, their money goes somewhere they&apos;d rather not support.
              </div>
            </>
          )}

          {succeeded && (
            <>
              <p className="text-4xl">🎉</p>
              <h1 className="mt-3 text-2xl font-bold text-green-700">Commitment Honored!</h1>
              {donation.commitment_description && (
                <p className="mt-4 text-lg text-gray-700 italic">
                  &ldquo;{donation.commitment_description}&rdquo;
                </p>
              )}
              <p className="mt-3 text-gray-500">{name} followed through. No excuses.</p>
            </>
          )}

          {failed && (
            <>
              <p className="text-4xl">💸</p>
              <h1 className="mt-3 text-2xl font-bold text-amber-700">Commitment Not Met</h1>
              {donation.commitment_description && (
                <p className="mt-4 text-lg text-gray-700 italic">
                  &ldquo;{donation.commitment_description}&rdquo;
                </p>
              )}
              <p className="mt-3 text-gray-500">
                {name} didn&apos;t follow through this time. The donation was captured.
              </p>
            </>
          )}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-400">
              Powered by{" "}
              <a href="/" className="font-medium text-green-600 hover:underline">
                Greasy
              </a>{" "}
              — financial accountability for real commitments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
