import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabaseClient';
import Login from './Login';
import RoadmapModal from './RoadmapModal';

const TreasureHunt = lazy(() => import('./TreasureHunt'));
const FaceGame = lazy(() => import('./FaceGame'));
const ScoreBoard = lazy(() => import('./ScoreBoard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const FormKapsulWaktu = lazy(() => import('./FormKapsulWaktu'));
const WheelOfFamily = lazy(() => import('./WheelOfFamily'));
const MonopoliBoard = lazy(() => import('./MonopoliBoard'));
const DosenKillerGame = lazy(() => import('./DosenKillerGame'));
const UnoBrutalGame = lazy(() => import('./UnoBrutalGame'));

const LoadingScreen = ({ label = 'Memuat halaman permainan...' }) => (
  <div className="min-h-[60vh] bg-slate-900 flex flex-col justify-center items-center gap-3 text-slate-200 p-6">
    <span
      aria-hidden="true"
      className="w-9 h-9 border-3 border-slate-600 border-t-amber-400 rounded-full animate-spin"
    />
    <p className="text-sm font-semibold">{label}</p>
  </div>
);

export default function GameDashboard() {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAnniversary, setShowAnniversary] = useState(false);

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
    }
    setIsChecking(false);
  }, []);

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
    if (user && user.nim !== 'guest') {
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
  }, [user]);

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
    window.location.reload();
  };

  if (isChecking) {
    return (
      <main className="min-h-screen bg-slate-900 flex justify-center items-center text-slate-200 font-semibold">
        Memuat Portal Perayaan 1 Dekade TL 2016...
      </main>
    );
  }

  if (!user) return <Login onLoginSuccess={setUser} />;

  const renderSubView = (Component, props = {}) => (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Navigasi kembali" className="mb-6">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-amber-300 hover:bg-slate-700 font-bold text-sm transition-colors"
          >
            Kembali ke Beranda Perayaan
          </button>
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
  if (activeView === 'monopoli') return renderSubView(MonopoliBoard);
  if (activeView === 'dosenkiller') return renderSubView(DosenKillerGame);
  if (activeView === 'unobrutal') return renderSubView(UnoBrutalGame);

  if (activeView === 'admin' && user.is_admin) {
    return (
      <Suspense fallback={<LoadingScreen label="Memuat ruang panitia..." />}>
        <AdminDashboard onBack={() => setActiveView('dashboard')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-4 md:p-8 relative">
      {showAnniversary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="anniv-welcome-title"
          className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-4"
        >
          <div className="bg-slate-800 border-2 border-amber-400 p-8 md:p-10 rounded-2xl max-w-lg w-full text-center shadow-lg">
            <span className="inline-block px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold mb-4">
              10 Tahun Kebersamaan (2016 - 2026)
            </span>
            <h2 id="anniv-welcome-title" className="text-3xl md:text-5xl font-bold text-amber-300 mb-3">
              Selamat Ulang Tahun, Sedulur 16!
            </h2>
            <p className="text-slate-200 text-base mb-8 leading-relaxed">
              Selamat datang kembali, <strong>{user.nama}</strong>! Mari rayakan satu dekade Teknik Lingkungan 2016 dengan mengisi kapsul kenangan dan bermain bersama.
            </p>
            <button
              type="button"
              onClick={closeAnniversary}
              className="min-h-[48px] px-8 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold rounded-xl transition-colors text-base"
            >
              Mulai Rayakan Sekarang
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-700 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/Asset 2.webp"
              alt="Logo Happy Anniversary TL 2016"
              width="120"
              height="47"
              className="w-28 h-auto hidden sm:block"
            />
            <div>
              <span className="inline-block text-xs font-semibold text-amber-300 mb-1">
                Perayaan 1 Dekade Teknik Lingkungan 2016
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-50">
                Halo, {user.nama}!
              </h1>
              <p className="text-slate-300 text-sm">
                NIM: <span className="font-mono font-semibold text-emerald-300">{user.nim}</span>
              </p>
            </div>
          </div>

          <nav aria-label="Menu pengguna" className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <RoadmapModal />
            {user.is_admin && (
              <button
                type="button"
                onClick={() => setActiveView('admin')}
                className="min-h-[44px] text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-colors"
              >
                Ruang Panitia
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] text-sm bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-600 hover:bg-rose-950 hover:border-rose-400 hover:text-rose-200 text-slate-200 font-semibold transition-colors ml-auto md:ml-0"
            >
              Keluar
            </button>
          </nav>
        </header>

        <main className="space-y-12">
          {/* BAGIAN 1: SOROTAN UTAMA PERAYAAN ULANG TAHUN (ASYMMETRIC HERO) */}
          <section aria-labelledby="highlight-heading">
            <div className="mb-4">
              <h2 id="highlight-heading" className="text-xl md:text-2xl font-bold text-amber-300">
                Agenda Utama Ulang Tahun 1 Dekade
              </h2>
              <p className="text-slate-300 text-sm">
                Kirimkan foto terbaru dan pesan kenanganmu untuk diputar bersama saat puncak perayaan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kartu Flagship: Kapsul Waktu (7 kolom di desktop) */}
              <article className="lg:col-span-7 bg-slate-800 p-6 md:p-8 rounded-2xl border-2 border-amber-400/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold">
                      Wajib Diisi Semua Alumni
                    </span>
                    <span aria-hidden="true" className="text-3xl">📦</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">
                    Kapsul Waktu 2016 ke 2026
                  </h3>
                  <p className="text-slate-200 text-sm md:text-base mb-6 leading-relaxed">
                    Unggah satu foto terbaikmu di tahun 2026 beserta pesan hangat atau cerita lucu masa kuliah untuk ditampilkan di acara Wheel of Family.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveView('kapsul')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl font-bold text-slate-950 text-base transition-colors"
                  >
                    Isi Kapsul Waktu Sekarang
                  </button>
                </div>
              </article>

              {/* Kartu Pendamping: Wheel of Family (5 kolom di desktop) */}
              <article className="lg:col-span-5 bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 flex flex-col justify-between">
                {user.is_admin ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-block px-3 py-1 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                          Akses Panitia
                        </span>
                        <span aria-hidden="true" className="text-3xl">🎡</span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-50 mb-2">
                        Wheel of Family
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        {targetDate
                          ? 'Hitung mundur untuk peserta sedang berjalan. Panitia dapat menguji roda putar kapan saja.'
                          : 'Jadwal pembukaan roda putar belum diatur di Ruang Panitia.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('wheel')}
                      className="w-full min-h-[48px] py-3 px-5 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold text-white text-base transition-colors"
                    >
                      Buka Roda Putar
                    </button>
                  </>
                ) : !targetDate ? (
                  <div className="my-auto text-center py-4">
                    <span aria-hidden="true" className="text-4xl block mb-3">🎁</span>
                    <h3 className="text-xl font-bold text-slate-50 mb-1">
                      Kejutan Puncak Wheel of Family
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Jadwal pemutaran kapsul kenangan akan diumumkan oleh panitia. Pastikan kamu sudah mengisi Kapsul Waktu!
                    </p>
                  </div>
                ) : !wheelUnlocked && timeLeft ? (
                  <div className="my-auto text-center">
                    <span className="inline-block px-3 py-1 rounded-md bg-amber-400/15 text-amber-300 text-xs font-bold mb-3">
                      Menuju Puncak Acara
                    </span>
                    <h3 className="text-xl font-bold text-slate-50 mb-1">
                      Wheel of Family Segera Dibuka
                    </h3>
                    <p className="text-slate-300 text-xs mb-5">
                      Hitung mundur pembukaan foto & pesan satu angkatan:
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-900 border border-slate-700 py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-amber-300">{timeLeft.days}</span>
                        <span className="block text-xs text-slate-300 mt-0.5 font-medium">Hari</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-amber-300">{timeLeft.hours}</span>
                        <span className="block text-xs text-slate-300 mt-0.5 font-medium">Jam</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-amber-300">{timeLeft.minutes}</span>
                        <span className="block text-xs text-slate-300 mt-0.5 font-medium">Menit</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-700 py-3 px-2 rounded-xl">
                        <span className="block font-mono font-bold text-xl sm:text-2xl text-emerald-300">{timeLeft.seconds}</span>
                        <span className="block text-xs text-slate-300 mt-0.5 font-medium">Detik</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-block px-3 py-1 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                          Sudah Dibuka
                        </span>
                        <span aria-hidden="true" className="text-3xl">🎡</span>
                      </div>
                      <h3 className="text-2xl font-bold text-amber-300 mb-2">
                        Wheel of Family
                      </h3>
                      <p className="text-slate-200 text-sm mb-6 leading-relaxed">
                        Saatnya memutar roda kenangan dan melihat transformasi teman-teman Sedulur 16 dari tahun 2016 hingga 2026!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('wheel')}
                      className="w-full min-h-[48px] py-3 px-5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-base transition-colors"
                    >
                      Buka Roda Kenangan
                    </button>
                  </>
                )}
              </article>
            </div>
          </section>

          {/* BAGIAN 2: PERMAINAN NOSTALGIA INDIVIDU (2 KOLOM) */}
          <section aria-labelledby="solo-games-heading">
            <div className="mb-4">
              <h2 id="solo-games-heading" className="text-xl md:text-2xl font-bold text-slate-50">
                Kuis Kenangan Kampus (Main Sendiri)
              </h2>
              <p className="text-slate-300 text-sm">
                Kumpulkan poin untuk klasemen angkatan dengan menebak lokasi kampus dan foto masa maba.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <article className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                      20 Lokasi Memori
                    </span>
                    <span aria-hidden="true" className="text-3xl">🗺️</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-2">
                    Digital Treasure Hunt
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Napak tilas titik-titik kenangan di sekitar kampus dan tempat nongkrong legendaris angkatan 2016.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('map')}
                  className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-600 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Lokasi
                </button>
              </article>

              <article className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-500/40 px-2.5 py-1 rounded-md">
                      20 Foto Angkatan
                    </span>
                    <span aria-hidden="true" className="text-3xl">👥</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 mb-2">
                    Tebak Muka Blur
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Seberapa hafal kamu dengan wajah teman seangkatan tahun 2016? Semakin cepat menebak, semakin tinggi poinnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('face')}
                  className="w-full min-h-[48px] bg-emerald-700 hover:bg-emerald-600 py-3 px-5 rounded-xl font-bold text-white text-sm transition-colors"
                >
                  Mulai Tebak Foto
                </button>
              </article>
            </div>
          </section>

          {/* BAGIAN 3: PERMAINAN BARENG SEANGKATAN (MULTIPLAYER) */}
          {(isMonopoliUnlocked || monopoliApproaching || isWerewolfUnlocked || werewolfApproaching || isUnoUnlocked || unoApproaching) && (
            <section aria-labelledby="party-games-heading">
              <div className="mb-4">
                <h2 id="party-games-heading" className="text-xl md:text-2xl font-bold text-slate-50">
                  Arena Main Bareng (Multiplayer)
                </h2>
                <p className="text-slate-300 text-sm">
                  Permainan seru untuk dimainkan bersama satu tongkrongan secara langsung.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {monopoliApproaching && !isMonopoliUnlocked && (
                  <article className="bg-slate-800/70 p-6 rounded-2xl border border-dashed border-amber-400/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-amber-950 border border-amber-400/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Kado Segera Dibuka
                        </span>
                        <span aria-hidden="true" className="text-2xl">🎁</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-200 mb-2">
                        Monopoli TL16
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Kado permainan papan kenangan 4 tahun masa kuliah ini akan segera dibuka sesuai jadwal perayaan.
                      </p>
                    </div>
                  </article>
                )}

                {isMonopoliUnlocked && (
                  <article className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Siap Dimainkan
                        </span>
                        <span aria-hidden="true" className="text-2xl">🎲</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-50 mb-2">
                        Monopoli TL16
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Kelilingi petak kampus, kumpulkan properti kontrakan, dan jawab tantangan Truth or Dare bersama teman-teman.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('monopoli')}
                      className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 py-3 px-4 rounded-xl font-bold text-slate-950 text-sm transition-colors"
                    >
                      Buka Papan Monopoli
                    </button>
                  </article>
                )}

                {werewolfApproaching && !isWerewolfUnlocked && (
                  <article className="bg-slate-800/70 p-6 rounded-2xl border border-dashed border-amber-400/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-amber-950 border border-amber-400/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Kado Segera Dibuka
                        </span>
                        <span aria-hidden="true" className="text-2xl">🎁</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-200 mb-2">
                        Dosen Killer
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Permainan deduksi sosial khas ruang kelas TL 2016 ini sedang disiapkan untuk sesi kumpul angkatan.
                      </p>
                    </div>
                  </article>
                )}

                {isWerewolfUnlocked && (
                  <article className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Siap Dimainkan
                        </span>
                        <span aria-hidden="true" className="text-2xl">🎓</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-50 mb-2">
                        Dosen Killer
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Permainan tebak peran ala kelas kuliah: temukan siapa yang menyamar sebagai Dosen Killer sebelum satu kelas kena remedial!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('dosenkiller')}
                      className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 py-3 px-4 rounded-xl font-bold text-slate-950 text-sm transition-colors"
                    >
                      Masuk Ruang Kelas
                    </button>
                  </article>
                )}

                {unoApproaching && !isUnoUnlocked && (
                  <article className="bg-slate-800/70 p-6 rounded-2xl border border-dashed border-amber-400/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-amber-950 border border-amber-400/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Kado Segera Dibuka
                        </span>
                        <span aria-hidden="true" className="text-2xl">🎁</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-200 mb-2">
                        UNO Seru TL16
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        Meja kartu UNO spesial reuni 1 Dekade akan dibuka menjelang sesi permainan bersama.
                      </p>
                    </div>
                  </article>
                )}

                {isUnoUnlocked && (
                  <article className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md">
                          Siap Dimainkan
                        </span>
                        <span aria-hidden="true" className="text-2xl">🃏</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-50 mb-2">
                        UNO Seru TL16
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Buka meja kartu bersama teman-teman angkatan dengan aturan tumpuk kartu yang meriah.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('unobrutal')}
                      className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 py-3 px-4 rounded-xl font-bold text-slate-950 text-sm transition-colors"
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
              <div className="text-center p-8 text-slate-300 bg-slate-800 rounded-2xl border border-slate-700">
                Memuat Papan Klasemen...
              </div>
            }
          >
            <ScoreBoard />
          </Suspense>
        </main>

        <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-slate-300 text-xs space-y-1">
          <p className="font-semibold text-amber-300">Perayaan 1 Dekade Teknik Lingkungan Angkatan 2016 (Sedulur 16)</p>
          <p>2016 - 2026 | Kebersamaan Satu Dekade</p>
        </footer>
      </div>
    </div>
  );
}
