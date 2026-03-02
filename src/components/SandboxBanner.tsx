'use client';

import { useEffect, useState } from 'react';

export function SandboxBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Run on client after hydration
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('sandbox')) {
        setVisible(true);
      }
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium border-b border-amber-600">
      <strong>SANDBOX</strong> — Safe for testing. Use card:{' '}
      <code className="bg-black/10 px-1.5 py-0.5 rounded">4242 4242 4242 4242</code> | Any future date | Any CVV | Nothing is charged.
    </div>
  );
}
