import { ENABLE_SUCCESS_FAILURE_FLOWS } from "@/lib/flags";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function CommitmentSuccessPage() {
  if (!ENABLE_SUCCESS_FAILURE_FLOWS) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-green-700">Commitment Honored!</h1>
        <p className="mt-3 text-gray-600">
          Amazing work. Your payment hold has been released — no money was charged.
          You earned this.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/donate"
            className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Make Another Commitment
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
