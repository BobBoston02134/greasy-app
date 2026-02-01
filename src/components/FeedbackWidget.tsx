"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FeedbackEntry {
  id: string;
  feedback: string;
  email?: string;
  page: string;
  timestamp: string;
  userAgent: string;
}

const FEEDBACK_STORAGE_KEY = "greasy_feedback";

function getFeedbackEntries(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFeedbackEntry(entry: FeedbackEntry): void {
  const entries = getFeedbackEntries();
  entries.push(entry);
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries));
  // Also log to console for easy access during testing
  console.log("[Greasy Feedback]", entry);
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) return;

    const entry: FeedbackEntry = {
      id: crypto.randomUUID(),
      feedback: feedback.trim(),
      email: email.trim() || undefined,
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };

    saveFeedbackEntry(entry);
    setSubmitted(true);

    // Reset after showing success message
    setTimeout(() => {
      setFeedback("");
      setEmail("");
      setSubmitted(false);
      setOpen(false);
    }, 2000);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {open && (
        <div className="mb-2 w-80 rounded-xl bg-white p-4 shadow-lg border border-gray-200">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-green-600 font-semibold mb-1">
                Thank you!
              </div>
              <p className="text-sm text-gray-600">
                Your feedback has been recorded.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Send Feedback
                  </h3>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Beta Testing
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Found a bug or have a suggestion? Let us know!
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="feedback-text"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="feedback-text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe the issue or share your thoughts..."
                    rows={4}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
                      "border-gray-300 resize-none"
                    )}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="feedback-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
                      "border-gray-300"
                    )}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    In case we need to follow up
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!feedback.trim()}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      "bg-green-600 text-white hover:bg-green-700",
                      "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
          open
            ? "bg-gray-600 text-white hover:bg-gray-700"
            : "bg-amber-500 text-white hover:bg-amber-600"
        )}
        aria-label={open ? "Close feedback form" : "Send feedback"}
      >
        {open ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
        <span className="text-sm font-medium">
          {open ? "Close" : "Feedback"}
        </span>
      </button>
    </div>
  );
}
