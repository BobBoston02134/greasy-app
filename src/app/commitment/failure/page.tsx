import { ENABLE_SUCCESS_FAILURE_FLOWS } from "@/lib/flags";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function CommitmentFailurePage() {
  if (!ENABLE_SUCCESS_FAILURE_FLOWS) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-6xl">💪</div>
        <h1 className="mt-4 text-3xl font-bold text-amber-700">Thanks for Being Honest</h1>
        <p className="mt-3 text-gray-600">
          Your payment has been processed and will go to your designated charity.
          This one didn&apos;t work out — but you showed up and faced the consequence.
          That counts for something.
        </p>
        <p className="mt-3 text-gray-500">
          Use this as fuel. The next commitment is waiting.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/donate"
            className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Try Again
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
