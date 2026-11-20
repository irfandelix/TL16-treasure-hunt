import React, { useState } from 'react';
import { buildRoomInviteUrl, copyTextToClipboard } from '../lib/roomInvite';

const IconLink = ({ className = 'w-4 h-4' }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

/**
 * Copies a shareable `?join=game:CODE` room invitation link for WhatsApp or chat groups.
 */
export default function InviteLinkButton({
  gameKey,
  roomCode,
  label = 'Salin Link Undangan',
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  if (!gameKey || !roomCode) return null;

  const handleCopy = async () => {
    const url = buildRoomInviteUrl(gameKey, roomCode);
    if (!url) return;
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
        copied
          ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#14532D]'
          : 'bg-[#FFFDF9] hover:bg-[#F1ECE0] border-[#DED8CA] text-[#14532D]'
      } ${className}`}
    >
      <IconLink className="w-4 h-4 shrink-0" />
      <span>{copied ? 'Link Undangan Disalin!' : label}</span>
    </button>
  );
}
