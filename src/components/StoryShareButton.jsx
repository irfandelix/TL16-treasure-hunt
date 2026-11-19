import React, { useState } from 'react';
import { shareOrDownloadStoryCard } from '../lib/storyCardGenerator';

const IconShareStory = ({ className = 'w-4 h-4' }) => (
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
    <rect x="4" y="2.5" width="16" height="19" rx="3" />
    <path d="M12 14V8" />
    <polyline points="9 11 12 8 15 11" />
    <line x1="9" y1="17.5" x2="15" y2="17.5" />
  </svg>
);

/**
 * Generates and shares a 9:16 IG Story poster via Web Share API or PNG download.
 */
export default function StoryShareButton({
  getPayload,
  label = 'Bagikan ke Story',
  variant = 'secondary',
  className = ''
}) {
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleClick = async () => {
    if (isBusy || !getPayload) return;
    setIsBusy(true);
    setFeedback('');

    try {
      const payload = await getPayload();
      if (!payload) return;
      const result = await shareOrDownloadStoryCard(payload);
      if (result.status === 'downloaded') {
        setFeedback('Poster PNG diunduh. Unggah dari galeri ke IG Story.');
      } else if (result.status === 'shared') {
        setFeedback('Poster siap dibagikan ke IG Story.');
      }
    } catch (err) {
      console.error('Gagal membagikan poster Story:', err);
      setFeedback('Gagal menyiapkan poster. Silakan coba lagi.');
    } finally {
      setIsBusy(false);
    }
  };

  const baseTone =
    variant === 'primary'
      ? 'bg-[#14532D] hover:bg-[#166534] text-white border border-[#14532D]'
      : 'bg-[#FFFDF9] hover:bg-[#F1ECE0] text-[#14532D] border border-[#CEC6B6]';

  return (
    <div className={`inline-flex flex-col items-stretch ${className}`}>
      <button
        type="button"
        disabled={isBusy}
        onClick={handleClick}
        className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${baseTone}`}
      >
        <IconShareStory className="w-4 h-4 shrink-0" />
        <span>{isBusy ? 'Menyiapkan Poster...' : label}</span>
      </button>
      {feedback && (
        <span role="status" className="text-[11px] font-medium text-zinc-600 mt-1.5 text-center">
          {feedback}
        </span>
      )}
    </div>
  );
}
