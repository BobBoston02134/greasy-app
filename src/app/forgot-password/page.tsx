"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Request-reset state
  const [email, setEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  // Set-new-password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // If token is present, show reset form; otherwise show request form
  const isResetMode = Boolean(token);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setRequestLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRequestError(data.error || "Something went wrong.");
      } else {
        setRequestSent(true);
      }
    } catch {
      setRequestError("Something went wrong. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.error || "Something went wrong.");
      } else {
        setResetDone(true);
      }
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 text-center">
          Set New Password
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Choose a new password for your account.
        </p>

        <Card className="mt-8">
          {resetDone ? (
            <div className="space-y-4 text-center">
              <p className="text-gray-700">
                Your password has been updated. You can now log in.
              </p>
              <Link href="/login">
                <Button fullWidth>Go to Log In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              {resetError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {resetError}
                </div>
              )}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-9 text-sm text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
              />
              <Button type="submit" fullWidth isLoading={resetLoading}>
                Set New Password
              </Button>
            </form>
          )}
        </Card>

        {!resetDone && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Back to{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 text-center">
        Forgot Password
      </h1>
      <p className="mt-2 text-center text-gray-600">
        Enter your email and we will send you a reset link.
      </p>

      <Card className="mt-8">
        {requestSent ? (
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              If that email is registered, a reset link is on its way. Check
              your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            {requestError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {requestError}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" fullWidth isLoading={requestLoading}>
              Send Reset Link
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link href="/login" className="text-green-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
