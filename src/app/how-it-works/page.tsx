import { ENABLE_HOW_IT_WORKS_PAGE } from "@/lib/flags";
import { notFound } from "next/navigation";

export default function HowItWorksPage() {
  if (!ENABLE_HOW_IT_WORKS_PAGE) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">How Greasy Works</h1>
      <p className="mt-3 text-lg text-gray-600">
        Greasy turns your good intentions into real financial accountability. Here&apos;s the full picture.
      </p>

      <div className="mt-10 space-y-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">1</span>
            <h2 className="text-xl font-semibold text-gray-900">Make a commitment</h2>
          </div>
          <p className="mt-3 text-gray-600 pl-11">
            Pick something you genuinely want to accomplish — finish a project, go to the gym, write that first draft. Describe it in plain language so it&apos;s clear and specific.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">2</span>
            <h2 className="text-xl font-semibold text-gray-900">Pledge a donation</h2>
          </div>
          <p className="mt-3 text-gray-600 pl-11">
            Choose an amount and authorize it on your card. The money isn&apos;t charged yet — it&apos;s just held. You pick a charity you&apos;d be proud to support, and a deadline.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">3</span>
            <h2 className="text-xl font-semibold text-gray-900">Pick your consequence</h2>
          </div>
          <p className="mt-3 text-gray-600 pl-11">
            Choose an &ldquo;anti-charity&rdquo; — an organization you&apos;d genuinely hate to support. If you don&apos;t follow through, that&apos;s where your money goes. The bigger the cringe, the stronger the motivation.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">4</span>
            <h2 className="text-xl font-semibold text-gray-900">We check in at the deadline</h2>
          </div>
          <p className="mt-3 text-gray-600 pl-11">
            When your deadline approaches, you get a check-in email with two buttons: &ldquo;Yes, I did it&rdquo; or &ldquo;No, I didn&apos;t.&rdquo; Your response determines what happens to your money.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">5</span>
            <h2 className="text-xl font-semibold text-gray-900">Money moves accordingly</h2>
          </div>
          <p className="mt-3 text-gray-600 pl-11">
            <strong>You succeeded:</strong> the payment hold is released. No charge. You earned it.
            <br className="mt-2 block" />
            <strong>You failed (or don&apos;t respond):</strong> the payment is captured and sent to your anti-charity.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-6">
          <h3 className="font-semibold text-amber-900">The default-to-capture rule</h3>
          <p className="mt-2 text-amber-800">
            If you don&apos;t respond to the check-in email within 48 hours, your payment is captured automatically. No response counts as failure. This is intentional — it removes the temptation to just ignore the email.
          </p>
        </div>
      </div>
    </div>
  );
}
