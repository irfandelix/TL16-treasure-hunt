import React, { useState, useEffect } from 'react';
import { formatShortReleaseDateId } from '../lib/earlyAccess';

const GAMES_META = [
  {
    key: 'monopoli',
    num: '01',
    title: 'Monopoli TL16',
    asset: '/games/monopoli.webp',
    mysteryWhisper: 'Segel masih rapat!'
  },
  {
    key: 'werewolf',
    num: '02',
    title: 'Dosen Killer',
    asset: '/games/dosen-killer.webp',
    mysteryWhisper: 'Pantau terus infonya!'
  },
  {
    key: 'uno',
    num: '03',
    title: 'UNO Seru TL16',
    asset: '/games/uno.webp',
    mysteryWhisper: 'Tunggu gilirannya!'
  },
  {
    key: 'athlete',
    num: '04',
    title: 'Magical Athlete TL16',
    asset: '/games/magical-athlete.webp',
    mysteryWhisper: 'Siap-siap adu cepat!'
  }
];

const COMING_LETTERS = [
  { ch: 'C', color: '#D91E36', delay: '0.00s' },
  { ch: 'O', color: '#F15025', delay: '0.08s' },
  { ch: 'M', color: '#F79D1E', delay: '0.16s' },
  { ch: 'I', color: '#FACC15', delay: '0.24s' },
  { ch: 'N', color: '#84CC16', delay: '0.32s' },
  { ch: 'G', color: '#10B981', delay: '0.40s' }
];

const SOON_LETTERS = [
  { ch: 'S', color: '#06B6D4', delay: '0.48s' },
  { ch: 'O', color: '#38BDF8', delay: '0.56s' },
  { ch: 'O', color: '#2563EB', delay: '0.64s' },
  { ch: 'N', color: '#312E81', delay: '0.72s' }
];

const CONFETTI_COLORS = ['#E31B6D', '#FACC15', '#22D3EE', '#84CC16', '#F97316', '#FFFFFF', '#F472B6'];
const MINI_ROTATIONS = ['-8deg', '5deg', '-4deg', '9deg'];

const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 24 + ((i % 3) - 1) * 0.08;
  const dist = 135 + ((i * 37) % 175);
  return {
    id: i,
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist * 0.72)}px`,
    spin: `${((i % 2 === 0 ? 1 : -1) * (180 + ((i * 53) % 280)))}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    isDot: i % 3 === 0,
    delay: `${((i % 5) * 0.025).toFixed(3)}s`
  };
});

function ClueStageArtwork({ game }) {
  if (game.key === 'monopoli') {
    return (
      <div className="cs-peek-zoom relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
        <img src={game.asset} alt="" className="w-full h-full object-contain cs-sil-stage cs-mono-sil select-none" />
        <img src={game.asset} alt="" className="w-full h-full object-contain absolute inset-0 cs-mono-peek opacity-95 select-none" />
      </div>
    );
  }

  if (game.key === 'werewolf') {
    return (
      <div className="cs-peek-zoom relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
        <img src={game.asset} alt="" className="w-full h-full object-contain cs-sil-stage select-none" />
        <img src={game.asset} alt="" className="w-full h-full object-contain absolute inset-0 cs-dosen-peek opacity-95 select-none" />
        <div className="cs-dosen-lens pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[3px] border-amber-300 bg-amber-200/10 shadow-[0_0_16px_rgba(251,191,36,0.55)] relative">
            <span className="block w-1.5 h-5 bg-amber-300 rounded-full absolute -bottom-3.5 -right-2 rotate-[-42deg]" />
          </div>
        </div>
      </div>
    );
  }

  if (game.key === 'uno') {
    return (
      <div className="cs-peek-zoom relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
        <img src={game.asset} alt="" className="w-full h-full object-contain cs-sil-stage cs-uno-sil select-none" />
        <img src={game.asset} alt="" className="w-full h-full object-contain absolute inset-0 cs-uno-peek opacity-95 select-none" />
      </div>
    );
  }

  return (
    <div className="cs-peek-zoom relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
      <img src={game.asset} alt="" className="w-full h-full object-contain cs-ath-sil select-none" />
      <img src={game.asset} alt="" className="w-full h-full object-contain absolute inset-0 cs-ath-peek select-none" />
      <div className="pointer-events-none absolute -inset-x-4 inset-y-0 overflow-hidden" aria-hidden="true">
        <div className="cs-neon-1 absolute top-1/3 left-0 w-24 h-1 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-lime-300 shadow-[0_0_12px_#22d3ee]" />
        <div className="cs-neon-2 absolute bottom-1/3 left-0 w-28 h-1 rounded-full bg-gradient-to-r from-transparent via-fuchsia-400 to-amber-300 shadow-[0_0_12px_#f472b6]" />
      </div>
    </div>
  );
}

function ExplosionGameItem({ game, index, stage, releaseDateIso }) {
  const [peeking, setPeeking] = useState(false);
  const [wiggleTick, setWiggleTick] = useState(0);
  const [whisperShown, setWhisperShown] = useState(false);

  const explodeClass = `cs-exp-${index}`;

  if (stage === 'open') {
    return (
      <article className={`cs-game-spot ${explodeClass} flex flex-col items-center text-center gap-1 max-w-[165px]`}>
        <img
          src={game.asset}
          alt={game.title}
          className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_14px_20px_rgba(0,0,0,0.45)] hover:-translate-y-1.5 transition-transform duration-300 select-none"
        />
        <div className="text-xs sm:text-sm font-bold text-white leading-tight">{game.title}</div>
        <span className="text-[11px] font-mono font-bold text-emerald-300">Sudah Terbuka</span>
      </article>
    );
  }

  if (stage === 'clue') {
    const releaseLabel = formatShortReleaseDateId(releaseDateIso);
    return (
      <button
        type="button"
        onClick={() => setPeeking((prev) => !prev)}
        className={`cs-game-spot ${peeking ? 'cs-is-peeking' : ''} ${explodeClass} flex flex-col items-center text-center gap-1 max-w-[165px] cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 rounded-2xl p-1`}
        aria-label={`Intip permainan rahasia nomor ${game.num}, Coming Soon ${releaseLabel}`}
      >
        <ClueStageArtwork game={game} />
        <span className="text-xs font-bold text-amber-300">Coming Soon</span>
        <span className="flex flex-col items-center justify-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block h-3.5 w-24 bg-white/25 rounded-[4px] border border-white/20"
          />
          <span className="text-[11px] font-mono font-semibold text-white/85">{releaseLabel}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setWiggleTick((t) => t + 1);
        setWhisperShown(true);
      }}
      className={`cs-game-spot ${explodeClass} flex flex-col items-center text-center gap-1 max-w-[165px] cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 rounded-2xl p-1`}
      aria-label={`Permainan rahasia nomor ${game.num}, Coming Soon`}
    >
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
        <img
          src={game.asset}
          alt=""
          className="cs-ghost-stage pointer-events-none absolute w-full h-full object-contain select-none"
        />
        <div
          key={wiggleTick}
          className={`${wiggleTick > 0 ? 'cs-wiggle' : 'cs-question'} relative z-10 flex flex-col items-center gap-1`}
        >
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-950/90 text-amber-300 border-2 border-amber-400 flex items-center justify-center text-xl sm:text-2xl font-black shadow-[0_0_20px_rgba(251,191,36,0.35)]">
            ?
          </span>
          <span className="text-[10px] font-mono font-bold tracking-wider text-amber-100/90">
            RAHASIA #{game.num}
          </span>
        </div>
      </div>
      <span className="text-xs font-bold text-white/90">Coming Soon</span>
      <span className="text-[11px] text-white/70">
        {whisperShown ? game.mysteryWhisper : 'Ketuk untuk cek'}
      </span>
    </button>
  );
}

/**
 * Trigger banner placed directly beneath Tombol Misteri that opens a radial
 * Coming Soon explosion pop-up showcasing the 4 multiplayer games across stages.
 */
export default function ComingSoonExplosion({ publicStages, gameDates }) {
  const [isOpen, setIsOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const stages = {
    monopoli: publicStages?.monopoli || 'mystery',
    werewolf: publicStages?.werewolf || 'mystery',
    uno: publicStages?.uno || 'mystery',
    athlete: publicStages?.athlete || 'mystery'
  };

  const openCount = GAMES_META.filter((g) => stages[g.key] === 'open').length;
  const remainingCount = GAMES_META.length - openCount;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (remainingCount === 0) return null;

  const openPopup = () => {
    setBurstKey((k) => k + 1);
    setIsOpen(true);
  };

  const replayBurst = () => {
    setBurstKey((k) => k + 1);
  };

  const subBadgeText =
    openCount === 0
      ? '4 GAME KEJUTAN • TL 2016'
      : `${openCount} TERBUKA • ${remainingCount} COMING SOON`;

  return (
    <>
      <section
        aria-labelledby="coming-soon-trigger-heading"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14532D] via-[#166534] to-[#0F3F22] border border-[#0B2E19] p-5 sm:p-6 text-white"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full bg-amber-400/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/3 -bottom-12 w-40 h-40 rounded-full bg-[#E31B6D]/20 blur-2xl"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="flex -space-x-3.5 shrink-0" aria-hidden="true">
              {GAMES_META.map((game, i) => {
                const isRevealed = stages[game.key] === 'open';
                return (
                  <div
                    key={game.key}
                    className="cs-mini-float w-11 h-11 rounded-full bg-zinc-950/45 border-2 border-amber-300/60 flex items-center justify-center p-1.5 backdrop-blur-sm shadow-md"
                    style={{ '--cs-rot': MINI_ROTATIONS[i], animationDelay: `${i * 0.25}s` }}
                  >
                    <img
                      src={game.asset}
                      alt=""
                      className={`w-full h-full object-contain select-none ${
                        isRevealed ? '' : 'brightness-0 invert opacity-80'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#E31B6D] animate-pulse" aria-hidden="true" />
                <span>ARENA MAIN BARENG • {remainingCount} GAME COMING SOON</span>
              </div>
              <h2 id="coming-soon-trigger-heading" className="text-base sm:text-xl font-bold leading-snug text-white">
                {openCount === 0
                  ? 'Ada 4 Permainan Kejutan Sedang Disiapkan!'
                  : `Masih Ada ${remainingCount} Permainan Kejutan Lagi!`}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Penasaran game apa saja yang bakal seru dimainkan bareng seangkatan? Coba intip kejutannya.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openPopup}
            className="group relative overflow-hidden w-full md:w-auto shrink-0 min-h-[50px] px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-zinc-950 font-extrabold text-sm shadow-[0_5px_0_#B45309] hover:shadow-[0_3px_0_#B45309] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span
              aria-hidden="true"
              className="cs-sheen pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/55 to-transparent"
            />
            <span className="relative">Intip 4 Game Coming Soon</span>
            <span
              aria-hidden="true"
              className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-950 text-amber-300 text-xs font-black"
            >
              !
            </span>
          </button>
        </div>
      </section>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kejutan 4 Game Coming Soon"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          style={{ background: 'rgba(9, 9, 11, 0.84)', backdropFilter: 'blur(8px)' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(254, 243, 199, 0.22) 0%, rgba(20, 83, 45, 0.56) 45%, rgba(12, 18, 22, 0.96) 100%)'
            }}
            className="relative w-full max-w-4xl max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-[28px] sm:rounded-[32px] border border-white/20 px-3 py-6 sm:p-8 flex flex-col justify-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup pop-up Coming Soon"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              &times;
            </button>

            <div key={`fx-${burstKey}`} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="cs-shock-1 absolute left-1/2 top-1/2 w-36 h-36 rounded-full border-amber-300" />
              <div className="cs-shock-2 absolute left-1/2 top-1/2 w-36 h-36 rounded-full border-[#E31B6D]" />
              {CONFETTI_PARTICLES.map((p) => (
                <span
                  key={p.id}
                  className="cs-confetti absolute left-1/2 top-1/2 block"
                  style={{
                    '--cs-tx': p.tx,
                    '--cs-ty': p.ty,
                    '--cs-spin': p.spin,
                    backgroundColor: p.color,
                    width: p.isDot ? '9px' : '13px',
                    height: p.isDot ? '9px' : '6px',
                    borderRadius: p.isDot ? '9999px' : '3px',
                    animationDelay: p.delay
                  }}
                />
              ))}
            </div>

            <div
              key={`grid-${burstKey}`}
              className="relative z-20 grid grid-cols-2 lg:grid-cols-12 items-center gap-y-4 sm:gap-y-6 gap-x-2 sm:gap-x-3 mt-4 sm:mt-1"
            >
              <div className="col-span-1 lg:col-span-4 lg:row-start-1 lg:col-start-1 flex justify-center">
                <ExplosionGameItem
                  game={GAMES_META[0]}
                  index={0}
                  stage={stages.monopoli}
                  releaseDateIso={gameDates?.monopoli}
                />
              </div>

              <div className="col-span-1 lg:col-span-4 lg:row-start-1 lg:col-start-9 flex justify-center">
                <ExplosionGameItem
                  game={GAMES_META[1]}
                  index={1}
                  stage={stages.werewolf}
                  releaseDateIso={gameDates?.werewolf}
                />
              </div>

              <div className="col-span-2 lg:col-span-4 lg:row-start-1 lg:row-span-2 lg:col-start-5 flex flex-col items-center justify-center my-2 lg:my-0 relative">
                <svg
                  viewBox="0 0 260 260"
                  className="cs-starburst pointer-events-none absolute left-1/2 top-1/2 w-48 h-48 sm:w-68 sm:h-68 opacity-25"
                  aria-hidden="true"
                >
                  <polygon
                    points="130,8 148,68 202,32 178,92 246,96 190,130 246,164 178,168 202,228 148,192 130,252 112,192 58,228 82,168 14,164 70,130 14,96 82,92 58,32 112,68"
                    fill="#FDE047"
                  />
                </svg>

                <button
                  type="button"
                  onClick={replayBurst}
                  aria-label="Putar ulang efek ledakan Coming Soon"
                  className="cs-sticker-wrap relative z-10 flex flex-col items-center select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 rounded-3xl p-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#E31B6D] border-[2.5px] sm:border-[3px] border-[#FFFDF9] shadow-md shrink-0" />
                    <div className="text-[30px] sm:text-5xl tracking-tight flex items-center">
                      {COMING_LETTERS.map((item, idx) => (
                        <span
                          key={idx}
                          className="cs-sticker-char"
                          style={{ color: item.color, animationDelay: item.delay }}
                        >
                          {item.ch}
                        </span>
                      ))}
                    </div>
                    <span className="w-6 h-3 sm:w-9 sm:h-4 rounded-full bg-[#E31B6D] border-[2.5px] sm:border-[3px] border-[#FFFDF9] shadow-md shrink-0" />
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 -mt-0.5 sm:-mt-1">
                    <span className="w-7 h-3 sm:w-11 sm:h-4 rounded-full bg-[#E31B6D] border-[2.5px] sm:border-[3px] border-[#FFFDF9] shadow-md shrink-0" />
                    <div className="text-[30px] sm:text-5xl tracking-tight flex items-center">
                      {SOON_LETTERS.map((item, idx) => (
                        <span
                          key={idx}
                          className="cs-sticker-char"
                          style={{ color: item.color, animationDelay: item.delay }}
                        >
                          {item.ch}
                        </span>
                      ))}
                    </div>
                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FACC15] border-[2.5px] sm:border-[3px] border-[#FFFDF9] shadow-md shrink-0" />
                  </div>

                  <div className="mt-2.5 px-3.5 py-1 rounded-full bg-[#14532D] border-2 border-[#FFFDF9] text-[#FEF08A] font-mono text-[10px] sm:text-[11px] font-bold tracking-wider shadow-lg">
                    {subBadgeText}
                  </div>
                </button>
              </div>

              <div className="col-span-1 lg:col-span-4 lg:row-start-2 lg:col-start-1 flex justify-center">
                <ExplosionGameItem
                  game={GAMES_META[2]}
                  index={2}
                  stage={stages.uno}
                  releaseDateIso={gameDates?.uno}
                />
              </div>

              <div className="col-span-1 lg:col-span-4 lg:row-start-2 lg:col-start-9 flex justify-center">
                <ExplosionGameItem
                  game={GAMES_META[3]}
                  index={3}
                  stage={stages.athlete}
                  releaseDateIso={gameDates?.athlete}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
