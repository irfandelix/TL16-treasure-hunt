import React, { useState, useEffect, Fragment } from 'react';
import { UPDATES_LOG } from '../data/updatesLog';
import { supabase } from '../lib/supabaseClient';
import { isAdminSession } from '../lib/adminAuth';
import { copyTextToClipboard } from '../lib/roomInvite';
import { extractComingSoonConfig, resolveGameStage } from '../lib/earlyAccess';
import RedactedText from './RedactedText';

const SECRET_MODE_RULES = [
  {
    key: 'monopoli',
    widthClass: 'w-20',
    pattern:
      'public/games/monopoli\\.webp|bidak Monopoli(?: TL16)?|bidak[^,.]*|papan Monopoli(?: TL16)?|Monopoli TL 2016|Monopoli TL16|MonopoliBoard(?:\\.jsx)?|MonopoliDice|monopoli_room_\\{nim\\}|monopoli_rooms|monopoli_players|monopoli_properties|monopoli_users|skor_monopoli|\\bMonopoli\\b|Daftar Petak(?: Papan)?|Detail Petak|kotak angka dadu|2 Dadu Bergoyang|kocokan dadu|lemparan dadu|petak tujuan|petak 11x11|papan 11x11|perbesar papan[^,.]*|TELEPORT/MUNDUR|bonus START|\\bKE_START\\b|\\bSTART\\b|properti kontrakan|Truth or Dare|uang sewa|kas sewa|IconBoard|\\blobi\\b',
  },
  {
    key: 'werewolf',
    widthClass: 'w-24',
    pattern:
      'public/games/dosen-killer\\.webp|Sidang Dosen Killer|Dosen Killer|DosenKillerGame(?:\\.jsx)?|DosenKiller|LayarDiskusi(?:\\.jsx)?|LayarMalam(?:\\.jsx)?|LayarVoting(?:\\.jsx)?|LayarEksekusi(?:\\.jsx)?|dk_room_\\{nim\\}|skor_werewolf|\\bwerewolf\\b|fase malam|kebocoran chat|petunjuk Intel|catatan Intel|kekebalan Uptodate|IconClass|remedial',
  },
  {
    key: 'uno',
    widthClass: 'w-20',
    pattern:
      'public/games/uno\\.webp|UNO Sedulur 16|UNO Seru TL16|UnoBrutalGame(?:\\.jsx)?|uno_room_\\{nim\\}|uno_rooms|uno_players|skor_uno|Juara Kartu UNO|\\bUNO\\b|Titip Absen|4 warna|top_card|current_turn|tumpuk kartu|meja kartu|keluar meja|kartu Skip dan \\+2|IconCards',
  },
  {
    key: 'wheel',
    widthClass: 'w-24',
    pattern:
      'public/games/wheel-of-family\\.webp|Wheel of Family|WheelOfFamily(?:\\.jsx)?|Roda Putar|Roda Kenangan|pemutaran kapsul kenangan|foto 2016[^,.]*|/2016/\\{nim\\}\\.webp|segmen [^,.]*',
  },
  {
    key: 'athlete',
    widthClass: 'w-24',
    pattern:
      'public/games/athletes[^,]*|public/games/magical-athlete\\.webp|src/pages/lock/magical-athlete\\.astro|/lock/magical-athlete|magical-athlete|Magical Athlete TL 2016|Magical Athlete TL16|Magical Athlete|MagicalAthleteGame(?:\\.jsx)?|athlete_rooms|athlete_players|athlete_schema\\.sql|scores_uno_athlete_schema\\.sql|athleteCharacters\\.js|skor_athlete|Pelari Tercepat|\\b5 Permainan\\b|hak Host [^,.]*',
  },
];

function isPathLocked(filePath, unlockedModes) {
  return SECRET_MODE_RULES.some((rule) => {
    if (unlockedModes[rule.key]) return false;
    return new RegExp(rule.pattern, 'i').test(filePath);
  });
}

function renderRedactedText(text, unlockedModes) {
  if (!text) return text;
  const activeRules = SECRET_MODE_RULES.filter((rule) => !unlockedModes[rule.key]);
  if (activeRules.length === 0) return text;

  const combined = new RegExp(
    activeRules.map((rule) => `(${rule.pattern})`).join('|'),
    'gi'
  );

  const parts = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={`t-${keyCounter++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }

    const matchedRuleIndex = activeRules.findIndex((_, idx) => match[idx + 1] !== undefined);
    const widthClass = activeRules[matchedRuleIndex]?.widthClass || 'w-20';
    parts.push(<RedactedText key={`r-${keyCounter++}`} revealed={false} widthClass={widthClass} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(<Fragment key={`t-${keyCounter++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}

const CATEGORIES = ['Semua', 'Fitur Baru', 'Perbaikan', 'Tampilan', 'Keamanan'];

const CATEGORY_STYLE = {
  'Fitur Baru': 'bg-green-100 text-green-900 border-green-300',
  'Perbaikan': 'bg-rose-50 text-rose-800 border-rose-300',
  'Tampilan': 'bg-amber-100 text-amber-900 border-amber-300',
  'Keamanan': 'bg-stone-200 text-stone-800 border-stone-300',
};

export default function UpdatesPage({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedDocs, setExpandedDocs] = useState(() => ({ [UPDATES_LOG[0]?.id]: true }));
  const [shareCopied, setShareCopied] = useState(false);
  const [unlockedModes, setUnlockedModes] = useState({
    monopoli: false,
    werewolf: false,
    uno: false,
    wheel: false,
    athlete: false,
    adminOnly: false,
  });

  useEffect(() => {
    let active = true;
    const isAdmin = isAdminSession();
    if (isAdmin) {
      setUnlockedModes({
        monopoli: true,
        werewolf: true,
        uno: true,
        wheel: true,
        athlete: true,
        adminOnly: true,
      });
      return () => {
        active = false;
      };
    }

    const fetchUnlockDates = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date, wheel_unlock_date, patch_notes')
          .eq('id', 1)
          .single();

        if (error || !data || !active) return;
        const now = Date.now();
        const comingSoonCfg = extractComingSoonConfig(data);
        const overrides = comingSoonCfg.overrides || {};
        setUnlockedModes({
          monopoli: resolveGameStage(data.monopoli_unlock_date, overrides.monopoli, now) === 'open',
          werewolf: resolveGameStage(data.werewolf_unlock_date, overrides.werewolf, now) === 'open',
          uno: resolveGameStage(data.uno_unlock_date, overrides.uno, now) === 'open',
          wheel: Boolean(data.wheel_unlock_date && now >= new Date(data.wheel_unlock_date).getTime()),
          athlete: resolveGameStage(comingSoonCfg.athlete_unlock_date, overrides.athlete, now) === 'open',
          adminOnly: false,
        });
      } catch {
        // Fallback aman: seluruh mode terjadwal tetap disensor
      }
    };
    fetchUnlockDates();
    return () => {
      active = false;
    };
  }, []);

  const visibleUpdates = UPDATES_LOG.filter(
    (item) => !item.requiresMode || Boolean(unlockedModes[item.requiresMode])
  );

  const filteredUpdates =
    selectedCategory === 'Semua'
      ? visibleUpdates
      : visibleUpdates.filter((item) => item.category === selectedCategory);

  const toggleDoc = (id) => {
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareUpdates = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/updates`;
    const shareData = {
      title: 'Catatan Update & Dokumentasi - 1 Dekade TL 2016',
      text: 'Lihat riwayat pembaruan dan fitur terbaru Portal 1 Dekade Teknik Lingkungan 2016.',
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    const copied = await copyTextToClipboard(shareUrl);
    if (copied) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF6EE] text-stone-900 p-4 sm:p-6 md:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] font-sans">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Navigasi halaman update" className="mb-6 pb-4 border-b border-[#DED6C6] flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
            >
              &larr; Kembali ke Beranda Perayaan
            </button>
          ) : (
            <a
              href="/"
              onClick={() => {
                const nim = localStorage.getItem('user_nim');
                if (nim) localStorage.removeItem(`active_view_${nim}`);
              }}
              className="inline-flex items-center min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
            >
              &larr; Kembali ke Beranda Perayaan
            </a>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShareUpdates}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm transition-colors"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{shareCopied ? 'Tautan Disalin!' : 'Bagikan Halaman'}</span>
            </button>
            <span className="font-mono text-xs font-bold text-stone-600 bg-[#F3EDE0] px-3 py-2 rounded-lg border border-[#DED6C6]">
              Total Pembaruan: {visibleUpdates.length}
            </span>
          </div>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/Asset 2.webp"
              alt="Happy Anniversary TL 2016"
              width="120"
              height="47"
              className="w-28 h-auto hidden sm:block"
            />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-stone-900">
                Catatan Update &amp; Dokumentasi
              </h1>
              <p className="text-stone-600 text-sm md:text-base mt-1">
                Semua fitur baru, perbaikan, dan pembaruan tampilan di Portal 1 Dekade TL 2016.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter kategori pembaruan">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
                  isActive
                    ? 'bg-green-900 text-white border-green-900'
                    : 'bg-white text-stone-700 border-[#DED6C6] hover:bg-[#F3EDE0]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <main className="space-y-6 pb-16">
          {filteredUpdates.map((item) => {
            const isExpanded = Boolean(expandedDocs[item.id]);
            const badgeClass = CATEGORY_STYLE[item.category] || 'bg-stone-100 text-stone-800 border-stone-300';

            return (
              <article
                key={item.id}
                className="bg-white border border-[#DED6C6] rounded-2xl p-6 md:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#FAF6EE] border border-[#DED6C6] text-stone-900 px-2.5 py-1 rounded-md">
                      {item.version}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${badgeClass}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-500">
                    {item.date} {item.commit && item.commit !== 'latest' ? `• ${item.commit}` : ''}
                  </div>
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-2">
                  {renderRedactedText(item.title, unlockedModes)}
                </h2>
                <p className="text-stone-700 text-sm md:text-base leading-relaxed mb-4">
                  {renderRedactedText(item.summary, unlockedModes)}
                </p>

                <ul className="list-disc list-inside space-y-1.5 text-sm text-stone-700 mb-5">
                  {item.changes.map((chg, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {renderRedactedText(chg, unlockedModes)}
                    </li>
                  ))}
                </ul>

                <div className="border-t border-[#EDE6D8] pt-4">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleDoc(item.id)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EDE0] border border-[#DED6C6] text-xs font-bold text-stone-800 transition-colors"
                  >
                    {isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Lengkap'}
                  </button>

                  {isExpanded && item.docs && (
                    <div className="mt-4 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-stone-900 mb-1">Penjelasan Tambahan:</p>
                        <p className="text-stone-700 leading-relaxed">
                          {renderRedactedText(item.docs.notes, unlockedModes)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 mb-1.5">Bagian yang Diperbarui:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.docs.files.map((filePath, fIdx) =>
                            isPathLocked(filePath, unlockedModes) ? (
                              <code
                                key={`locked-${fIdx}`}
                                className="font-mono bg-white border border-[#DED6C6] px-2 py-0.5 rounded-md inline-flex items-center"
                              >
                                <RedactedText
                                  revealed={false}
                                  widthClass="w-28"
                                  srLabel="nama file dirahasiakan"
                                />
                              </code>
                            ) : (
                              <code
                                key={filePath}
                                className="font-mono bg-white border border-[#DED6C6] text-green-900 px-2 py-0.5 rounded-md"
                              >
                                {filePath}
                              </code>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </main>
      </div>
    </div>
  );
}
