import React from 'react';

/**
 * Shared warm-paper preparation briefing screen shown before solo games
 * (Napak Tilas Peta & Tebak Muka Blur) so players can review rules before playing.
 */
export default function SoloGamePrepScreen({
  title,
  subtitle,
  artworkSrc,
  artworkAlt,
  stats = [],
  steps = [],
  scoringTiers = [],
  scoringNote = '',
  resumeBanner = null,
  startLabel = 'Mulai Bermain',
  onStart,
  onBack
}) {
  return (
    <section
      aria-labelledby="solo-prep-heading"
      className="w-full max-w-3xl mx-auto bg-[#FFFDF9] rounded-2xl border border-[#DED8CA] overflow-hidden"
    >
      {/* Hero Ilustrasi & Ringkasan */}
      <div className="bg-[#F4EFE4] border-b border-[#E5DFD2] p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          <div className="md:col-span-5 flex justify-center">
            <img
              src={artworkSrc}
              alt={artworkAlt}
              width="220"
              height="220"
              fetchPriority="high"
              className="w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-[0_12px_18px_rgba(24,24,27,0.12)] select-none"
            />
          </div>

          <div className="md:col-span-7 text-center md:text-left space-y-3">
            <h1 id="solo-prep-heading" className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed">
              {subtitle}
            </p>

            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#FFFDF9] border border-[#DED8CA] rounded-xl px-2.5 py-2 text-center"
                  >
                    <span className="block font-mono font-bold text-sm sm:text-base text-[#14532D] tabular-nums">
                      {item.value}
                    </span>
                    <span className="block text-[11px] font-medium text-zinc-600 mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panduan Persiapan & Aturan Skor */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">Sebelum Mulai</h2>
          <ol className="space-y-2.5">
            {steps.map((text, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700 leading-relaxed">
                <span className="font-mono text-xs font-bold text-[#14532D] bg-[#ECFDF5] border border-[#BBF7D0] w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {scoringTiers.length > 0 && (
          <div className="bg-[#F8F6F1] border border-[#E5DFD2] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-zinc-900">Hitungan Poin</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {scoringTiers.map((tier) => (
                <div
                  key={tier.condition}
                  className="bg-[#FFFDF9] border border-[#DED8CA] rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-zinc-700 font-medium">{tier.condition}</span>
                  <span className="font-mono font-bold text-[#14532D] shrink-0">{tier.points}</span>
                </div>
              ))}
            </div>
            {scoringNote && (
              <p className="text-xs text-zinc-600 leading-relaxed">{scoringNote}</p>
            )}
          </div>
        )}

        {resumeBanner && (
          <div className="bg-[#FEF7E6] border border-[#F3D38A] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#78350F] font-medium">
            {resumeBanner}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onStart}
            className="flex-1 min-h-[50px] px-6 py-3.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base transition-colors cursor-pointer"
          >
            {startLabel}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="sm:w-auto min-h-[50px] px-5 py-3.5 rounded-xl bg-[#F8F6F1] hover:bg-[#EFE9DC] border border-[#DED8CA] text-zinc-800 font-bold text-sm transition-colors cursor-pointer"
            >
              Kembali
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
