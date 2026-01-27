"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FINANCIAL_ROUTES } from "@/lib/constants";

export function ShareButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHidden = FINANCIAL_ROUTES.some((route) => pathname.startsWith(route));
  if (isHidden) return null;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = "Check out Greasy - motivational fundraising!";

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Greasy", text, url });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-2 flex flex-col gap-2 rounded-xl bg-white p-3 shadow-lg border border-gray-200">
          <button
            onClick={copyLink}
            className="text-sm text-gray-700 hover:text-green-600 text-left"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={shareTwitter}
            className="text-sm text-gray-700 hover:text-green-600 text-left"
          >
            Share on X
          </button>
          <button
            onClick={shareFacebook}
            className="text-sm text-gray-700 hover:text-green-600 text-left"
          >
            Share on Facebook
          </button>
          {"share" in navigator && (
            <button
              onClick={nativeShare}
              className="text-sm text-gray-700 hover:text-green-600 text-left"
            >
              More...
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Share"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  );
}
