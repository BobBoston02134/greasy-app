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
    <div
      style={{
        backgroundColor: '#f59e0b',
        color: 'black',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 500,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      🧪 <strong>SANDBOX</strong> — Safe for testing. Use card: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>4242 4242 4242 4242</code> | Any future date | Any CVV | Nothing is charged.
    </div>
  );
}
