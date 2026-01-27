import { Card } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">About Greasy</h1>
      <div className="mt-8 space-y-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">Our Mission</h2>
          <p className="mt-2 text-gray-600">
            Greasy is a motivational fundraising platform that helps you put skin
            in the game. We believe that when your money is on the line, you are
            more likely to follow through on your commitments.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-600">
            Choose a donation amount, set a timeframe, and pick an organization
            to support. Then, optionally add an anti-charity: an organization you
            would rather not support. If you do not accomplish your goal, your
            donation goes to the anti-charity instead. It is the ultimate
            motivator.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-gray-900">
            Why &ldquo;Greasy&rdquo;?
          </h2>
          <p className="mt-2 text-gray-600">
            Because real commitment should feel a little uncomfortable. Greasy
            makes your pledges stick by adding a layer of accountability that
            money alone cannot buy.
          </p>
        </Card>
      </div>
    </div>
  );
}
