"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function AccountPage() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">My Account</h1>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900">{session?.user?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">
              {session?.user?.email ?? "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Stripe Customer ID</span>
            <span className="font-mono text-sm text-gray-900">
              {session?.user?.id ?? "—"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Donation History
        </h2>
        <p className="mt-2 text-gray-500">
          Your donation history will appear here. This feature is coming soon.
        </p>
      </Card>

      <div className="mt-8 text-center">
        <Link
          href="/donate"
          className="rounded-lg bg-green-600 px-8 py-3 text-lg font-semibold text-white hover:bg-green-700 transition-colors inline-block"
        >
          Make a Donation
        </Link>
      </div>
    </div>
  );
}
