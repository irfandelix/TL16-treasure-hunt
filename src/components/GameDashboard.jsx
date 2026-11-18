import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import RoadmapModal from './RoadmapModal';
import PlayerAvatar from './PlayerAvatar';
import AvatarDesigner from './AvatarDesigner';
import {
  getLocalAvatarConfig,
  loadPlayerAvatar,
  savePlayerAvatar,
  generateSeedAvatarConfig
} from '../lib/avatarHelper';

const TreasureHunt = lazy(() => import('./TreasureHunt'));
const FaceGame = lazy(() => import('./FaceGame'));
const ScoreBoard = lazy(() => import('./ScoreBoard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const FormKapsulWaktu = lazy(() => import('./FormKapsulWaktu'));
const WheelOfFamily = lazy(() => import('./WheelOfFamily'));
const MonopoliBoard = lazy(() => import('./MonopoliBoard'));
const DosenKillerGame = lazy(() => import('./DosenKillerGame'));
const UnoBrutalGame = lazy(() => import('./UnoBrutalGame'));
const UpdatesPage = lazy(() => import('./UpdatesPage'));

const LoadingScreen = ({ label = 'Memuat halaman permainan...' }) => (
  <div className="min-h-[60vh] bg-[#F4F6F9] flex flex-col justify-center items-center gap-3 text-slate-700 p-6">
    <span
      aria-hidden="true"
      className="w-9 h-9 border-3 border-slate-200 border-t-emerald-700 rounded-full animate-spin"
    />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

const IconMap = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-emerald-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconUsers = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-sky-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBoard = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-amber-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

const IconClass = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-rose-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconCards = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-violet-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="12" height="16" rx="2" />
    <path d="M9 2h10a2 2 0 0 1 2 2v14" />
  </svg>
);

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAnniversary, setShowAnniversary] = useState(false);

  const [avatarConfig, setAvatarConfig] = useState(null);
  const [showAvatarDesigner, setShowAvatarDesigner] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const [targetDate, setTargetDate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [wheelUnlocked, setWheelUnlocked] = useState(false);

  const [isMonopoliUnlocked, setIsMonopoliUnlocked] = useState(false);
  const [isWerewolfUnlocked, setIsWerewolfUnlocked] = useState(false);
  const [isUnoUnlocked, setIsUnoUnlocked] = useState(false);

  const [monopoliApproaching, setMonopoliApproaching] = useState(false);
  const [werewolfApproaching, setWerewolfApproaching] = useState(false);
  const [unoApproaching, setUnoApproaching] = useState(false);
  const [gameDates, setGameDates] = useState(null);

  useEffect(() => {
    const savedNim = localStorage.getItem('user_nim');
    const savedNama = localStorage.getItem('user_nama');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (savedNim) {
      setUser({ nim: savedNim, nama: savedNama, is_admin: isAdmin });
      setAvatarConfig(getLocalAvatarConfig(savedNim) || generateSeedAvatarConfig(savedNim));

      const savedView = localStorage.getItem(`active_view_${savedNim}`);
      const allowedViews = ['dashboard', 'map', 'face', 'kapsul', 'wheel', 'monopoli', 'dosenkiller', 'unobrutal', 'updates', 'admin'];
      let resolvedView = 'dashboard';
      if (savedView && allowedViews.includes(savedView) && (savedView !== 'admin' || isAdmin)) {
        resolvedView = savedView;
        setActiveView(savedView);
      }

      if (resolvedView === 'dashboard' && !sessionStorage.getItem(`avatar_confirmed_${savedNim}`)) {
        setShowAvatarDesigner(true);
        setIsEditingAvatar(false);
      }
    }
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (!user?.nim) return;
    let active = true;
    loadPlayerAvatar(user.nim).then((loaded) => {
      if (active && loaded) {
        setAvatarConfig(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [user?.nim]);

  useEffect(() => {
    if (!user?.nim) return;
    if (activeView === 'dashboard') {
      localStorage.removeItem(`active_view_${user.nim}`);
    } else {
      localStorage.setItem(`active_view_${user.nim}`, activeView);
    }
  }, [activeView, user?.nim]);

  const handleLoginSuccess = (loggedInUser) => {
    const localOrSeed =
      loggedInUser.avatar_config ||
      getLocalAvatarConfig(loggedInUser.nim) ||
      generateSeedAvatarConfig(loggedInUser.nim);
    setAvatarConfig(localOrSeed);
    setUser(loggedInUser);
    setActiveView('dashboard');
    setIsEditingAvatar(false);
    setShowAvatarDesigner(true);
  };

  const handleSaveAvatar = async (nextConfig) => {
    if (!user?.nim) return;
    const { config: saved } = await savePlayerAvatar(user.nim, nextConfig);
    setAvatarConfig(saved);
    setShowAvatarDesigner(false);
    setIsEditingAvatar(false);
  };

  const closeAnniversary = () => {
    setShowAnniversary(false);
    if (user) localStorage.setItem(`has_seen_anniversary_${user.nim}`, 'true');
  };

  useEffect(() => {
    if (!showAnniversary) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAnniversary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnniversary, user]);

  useEffect(() => {
    if (user && user.nim !== 'guest' && !showAvatarDesigner) {
      const hasSeen = localStorage.getItem(`has_seen_anniversary_${user.nim}`);
      if (!hasSeen) {
        setShowAnniversary(true);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#34d399', '#f8fafc']
          });
        }
      }
    }
  }, [user, showAvatarDesigner]);

  useEffect(() => {
    if (!user) return;

    const updateGameStatus = (data) => {
      setTargetDate(data.wheel_unlock_date ? new Date(data.wheel_unlock_date) : null);
      if (!data.wheel_unlock_date) setWheelUnlocked(false);

      setGameDates({
        monopoli: data.monopoli_unlock_date,
        werewolf: data.werewolf_unlock_date,
        uno: data.uno_unlock_date
      });
    };

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('wheel_unlock_date, monopoli_unlock_date, werewolf_unlock_date, uno_unlock_date')
          .eq('id', 1)
          .single();

        if (error) throw error;
        if (data) {
          updateGameStatus(data);
        }
      } catch (error) {
        console.error('Gagal memeriksa jadwal:', error.message);
      }
    };

    fetchSettings();

    const subscription = supabase
      .channel('public:app_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => {
          updateGameStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setWheelUnlocked(true);
        setTimeLeft(null);
      } else {
        setWheelUnlocked(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  useEffect(() => {
    if (!user || !gameDates) return;

    const checkLocalTime = () => {
      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      if (user.is_admin) {
        setIsMonopoliUnlocked(true);
        setMonopoliApproaching(false);
      } else if (gameDates.monopoli) {
        const unlockTimeMono = new Date(gameDates.monopoli).getTime();
        setIsMonopoliUnlocked(now >= unlockTimeMono);
        setMonopoliApproaching(now < unlockTimeMono && unlockTimeMono - now <= THIRTY_DAYS_MS);
      } else {
        setIsMonopoliUnlocked(false);
        setMonopoliApproaching(false);
      }

      if (user.is_admin) {
        setIsWerewolfUnlocked(true);
        setWerewolfApproaching(false);
      } else if (gameDates.werewolf) {
        const unlockTimeWolf = new Date(gameDates.werewolf).getTime();
        setIsWerewolfUnlocked(now >= unlockTimeWolf);
        setWerewolfApproaching(now < unlockTimeWolf && unlockTimeWolf - now <= THIRTY_DAYS_MS);
      } else {
        setIsWerewolfUnlocked(false);
        setWerewolfApproaching(false);
      }

      if (user.is_admin) {
        setIsUnoUnlocked(true);
        setUnoApproaching(false);
      } else if (gameDates.uno) {
        const unlockTimeUno = new Date(gameDates.uno).getTime();
        setIsUnoUnlocked(now >= unlockTimeUno);
        setUnoApproaching(now < unlockTimeUno && unlockTimeUno - now <= THIRTY_DAYS_MS);
      } else {
        setIsUnoUnlocked(false);
        setUnoApproaching(false);
      }
    };

    checkLocalTime();
    const interval = setInterval(checkLocalTime, 1000);
    return () => clearInterval(interval);
  }, [user, gameDates]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[#F4F6F9] flex justify-center items-center text-slate-700 font-semibold">
        Memuat Portal Perayaan 1 Dekade TL 2016...
      </main>
    );
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (showAvatarDesigner) {
    return (
      <AvatarDesigner
        user={user}
        initialConfig={avatarConfig}
        isEditing={isEditingAvatar}
        onSave={handleSaveAvatar}
        onCancel={() => {
          setShowAvatarDesigner(false);
          setIsEditingAvatar(false);
        }}
      />
    );
  }

  const renderSubView = (Component, props = {}) => (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Navigasi kembali" className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-emerald-800 hover:bg-slate-50 font-bold text-sm transition-colors shadow-xs"
          >
            &larr; Kembali ke Beranda Perayaan
          </button>
          <div className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <PlayerAvatar config={avatarConfig} seed={user.nim} className="w-7 h-7" alt={user.nama} />
            <span className="text-xs font-bold text-slate-800">{user.nama}</span>
          </div>
        </nav>
        <main>
          <Suspense fallback={<LoadingScreen />}>
            <Component {...props} />
          </Suspense>
        </main>
      </div>
    </div>
  );

  if (activeView === 'map') return renderSubView(TreasureHunt);
  if (activeView === 'face') return renderSubView(FaceGame);
  if (activeView === 'kapsul') return renderSubView(FormKapsulWaktu, { userLocal: user });
  if (activeView === 'wheel') return renderSubView(WheelOfFamily);
  if (activeView === 'monopoli') return renderSubView(MonopoliBoard, { myAvatarConfig: avatarConfig });
  if (activeView === 'dosenkiller') return renderSubView(DosenKillerGame);
  if (activeView === 'unobrutal') return renderSubView(UnoBrutalGame);

  if (activeView === 'updates') {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat catatan pembaruan..." />}>
        <UpdatesPage onBack={() => setActiveView('dashboard')} />
      </Suspense>
    );
  }

  if (activeView === 'admin' && user.is_admin) {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat ruang panitia..." />}>
        <AdminDashboard onBack={() => setActiveView('dashboard')} />
      </Suspense>
    );
  }

  const hasMultiplayerSection =
    isMonopoliUnlocked ||
    monopoliApproaching ||
    isWerewolfUnlocked ||
    werewolfApproaching ||
    isUnoUnlocked ||
    unoApproaching;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 relative pb-12">
      {showAnniversary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anniv-welcome-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl">
            <h2 id="anniv-welcome-title" className="flex justify-center mb-5">
              <img
                src="/Asset 2.webp"
                alt="Happy Anniversary Teknik Lingkungan 2016"
                width="280"
                height="109"
                className="w-full max-w-[260px] h-auto"
              />
            </h2>
            <p className="text-slate-600 text-base mb-8 leading-relaxed">
              Selamat datang kembali, <strong className="text-slate-900">{user.nama}</strong>! Mari rayakan satu dekade Teknik Lingkungan 2016 dengan mengisi kapsul kenangan dan bermain bersama.
            </p>
            <button
              type="button"
              onClick={closeAnniversary}
              className="min-h-[48px] px-8 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-base"
            >
              Mulai Rayakan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* TOP BENTO BAR */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatar
              config={avatarConfig}
              seed={user.nim}
              className="w-11 h-11 border-2 border-slate-900"
              alt={`Karakter ${user.nama}`}
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                Halo, {user.nama}!
              </h1>
              <p className="text-slate-500 text-xs">
                NIM <span className="font-mono font-semibold text-emerald-700">{user.nim}</span> &middot; Reuni 1 Dekade TL 2016
              </p>
            </div>
          </div>

          <nav aria-label="Menu pengguna" className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsEditingAvatar(true);
                setShowAvatarDesigner(true);
              }}
              className="min-h-[40px] text-xs whitespace-nowrap bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-xl font-bold transition-colors"
            >
              Edit Karakter
            </button>
            <RoadmapModal />
            <button
              type="button"
              onClick={() => setActiveView('updates')}
              className="min-h-[40px] text-xs whitespace-nowrap bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold transition-colors"
            >
              Catatan Update
            </button>
            {user.is_admin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="min-h-[40px] text-xs whitespace-nowrap bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl font-bold transition-colors"
              >
                Ruang Panitia
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] text-xs whitespace-nowrap bg-white px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 font-semibold transition-colors ml-auto lg:ml-0"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <main className="space-y-10">
          {/* BAGIAN 1: BENTO HERO & PROFIL KARAKTER / WHEEL OF FAMILY */}
          <section aria-labelledby="highlight-heading" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Hero Flagship Card */}
              <article className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22)]">
                <div className="space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    2016 - 2026 &bull; Wajib Diisi Semua Alumni
                  </div>
                  <h2 id="highlight-heading" className="text-2xl sm:text-3xl font-bold leading-tight">
                    Kapsul Waktu 2016 ke 2026
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    Unggah satu foto terbaikmu di tahun 2026 beserta pesan hangat atau cerita lucu masa kuliah untuk diputar bersama di acara puncak Wheel of Family.
                  </p>
                </div>

                <div className="pt-6 flex flex-wrap items-center gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => setActiveView('kapsul')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold text-slate-950 text-sm sm:text-base transition-colors"
                  >
                    Isi Kapsul Waktu Sekarang
                  </button>
                </div>
              </article>

              {/* Profil Karakter + Agenda Wheel of Family */}
              <article className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] flex flex-col justify-between gap-5">
                {/* Player Profile Summary */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar
                      config={avatarConfig}
                      seed={user.nim}
                      className="w-14 h-14 border-2 border-slate-900"
                      alt={`Karakter ${user.nama}`}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Karakter Aktif
                      </span>
                      <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {user.nama}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAvatar(true);
                      setShowAvatarDesigner(true);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0"
                  >
                    Ubah
                  </button>
                </div>

                {/* Wheel of Family Card Body */}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  {user.is_admin ? (
                    <>
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2">
                          Akses Panitia
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Wheel of Family</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {targetDate
                            ? 'Hitung mundur untuk peserta sedang berjalan. Panitia dapat menguji roda putar kapan saja.'
                            : 'Jadwal pembukaan roda putar belum diatur di Ruang Panitia.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold text-white text-sm transition-colors"
                      >
                        Buka Roda Putar
                      </button>
                    </>
                  ) : !targetDate ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        Kejutan Puncak Wheel of Family
                      </h3>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        Jadwal pemutaran kapsul kenangan akan diumumkan oleh panitia. Pastikan kamu sudah mengisi Kapsul Waktu!
                      </p>
                    </div>
                  ) : !wheelUnlocked && timeLeft ? (
                    <div className="space-y-3">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-1.5">
                          Menuju Puncak Acara
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          Wheel of Family Segera Dibuka
                        </h3>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-200 py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-slate-900">{timeLeft.days}</span>
                          <span className="block text-[11px] text-slate-500 font-medium">Hari</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-slate-900">{timeLeft.hours}</span>
                          <span className="block text-[11px] text-slate-500 font-medium">Jam</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-slate-900">{timeLeft.minutes}</span>
                          <span className="block text-[11px] text-slate-500 font-medium">Menit</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-emerald-700">{timeLeft.seconds}</span>
                          <span className="block text-[11px] text-emerald-700 font-medium">Detik</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
                          Sudah Dibuka
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Wheel of Family</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Saatnya memutar roda kenangan dan melihat transformasi teman-teman Sedulur 16 dari 2016 ke 2026!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-sm transition-colors"
                      >
                        Buka Roda Kenangan
                      </button>
                    </>
                  )}
                </div>
              </article>
            </div>
          </section>

          {/* BAGIAN 2: PERMAINAN NOSTALGIA INDIVIDU (BENTO GRID) */}
          <section aria-labelledby="solo-games-heading" className="space-y-4">
            <div>
              <h2 id="solo-games-heading" className="text-xl sm:text-2xl font-bold text-slate-900">
                Kuis Kenangan Kampus (Main Sendiri)
              </h2>
              <p className="text-slate-600 text-sm mt-0.5">
                Kumpulkan poin untuk klasemen angkatan dengan menebak lokasi kampus dan foto masa maba.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <article className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-transform">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <IconMap />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                      20 Lokasi Memori
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Digital Treasure Hunt</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      Napak tilas titik-titik kenangan di sekitar kampus dan tempat nongkrong legendaris angkatan 2016.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('map')}
                  className="w-full min-h-[46px] bg-emerald-700 hover:bg-emerald-600 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Lokasi
                </button>
              </article>

              <article className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-transform">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center">
                      <IconUsers />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-bold">
                      20 Foto Angkatan
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Tebak Muka Blur</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      Seberapa hafal kamu dengan wajah teman seangkatan tahun 2016? Semakin cepat menebak, semakin tinggi poinnya.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('face')}
                  className="w-full min-h-[46px] bg-slate-900 hover:bg-slate-800 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Foto
                </button>
              </article>
            </div>
          </section>

          {/* BAGIAN 3: PERMAINAN BARENG SEANGKATAN (MULTIPLAYER BENTO) */}
          {hasMultiplayerSection && (
            <section aria-labelledby="party-games-heading" className="space-y-4">
              <div>
                <h2 id="party-games-heading" className="text-xl sm:text-2xl font-bold text-slate-900">
                  Arena Main Bareng (Multiplayer)
                </h2>
                <p className="text-slate-600 text-sm mt-0.5">
                  Permainan seru bersama satu tongkrongan memakai karakter yang sudah kamu desain.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {monopoliApproaching && !isMonopoliUnlocked && (
                  <article className="bg-white/75 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                          <IconBoard />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                          Segera Dibuka
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Monopoli TL16</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Permainan papan kenangan 4 tahun masa kuliah ini akan segera dibuka sesuai jadwal perayaan.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isMonopoliUnlocked && (
                  <article className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-transform">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                          <IconBoard />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                          Siap Dimainkan
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Monopoli TL16</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Kelilingi petak kampus memakai bidak karaktermu, beli properti, dan jawab tantangan Truth or Dare.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('monopoli')}
                      className="w-full min-h-[46px] bg-amber-400 hover:bg-amber-300 py-3 px-5 rounded-xl font-bold text-slate-950 text-sm transition-colors"
                    >
                      Buka Papan Monopoli
                    </button>
                  </article>
                )}

                {werewolfApproaching && !isWerewolfUnlocked && (
                  <article className="bg-white/75 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center">
                          <IconClass />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                          Segera Dibuka
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Dosen Killer</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Permainan deduksi sosial khas ruang kelas TL 2016 ini sedang disiapkan untuk sesi kumpul angkatan.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isWerewolfUnlocked && (
                  <article className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-transform">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center">
                          <IconClass />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                          Siap Dimainkan
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Dosen Killer</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Permainan tebak peran ala kelas kuliah: temukan siapa Dosen Killer sebelum satu kelas kena remedial!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('dosenkiller')}
                      className="w-full min-h-[46px] bg-slate-900 hover:bg-slate-800 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                    >
                      Masuk Ruang Kelas
                    </button>
                  </article>
                )}

                {unoApproaching && !isUnoUnlocked && (
                  <article className="bg-white/75 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                          <IconCards />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                          Segera Dibuka
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">UNO Seru TL16</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Meja kartu UNO spesial reuni 1 Dekade akan dibuka menjelang sesi permainan bersama.
                        </p>
                      </div>
                    </div>
                  </article>
                )}

                {isUnoUnlocked && (
                  <article className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-transform">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                          <IconCards />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                          Siap Dimainkan
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">UNO Seru TL16</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mt-1">
                          Buka meja kartu bersama teman-teman angkatan dengan aturan tumpuk kartu yang meriah.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('unobrutal')}
                      className="w-full min-h-[46px] bg-slate-900 hover:bg-slate-800 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                    >
                      Gabung Meja Kartu
                    </button>
                  </article>
                )}
              </div>
            </section>
          )}

          {/* BAGIAN 4: PAPAN KLASEMEN */}
          <Suspense
            fallback={
              <div className="text-center p-8 text-slate-600 bg-white rounded-3xl border border-slate-200">
                Memuat Papan Klasemen...
              </div>
            }
          >
            <ScoreBoard currentNim={user.nim} currentAvatarConfig={avatarConfig} />
          </Suspense>
        </main>

        <footer className="mt-14 pt-8 border-t border-slate-200 text-center text-slate-500 text-xs space-y-1">
          <p className="font-semibold text-slate-800">Perayaan 1 Dekade Teknik Lingkungan Angkatan 2016 (Sedulur 16)</p>
          <p>2016 - 2026 | Kebersamaan Satu Dekade</p>
        </footer>
      </div>
    </div>
  );
}
