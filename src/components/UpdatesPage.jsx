import React, { useState, useEffect, Fragment } from 'react';
import { UPDATES_LOG } from '../data/updatesLog';
import { supabase } from '../lib/supabaseClient';
import { isAdminSession } from '../lib/adminAuth';
import RedactedText from './RedactedText';

const SECRET_MODE_RULES = [
  {
    key: 'monopoli',
    widthClass: 'w-20',
    pattern:
      'bidak Monopoli(?: TL16)?|papan Monopoli(?: TL16)?|Monopoli TL16|MonopoliBoard(?:\\.jsx)?|MonopoliDice|monopoli_room_\\{nim\\}|monopoli_rooms|monopoli_players|monopoli_properties|monopoli_users|skor_monopoli|\\bMonopoli\\b|Daftar Petak(?: Papan)?|Detail Petak|kotak angka dadu|2 Dadu Bergoyang|kocokan dadu|petak tujuan|TELEPORT/MUNDUR|bonus START|properti kontrakan|Truth or Dare|uang sewa',
  },
  {
    key: 'werewolf',
    widthClass: 'w-24',
    pattern:
      'Sidang Dosen Killer|Dosen Killer|DosenKillerGame(?:\\.jsx)?|DosenKiller|LayarDiskusi(?:\\.jsx)?|LayarMalam(?:\\.jsx)?|LayarVoting(?:\\.jsx)?|LayarEksekusi(?:\\.jsx)?|dk_room_\\{nim\\}|skor_werewolf|\\bwerewolf\\b|kebocoran chat|petunjuk Intel|catatan Intel|kekebalan Uptodate',
  },
  {
    key: 'uno',
    widthClass: 'w-20',
    pattern:
      'UNO Sedulur 16|UNO Seru TL16|UnoBrutalGame(?:\\.jsx)?|uno_room_\\{nim\\}|uno_rooms|uno_players|\\bUNO\\b|top_card|current_turn|tumpuk kartu|meja kartu|kartu Skip dan \\+2',
  },
  {
    key: 'wheel',
    widthClass: 'w-24',
    pattern: 'Wheel of Family|WheelOfFamily(?:\\.jsx)?|Roda Putar|Roda Kenangan|pemutaran kapsul kenangan',
  },
  {
    key: 'athlete',
    widthClass: 'w-24',
    pattern: 'Magical Athlete|MagicalAthleteGame(?:\\.jsx)?',
  },
];

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

const CATEGORIES = ['Semua', 'Fitur Baru', 'Perbaikan Bug', 'Desain & UI', 'Keamanan & Akses'];

const CATEGORY_STYLE = {
  'Fitur Baru': 'bg-green-100 text-green-900 border-green-300',
  'Perbaikan Bug': 'bg-rose-50 text-rose-800 border-rose-300',
  'Desain & UI': 'bg-amber-100 text-amber-900 border-amber-300',
  'Keamanan & Akses': 'bg-stone-200 text-stone-800 border-stone-300',
};

export default function UpdatesPage({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedDocs, setExpandedDocs] = useState(() => ({ [UPDATES_LOG[0]?.id]: true }));
  const [unlockedModes, setUnlockedModes] = useState({
    monopoli: false,
    werewolf: false,
    uno: false,
    wheel: false,
    athlete: false,
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
      });
      return () => {
        active = false;
      };
    }

    const fetchUnlockDates = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date, wheel_unlock_date')
          .eq('id', 1)
          .single();

        if (error || !data || !active) return;
        const now = Date.now();
        setUnlockedModes({
          monopoli: Boolean(data.monopoli_unlock_date && now >= new Date(data.monopoli_unlock_date).getTime()),
          werewolf: Boolean(data.werewolf_unlock_date && now >= new Date(data.werewolf_unlock_date).getTime()),
          uno: Boolean(data.uno_unlock_date && now >= new Date(data.uno_unlock_date).getTime()),
          wheel: Boolean(data.wheel_unlock_date && now >= new Date(data.wheel_unlock_date).getTime()),
          athlete: false,
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

  const filteredUpdates =
    selectedCategory === 'Semua'
      ? UPDATES_LOG
      : UPDATES_LOG.filter((item) => item.category === selectedCategory);

  const toggleDoc = (id) => {
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-stone-900 p-4 md:p-8 font-sans">
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
              className="inline-flex items-center min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#DED6C6] text-green-900 hover:bg-[#F3EDE0] font-bold text-sm transition-colors"
            >
              &larr; Kembali ke Beranda Perayaan
            </a>
          )}
          <span className="font-mono text-xs font-bold text-stone-600 bg-[#F3EDE0] px-3 py-1.5 rounded-lg border border-[#DED6C6]">
            Total Pembaruan: {UPDATES_LOG.length}
          </span>
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
                Riwayat setiap pembaruan fitur, perbaikan bug, dan dokumentasi teknis Portal 1 Dekade TL 2016.
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
                    {isExpanded ? 'Sembunyikan Dokumentasi Teknis' : 'Lihat Dokumentasi Teknis'}
                  </button>

                  {isExpanded && item.docs && (
                    <div className="mt-4 bg-[#FAF6EE] border border-[#DED6C6] rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-stone-900 mb-1">Catatan Implementasi:</p>
                        <p className="text-stone-700 leading-relaxed">
                          {renderRedactedText(item.docs.notes, unlockedModes)}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 mb-1.5">File Terkait:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.docs.files.map((filePath) => (
                            <code
                              key={filePath}
                              className="font-mono bg-white border border-[#DED6C6] text-green-900 px-2 py-0.5 rounded-md"
                            >
                              {renderRedactedText(filePath, unlockedModes)}
                            </code>
                          ))}
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
