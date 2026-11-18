import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import RoadmapModal from './RoadmapModal';
import PlayerAvatar from './PlayerAvatar';
import AvatarDesigner from './AvatarDesigner';
import RedactedText from './RedactedText';
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
  <div className="min-h-[60vh] bg-[#F8F6F1] flex flex-col justify-center items-center gap-3 text-zinc-700 p-6">
    <span
      aria-hidden="true"
      className="w-9 h-9 border-3 border-[#DED8CA] border-t-[#14532D] rounded-full animate-spin"
    />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

const IconMap = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#14532D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconUsers = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#14532D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBoard = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

const IconClass = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconCards = () => (
  <svg aria-hidden="true" className="w-5 h-5 text-[#B45309] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
      <main className="min-h-screen bg-[#F8F6F1] flex justify-center items-center text-zinc-700 font-semibold">
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
        isMonopoliUnlocked={isMonopoliUnlocked}
        onSave={handleSaveAvatar}
        onCancel={() => {
          setShowAvatarDesigner(false);
          setIsEditingAvatar(false);
        }}
      />
    );
  }

  const renderSubView = (Component, props = {}) => (
    <div className="min-h-screen bg-[#F8F6F1] text-zinc-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Navigasi kembali" className="mb-6 pb-4 border-b border-[#DED8CA] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#DED8CA] text-[#14532D] hover:bg-[#EFE9DC] font-bold text-sm transition-colors"
          >
            &larr; Kembali ke Beranda Perayaan
          </button>
          <div className="hidden sm:flex items-center gap-2.5 bg-[#FFFDF9] border border-[#DED8CA] px-3 py-1.5 rounded-xl">
            <PlayerAvatar config={avatarConfig} seed={user.nim} className="w-7 h-7" alt={user.nama} />
            <span className="text-xs font-bold text-zinc-800">{user.nama}</span>
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

  const multiplayerGames = [];
  if (isMonopoliUnlocked || monopoliApproaching) {
    multiplayerGames.push({
      id: 'monopoli',
      title: (
        <>
          <RedactedText revealed={isMonopoliUnlocked} widthClass="w-20">
            Monopoli
          </RedactedText>{' '}
          TL16
        </>
      ),
      unlocked: isMonopoliUnlocked,
      icon: <IconBoard />,
      description: isMonopoliUnlocked
        ? 'Kelilingi petak kampus memakai bidak karaktermu, beli properti kontrakan, dan jawab tantangan Truth or Dare.'
        : 'Permainan papan kenangan 4 tahun masa kuliah ini akan segera dibuka sesuai jadwal perayaan.',
      ctaLabel: 'Buka Papan Monopoli',
      onClick: () => setActiveView('monopoli')
    });
  }
  if (isWerewolfUnlocked || werewolfApproaching) {
    multiplayerGames.push({
      id: 'dosenkiller',
      title: 'Dosen Killer',
      unlocked: isWerewolfUnlocked,
      icon: <IconClass />,
      description: isWerewolfUnlocked
        ? 'Permainan tebak peran ala kelas kuliah: temukan siapa Dosen Killer sebelum satu kelas kena remedial.'
        : 'Permainan deduksi sosial khas ruang kelas TL 2016 ini sedang disiapkan untuk sesi kumpul angkatan.',
      ctaLabel: 'Masuk Ruang Kelas',
      onClick: () => setActiveView('dosenkiller')
    });
  }
  if (isUnoUnlocked || unoApproaching) {
    multiplayerGames.push({
      id: 'unobrutal',
      title: 'UNO Seru TL16',
      unlocked: isUnoUnlocked,
      icon: <IconCards />,
      description: isUnoUnlocked
        ? 'Buka meja kartu bersama teman-teman angkatan dengan aturan tumpuk kartu yang meriah.'
        : 'Meja kartu UNO spesial reuni 1 Dekade akan dibuka menjelang sesi permainan bersama.',
      ctaLabel: 'Gabung Meja Kartu',
      onClick: () => setActiveView('unobrutal')
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-zinc-900 relative pb-14">
      {showAnniversary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anniv-welcome-title"
          className="fixed inset-0 z-50 bg-zinc-950/60 flex flex-col items-center justify-center p-4"
        >
          <div className="bg-[#FFFDF9] border border-[#DED8CA] p-8 md:p-10 rounded-2xl max-w-lg w-full text-center shadow-xl">
            <h2 id="anniv-welcome-title" className="flex justify-center mb-5">
              <img
                src="/Asset 2.webp"
                alt="Happy Anniversary Teknik Lingkungan 2016"
                width="280"
                height="109"
                className="w-full max-w-[260px] h-auto"
              />
            </h2>
            <p className="text-zinc-700 text-base mb-8 leading-relaxed">
              Selamat datang kembali, <strong className="text-zinc-900">{user.nama}</strong>! Mari rayakan satu dekade Teknik Lingkungan 2016 dengan mengisi kapsul kenangan dan bermain bersama.
            </p>
            <button
              type="button"
              onClick={closeAnniversary}
              className="min-h-[48px] px-8 py-3 bg-[#14532D] hover:bg-[#166534] text-white font-bold rounded-xl transition-colors text-base"
            >
              Mulai Rayakan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* HEADER NAVIGASI BERSIH */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9] border-b border-[#DED8CA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PlayerAvatar
              config={avatarConfig}
              seed={user.nim}
              className="w-11 h-11 border border-[#C7BDA8]"
              alt={`Karakter ${user.nama}`}
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight truncate">
                Halo, {user.nama}!
              </h1>
              <p className="text-zinc-600 text-xs">
                NIM <span className="font-mono font-semibold text-[#14532D]">{user.nim}</span>
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
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#F1ECE0] hover:bg-[#E5DFD2] border border-[#DED8CA] text-zinc-900 px-3.5 py-2 rounded-xl font-bold transition-colors"
            >
              Edit Karakter
            </button>
            <RoadmapModal />
            <button
              type="button"
              onClick={() => setActiveView('updates')}
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#FFFDF9] hover:bg-[#F1ECE0] px-3.5 py-2 rounded-xl border border-[#DED8CA] text-zinc-800 font-bold transition-colors"
            >
              Catatan Update
            </button>
            {user.is_admin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="min-h-[44px] text-xs whitespace-nowrap bg-[#14532D] hover:bg-[#166534] text-white px-3.5 py-2 rounded-xl font-bold transition-colors"
              >
                Ruang Panitia
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] text-xs whitespace-nowrap bg-[#FFFDF9] px-3.5 py-2 rounded-xl border border-[#DED8CA] hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 text-zinc-700 font-semibold transition-colors ml-auto lg:ml-0"
            >
              Keluar
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <main className="space-y-12">
          {/* BAGIAN 1: AGENDA UTAMA & PROFIL + WHEEL OF FAMILY (EDITORIAL 2-KOLOM) */}
          <section aria-labelledby="highlight-heading">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <article className="lg:col-span-7 bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#DED8CA] flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <img
                    src="/Asset 2.webp"
                    alt="Happy Anniversary Teknik Lingkungan 2016"
                    width="220"
                    height="86"
                    fetchPriority="high"
                    className="w-40 sm:w-48 h-auto"
                  />
                  <div>
                    <h2 id="highlight-heading" className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                      Kapsul Waktu 2016 ke 2026
                    </h2>
                    <p className="text-zinc-600 text-sm sm:text-base mt-2 leading-relaxed max-w-xl">
                      Unggah satu foto terbaikmu di tahun 2026 beserta pesan hangat atau cerita lucu masa kuliah untuk diputar bersama pada puncak acara Wheel of Family.
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('kapsul')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-[#14532D] hover:bg-[#166534] rounded-xl font-bold text-white text-sm sm:text-base transition-colors"
                  >
                    Isi Kapsul Waktu Sekarang
                  </button>
                </div>
              </article>

              <article className="lg:col-span-5 bg-[#F1ECE0] p-6 sm:p-8 rounded-2xl border border-[#DED8CA] flex flex-col justify-between gap-6">
                <div className="flex items-center justify-between gap-3 pb-5 border-b border-[#D8D0C0]">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar
                      config={avatarConfig}
                      seed={user.nim}
                      className="w-14 h-14 border border-[#C7BDA8]"
                      alt={`Karakter ${user.nama}`}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-base truncate">
                        {user.nama}
                      </p>
                      <p className="text-xs font-mono text-zinc-600 mt-0.5">
                        NIM {user.nim}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAvatar(true);
                      setShowAvatarDesigner(true);
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFDF9] hover:bg-white border border-[#DED8CA] text-zinc-800 text-xs font-bold transition-colors shrink-0"
                  >
                    Ubah
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-4">
                  {user.is_admin ? (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1.5">Wheel of Family</h3>
                        <p className="text-zinc-700 text-sm leading-relaxed">
                          {targetDate
                            ? 'Hitung mundur untuk peserta sedang berjalan. Panitia dapat menguji roda putar kapan saja.'
                            : 'Jadwal pembukaan roda putar belum diatur di Ruang Panitia.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-[#FFFDF9] hover:bg-white border border-[#CEC6B6] rounded-xl font-bold text-zinc-900 text-sm transition-colors"
                      >
                        Buka Roda Putar
                      </button>
                    </>
                  ) : !targetDate ? (
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 mb-1.5">
                        Wheel of Family
                      </h3>
                      <p className="text-zinc-700 text-sm leading-relaxed">
                        Jadwal pemutaran kapsul kenangan akan diumumkan oleh panitia. Pastikan kamu sudah mengisi Kapsul Waktu!
                      </p>
                    </div>
                  ) : !wheelUnlocked && timeLeft ? (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          Wheel of Family Segera Dibuka
                        </h3>
                        <p className="text-zinc-600 text-xs mt-0.5">
                          Hitung mundur pembukaan foto &amp; pesan angkatan:
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.days}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Hari</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.hours}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Jam</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-zinc-900">{timeLeft.minutes}</span>
                          <span className="block text-[11px] text-zinc-600 font-medium">Menit</span>
                        </div>
                        <div className="bg-[#FFFDF9] border border-[#DED8CA] py-2.5 px-1.5 rounded-xl">
                          <span className="block font-mono font-bold text-lg text-[#14532D]">{timeLeft.seconds}</span>
                          <span className="block text-[11px] text-[#14532D] font-medium">Detik</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1.5">Wheel of Family</h3>
                        <p className="text-zinc-700 text-sm leading-relaxed">
                          Saatnya memutar roda kenangan dan melihat transformasi teman-teman Sedulur 16 dari 2016 ke 2026!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveView('wheel')}
                        className="w-full min-h-[46px] py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-bold text-sm transition-colors"
                      >
                        Buka Roda Kenangan
                      </button>
                    </>
                  )}
                </div>
              </article>
            </div>
          </section>

          {/* BAGIAN 2: KUIS KENANGAN KAMPUS (PEMBAGIAN 2-KOLOM DALAM SATU LEMBAR) */}
          <section aria-labelledby="solo-games-heading" className="space-y-4">
            <div>
              <h2 id="solo-games-heading" className="text-xl sm:text-2xl font-bold text-zinc-900">
                Kuis Kenangan Kampus (Main Sendiri)
              </h2>
              <p className="text-zinc-600 text-sm mt-0.5">
                Kumpulkan poin klasemen angkatan dengan menebak lokasi kampus dan foto masa maba.
              </p>
            </div>

            <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5DFD2]">
              <article className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IconMap />
                      <h3 className="text-lg font-bold text-zinc-900">Digital Treasure Hunt</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#14532D]">20 Lokasi</span>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Napak tilas titik-titik kenangan di sekitar kampus dan tempat nongkrong legendaris angkatan 2016.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('map')}
                    className="w-full sm:w-auto min-h-[46px] bg-[#14532D] hover:bg-[#166534] py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                  >
                    Mulai Tebak Lokasi
                  </button>
                </div>
              </article>

              <article className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <IconUsers />
                      <h3 className="text-lg font-bold text-zinc-900">Tebak Muka Blur</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#14532D]">20 Foto</span>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    Seberapa hafal kamu dengan wajah teman seangkatan tahun 2016? Semakin cepat menebak, semakin tinggi poinnya.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('face')}
                    className="w-full sm:w-auto min-h-[46px] bg-[#14532D] hover:bg-[#166534] py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                  >
                    Mulai Tebak Foto
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* BAGIAN 3: ARENA MAIN BARENG MULTIPLAYER (DAFTAR INDEKS BERNOMOR) */}
          {multiplayerGames.length > 0 && (
            <section aria-labelledby="party-games-heading" className="space-y-4">
              <div>
                <h2 id="party-games-heading" className="text-xl sm:text-2xl font-bold text-zinc-900">
                  Arena Main Bareng (Multiplayer)
                </h2>
                <p className="text-zinc-600 text-sm mt-0.5">
                  Permainan seru bersama satu tongkrongan memakai karakter yang sudah kamu desain.
                </p>
              </div>

              <div className="bg-[#FFFDF9] border border-[#DED8CA] rounded-2xl divide-y divide-[#E5DFD2]">
                {multiplayerGames.map((game, index) => (
                  <article
                    key={game.id}
                    className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      game.unlocked ? '' : 'bg-[#F8F6F1]/70'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-500 pt-1 shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="pt-0.5 shrink-0">{game.icon}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1">
                          <h3 className="text-lg font-bold text-zinc-900">{game.title}</h3>
                          <span
                            className={`text-xs font-bold ${
                              game.unlocked ? 'text-[#14532D]' : 'text-amber-800'
                            }`}
                          >
                            {game.unlocked ? 'Siap Dimainkan' : 'Segera Dibuka'}
                          </span>
                        </div>
                        <p className="text-zinc-600 text-sm leading-relaxed max-w-xl">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {game.unlocked && (
                      <button
                        type="button"
                        onClick={game.onClick}
                        className="w-full sm:w-auto shrink-0 min-h-[46px] bg-amber-400 hover:bg-amber-300 py-2.5 px-5 rounded-xl font-bold text-zinc-950 text-sm transition-colors"
                      >
                        {game.ctaLabel}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* BAGIAN 4: PAPAN KLASEMEN */}
          <Suspense
            fallback={
              <div className="text-center p-8 text-zinc-600 bg-[#FFFDF9] rounded-2xl border border-[#DED8CA]">
                Memuat Papan Klasemen...
              </div>
            }
          >
            <ScoreBoard currentNim={user.nim} currentAvatarConfig={avatarConfig} />
          </Suspense>
        </main>

        <footer className="mt-14 pt-8 border-t border-[#DED8CA] text-center text-zinc-600 text-xs space-y-1">
          <p className="font-semibold text-zinc-800">Perayaan 1 Dekade Teknik Lingkungan Angkatan 2016 (Sedulur 16)</p>
          <p>2016 - 2026 | Kebersamaan Satu Dekade</p>
        </footer>
      </div>
    </div>
  );
}
