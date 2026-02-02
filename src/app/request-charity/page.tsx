"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CharityRequest {
  charityName: string;
  website: string;
  reason: string;
  email: string;
  submittedAt: string;
}

const STORAGE_KEY = "greasy_charity_requests";

function saveRequest(request: CharityRequest) {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const requests: CharityRequest[] = existing ? JSON.parse(existing) : [];
    requests.push(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // If localStorage fails, log to console as backup
    console.log("[Greasy Charity Request]", request);
  }
}

export default function RequestCharityPage() {
  const [submitted, setSubmitted] = useState(false);
  const [charityName, setCharityName] = useState("");
  const [website, setWebsite] = useState("");
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const request: CharityRequest = {
      charityName,
      website,
      reason,
      email,
      submittedAt: new Date().toISOString(),
    };

    saveRequest(request);
    setCharityName("");
    setWebsite("");
    setReason("");
    setEmail("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900">Thank You!</h1>
          <p className="mt-2 text-gray-600">
            Your charity request has been submitted. We will review it and
            consider adding it to our platform.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">Request a Charity</h1>
      <p className="mt-2 text-gray-600">
        Do not see a charity you want to support? Let us know and we will
        consider adding it.
      </p>

      <Card className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Charity Name"
            type="text"
            required
            placeholder="Enter the charity name"
            value={charityName}
            onChange={(e) => setCharityName(e.target.value)}
          />
          <Input
            label="Charity Website (optional)"
            type="url"
            placeholder="https://example.org"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <div className="space-y-1">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Why do you want this charity added? (optional)
            </label>
            <textarea
              id="reason"
              rows={4}
              placeholder="Tell us why this charity matters to you..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <Input
            label="Your Email (optional)"
            type="email"
            placeholder="you@example.com"
            helperText="We may reach out if we have questions about your request"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" fullWidth>
            Submit Request
          </Button>
        </form>
      </Card>
    </div>
  );
}
