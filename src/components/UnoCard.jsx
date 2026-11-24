import React from 'react';
import { CARD_SUBLABELS, isWildCard } from '../lib/unoBrutalRules';

const CARD_PALETTES = {
  Merah: { bg: '#BE123C', text: '#FFFFFF', oval: 'rgba(255,255,255,0.16)' },
  Kuning: { bg: '#EAB308', text: '#1C1917', oval: 'rgba(255,255,255,0.34)' },
  Hijau: { bg: '#15803D', text: '#FFFFFF', oval: 'rgba(255,255,255,0.16)' },
  Biru: { bg: '#0369A1', text: '#FFFFFF', oval: 'rgba(255,255,255,0.16)' },
  Bebas: { bg: '#1C1917', text: '#FFFFFF', oval: 'rgba(255,255,255,0.08)' }
};

const CORNER_PIPS = {
  Skip: '⊘',
  Reverse: '⇄',
  'Skip Semua': '⊘⊘',
  'Sapu Bersih': '✦',
  'Tukar KTM': '⇄',
  'Titip Absen': '★'
};

export const UNO_CATALOG_ITEMS = [
  { color: { name: 'Merah' }, value: '7', title: 'Angka 1-9', desc: 'Cocokkan warna atau angka di meja.' },
  { color: { name: 'Kuning' }, value: 'Skip', title: 'Skip', desc: 'Lewati giliran pemain berikutnya.' },
  { color: { name: 'Hijau' }, value: 'Reverse', title: 'Putar Balik', desc: 'Balik arah meja (jalan lagi bila berdua).' },
  { color: { name: 'Biru' }, value: '+2', title: 'Tumpuk +2', desc: 'Lempar +2, bisa ditangkis & ditumpuk.' },
  { color: { name: 'Merah' }, value: 'Skip Semua', title: 'Jam Kosong', desc: 'Lewati semua lawan, kamu jalan lagi.' },
  { color: { name: 'Hijau' }, value: 'Sapu Bersih', title: 'Sapu Bersih', desc: 'Buang semua kartu satu warna sekaligus.' },
  { color: { name: 'Kuning' }, value: 'Tukar KTM', title: 'Tukar KTM', desc: 'Tukar seluruh kartu tanganmu dengan 1 lawan.' },
  { color: { name: 'Bebas' }, value: 'Titip Absen', title: 'Titip Absen', desc: 'Kartu bebas untuk mengganti warna aktif.' },
  { color: { name: 'Bebas' }, value: '+4', title: 'Revisi Mayor', desc: 'Pilih warna + tumpuk bom +4 kartu.' },
  { color: { name: 'Bebas' }, value: '+6', title: 'Mengulang MK', desc: 'Pilih warna + tumpuk bom +6 kartu.' }
];

function CardCenterGlyph({ value, colorName }) {
  const ink = colorName === 'Kuning' ? '#1C1917' : '#FFFFFF';

  if (/^[1-9]$/.test(String(value))) {
    return (
      <span className="text-[40px] font-black leading-none tracking-tight uno-num-ink" style={{ color: ink }}>
        {value}
      </span>
    );
  }
  if (value === 'Skip') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="16" stroke={ink} strokeWidth="4.5" />
        <line x1="13" y1="35" x2="35" y2="13" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (value === 'Skip Semua') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke={ink} strokeWidth="3" strokeDasharray="5 3" />
        <circle cx="24" cy="24" r="11" stroke={ink} strokeWidth="4" />
        <line x1="16.5" y1="31.5" x2="31.5" y2="16.5" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (value === 'Reverse') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <path d="M13 21c0-5.5 4.8-9.5 11.5-9.5h7" stroke={ink} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M27 6.5l5.5 5-5.5 5" stroke={ink} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M35 27c0 5.5-4.8 9.5-11.5 9.5h-7" stroke={ink} strokeWidth="4.2" strokeLinecap="round" />
        <path d="M21 41.5l-5.5-5 5.5-5" stroke={ink} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (value === '+2') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <rect x="7" y="10" width="17" height="24" rx="3" transform="rotate(-10 7 10)" fill={ink} fillOpacity="0.28" stroke={ink} strokeWidth="2.4" />
        <rect x="23" y="8" width="17" height="24" rx="3" transform="rotate(8 23 8)" fill={ink} fillOpacity="0.92" stroke={ink} strokeWidth="2.4" />
        <text x="24" y="45" textAnchor="middle" fill={ink} fontSize="13" fontWeight="900" fontFamily="system-ui,sans-serif">+2</text>
      </svg>
    );
  }
  if (value === 'Sapu Bersih') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <rect x="6" y="13" width="13" height="19" rx="2.5" transform="rotate(-14 6 13)" fill={ink} fillOpacity="0.28" stroke={ink} strokeWidth="2.2" />
        <rect x="17" y="9" width="13" height="19" rx="2.5" transform="rotate(-2 17 9)" fill={ink} fillOpacity="0.56" stroke={ink} strokeWidth="2.2" />
        <rect x="27" y="8" width="13" height="19" rx="2.5" transform="rotate(10 27 8)" fill={ink} fillOpacity="0.92" stroke={ink} strokeWidth="2.2" />
        <path d="M8 38c10-2.5 22-2.5 32 0" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (value === 'Tukar KTM') {
    return (
      <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none" aria-hidden="true">
        <rect x="5" y="13" width="13" height="19" rx="2.5" fill={ink} fillOpacity="0.9" stroke={ink} strokeWidth="2.2" />
        <rect x="30" y="15" width="13" height="19" rx="2.5" fill={ink} fillOpacity="0.3" stroke={ink} strokeWidth="2.2" />
        <path d="M16 9c5-3.5 12-3.5 17 1" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M30 6.5l4 3.5-4.5 1" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 39c-5 3.5-12 3.5-17-1" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M18 41.5l-4-3.5 4.5-1" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (value === 'Titip Absen') {
    return (
      <div className="w-10 h-10 rounded-full uno-wild-quad border-[2.5px] border-white flex items-center justify-center" aria-hidden="true">
        <span className="w-4 h-4 rounded-full bg-[#1C1917] border-2 border-white" />
      </div>
    );
  }
  if (value === '+4' || value === '+6') {
    const numColor = value === '+6' ? '#FDA4AF' : '#FDE68A';
    return (
      <svg viewBox="0 0 54 48" className="w-12 h-11" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="12" height="18" rx="2.5" transform="rotate(-15 4 10)" fill="#BE123C" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="15" y="6" width="12" height="18" rx="2.5" transform="rotate(-4 15 6)" fill="#0369A1" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="26" y="6" width="12" height="18" rx="2.5" transform="rotate(6 26 6)" fill="#15803D" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="37" y="10" width="12" height="18" rx="2.5" transform="rotate(15 37 10)" fill="#EAB308" stroke="#FFFFFF" strokeWidth="2" />
        <text x="27" y="45" textAnchor="middle" fill={numColor} fontSize="16" fontWeight="900" fontFamily="system-ui,sans-serif">{value}</text>
      </svg>
    );
  }

  return <span className="text-2xl font-black" style={{ color: ink }}>{value}</span>;
}

export function UnoCard({
  card,
  interactive = false,
  playable = false,
  disabled = false,
  onClick,
  className = ''
}) {
  if (!card) return null;
  const colorName = card.color?.name || 'Merah';
  const wild = isWildCard(card);
  const face = wild ? CARD_PALETTES.Bebas : CARD_PALETTES[colorName] || CARD_PALETTES.Merah;
  const chosenColor = wild && colorName !== 'Bebas' ? CARD_PALETTES[colorName] : null;
  const pip = CORNER_PIPS[card.value] || card.value;
  const labelText = CARD_SUBLABELS[card.value] || `Angka ${card.value}`;

  const stateClass = interactive
    ? playable
      ? 'cursor-pointer -translate-y-2 hover:-translate-y-5 active:-translate-y-3 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]'
      : 'opacity-45 translate-y-1 cursor-not-allowed transition-all duration-150'
    : '';

  const style = {
    background: face.bg,
    color: face.text,
    ...(chosenColor
      ? {
          borderColor: chosenColor.bg,
          boxShadow: '0 0 0 2.5px #FFFFFF inset, 0 4px 10px rgba(28,25,23,0.2)'
        }
      : {})
  };

  const inner = (
    <>
      <div
        className={`uno-card-oval ${wild ? 'uno-wild-quad opacity-20' : ''}`}
        style={wild ? undefined : { background: face.oval }}
      />
      <div className="relative z-10 w-full h-3.5 flex items-center justify-between leading-none">
        <span className="text-[11px] font-black tracking-tight uno-num-ink">{pip}</span>
        {chosenColor ? (
          <span
            className="px-1 py-0.5 rounded text-[8px] font-mono font-bold text-white"
            style={{ background: chosenColor.bg }}
          >
            {colorName}
          </span>
        ) : (
          <span className="text-[8px] font-mono font-bold opacity-85">{wild ? 'WILD' : colorName}</span>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-1 my-auto">
        <div className="w-12 h-12 flex items-center justify-center">
          <CardCenterGlyph value={card.value} colorName={wild ? 'Bebas' : colorName} />
        </div>
        <span
          className={`h-[18px] inline-flex items-center justify-center text-[8.5px] font-mono font-bold tracking-tight whitespace-nowrap px-1.5 rounded ${
            colorName === 'Kuning' && !wild ? 'bg-[#1C1917]/12 text-[#1C1917]' : 'bg-black/30 text-white'
          }`}
        >
          {labelText}
        </span>
      </div>

      <div className="relative z-10 w-full h-3.5 flex items-end justify-end leading-none">
        <span className="text-[11px] font-black tracking-tight rotate-180 uno-num-ink">{pip}</span>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        disabled={disabled || !playable}
        onClick={onClick}
        aria-label={`Kartu ${colorName} ${card.value}`}
        className={`uno-card ${stateClass} ${className} flex flex-col items-center justify-between p-2 text-left`}
        style={style}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={`uno-card ${className} flex flex-col items-center justify-between p-2 text-left`}
      style={style}
    >
      {inner}
    </div>
  );
}

export function UnoDeckBack({ pendingDraw = 0, disabled = false, onClick, kicked = false, buttonRef = null }) {
  const isBomb = pendingDraw > 0;
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={isBomb ? `Telan ${pendingDraw} kartu hukuman` : 'Ambil 1 kartu dari tumpukan'}
      className={`uno-card uno-deck-stack ${kicked ? 'uno-deck-kick' : ''} cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex flex-col items-center justify-center p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D]`}
      style={{ background: isBomb ? '#BE123C' : '#1C1917' }}
    >
      {isBomb ? (
        <>
          <div className="uno-card-oval bg-white/15" />
          <div className="relative z-10 flex flex-col items-center text-center text-white">
            <span className="text-[10px] font-mono font-bold text-[#FEF3C7]">BOM</span>
            <span className="text-lg sm:text-xl font-black leading-tight uno-num-ink">TELAN</span>
            <span className="text-base font-mono font-black text-[#FEF3C7]">+{pendingDraw}</span>
          </div>
        </>
      ) : (
        <>
          <div className="uno-card-oval bg-[#14532D] border-2 border-[#D97706]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-[#FEF3C7] font-black text-base sm:text-lg tracking-tight -rotate-12">TL16</span>
            <span className="text-[8px] font-mono font-bold text-white/85 tracking-wider mt-0.5">AMBIL</span>
          </div>
        </>
      )}
    </button>
  );
}

export function UnoMiniBack({ angle = 0 }) {
  return (
    <div
      className="uno-mini-back w-6 h-9 sm:w-8 sm:h-12 flex items-center justify-center"
      style={{ transform: `rotate(${angle}deg)` }}
      aria-hidden="true"
    >
      <div className="absolute inset-[14%] rounded-full -rotate-20 bg-[#14532D] border border-[#D97706]" />
      <span className="relative z-10 text-[6px] sm:text-[7px] font-black text-[#FEF3C7] -rotate-12">TL16</span>
    </div>
  );
}

export function UnoDirectionRing({ direction = 1, isDanger = false }) {
  const color = isDanger ? '#BE123C' : '#14532D';
  const isReverse = direction === -1;
  return (
    <div
      aria-hidden="true"
      className={`${isReverse ? 'uno-ring-ccw' : 'uno-ring-cw'} pointer-events-none absolute w-[248px] h-[248px] sm:w-[332px] sm:h-[332px] flex items-center justify-center`}
    >
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full transition-transform duration-300"
        style={{ transform: isReverse ? 'scaleX(-1)' : 'scaleX(1)' }}
        fill="none"
      >
        <defs>
          <linearGradient id="unoRingGradTop" x1="15%" y1="35%" x2="88%" y2="35%">
            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
            <stop offset="55%" stopColor={color} stopOpacity="0.52" />
            <stop offset="100%" stopColor={color} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="unoRingGradBot" x1="85%" y1="65%" x2="12%" y2="65%">
            <stop offset="0%" stopColor={color} stopOpacity="0.14" />
            <stop offset="55%" stopColor={color} stopOpacity="0.52" />
            <stop offset="100%" stopColor={color} stopOpacity="0.88" />
          </linearGradient>
        </defs>
        <path
          d="M 43.1 107.9 A 134.5 134.5 0 0 1 258.4 68.3 L 262.5 57.5 L 278.7 112.1 L 238.5 81.5 L 248.9 77.1 A 121.5 121.5 0 0 0 43.1 107.9 Z"
          fill="url(#unoRingGradTop)"
        />
        <path
          d="M 43.1 107.9 A 134.5 134.5 0 0 1 258.4 68.3 L 262.5 57.5 L 278.7 112.1 L 238.5 81.5 L 248.9 77.1 A 121.5 121.5 0 0 0 43.1 107.9 Z"
          transform="rotate(180 160 160)"
          fill="url(#unoRingGradBot)"
        />
      </svg>
    </div>
  );
}

export function UnoCardCatalog({ heading = 'Katalog 10 Jenis Kartu No Mercy' }) {
  return (
    <section aria-labelledby="uno-catalog-heading" className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 bg-[#FAF6EE] border-b border-[#DED8CA] flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="uno-catalog-heading" className="text-base font-bold text-[#1C1917]">
          {heading}
        </h3>
        <span className="text-xs text-[#57534E]">
          Kenali simbol &amp; efek tiap kartu sebelum permainan dimulai
        </span>
      </div>
      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
        {UNO_CATALOG_ITEMS.map((item) => (
          <div key={item.value} className="flex flex-col items-center text-center gap-1.5 max-w-[136px]">
            <UnoCard card={item} />
            <div className="text-xs font-bold text-[#1C1917] leading-tight mt-0.5">{item.title}</div>
            <p className="text-[11px] text-[#57534E] leading-snug">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
