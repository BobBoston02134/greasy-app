import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          Turn Your <span className="text-green-600">Donations</span> Into
          Motivation
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Give to the causes you love, and let your commitment drive real
          results. Greasy helps you put skin in the game.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/donate"
            className="rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Start Donating
          </Link>
          <Link
            href="/about"
            className="rounded-lg border-2 border-green-600 px-8 py-3 text-lg font-semibold text-green-600 hover:bg-green-50 transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-8 sm:grid-cols-3">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">
            Choose Your Cause
          </h3>
          <p className="mt-2 text-gray-600">
            Pick from a curated list of organizations that align with your
            values.
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">
            Set Your Timeline
          </h3>
          <p className="mt-2 text-gray-600">
            Donate immediately or set a timeframe that motivates you to take
            action.
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900">
            Add Motivation
          </h3>
          <p className="mt-2 text-gray-600">
            Optionally add an anti-charity to keep yourself accountable and
            driven.
          </p>
        </Card>
      </div>
    </div>
  );
}
