import React from 'react';

/**
 * Displays text when revealed, or a detective-style black redaction bar until unlocked.
 */
export default function RedactedText({ revealed = false, children, onDark = false, widthClass = 'w-16' }) {
  if (revealed) {
    return <>{children}</>;
  }

  return (
    <span className="inline-flex items-center align-middle mx-0.5">
      <span
        aria-hidden="true"
        title="Dirahasiakan sampai tanggal pembukaan tiba"
        className={`inline-block h-[0.95em] ${widthClass} bg-zinc-950 rounded-[3px] select-none ${
          onDark ? 'border border-white/30' : ''
        }`}
      />
      <span className="sr-only">permainan rahasia (menunggu jadwal buka)</span>
    </span>
  );
}
