'use client';

import { useState, useEffect } from 'react';

export function SandboxBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check hostname on client side
    const hostname = window.location.hostname;
    const isSandbox = hostname.startsWith('sandbox.') || hostname.includes('sandbox');
    console.log('[SandboxBanner] hostname:', hostname, 'isSandbox:', isSandbox);
    if (isSandbox) {
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-50">
      <span className="mr-2">🧪</span>
      <strong>SANDBOX</strong> — Safe for testing. Use card:{' '}
      <code className="bg-amber-600/30 px-1.5 py-0.5 rounded font-mono">
        4242 4242 4242 4242
      </code>{' '}
      | Any future date | Any CVV | Nothing is charged.
    </div>
  );
}
