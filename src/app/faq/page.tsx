import { ENABLE_FAQ_PAGE } from "@/lib/flags";
import { notFound } from "next/navigation";

const faqs = [
  {
    q: "What if I succeed — do I get charged?",
    a: "No. If you click 'Yes, I did it' in the check-in email, the payment hold on your card is released immediately. You are never charged when you follow through.",
  },
  {
    q: "What if I don't respond to the check-in email?",
    a: "No response counts as failure. After 48 hours with no reply, your payment is automatically captured. This is by design — ignoring the email is not a way out.",
  },
  {
    q: "Can I cancel my commitment?",
    a: "No. The whole point is that the commitment is real. If you could cancel at any time, the accountability would be meaningless. Choose your commitment carefully.",
  },
  {
    q: "Where does the money actually go?",
    a: "When you succeed, your payment hold is released and you keep your money. When you fail, the captured payment goes to your designated anti-charity organization.",
  },
  {
    q: "What is an anti-charity?",
    a: "An anti-charity is an organization you'd genuinely rather not support. The stronger your aversion to it, the stronger your motivation to follow through. We offer a curated list to choose from.",
  },
  {
    q: "Is my card charged when I sign up?",
    a: "No. Your card is authorized (a hold is placed) but not charged at signup. The charge only happens if you fail your commitment or don't respond to the check-in.",
  },
  {
    q: "What if I have a legitimate reason I couldn't complete my commitment?",
    a: "Greasy doesn't adjudicate life circumstances. The commitment you make is between you and yourself. You self-report whether you succeeded. We trust you to be honest.",
  },
  {
    q: "How long until my deadline?",
    a: "You choose your deadline when you sign up: same day (5pm, 10pm, midnight), end of week, end of month, end of quarter, or end of year.",
  },
  {
    q: "I need a refund. How do I request one?",
    a: "If you believe a payment was captured in error, contact us at support@greasy.ai with your donation ID and we'll review it.",
  },
];

export default function FAQPage() {
  if (!ENABLE_FAQ_PAGE) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
      <p className="mt-3 text-lg text-gray-600">
        Everything you need to know about how Greasy works.
      </p>

      <div className="mt-10 space-y-8">
        {faqs.map((faq, i) => (
          <div key={i}>
            <h2 className="text-lg font-semibold text-gray-900">{faq.q}</h2>
            <p className="mt-2 text-gray-600">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg bg-gray-50 p-6">
        <p className="text-gray-600">
          Still have questions? Email us at{" "}
          <a href="mailto:support@greasy.ai" className="font-medium text-green-600 hover:underline">
            support@greasy.ai
          </a>
        </p>
      </div>
    </div>
  );
}
