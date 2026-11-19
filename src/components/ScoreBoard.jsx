import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isAdminSession } from '../lib/adminAuth';
import PlayerAvatar from './PlayerAvatar';
import RedactedText from './RedactedText';
import { getLocalAvatarConfig } from '../lib/avatarHelper';

const IconCrown = ({ className = 'w-5 h-5' }) => (
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
    <path d="M3 18h18" />
    <path d="M5 15l-2-8 5 4 4-6 4 6 5-4-2 8H5z" />
  </svg>
);

const IconSearch = ({ className = 'w-4 h-4' }) => (
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
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconArrowDown = ({ className = 'w-4 h-4' }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const IconRefresh = ({ className = 'w-4 h-4' }) => (
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
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

function getTotalScore(person, isMonopoliUnlocked, isWerewolfUnlocked) {
  return (
    (person.skor_peta || 0) +
    (person.skor_muka || 0) +
    (isMonopoliUnlocked ? (person.skor_monopoli || 0) : 0) +
    (isWerewolfUnlocked ? (person.skor_werewolf || 0) : 0)
  );
}

function getCategoryScore(person, sortKey, isMonopoliUnlocked, isWerewolfUnlocked) {
  if (sortKey === 'peta') return person.skor_peta || 0;
  if (sortKey === 'muka') return person.skor_muka || 0;
  if (sortKey === 'monopoli') return isMonopoliUnlocked ? (person.skor_monopoli || 0) : 0;
  if (sortKey === 'werewolf') return isWerewolfUnlocked ? (person.skor_werewolf || 0) : 0;
  return getTotalScore(person, isMonopoliUnlocked, isWerewolfUnlocked);
}

export default function ScoreBoard({ currentNim = '', currentAvatarConfig = null }) {
  const [alumni, setAlumni] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [sortBy, setSortBy] = useState('total');
  const [searchQuery, setSearchQuery] = useState('');

  const myRowRef = useRef(null);

  const loadAllData = useCallback(async (checkAdmin) => {
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('app_settings')
        .select('show_scoreboard, monopoli_unlock_date, werewolf_unlock_date')
        .eq('id', 1)
        .single();

      if (settingsError) throw settingsError;

      let monopoliBuka = false;
      let werewolfBuka = false;

      if (settings) {
        setIsRevealed(Boolean(settings.show_scoreboard));
        const now = Date.now();

        if (checkAdmin) {
          monopoliBuka = true;
          werewolfBuka = true;
        } else {
          if (settings.monopoli_unlock_date) {
            monopoliBuka = now >= new Date(settings.monopoli_unlock_date).getTime();
          }
          if (settings.werewolf_unlock_date) {
            werewolfBuka = now >= new Date(settings.werewolf_unlock_date).getTime();
          }
        }
        setIsMonopoliUnlocked(monopoliBuka);
        setIsWerewolfUnlocked(werewolfBuka);
      }

      let alumniRes = await supabase
        .from('alumni')
        .select('nim, nama, skor_peta, skor_muka, skor_monopoli, skor_werewolf, avatar_config');
      if (alumniRes.error) {
        alumniRes = await supabase
          .from('alumni')
          .select('nim, nama, skor_peta, skor_muka, skor_monopoli, skor_werewolf');
      }
      if (alumniRes.error) throw alumniRes.error;

      if (alumniRes.data) {
        setAlumni(alumniRes.data);
      }
      setErrorMsg('');
    } catch (error) {
      console.error('Gagal menarik data klasemen:', error.message);
      setErrorMsg('Gagal memuat papan klasemen. Periksa koneksi internetmu lalu muat ulang.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = isAdminSession();
    setIsAdmin(checkAdmin);
    loadAllData(checkAdmin);

    const intervalId = setInterval(() => loadAllData(checkAdmin), 10000);
    return () => clearInterval(intervalId);
  }, [loadAllData]);

  const shouldReveal = isAdmin || isRevealed;

  const categories = useMemo(() => {
    const list = [
      { id: 'total', label: 'Total Skor' },
      { id: 'peta', label: 'Peta' },
      { id: 'muka', label: 'Foto' }
    ];
    if (isMonopoliUnlocked) {
      list.push({ id: 'monopoli', label: 'Monopoli' });
    }
    if (isWerewolfUnlocked) {
      list.push({ id: 'werewolf', label: 'Dosen Killer' });
    }
    return list;
  }, [isMonopoliUnlocked, isWerewolfUnlocked]);

  useEffect(() => {
    if (!categories.some((item) => item.id === sortBy)) {
      setSortBy('total');
    }
  }, [categories, sortBy]);

  const rankedAlumni = useMemo(() => {
    return [...alumni]
      .map((person) => ({
        ...person,
        _total: getTotalScore(person, isMonopoliUnlocked, isWerewolfUnlocked),
        _activeScore: getCategoryScore(person, sortBy, isMonopoliUnlocked, isWerewolfUnlocked)
      }))
      .sort((a, b) => {
        if (b._activeScore !== a._activeScore) return b._activeScore - a._activeScore;
        if (b._total !== a._total) return b._total - a._total;
        return a.nim.localeCompare(b.nim);
      })
      .map((person, index) => ({
        ...person,
        _rank: index + 1
      }));
  }, [alumni, isMonopoliUnlocked, isWerewolfUnlocked, sortBy]);

  const leaderScore = useMemo(() => {
    if (rankedAlumni.length === 0) return 0;
    return Math.max(rankedAlumni[0]._activeScore, 1);
  }, [rankedAlumni]);

  const activeCategoryLabel = useMemo(() => {
    return categories.find((c) => c.id === sortBy)?.label || 'Total Skor';
  }, [categories, sortBy]);

  const normalizedQuery = shouldReveal ? searchQuery.trim().toLowerCase() : '';
  const isFiltering = normalizedQuery.length > 0;

  const filteredAlumni = useMemo(() => {
    if (!isFiltering) return rankedAlumni;
    return rankedAlumni.filter(
      (person) =>
        (person.nama || '').toLowerCase().includes(normalizedQuery) ||
        (person.nim || '').toLowerCase().includes(normalizedQuery)
    );
  }, [rankedAlumni, isFiltering, normalizedQuery]);

  const topThree = useMemo(() => {
    if (isFiltering || rankedAlumni.length === 0) return [];
    return rankedAlumni.slice(0, 3);
  }, [rankedAlumni, isFiltering]);

  const listRows = useMemo(() => {
    if (isFiltering) return filteredAlumni;
    return rankedAlumni.slice(3);
  }, [isFiltering, filteredAlumni, rankedAlumni]);

  const currentUserEntry = useMemo(() => {
    if (!currentNim) return null;
    return rankedAlumni.find((person) => person.nim === currentNim) || null;
  }, [rankedAlumni, currentNim]);

  const activeScorerCount = useMemo(() => {
    return rankedAlumni.filter((person) => person._activeScore > 0).length;
  }, [rankedAlumni]);

  const resolveAvatar = (person) => {
    if (person.nim === currentNim && currentAvatarConfig) return currentAvatarConfig;
    return person.avatar_config || (person.nim === currentNim ? getLocalAvatarConfig(person.nim) : null);
  };

  const handleJumpToMe = () => {
    if (!myRowRef.current) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    myRowRef.current.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center'
    });
  };

  const getPodiumGridPlacement = (rank, count) => {
    if (count === 3) {
      if (rank === 1) return 'md:col-start-2 md:row-start-1';
      if (rank === 2) return 'md:col-start-1 md:row-start-1';
      return 'md:col-start-3 md:row-start-1';
    }
    if (count === 2) {
      return rank === 1 ? 'md:col-start-2 md:row-start-1' : 'md:col-start-1 md:row-start-1';
    }
    return 'md:col-span-3 md:max-w-sm md:mx-auto md:w-full';
  };

  const getPodiumTone = (rank) => {
    if (rank === 1) {
      return {
        card: 'bg-[#FEF7E6] border-[#D97706] md:min-h-[380px] md:py-7 shadow-[0_8px_22px_-12px_rgba(180,83,9,0.28)]',
        rankBadge: 'bg-[#B45309] text-white',
        scoreText: 'text-[#14532D] text-3xl sm:text-4xl',
        avatarSize: 'w-20 h-20 sm:w-24 sm:h-24 border-2 border-[#D97706]',
        label: 'Peringkat #1'
      };
    }
    if (rank === 2) {
      return {
        card: 'bg-[#F6F4EE] border-[#C7BDA8] md:min-h-[344px]',
        rankBadge: 'bg-zinc-700 text-white',
        scoreText: 'text-zinc-900 text-2xl sm:text-3xl',
        avatarSize: 'w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#C7BDA8]',
        label: 'Peringkat #2'
      };
    }
    return {
      card: 'bg-[#FAF3EC] border-[#D8C5B4] md:min-h-[318px]',
      rankBadge: 'bg-[#9A3412] text-white',
      scoreText: 'text-zinc-900 text-2xl sm:text-3xl',
      avatarSize: 'w-14 h-14 sm:w-16 sm:h-16 border-2 border-[#D8C5B4]',
      label: 'Peringkat #3'
    };
  };

  const renderScoreBreakdown = (person, centered = false) => {
    const items = [
      { key: 'peta', label: 'Peta', value: person.skor_peta || 0 },
      { key: 'muka', label: 'Foto', value: person.skor_muka || 0 }
    ];
    if (isMonopoliUnlocked) {
      items.push({ key: 'monopoli', label: 'Monopoli', value: person.skor_monopoli || 0 });
    }
    if (isWerewolfUnlocked) {
      items.push({ key: 'werewolf', label: 'Dosen Killer', value: person.skor_werewolf || 0 });
    }

    return (
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 ${centered ? 'justify-center' : ''}`}>
        {items.map((item) => {
          const isSorted = sortBy === item.key;
          return (
            <span key={item.key} className={isSorted ? 'text-zinc-900 font-semibold' : ''}>
              {item.label}{' '}
              <strong
                className={`font-mono ${
                  isSorted ? 'text-[#B45309]' : 'text-zinc-800'
                }`}
              >
                {item.value}
              </strong>
            </span>
          );
        })}
      </div>
    );
  };

  const renderParticipantIdentity = (person, isMe, compact = false) => {
    const displayNim = shouldReveal ? person.nim : `${person.nim.substring(0, 5)}****`;
    const revealedName = person.nama;

    return (
      <div className={`min-w-0 ${compact ? 'w-full' : ''}`}>
        <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'justify-center min-h-[2.75rem]' : ''}`}>
          {shouldReveal ? (
            <span className="font-bold text-zinc-900 text-sm sm:text-base leading-snug break-words">
              {revealedName}
            </span>
          ) : (
            <RedactedText
              revealed={false}
              widthClass={compact ? 'w-28 sm:w-32' : 'w-32 sm:w-44'}
              srLabel="Nama peserta dirahasiakan"
            />
          )}
          {isMe && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC] shrink-0">
              Kamu
            </span>
          )}
        </div>
        <div className="text-xs font-mono text-zinc-600 mt-0.5">
          NIM {displayNim}
        </div>
      </div>
    );
  };

  return (
    <section
      aria-labelledby="scoreboard-heading"
      className="bg-[#FFFDF9] rounded-2xl p-5 sm:p-6 md:p-8 border border-[#DED8CA]"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#E5DFD2]">
        <div className="min-w-0">
          <h2 id="scoreboard-heading" className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Klasemen Sedulur 16
          </h2>
          <p className="text-zinc-600 mt-1 text-sm max-w-2xl">
            {isAdmin
              ? 'Mode Panitia: seluruh nama alumni ditampilkan untuk pemantauan skor.'
              : isRevealed
                ? 'Klasemen akhir telah dibuka! Selamat kepada para peraih skor tertinggi perayaan 1 Dekade TL 2016.'
                : 'Nama peserta disensor rapat sampai puncak perayaan dibuka oleh panitia.'}
          </p>
        </div>

        {!isLoading && !errorMsg && rankedAlumni.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F1ECE0] border border-[#DED8CA] text-xs font-medium text-zinc-700">
              Aktif bermain:{' '}
              <strong className="font-mono text-zinc-900 ml-1">
                {activeScorerCount}/{rankedAlumni.length}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                loadAllData(isAdmin);
              }}
              aria-label="Muat ulang papan klasemen"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F6F1] hover:bg-[#F1ECE0] border border-[#DED8CA] text-xs font-bold text-zinc-800 transition-colors"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          aria-live="polite"
          aria-busy="true"
          className="mt-6 space-y-5"
        >
          <p className="text-xs font-medium text-zinc-600">Memuat data klasemen angkatan...</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((slot) => (
              <div
                key={slot}
                className="h-44 rounded-xl bg-[#F1ECE0]/70 border border-[#DED8CA] animate-pulse"
              />
            ))}
          </div>
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-16 rounded-xl bg-[#F8F6F1] border border-[#DED8CA] animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="mt-6 py-10 px-4 text-center bg-rose-50 border border-rose-200 rounded-xl space-y-4"
        >
          <p className="text-rose-800 text-sm font-medium">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadAllData(isAdmin);
            }}
            className="min-h-[44px] px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] text-white font-bold rounded-xl text-sm transition-colors"
          >
            Muat Ulang Klasemen
          </button>
        </div>
      ) : alumni.length === 0 ? (
        <div className="mt-6 py-10 px-4 text-center text-zinc-600 text-sm bg-[#F8F6F1] rounded-xl border border-[#DED8CA]">
          Belum ada skor permainan yang tercatat. Mainkan salah satu kuis di atas untuk mulai mengumpulkan poin!
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Ringkasan posisi pengguna & kontrol filter kategori / pencarian */}
          <div className="flex flex-col gap-4">
            {currentUserEntry && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F1ECE0] border border-[#DED8CA]">
                <div className="flex items-center gap-3 min-w-0">
                  <PlayerAvatar
                    config={resolveAvatar(currentUserEntry)}
                    seed={currentUserEntry.nim}
                    className="w-10 h-10 border border-[#C7BDA8]"
                    alt={`Karakter ${currentUserEntry.nama}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-600">
                      Posisimu di kategori <strong className="text-zinc-900">{activeCategoryLabel}</strong>
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-display font-bold text-lg text-[#14532D] font-mono">
                        #{currentUserEntry._rank}
                      </span>
                      <span className="text-xs text-zinc-600">
                        dari {rankedAlumni.length} peserta
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-900">
                        {currentUserEntry._activeScore} poin
                      </span>
                    </div>
                  </div>
                </div>

                {!isFiltering && currentUserEntry._rank > 3 && (
                  <button
                    type="button"
                    onClick={handleJumpToMe}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFDF9] hover:bg-white border border-[#CEC6B6] text-xs font-bold text-zinc-900 transition-colors shrink-0"
                  >
                    <span>Lihat Barisku</span>
                    <IconArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Urutkan klasemen berdasarkan permainan"
                className="flex flex-wrap items-center gap-2"
              >
                {categories.map((cat) => {
                  const active = sortBy === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSortBy(cat.id)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${
                        active
                          ? 'bg-[#14532D] text-white border-[#14532D]'
                          : 'bg-[#F8F6F1] text-zinc-800 border-[#DED8CA] hover:bg-[#F1ECE0]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {shouldReveal && (
                <div className="flex items-center gap-2 w-full lg:w-80 shrink-0">
                  <div className="relative flex-1 min-w-0">
                    <label htmlFor="scoreboard-search" className="sr-only">
                      Cari nama atau NIM peserta
                    </label>
                    <IconSearch className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="scoreboard-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama atau NIM..."
                      className="w-full min-h-[44px] pl-10 pr-3 py-2 rounded-xl bg-[#F8F6F1] border border-[#DED8CA] text-sm text-zinc-900 placeholder:text-zinc-500 focus:bg-[#FFFDF9] focus:border-[#14532D]"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#F1ECE0] hover:bg-[#E5DFD2] border border-[#DED8CA] text-xs font-bold text-zinc-800 transition-colors shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Podium 3 Besar (DOM & mobile berurutan 1-2-3, desktop tangga 2-1-3) */}
          {topThree.length > 0 && (
            <div aria-label="Tiga peringkat teratas" className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {topThree.map((person) => {
                  const tone = getPodiumTone(person._rank);
                  const isMe = person.nim === currentNim;
                  const placementClass = getPodiumGridPlacement(person._rank, topThree.length);

                  return (
                    <article
                      key={person.nim}
                      className={`${placementClass} rounded-2xl border p-5 flex flex-col justify-between items-center text-center gap-3 transition-transform duration-200 ${tone.card} ${
                        isMe ? 'ring-2 ring-[#14532D] ring-offset-2 ring-offset-[#FFFDF9]' : ''
                      }`}
                    >
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${tone.rankBadge}`}>
                          {person._rank === 1 && <IconCrown className="w-3.5 h-3.5" />}
                          <span>#{person._rank}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-600">
                          {tone.label}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-3 w-full">
                        <PlayerAvatar
                          config={resolveAvatar(person)}
                          seed={person.nim}
                          className={tone.avatarSize}
                          alt={shouldReveal ? person.nama : 'Peserta dirahasiakan'}
                        />

                        {renderParticipantIdentity(person, isMe, true)}
                      </div>

                      <div className="w-full pt-3 mt-1 border-t border-[#DED8CA]/80 flex flex-col items-center gap-1.5">
                        <div className={`font-mono font-bold leading-none ${tone.scoreText}`}>
                          {person._activeScore}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-600">
                          {sortBy === 'total' ? 'Total Poin' : `Poin ${activeCategoryLabel}`}
                        </div>
                        <div className="pt-1 w-full">
                          {renderScoreBreakdown(person, true)}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daftar peringkat lanjutan atau hasil pencarian */}
          {filteredAlumni.length === 0 ? (
            <div className="py-10 px-4 text-center bg-[#F8F6F1] rounded-xl border border-[#DED8CA] space-y-3">
              <p className="text-zinc-700 text-sm font-medium">
                Tidak ada peserta yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold transition-colors"
              >
                Tampilkan Semua Peserta
              </button>
            </div>
          ) : listRows.length > 0 && (
            <div className="rounded-xl border border-[#DED8CA] bg-[#FFFDF9] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#F1ECE0] border-b border-[#DED8CA] text-xs font-bold text-zinc-800">
                <span>
                  {isFiltering
                    ? `Hasil Pencarian (${listRows.length} peserta)`
                    : `Peringkat #4 hingga #${rankedAlumni.length}`}
                </span>
                <span className="font-mono">{activeCategoryLabel}</span>
              </div>

              <div className="max-h-[58dvh] sm:max-h-[440px] overflow-y-auto divide-y divide-[#E5DFD2]">
                {listRows.map((person) => {
                  const isMe = person.nim === currentNim;
                  const ratioPct =
                    person._activeScore > 0
                      ? Math.max(4, Math.min(100, Math.round((person._activeScore / leaderScore) * 100)))
                      : 0;

                  return (
                    <div
                      key={person.nim}
                      ref={isMe ? myRowRef : null}
                      className={`px-4 py-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isMe ? 'bg-[#14532D]/[0.06]' : 'hover:bg-[#F8F6F1]'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono font-bold text-sm sm:text-base text-amber-800 w-9 shrink-0 pt-2 sm:pt-0">
                          #{person._rank}
                        </span>

                        <PlayerAvatar
                          config={resolveAvatar(person)}
                          seed={person.nim}
                          className="w-10 h-10 border border-[#DED8CA] shrink-0"
                          alt={shouldReveal ? person.nama : 'Peserta dirahasiakan'}
                        />

                        <div className="min-w-0 flex-1 space-y-1.5">
                          {renderParticipantIdentity(person, isMe, false)}
                          {renderScoreBreakdown(person)}

                          <div
                            aria-hidden="true"
                            className="w-full max-w-md h-1.5 rounded-full bg-[#EFEAE0] overflow-hidden"
                          >
                            <div
                              className={`h-full rounded-full transition-[width] duration-300 ${
                                sortBy === 'monopoli' || sortBy === 'werewolf'
                                  ? 'bg-[#B45309]'
                                  : 'bg-[#14532D]'
                              }`}
                              style={{ width: `${ratioPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between pl-12 sm:pl-0 shrink-0">
                        <span className="text-[11px] font-medium text-zinc-600 sm:hidden">
                          {activeCategoryLabel}
                        </span>
                        <div className="text-right">
                          <div className="font-mono font-bold text-lg sm:text-xl text-[#14532D]">
                            {person._activeScore}
                          </div>
                          {sortBy !== 'total' && (
                            <div className="text-[11px] font-mono text-zinc-600">
                              Total {person._total}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
