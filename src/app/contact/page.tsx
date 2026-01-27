"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl font-bold text-gray-900">Thank You!</h1>
          <p className="mt-2 text-gray-600">
            We have received your message and will get back to you soon.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
      <p className="mt-2 text-gray-600">
        Have questions? We would love to hear from you.
      </p>

      <Card className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" type="text" required placeholder="Your name" />
          <Input
            label="Email"
            type="email"
            required
            placeholder="you@example.com"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              required
              rows={4}
              placeholder="How can we help?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <Button type="submit" fullWidth>
            Send Message
          </Button>
        </form>
      </Card>
    </div>
  );
}
